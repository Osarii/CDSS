import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  RemoteClinicalAssistantProvider,
  RemotePharmacyAssistantProvider,
  getGeminiWebhookUrl,
  getQwenWebhookUrl,
} from './remoteProviders'
import { executeDualAIRoles } from './orchestrator'
import { SYN_001 } from '../../data/scenarios'
import { buildPharmacyReviewInput } from '../../domain'
import type {
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReview,
} from '../../domain'

// Global fetch mock helper
const originalFetch = global.fetch

describe('Remote AI Provider Boundary & n8n Webhook Integration', () => {
  const dummyContext = SYN_001.clinicalContext

  const dummyDraft: PrescriptionDraft = {
    id: 'draft-test-01',
    patientId: 'pat-test-01',
    authorPhysicianId: 'dr-medico-demo',
    status: 'draft',
    createdAt: '2026-09-28T10:00:00.000Z',
    items: [
      {
        id: 'item-01',
        medicationCode: 'MET-500',
        medicationName: 'Metformin',
        dosage: '500 mg',
        route: 'oral',
        frequency: 'c/12 h',
      },
    ],
  }

  const dummyFindings: ClinicalFinding[] = [
    {
      id: 'finding-test-01',
      patientId: 'pat-test-01',
      ruleId: 'DEMO-DDI-001',
      ruleVersion: '1.0.0',
      severity: 'warning',
      title: 'Monitoreo renal recomendado',
      detail: 'Evaluar función renal previa.',
      supportingDataKeys: ['med-01'],
      missingDataKeys: [],
      timestamp: '2026-09-28T10:00:00.000Z',
      isDeterministic: true,
    },
  ]

  const validGeminiResponse: ClinicalAssessmentSummary = {
    id: 'ca-rem-01',
    patientId: 'pat-test-01',
    summary: 'Resumen clínico generado vía n8n Gemini',
    clinicalConsiderations: ['Monitoreo glucémico adecuado'],
    dataAvailabilityGaps: [],
    deterministicFindingsReferenced: ['finding-test-01'],
    generatedAt: '2026-09-28T10:05:00.000Z',
    role: 'clinical_assistant',
  }

  const validQwenResponse: PharmacyReview = {
    id: 'pr-rem-01',
    patientId: 'pat-test-01',
    prescriptionDraftId: 'draft-test-01',
    status: 'NO_ADDITIONAL_CONCERNS',
    summary: 'Revisión farmacéutica generada vía n8n Qwen',
    pharmacologicalConsiderations: ['Dosis de Metformina dentro de rango habitual'],
    requiredDataGaps: [],
    deterministicFindingsReferenced: ['finding-test-01'],
    reviewedAt: '2026-09-28T10:05:00.000Z',
    role: 'pharmacy_assistant',
  }

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  // ----------------------------------------------------------------
  // 1. Webhook URL Resolution
  // ----------------------------------------------------------------
  describe('Webhook URL resolution', () => {
    it('uses explicit config webhook URL when provided', () => {
      expect(getGeminiWebhookUrl({ geminiWebhookUrl: 'https://n8n.test/gemini' })).toBe(
        'https://n8n.test/gemini'
      )
      expect(getQwenWebhookUrl({ qwenWebhookUrl: 'https://n8n.test/qwen' })).toBe(
        'https://n8n.test/qwen'
      )
    })

    it('returns empty string when webhook URL is unconfigured', () => {
      expect(getGeminiWebhookUrl({})).toBe('')
      expect(getQwenWebhookUrl({})).toBe('')
    })
  })

  // ----------------------------------------------------------------
  // 2. Remote Clinical Assistant Provider (Gemini via n8n)
  // ----------------------------------------------------------------
  describe('RemoteClinicalAssistantProvider', () => {
    it('throws error when webhook URL is missing', async () => {
      const provider = new RemoteClinicalAssistantProvider({})
      await expect(
        provider.generateAssessment(dummyContext, dummyFindings, dummyDraft)
      ).rejects.toThrow(/Missing n8n webhook URL/)
    })

    it('sends correct payload to Gemini n8n webhook and validates schema', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => validGeminiResponse,
      } as unknown as Response)

      const provider = new RemoteClinicalAssistantProvider({
        geminiWebhookUrl: 'https://n8n.hospital.org/webhook/gemini-clinical',
      })

      const result = await provider.generateAssessment(dummyContext, dummyFindings, dummyDraft)

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, init] = vi.mocked(global.fetch).mock.calls[0]
      expect(url).toBe('https://n8n.hospital.org/webhook/gemini-clinical')
      expect(init?.method).toBe('POST')

      const body = JSON.parse(init?.body as string)
      expect(body.context.patient.id).toBe('pat-syn-001')
      expect(body.deterministicFindings).toHaveLength(1)
      expect(body.proposedPrescription.id).toBe('draft-test-01')

      expect(result).toEqual(validGeminiResponse)
    })

    it('handles HTTP error responses (e.g. 500, 503)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as unknown as Response)

      const provider = new RemoteClinicalAssistantProvider({
        geminiWebhookUrl: 'https://n8n.hospital.org/webhook/gemini-clinical',
      })

      await expect(
        provider.generateAssessment(dummyContext, dummyFindings, dummyDraft)
      ).rejects.toThrow(/returned HTTP 503: Service Unavailable/)
    })

    it('rejects invalid JSON responses', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
      } as unknown as Response)

      const provider = new RemoteClinicalAssistantProvider({
        geminiWebhookUrl: 'https://n8n.hospital.org/webhook/gemini-clinical',
      })

      await expect(
        provider.generateAssessment(dummyContext, dummyFindings, dummyDraft)
      ).rejects.toThrow(/returned invalid JSON response/)
    })

    it('rejects responses failing Zod domain schema validation', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Malformed payload: missing patientId and summary
          id: 'ca-bad',
          role: 'clinical_assistant',
        }),
      } as unknown as Response)

      const provider = new RemoteClinicalAssistantProvider({
        geminiWebhookUrl: 'https://n8n.hospital.org/webhook/gemini-clinical',
      })

      await expect(
        provider.generateAssessment(dummyContext, dummyFindings, dummyDraft)
      ).rejects.toThrow(/failed domain schema validation/)
    })

    it('handles network timeouts gracefully', async () => {
      vi.mocked(global.fetch).mockImplementationOnce((_url, init) => {
        return new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      })

      const provider = new RemoteClinicalAssistantProvider({
        geminiWebhookUrl: 'https://n8n.hospital.org/webhook/gemini-clinical',
        timeoutMs: 50,
      })

      await expect(
        provider.generateAssessment(dummyContext, dummyFindings, dummyDraft)
      ).rejects.toThrow(/timed out after 50ms/)
    })
  })

  // ----------------------------------------------------------------
  // 3. Remote Pharmacy Assistant Provider (Qwen via n8n) & Isolation
  // ----------------------------------------------------------------
  describe('RemotePharmacyAssistantProvider & Boundary Isolation', () => {
    it('sends ONLY PharmacyReviewInput to Qwen n8n endpoint and excludes raw ClinicalContext', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => validQwenResponse,
      } as unknown as Response)

      const provider = new RemotePharmacyAssistantProvider({
        qwenWebhookUrl: 'https://n8n.hospital.org/webhook/qwen-pharmacy',
      })

      const input = buildPharmacyReviewInput({
        context: dummyContext,
        proposedPrescription: dummyDraft,
        deterministicFindings: dummyFindings,
      })

      const result = await provider.reviewPrescription(input)

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, init] = vi.mocked(global.fetch).mock.calls[0]
      expect(url).toBe('https://n8n.hospital.org/webhook/qwen-pharmacy')

      const body = JSON.parse(init?.body as string)
      // Safety invariant: 'input' is sent, but raw 'context' root object is absent
      expect(body.input).toBeDefined()
      expect(body.input.proposedPrescription.id).toBe('draft-test-01')
      expect(body.input.relevantDiagnoses).toBeDefined()
      expect(body.input.allergies).toBeDefined()
      expect(body.input.currentMedications).toBeDefined()
      expect(body.context).toBeUndefined() // Raw ClinicalContext is NOT leaked

      expect(result).toEqual(validQwenResponse)
    })

    it('rejects invalid pharmacy status values', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...validQwenResponse,
          status: 'INVALID_STATUS',
        }),
      } as unknown as Response)

      const provider = new RemotePharmacyAssistantProvider({
        qwenWebhookUrl: 'https://n8n.hospital.org/webhook/qwen-pharmacy',
      })

      const input = buildPharmacyReviewInput({
        context: dummyContext,
        proposedPrescription: dummyDraft,
        deterministicFindings: dummyFindings,
      })

      await expect(provider.reviewPrescription(input)).rejects.toThrow(/failed domain schema validation/)
    })
  })

  // ----------------------------------------------------------------
  // 4. Orchestration Integration with Remote Mode
  // ----------------------------------------------------------------
  describe('executeDualAIRoles with Provider Mode Support', () => {
    it('defaults to mock mode when no mode or providers specified', async () => {
      const result = await executeDualAIRoles({
        context: dummyContext,
        proposedPrescription: dummyDraft,
        deterministicFindings: dummyFindings,
      })

      expect(result.clinicalSummary!.role).toBe('clinical_assistant')
      expect(result.pharmacyReview!.role).toBe('pharmacy_assistant')
      expect(result.comparison!.unresolvedDiscrepancies).toBeDefined()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('executes remote providers when mode: "remote" is passed', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validGeminiResponse,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validQwenResponse,
        } as unknown as Response)

      const result = await executeDualAIRoles({
        context: dummyContext,
        proposedPrescription: dummyDraft,
        deterministicFindings: dummyFindings,
        options: {
          mode: 'remote',
          remoteConfig: {
            geminiWebhookUrl: 'https://n8n.hospital.org/webhook/gemini',
            qwenWebhookUrl: 'https://n8n.hospital.org/webhook/qwen',
          },
        },
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(result.clinicalSummary).toEqual(validGeminiResponse)
      expect(result.pharmacyReview).toEqual(validQwenResponse)

      // Comparison layer remains deterministic
      expect(result.comparison!.clinicalSummaryId).toBe('ca-rem-01')
      expect(result.comparison!.pharmacyReviewId).toBe('pr-rem-01')

      // Deterministic findings remain untouched
      expect(result.deterministicFindings).toHaveLength(1)
      expect(result.deterministicFindings[0].id).toBe('finding-test-01')
    })

    it('preserves deterministic findings immutability even when remote provider fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response)

      const originalFindingRef = dummyFindings[0]

      await expect(
        executeDualAIRoles({
          context: dummyContext,
          proposedPrescription: dummyDraft,
          deterministicFindings: dummyFindings,
          options: {
            mode: 'remote',
            remoteConfig: {
              geminiWebhookUrl: 'https://n8n.hospital.org/webhook/gemini',
              qwenWebhookUrl: 'https://n8n.hospital.org/webhook/qwen',
            },
          },
        })
      ).rejects.toThrow(/HTTP 500/)

      // Findings were not modified or invalidated
      expect(dummyFindings[0]).toEqual(originalFindingRef)
    })
  })
})
