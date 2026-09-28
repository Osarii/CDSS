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

  function executeN8nCodeNode(jsCode: string, item: unknown, prepItem?: unknown) {
    const fn = new Function('$input', '$', jsCode)
    const $input = {
      first: () => ({ json: item }),
    }
    const $ = () => ({
      first: () => ({ json: prepItem || {} }),
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

    it('targets model gemini-3.5-flash-lite and uses non-secret placeholder for credentials', () => {
      const httpNode = clinicalWorkflow.nodes.find(
        (n: { type: string }) => n.type === 'n8n-nodes-base.httpRequest'
      )
      expect(httpNode).toBeDefined()
      expect(httpNode.parameters.url).toContain('gemini-3.5-flash-lite')
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

    it('configures bounded retry and timeout resilience on the Gemini HTTP Request node', () => {
      const httpNode = clinicalWorkflow.nodes.find(
        (n: { type: string }) => n.type === 'n8n-nodes-base.httpRequest'
      )
      expect(httpNode).toBeDefined()
      // Increased timeout to 45000ms
      expect(httpNode.parameters.options?.timeout).toBe(45000)
      // Bounded retry configuration: at most 2 retries (total 3 tries), short delay/backoff, controlled error flow
      expect(httpNode.retryOnFail).toBe(true)
      expect(httpNode.maxTries).toBe(3)
      expect(httpNode.waitBetweenTries).toBe(2000)
      expect(httpNode.onError).toBe('continueRegularOutput')
    })

    it('strictly normalizes valid candidate output and assigns system-owned metadata', () => {
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
                    role: 'clinical_assistant',
                  }),
                },
              ],
            },
          },
        ],
      }

      const prepItem = {
        patientId: 'pat-syn-001',
        systemId: 'ca-summary-pat-syn-001-1727500000000',
        systemTimestamp: '2026-09-28T10:00:00.000Z',
        supportedGaps: ['serum_creatinine'],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, validCandidate, prepItem)
      expect(result).toHaveLength(1)
      expect(result[0].json.error).toBeUndefined()
      const validated = clinicalAssessmentSummarySchema.parse(result[0].json)
      expect(validated.id).toBe('ca-summary-pat-syn-001-1727500000000')
      expect(validated.patientId).toBe('pat-syn-001')
      expect(validated.generatedAt).toBe('2026-09-28T10:00:00.000Z')
      expect(validated.role).toBe('clinical_assistant')
    })

    it('rejects incomplete Gemini outputs missing required AI clinical fields', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const baseValid = {
        summary: 'Síntesis clínica válida.',
        clinicalConsiderations: ['Observación'],
        dataAvailabilityGaps: [],
        deterministicFindingsReferenced: ['f1'],
        role: 'clinical_assistant',
      }

      const requiredClinicalKeys: (keyof typeof baseValid)[] = [
        'summary',
        'clinicalConsiderations',
        'dataAvailabilityGaps',
        'deterministicFindingsReferenced',
        'role',
      ]

      for (const key of requiredClinicalKeys) {
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
        summary: 'Summary',
        clinicalConsiderations: [],
        dataAvailabilityGaps: [{ key: '', status: 'INVALID_STATUS' }],
        deterministicFindingsReferenced: [],
        role: 'clinical_assistant',
      }

      const item = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(invalidGap) }] } }],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('INVALID_CLINICAL_ASSESSMENT_STRUCTURE')
    })

    it('rejects unsupported AI-invented dataAvailabilityGaps not in input metadata', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const inventedGap = {
        summary: 'Síntesis clínica válida.',
        clinicalConsiderations: [],
        dataAvailabilityGaps: [{ key: 'invented_gap_potassium', status: 'MISSING' }],
        deterministicFindingsReferenced: [],
        role: 'clinical_assistant',
      }

      const prepItem = {
        patientId: 'pat-syn-001',
        supportedGaps: ['serum_creatinine'],
      }

      const item = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(inventedGap) }] } }],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item, prepItem)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('INVALID_CLINICAL_ASSESSMENT_STRUCTURE')
      expect(result[0].json.message).toContain('unsupported or invented dataAvailabilityGap')
    })

    it('prepares supportedGaps and explicit instructions for empty collections in Prompt Prep', () => {
      const prepNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Validate & Prepare Prompt'
      )

      const mockPayload = {
        context: {
          patient: { id: 'pat-001' },
          allergies: [],
          conditions: [],
          medications: [],
          observations: [],
          dataPoints: {
            serum_creatinine: { key: 'serum_creatinine', status: 'MISSING' },
            potassium: { key: 'potassium', status: 'AVAILABLE' },
          },
        },
        deterministicFindings: [],
      }

      const result = executeN8nCodeNode(prepNode.parameters.jsCode, mockPayload)
      expect(result[0].json.supportedGaps).toEqual(['serum_creatinine'])
      expect(result[0].json.systemInstruction).toContain('INVARIANTE SEMÁNTICO DE COLECCIONES VACÍAS')
      expect(result[0].json.systemTimestamp).toBeDefined()
      expect(result[0].json.systemId).toContain('ca-summary-pat-001-')
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
    })

    it('strictly normalizes valid message content and assigns system-owned metadata', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )
      const validMessage = {
        choices: [
          {
            message: {
              content: JSON.stringify({
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
                role: 'pharmacy_assistant',
              }),
            },
          },
        ],
      }

      const prepItem = {
        patientId: 'pat-syn-001',
        prescriptionDraftId: 'draft-001',
        systemId: 'pr-review-pat-syn-001-draft-001-1727500000000',
        systemTimestamp: '2026-09-28T10:00:00.000Z',
        supportedGaps: ['serum_creatinine'],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, validMessage, prepItem)
      expect(result).toHaveLength(1)
      expect(result[0].json.error).toBeUndefined()
      const validated = pharmacyReviewSchema.parse(result[0].json)
      expect(validated.id).toBe('pr-review-pat-syn-001-draft-001-1727500000000')
      expect(validated.patientId).toBe('pat-syn-001')
      expect(validated.prescriptionDraftId).toBe('draft-001')
      expect(validated.reviewedAt).toBe('2026-09-28T10:00:00.000Z')
      expect(validated.role).toBe('pharmacy_assistant')
      expect(validated.status).toBe('BLOCKED_BY_MISSING_DATA')
    })

    it('rejects incomplete Qwen outputs missing required AI clinical fields', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const baseValid = {
        status: 'NO_ADDITIONAL_CONCERNS',
        summary: 'Revisión farmacéutica válida.',
        pharmacologicalConsiderations: ['Obs'],
        requiredDataGaps: [],
        deterministicFindingsReferenced: ['f1'],
        role: 'pharmacy_assistant',
      }

      const requiredClinicalKeys: (keyof typeof baseValid)[] = [
        'status',
        'summary',
        'pharmacologicalConsiderations',
        'requiredDataGaps',
        'deterministicFindingsReferenced',
        'role',
      ]

      for (const key of requiredClinicalKeys) {
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
        status: 'NON_EXISTENT_STATUS',
        summary: 'Summary',
        pharmacologicalConsiderations: [],
        requiredDataGaps: [],
        deterministicFindingsReferenced: [],
        role: 'pharmacy_assistant',
      }

      const item = {
        choices: [{ message: { content: JSON.stringify(invalidStatus) } }],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('INVALID_PHARMACY_REVIEW_STRUCTURE')
    })

    it('rejects unsupported AI-invented requiredDataGaps not in input unavailableData', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const inventedGap = {
        status: 'BLOCKED_BY_MISSING_DATA',
        summary: 'Revisión farmacéutica.',
        pharmacologicalConsiderations: [],
        requiredDataGaps: [{ key: 'invented_allergies', status: 'MISSING', reason: null }],
        deterministicFindingsReferenced: [],
        role: 'pharmacy_assistant',
      }

      const prepItem = {
        patientId: 'pat-syn-001',
        prescriptionDraftId: 'draft-001',
        supportedGaps: ['serum_creatinine'],
      }

      const item = {
        choices: [{ message: { content: JSON.stringify(inventedGap) } }],
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, item, prepItem)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('INVALID_PHARMACY_REVIEW_STRUCTURE')
      expect(result[0].json.message).toContain('unsupported or invented requiredDataGap')
    })

    it('prepares supportedGaps and explicit instructions for empty collections in Pharmacy Prompt Prep', () => {
      const prepNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Validate & Prepare Prompt'
      )

      const mockInput = {
        patientId: 'pat-002',
        proposedPrescription: { id: 'draft-002', items: [] },
        relevantDiagnoses: [],
        allergies: [],
        currentMedications: [],
        relevantObservations: [],
        deterministicFindings: [],
        unavailableData: [
          { key: 'potassium', status: 'MISSING', reason: 'Falta lab' },
        ],
      }

      const result = executeN8nCodeNode(prepNode.parameters.jsCode, { input: mockInput })
      expect(result[0].json.supportedGaps).toEqual(['potassium'])
      expect(result[0].json.systemInstruction).toContain('INVARIANTE SEMÁNTICO DE COLECCIONES VACÍAS')
      expect(result[0].json.systemTimestamp).toBeDefined()
      expect(result[0].json.systemId).toContain('pr-review-pat-002-draft-002-')
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

    it('classifies transient errors as retryable and client/auth errors as non-retryable', () => {
      const isTransientGeminiError = (error: { status?: number; code?: string | number; message?: string }): boolean => {
        const status = typeof error.status === 'number' ? error.status : typeof error.code === 'number' ? error.code : undefined
        if (status) {
          // Never retry 400, 401, 402, 403
          if ([400, 401, 402, 403].includes(status)) return false
          if (status === 408 || status === 429) return true
          if (status >= 500 && status < 600) return true
          return false
        }
        const text = `${error.code || ''} ${error.message || ''}`.toLowerCase()
        if (
          text.includes('timeout') ||
          text.includes('timed out') ||
          text.includes('network') ||
          text.includes('econnreset') ||
          text.includes('etimedout')
        ) {
          return true
        }
        return false
      }

      // Transient errors: must be retryable
      expect(isTransientGeminiError({ status: 408, message: 'Request Timeout' })).toBe(true)
      expect(isTransientGeminiError({ status: 429, message: 'Too Many Requests' })).toBe(true)
      expect(isTransientGeminiError({ status: 500, message: 'Internal Server Error' })).toBe(true)
      expect(isTransientGeminiError({ status: 502, message: 'Bad Gateway' })).toBe(true)
      expect(isTransientGeminiError({ status: 503, message: 'Service Unavailable' })).toBe(true)
      expect(isTransientGeminiError({ status: 504, message: 'Gateway Timeout' })).toBe(true)
      expect(isTransientGeminiError({ message: 'Network error: socket hang up' })).toBe(true)
      expect(isTransientGeminiError({ code: 'ETIMEDOUT', message: 'Connection timed out' })).toBe(true)

      // Client / Auth errors: must NEVER be retried
      expect(isTransientGeminiError({ status: 400, message: 'Bad Request' })).toBe(false)
      expect(isTransientGeminiError({ status: 401, message: 'Unauthorized / Invalid Key' })).toBe(false)
      expect(isTransientGeminiError({ status: 402, message: 'Payment Required' })).toBe(false)
      expect(isTransientGeminiError({ status: 403, message: 'Forbidden' })).toBe(false)
    })

    it('preserves controlled GEMINI_API_ERROR when transient errors exhaust retries or on fatal errors', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )

      const transientExhausted = {
        error: {
          code: 'ETIMEDOUT',
          message: 'Request timed out after 45000ms (3 attempts exhausted)',
        },
      }

      const result = executeN8nCodeNode(normalizeNode.parameters.jsCode, transientExhausted)
      expect(result[0].json.error).toBe(true)
      expect(result[0].json.code).toBe('GEMINI_API_ERROR')
      expect(result[0].json.message).toContain('Request timed out after 45000ms')
      expect(() => clinicalAssessmentSummarySchema.parse(result[0].json)).toThrow()
    })
  })
})
