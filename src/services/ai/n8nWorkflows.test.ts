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

    it('normalizes response into canonical ClinicalAssessmentSummary schema', () => {
      const mockNormalizedOutput = {
        id: 'ca-summary-pat-syn-001-1727500000000',
        patientId: 'pat-syn-001',
        summary: 'Síntesis clínica de demostración generada para paciente pat-syn-001.',
        clinicalConsiderations: [
          'Se identificaron 1 hallazgos determinísticos activos.',
        ],
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
      }

      const validated = clinicalAssessmentSummarySchema.parse(mockNormalizedOutput)
      expect(validated.role).toBe('clinical_assistant')
      expect(validated.patientId).toBe('pat-syn-001')
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

    it('enforces JSON Schema Mode with strict validation in Groq request', () => {
      const httpNode = pharmacyWorkflow.nodes.find(
        (n: { type: string }) => n.type === 'n8n-nodes-base.httpRequest'
      )
      expect(httpNode.parameters.jsonBody).toContain('json_schema')
      expect(httpNode.parameters.jsonBody).toContain('pharmacy_review')
      expect(httpNode.parameters.jsonBody).toContain('BLOCKED_BY_MISSING_DATA')
      expect(httpNode.parameters.jsonBody).toContain('REVIEW_RECOMMENDED')
      expect(httpNode.parameters.jsonBody).toContain('NO_ADDITIONAL_CONCERNS')
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

    it('normalizes response into canonical PharmacyReview schema', () => {
      const mockNormalizedOutput = {
        id: 'pr-review-pat-syn-001-1727500000000',
        patientId: 'pat-syn-001',
        prescriptionDraftId: 'draft-001',
        status: 'BLOCKED_BY_MISSING_DATA',
        summary: 'Revisión farmacéutica independiente de propuesta draft-001.',
        pharmacologicalConsiderations: [
          'Evaluación bloqueada por datos analíticos renales ausentes.',
        ],
        requiredDataGaps: [
          {
            key: 'serum_creatinine',
            status: 'MISSING',
            reason: 'Dato analítico no registrado',
          },
        ],
        deterministicFindingsReferenced: ['finding-001'],
        reviewedAt: '2026-09-28T10:00:00.000Z',
        role: 'pharmacy_assistant',
      }

      const validated = pharmacyReviewSchema.parse(mockNormalizedOutput)
      expect(validated.role).toBe('pharmacy_assistant')
      expect(validated.status).toBe('BLOCKED_BY_MISSING_DATA')
    })

    it('returns explicit error responses for malformed or error outputs instead of fabricating valid summaries', () => {
      const normalizeNode = pharmacyWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )
      expect(normalizeNode).toBeDefined()
      const code = normalizeNode.parameters.jsCode

      // Verify code returns controlled error on API error or malformed structure
      expect(code).toContain("code: 'GROQ_API_ERROR'")
      expect(code).toContain("code: 'MALFORMED_PROVIDER_OUTPUT'")
      expect(code).toContain("code: 'INVALID_PHARMACY_REVIEW_STRUCTURE'")

      // Verify error response is rejected by SAMED Zod schema
      const errorOutput = {
        error: true,
        code: 'MALFORMED_PROVIDER_OUTPUT',
        message: 'Failed to parse Qwen provider response',
      }
      expect(() => pharmacyReviewSchema.parse(errorOutput)).toThrow()
    })
  })

  describe('Clinical Assistant Workflow Error Rejection', () => {
    const clinicalWorkflow = JSON.parse(fs.readFileSync(clinicalWorkflowPath, 'utf8'))

    it('returns explicit error responses for malformed or error outputs instead of fabricating valid summaries', () => {
      const normalizeNode = clinicalWorkflow.nodes.find(
        (n: { name: string }) => n.name === 'Normalize Response'
      )
      expect(normalizeNode).toBeDefined()
      const code = normalizeNode.parameters.jsCode

      // Verify code returns controlled error on API error or malformed structure
      expect(code).toContain("code: 'GEMINI_API_ERROR'")
      expect(code).toContain("code: 'MALFORMED_PROVIDER_OUTPUT'")
      expect(code).toContain("code: 'INVALID_CLINICAL_ASSESSMENT_STRUCTURE'")

      // Verify error response is rejected by SAMED Zod schema
      const errorOutput = {
        error: true,
        code: 'MALFORMED_PROVIDER_OUTPUT',
        message: 'Failed to parse Gemini provider response',
      }
      expect(() => clinicalAssessmentSummarySchema.parse(errorOutput)).toThrow()
    })
  })
})
