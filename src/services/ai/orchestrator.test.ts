import { describe, it, expect, vi } from 'vitest'
import {
  executeDualAIRoles,
  executeClinicalAssistantRole,
  executePharmacyAssistantRole,
} from './orchestrator'
import {
  MockClinicalAssistantProvider,
  MockPharmacyAssistantProvider,
} from './mockProviders'
import type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReview,
} from '../../domain'

const dummyContext: ClinicalContext = {
  patient: {
    id: 'pat-syn-001',
    syntheticIdentifier: 'SYN-001',
    age: 65,
    gender: 'female',
  },
  conditions: [],
  allergies: [],
  medications: [],
  medicationExposures: [],
  observations: [],
  dataPoints: {},
  timestamp: '2026-09-28T12:00:00.000Z',
}

const dummyDraft: PrescriptionDraft = {
  id: 'rx-draft-001',
  patientId: 'pat-syn-001',
  authorPhysicianId: 'dr-medico-demo',
  status: 'draft',
  createdAt: '2026-09-28T12:00:00.000Z',
  items: [
    {
      id: 'item-001',
      medicationCode: 'MED-001',
      medicationName: 'Enalapril',
      dosage: '20 mg',
      route: 'oral',
      frequency: 'cada 12 horas',
    },
  ],
}

const dummyFindings: ClinicalFinding[] = [
  {
    id: 'finding-test-01',
    patientId: 'pat-syn-001',
    ruleId: 'DEMO-DDI-001',
    ruleVersion: '1.0.0',
    title: 'Alerta de prueba',
    severity: 'critical',
    detail: 'Detalle de prueba para hallazgo determinista',
    supportingDataKeys: ['medications.MED-001'],
    missingDataKeys: [],
    timestamp: '2026-09-28T10:00:00.000Z',
    isDeterministic: true,
  },
]

