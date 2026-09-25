import type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReviewInput,
  PharmacyReview,
  ReviewComparison,
} from '../../domain'

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

export interface DualAIOptions {
  clinicalProvider?: ClinicalAssistantProvider
  pharmacyProvider?: PharmacyAssistantProvider
  relevantObservationCodes?: string[]
}

export interface DualAIRunResult {
  clinicalSummary: ClinicalAssessmentSummary
  pharmacyReview: PharmacyReview
  comparison: ReviewComparison
  deterministicFindings: ClinicalFinding[]
}
