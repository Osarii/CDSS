import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  clinicalAssessmentSummarySchema,
  pharmacyReviewSchema,
} from '../../domain'

describe('n8n Workflows Validation (Gemini Clinical & Qwen Pharmacy)', () => {
  const rootDir = path.resolve(__dirname, '../../../')
  const clinicalWorkflowPath = path.join(rootDir, 'n8n/clinical-assistant-workflow.json')
  const pharmacyWorkflowPath = path.join(rootDir, 'n8n/pharmacy-assistant-workflow.json')

  function executeN8nCodeNode(jsCode: string, item: unknown) {
    const fn = new Function('$input', '$', jsCode)
    const $input = {
      first: () => ({ json: item }),
    }
    const $ = () => ({
      first: () => ({ json: {} }),
    })
    return fn($input, $)
  }

  // ----------------------------------------------------------------
  // 1. File existence and JSON parsability
  // ----------------------------------------------------------------
  it('loads valid, parsable JSON for both n8n workflow files', () => {
    expect(fs.existsSync(clinicalWorkflowPath)).toBe(true)
    expect(fs.existsSync(pharmacyWorkflowPath)).toBe(true)

    const clinicalRaw = fs.readFileSync(clinicalWorkflowPath, 'utf8')
    const pharmacyRaw = fs.readFileSync(pharmacyWorkflowPath, 'utf8')

    const clinicalWorkflow = JSON.parse(clinicalRaw)
    const pharmacyWorkflow = JSON.parse(pharmacyRaw)

    expect(clinicalWorkflow.name).toBe('SAMED - Clinical Assistant (Gemini)')
    expect(Array.isArray(clinicalWorkflow.nodes)).toBe(true)
    expect(clinicalWorkflow.connections).toBeDefined()

    expect(pharmacyWorkflow.name).toBe('SAMED - Pharmacy Assistant (Qwen)')
    expect(Array.isArray(pharmacyWorkflow.nodes)).toBe(true)
    expect(pharmacyWorkflow.connections).toBeDefined()
  })

  // ----------------------------------------------------------------
  // 2. Clinical Assistant Workflow Structure & Model Specifications
  // ----------------------------------------------------------------
  describe('Clinical Assistant Workflow (Gemini)', () => {
    const clinicalWorkflow = JSON.parse(fs.readFileSync(clinicalWorkflowPath, 'utf8'))

    it('contains Webhook, Prompt Prep, Gemini API, Normalization, and Respond nodes', () => {
      const nodeTypes = clinicalWorkflow.nodes.map((n: { type: string }) => n.type)
      expect(nodeTypes).toContain('n8n-nodes-base.webhook')
      expect(nodeTypes).toContain('n8n-nodes-base.code')
      expect(nodeTypes).toContain('n8n-nodes-base.httpRequest')
      expect(nodeTypes).toContain('n8n-nodes-base.respondToWebhook')
    })

    it('targets model gemini-3.8-flash and uses non-secret placeholder for credentials', () => {
      const httpNode = clinicalWorkflow.nodes.find(
        (n: { type: string }) => n.type === 'n8n-nodes-base.httpRequest'
      )
      expect(httpNode).toBeDefined()
      expect(httpNode.parameters.url).toContain('gemini-3.8-flash')
      expect(httpNode.parameters.method).toBe('POST')

      // Credentials are placeholder only - no real secrets
      const rawHeader = JSON.stringify(httpNode.parameters.headerParameters)
      expect(rawHeader).toContain('REPLACE_WITH_GEMINI_API_KEY')
      expect(rawHeader).not.toMatch(/AIza[0-9A-Za-z-_]{35}/) // No real Google API key
    })

    it('enforces structured JSON schema in Gemini generationConfig', () => {
      const httpNode = clinicalWorkflow.nodes.find(
        (n: { type: string }) => n.type === 'n8n-nodes-base.httpRequest'
      )
      expect(httpNode.parameters.jsonBody).toContain('responseMimeType')
      expect(httpNode.parameters.jsonBody).toContain('application/json')
      expect(httpNode.parameters.jsonBody).toContain('responseSchema')
      expect(httpNode.parameters.jsonBody).toContain('clinical_assistant')
    })

    it('strictly normalizes valid candidate output without fabricating missing fields', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )
      const validCandidate = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    id: 'ca-summary-pat-syn-001-1727500000000',
                    patientId: 'pat-syn-001',
                    summary: 'Síntesis clínica válida generada por Gemini.',
                    clinicalConsiderations: ['Observación relevante 1'],
                    dataAvailabilityGaps: [
                      {
                        key: 'serum_creatinine',
                        status: 'MISSING',
                        reason: 'Dato analítico no registrado',
                      },
                    ],
                    deterministicFindingsReferenced: ['finding-001'],
                    generatedAt: '2026-09-28T10:00:00.000Z',
                    role: 'clinical_assistant',
                  }),
                },
              ],
            },
          },
        ],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, validCandidate)
      expect(result).toHaveLength(1)
      expect(result[0].json.error).toBeUndefined()
      const validated = clinicalAssessmentSummarySchema.parse(result[0].json)
      expect(validated.id).toBe('ca-summary-pat-syn-001-1727500000000')
      expect(validated.patientId).toBe('pat-syn-001')
      expect(validated.role).toBe('clinical_assistant')
    })

    it('rejects incomplete Gemini outputs missing required contract fields', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const baseValid = {
        id: 'ca-summary-pat-syn-001-1727500000000',
        patientId: 'pat-syn-001',
        summary: 'Síntesis clínica válida.',
        clinicalConsiderations: ['Observación'],
        dataAvailabilityGaps: [{ key: 'k1', status: 'AVAILABLE' }],
        deterministicFindingsReferenced: ['f1'],
        generatedAt: '2026-09-28T10:00:00.000Z',
        role: 'clinical_assistant',
      }

      const requiredKeys: (keyof typeof baseValid)[] = [
        'id',
        'patientId',
        'summary',
        'clinicalConsiderations',
        'dataAvailabilityGaps',
        'deterministicFindingsReferenced',
        'generatedAt',
        'role',
      ]

      for (const key of requiredKeys) {
        const incomplete = { ...baseValid }
        delete (incomplete as Record<string, unknown>)[key]

        const item = {
          candidates: [{ content: { parts: [{ text: JSON.stringify(incomplete) }] } }],
        }

        const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item)
        expect(result[0].json.error).toBe(true)
        expect(result[0].json.code).toBe('INVALID_CLINICAL_ASSESSMENT_STRUCTURE')
        expect(() => clinicalAssessmentSummarySchema.parse(result[0].json)).toThrow()
      }
    })

    it('rejects Gemini outputs with malformed dataAvailabilityGaps items', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const invalidGap = {
        id: 'ca-summary-1',
        patientId: 'pat-1',
        summary: 'Summary',
        clinicalConsiderations: [],
        dataAvailabilityGaps: [{ key: '', status: 'INVALID_STATUS' }],
        deterministicFindingsReferenced: [],
        generatedAt: '2026-09-28T10:00:00.000Z',
        role: 'clinical_assistant',
      }

      const item = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(invalidGap) }] } }],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('INVALID_CLINICAL_ASSESSMENT_STRUCTURE')
    })
  })

  // ----------------------------------------------------------------
  // 3. Pharmacy Assistant Workflow Structure & Model Specifications
  // ----------------------------------------------------------------
  describe('Pharmacy Assistant Workflow (Qwen)', () => {
    const pharmacyWorkflow = JSON.parse(fs.readFileSync(pharmacyWorkflowPath, 'utf8'))

    it('targets model qwen/qwen3.8-27b on Groq and uses non-secret placeholder for credentials', () => {
      const httpNode = pharmacyWorkflow.nodes.find(
        (n: { type: string }) => n.type === 'n8n-nodes-base.httpRequest'
      )
      expect(httpNode).toBeDefined()
      expect(httpNode.parameters.url).toContain('api.groq.com')
      expect(httpNode.parameters.jsonBody).toContain('qwen/qwen3.8-27b')

      // Credentials are placeholder only - no real secrets
      const rawHeader = JSON.stringify(httpNode.parameters.headerParameters)
      expect(rawHeader).toContain('REPLACE_WITH_GROQ_API_KEY')
      expect(rawHeader).not.toMatch(/gsk_[0-9A-Za-z]{40,}/) // No real Groq API key
    })

    it('enforces JSON Schema Mode with full strict:true compliance for Groq', () => {
      const httpNode = pharmacyWorkflow.nodes.find(
        (n: { type: string }) => n.type === 'n8n-nodes-base.httpRequest'
      )
      const rawJsonBody = httpNode.parameters.jsonBody
      // Extract json_schema substring or verify properties
      expect(rawJsonBody).toContain('"strict": true')
      expect(rawJsonBody).toContain('"additionalProperties": false')

      // Verify all properties of root object are required
      const requiredRootProps = [
        'id',
        'patientId',
        'prescriptionDraftId',
        'status',
        'summary',
        'pharmacologicalConsiderations',
        'requiredDataGaps',
        'deterministicFindingsReferenced',
        'reviewedAt',
        'role',
      ]

      for (const prop of requiredRootProps) {
        expect(rawJsonBody).toContain(`"${prop}"`)
      }

      // Verify requiredDataGaps schema: strict object with nullable reason and all required properties
      expect(rawJsonBody).toContain('"reason": {\n                  "type": ["string", "null"]')
      expect(rawJsonBody).toContain('"required": ["key", "status", "reason"]')
    })

    it('enforces controlled input boundary: does not leak or process raw ClinicalContext', () => {
      const prepNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Validate & Prepare Prompt'
      )
      expect(prepNode).toBeDefined()
      const code = prepNode.parameters.jsCode

      // Must require PharmacyReviewInput
      expect(code).toContain('proposedPrescription')
      expect(code).toContain('unavailableData')
      expect(code).toContain('deterministicFindings')

      // Must not accept or expose full raw context
      expect(code).toContain('Ensure raw ClinicalContext is strictly not passed to Qwen')
    })

    it('strictly normalizes valid message content without fabricating missing fields', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )
      const validMessage = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                id: 'pr-review-pat-syn-001-1727500000000',
                patientId: 'pat-syn-001',
                prescriptionDraftId: 'draft-001',
                status: 'BLOCKED_BY_MISSING_DATA',
                summary: 'Revisión farmacéutica independiente válida.',
                pharmacologicalConsiderations: ['Consideración 1'],
                requiredDataGaps: [
                  {
                    key: 'serum_creatinine',
                    status: 'MISSING',
                    reason: null,
                  },
                ],
                deterministicFindingsReferenced: ['finding-001'],
                reviewedAt: '2026-09-28T10:00:00.000Z',
                role: 'pharmacy_assistant',
              }),
            },
          },
        ],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, validMessage)
      expect(result).toHaveLength(1)
      expect(result[0].json.error).toBeUndefined()
      const validated = pharmacyReviewSchema.parse(result[0].json)
      expect(validated.role).toBe('pharmacy_assistant')
      expect(validated.status).toBe('BLOCKED_BY_MISSING_DATA')
      expect(validated.prescriptionDraftId).toBe('draft-001')
    })

    it('rejects incomplete Qwen outputs missing required contract fields', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const baseValid = {
        id: 'pr-review-pat-syn-001-1727500000000',
        patientId: 'pat-syn-001',
        prescriptionDraftId: 'draft-001',
        status: 'NO_ADDITIONAL_CONCERNS',
        summary: 'Revisión farmacéutica válida.',
        pharmacologicalConsiderations: ['Obs'],
        requiredDataGaps: [{ key: 'k1', status: 'AVAILABLE', reason: null }],
        deterministicFindingsReferenced: ['f1'],
        reviewedAt: '2026-09-28T10:00:00.000Z',
        role: 'pharmacy_assistant',
      }

      const requiredKeys: (keyof typeof baseValid)[] = [
        'id',
        'patientId',
        'prescriptionDraftId',
        'status',
        'summary',
        'pharmacologicalConsiderations',
        'requiredDataGaps',
        'deterministicFindingsReferenced',
        'reviewedAt',
        'role',
      ]

      for (const key of requiredKeys) {
        const incomplete = { ...baseValid }
        delete (incomplete as Record<string, unknown>)[key]

        const item = {
          choices: [{ message: { content: JSON.stringify(incomplete) } }],
        }

        const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item)
        expect(result[0].json.error).toBe(true)
        expect(result[0].json.code).toBe('INVALID_PHARMACY_REVIEW_STRUCTURE')
        expect(() => pharmacyReviewSchema.parse(result[0].json)).toThrow()
      }
    })

    it('rejects Qwen outputs with invalid status or malformed requiredDataGaps', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const invalidStatus = {
        id: 'pr-1',
        patientId: 'pat-1',
        prescriptionDraftId: 'draft-1',
        status: 'NON_EXISTENT_STATUS',
        summary: 'Summary',
        pharmacologicalConsiderations: [],
        requiredDataGaps: [],
        deterministicFindingsReferenced: [],
        reviewedAt: '2026-09-28T10:00:00.000Z',
        role: 'pharmacy_assistant',
      }

      const item = {
        choices: [{ message: { content: JSON.stringify(invalidStatus) } }],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('INVALID_PHARMACY_REVIEW_STRUCTURE')
    })

    it('returns explicit error responses on Groq API failure', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const errorOutput = {
        error: {
          message: 'Rate limit reached',
          type: 'requests',
          code: 'rate_limit_exceeded',
        },
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, errorOutput)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('GROQ_API_ERROR')
      expect(result[0].json.message).toContain('Rate limit reached')
      expect(() => pharmacyReviewSchema.parse(result[0].json)).toThrow()
    })
  })

  describe('Clinical Assistant Workflow Error Rejection', () => {
    const clinicalWorkflow = JSON.parse(fs.readFileSync(clinicalWorkflowPath, 'utf8'))

    it('returns explicit error responses on Gemini API failure', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const errorOutput = {
        error: {
          code: 429,
          message: 'Resource exhausted',
          status: 'RESOURCE_EXHAUSTED',
        },
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, errorOutput)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('GEMINI_API_ERROR')
      expect(result[0].json.message).toContain('Resource exhausted')
      expect(() => clinicalAssessmentSummarySchema.parse(result[0].json)).toThrow()
    })
  })
})