describe('Dual AI Orchestrator — Independent & Non-Blocking Execution', () => {
  // 1. Both Success
  it('executes both assistants successfully and generates comparison without winner', async () => {
    const onClinicalComplete = vi.fn()
    const onPharmacyComplete = vi.fn()
    const onClinicalError = vi.fn()
    const onPharmacyError = vi.fn()

    const result = await executeDualAIRoles({
      context: dummyContext,
      proposedPrescription: dummyDraft,
      deterministicFindings: dummyFindings,
      options: {
        onClinicalComplete,
        onPharmacyComplete,
        onClinicalError,
        onPharmacyError,
      },
    })

    expect(result.clinicalSummary).toBeDefined()
    expect(result.clinicalSummary?.role).toBe('clinical_assistant')
    expect(result.pharmacyReview).toBeDefined()
    expect(result.pharmacyReview?.role).toBe('pharmacy_assistant')
    expect(result.comparison).toBeDefined()
    expect(result.comparison?.clinicalSummaryId).toBe(result.clinicalSummary?.id)
    expect(result.comparison?.pharmacyReviewId).toBe(result.pharmacyReview?.id)

    expect(onClinicalComplete).toHaveBeenCalledTimes(1)
    expect(onPharmacyComplete).toHaveBeenCalledTimes(1)
    expect(onClinicalError).not.toHaveBeenCalled()
    expect(onPharmacyError).not.toHaveBeenCalled()

    // Deterministic findings remain unchanged
    expect(result.deterministicFindings).toEqual(dummyFindings)
  })

  // 2. Slow Provider (Non-Blocking execution)
  it('does not block the faster provider when the other provider is slow', async () => {
    const timeline: string[] = []

    // Clinical assistant completes fast (10ms)
    const fastClinicalProvider = {
      generateAssessment: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        timeline.push('clinical_completed')
        return {
          id: 'ca-fast-001',
          patientId: 'pat-syn-001',
          summary: 'Evaluación clínica rápida',
          clinicalConsiderations: ['Consideración 1'],
          dataAvailabilityGaps: [],
          deterministicFindingsReferenced: [],
          generatedAt: new Date().toISOString(),
          role: 'clinical_assistant' as const,
        }
      }),
    }

    // Pharmacy assistant completes slower (60ms)
    const slowPharmacyProvider = {
      reviewPrescription: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60))
        timeline.push('pharmacy_completed')
        return {
          id: 'pr-slow-001',
          patientId: 'pat-syn-001',
          prescriptionDraftId: 'rx-draft-001',
          status: 'NO_ADDITIONAL_CONCERNS' as const,
          summary: 'Revisión farmacéutica lenta',
          pharmacologicalConsiderations: [],
          requiredDataGaps: [],
          deterministicFindingsReferenced: [],
          reviewedAt: new Date().toISOString(),
          role: 'pharmacy_assistant' as const,
        }
      }),
    }

    let clinicalResultAtCallback: ClinicalAssessmentSummary | null = null
    let pharmacyResultAtCallback: PharmacyReview | null = null

    const result = await executeDualAIRoles({
      context: dummyContext,
      proposedPrescription: dummyDraft,
      deterministicFindings: dummyFindings,
      options: {
        clinicalProvider: fastClinicalProvider,
        pharmacyProvider: slowPharmacyProvider,
        onClinicalComplete: (summary) => {
          clinicalResultAtCallback = summary
          timeline.push('on_clinical_callback')
        },
        onPharmacyComplete: (review) => {
          pharmacyResultAtCallback = review
          timeline.push('on_pharmacy_callback')
        },
      },
    })

    // Clinical finished and fired callback BEFORE pharmacy completed
    expect(timeline[0]).toBe('clinical_completed')
    expect(timeline[1]).toBe('on_clinical_callback')
    expect(timeline[2]).toBe('pharmacy_completed')
    expect(timeline[3]).toBe('on_pharmacy_callback')

    expect(clinicalResultAtCallback).toBeDefined()
    expect(pharmacyResultAtCallback).toBeDefined()
    expect(result.clinicalSummary?.id).toBe('ca-fast-001')
    expect(result.pharmacyReview?.id).toBe('pr-slow-001')
    expect(result.comparison).toBeDefined()
  })

  // 3. Single-Provider Failure: Gemini / Clinical fails, Qwen / Pharmacy succeeds
  it('preserves valid Pharmacy review when Clinical Assistant encounters an error or timeout', async () => {
    const failingClinicalProvider = {
      generateAssessment: vi.fn(async () => {
        throw new Error('Gemini API timeout after 45000ms: ETIMEDOUT')
      }),
    }

    const successfulPharmacyProvider = new MockPharmacyAssistantProvider({
      forceStatus: 'REVIEW_RECOMMENDED',
      overrideSummary: 'Revisión farmacéutica preservada intacta.',
    })

    const onClinicalError = vi.fn()
    const onPharmacyComplete = vi.fn()

    const result = await executeDualAIRoles({
      context: dummyContext,
      proposedPrescription: dummyDraft,
      deterministicFindings: dummyFindings,
      options: {
        clinicalProvider: failingClinicalProvider,
        pharmacyProvider: successfulPharmacyProvider,
        onClinicalError,
        onPharmacyComplete,
      },
    })

    // Clinical failure is captured
    expect(result.clinicalSummary).toBeNull()
    expect(result.clinicalError).toContain('Gemini API timeout after 45000ms')
    expect(onClinicalError).toHaveBeenCalledWith(expect.stringContaining('Gemini API timeout'))

    // Pharmacy review is NOT discarded
    expect(result.pharmacyReview).toBeDefined()
    expect(result.pharmacyReview?.status).toBe('REVIEW_RECOMMENDED')
    expect(result.pharmacyReview?.summary).toBe('Revisión farmacéutica preservada intacta.')
    expect(onPharmacyComplete).toHaveBeenCalledTimes(1)

    // Comparison is NOT fabricated when only one assistant is available
    expect(result.comparison).toBeNull()

    // Deterministic findings remain authoritative and unchanged
    expect(result.deterministicFindings).toEqual(dummyFindings)
  })

  // 4. Single-Provider Failure: Pharmacy fails, Clinical succeeds
  it('preserves valid Clinical summary when Pharmacy Assistant encounters an error', async () => {
    const successfulClinicalProvider = new MockClinicalAssistantProvider({
      overrideSummary: 'Síntesis clínica válida preservada.',
    })

    const failingPharmacyProvider = {
      reviewPrescription: vi.fn(async () => {
        throw new Error('Qwen/Groq API 503 Service Unavailable')
      }),
    }

    const onClinicalComplete = vi.fn()
    const onPharmacyError = vi.fn()

    const result = await executeDualAIRoles({
      context: dummyContext,
      proposedPrescription: dummyDraft,
      deterministicFindings: dummyFindings,
      options: {
        clinicalProvider: successfulClinicalProvider,
        pharmacyProvider: failingPharmacyProvider,
        onClinicalComplete,
        onPharmacyError,
      },
    })

    // Clinical summary is NOT discarded
    expect(result.clinicalSummary).toBeDefined()
    expect(result.clinicalSummary?.summary).toBe('Síntesis clínica válida preservada.')
    expect(onClinicalComplete).toHaveBeenCalledTimes(1)

    // Pharmacy failure is captured
    expect(result.pharmacyReview).toBeNull()
    expect(result.pharmacyError).toContain('Qwen/Groq API 503')
    expect(onPharmacyError).toHaveBeenCalledWith(expect.stringContaining('Qwen/Groq API 503'))

    // Comparison is NOT fabricated
    expect(result.comparison).toBeNull()

    // Deterministic findings remain authoritative and unchanged
    expect(result.deterministicFindings).toEqual(dummyFindings)
  })

  // 5. Both Failure
  it('captures both errors and does not fabricate comparison when both providers fail', async () => {
    const failingClinicalProvider = {
      generateAssessment: vi.fn(async () => {
        throw new Error('Gemini API 500 Internal Server Error')
      }),
    }

    const failingPharmacyProvider = {
      reviewPrescription: vi.fn(async () => {
        throw new Error('Groq API 429 Rate Limit Exceeded')
      }),
    }

    const onClinicalError = vi.fn()
    const onPharmacyError = vi.fn()

    // With throwOnError: false, returns result object with both errors
    const result = await executeDualAIRoles({
      context: dummyContext,
      proposedPrescription: dummyDraft,
      deterministicFindings: dummyFindings,
      options: {
        clinicalProvider: failingClinicalProvider,
        pharmacyProvider: failingPharmacyProvider,
        throwOnError: false,
        onClinicalError,
        onPharmacyError,
      },
    })

    expect(result.clinicalSummary).toBeNull()
    expect(result.pharmacyReview).toBeNull()
    expect(result.comparison).toBeNull()
    expect(result.clinicalError).toContain('Gemini API 500')
    expect(result.pharmacyError).toContain('Groq API 429')

    expect(onClinicalError).toHaveBeenCalledTimes(1)
    expect(onPharmacyError).toHaveBeenCalledTimes(1)

    // Deterministic findings remain authoritative and untouched
    expect(result.deterministicFindings).toEqual(dummyFindings)

    // With default throwOnError (true), throws a combined error
    await expect(
      executeDualAIRoles({
        context: dummyContext,
        proposedPrescription: dummyDraft,
        deterministicFindings: dummyFindings,
        options: {
          clinicalProvider: failingClinicalProvider,
          pharmacyProvider: failingPharmacyProvider,
        },
      })
    ).rejects.toThrow(/Dual AI execution failed/)
  })

  // 6. Independent Role Execution Helpers
  it('executes Clinical Assistant role independently via helper', async () => {
    const summary = await executeClinicalAssistantRole({
      context: dummyContext,
      deterministicFindings: dummyFindings,
      proposedPrescription: dummyDraft,
    })

    expect(summary.role).toBe('clinical_assistant')
    expect(summary.patientId).toBe('pat-syn-001')
  })

  it('executes Pharmacy Assistant role independently via helper', async () => {
    const review = await executePharmacyAssistantRole({
      context: dummyContext,
      proposedPrescription: dummyDraft,
      deterministicFindings: dummyFindings,
    })

    expect(review.role).toBe('pharmacy_assistant')
    expect(review.patientId).toBe('pat-syn-001')
    expect(review.prescriptionDraftId).toBe('rx-draft-001')
  })
})
