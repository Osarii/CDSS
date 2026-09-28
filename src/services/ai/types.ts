import type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReviewInput,
  PharmacyReview,
  ReviewComparison,
} from '../../domain'

export type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReviewInput,
  PharmacyReview,
  ReviewComparison,
}

/**
 * Provider-agnostic interface for Clinical Assistant AI.
 * Receives permitted ClinicalContext + deterministic findings.
 * Safety invariant: Cannot create, author, or approve a prescription.
 */
export interface ClinicalAssistantProvider {
  generateAssessment(
    context: ClinicalContext,
    deterministicFindings: ClinicalFinding[],
    proposedPrescription?: PrescriptionDraft
  ): Promise<ClinicalAssessmentSummary>
}

/**
 * Provider-agnostic interface for Pharmacy Assistant AI.
 * Receives only controlled, medication-relevant PharmacyReviewInput.
 * Safety invariant: Full ClinicalContext must NOT leak into this provider.
 */
export interface PharmacyAssistantProvider {
  reviewPrescription(input: PharmacyReviewInput): Promise<PharmacyReview>
}

export type AIProviderMode = 'mock' | 'remote'

export interface RemoteAIProviderConfig {
  geminiWebhookUrl?: string
  qwenWebhookUrl?: string
  timeoutMs?: number
  headers?: Record<string, string>
}

export interface DualAIOptions {
  clinicalProvider?: ClinicalAssistantProvider
  pharmacyProvider?: PharmacyAssistantProvider
  relevantObservationCodes?: string[]
  mode?: AIProviderMode
  remoteConfig?: RemoteAIProviderConfig
  throwOnError?: boolean
  onClinicalComplete?: (summary: ClinicalAssessmentSummary) => void
  onClinicalError?: (error: string) => void
  onPharmacyComplete?: (review: PharmacyReview) => void
  onPharmacyError?: (error: string) => void
}

export interface DualAIRunResult {
  clinicalSummary: ClinicalAssessmentSummary | null
  pharmacyReview: PharmacyReview | null
  comparison: ReviewComparison | null
  deterministicFindings: ClinicalFinding[]
  clinicalError?: string | null
  pharmacyError?: string | null
}
