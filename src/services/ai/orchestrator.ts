import type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
} from '../../domain'
import {
  buildPharmacyReviewInput,
  compareReviews,
} from '../../domain'
import type {
  ClinicalAssistantProvider,
  PharmacyAssistantProvider,
  DualAIOptions,
  DualAIRunResult,
} from './types'
import {
  MockClinicalAssistantProvider,
  MockPharmacyAssistantProvider,
} from './mockProviders'

/**
 * Orchestrator service for executing SAMED Dual AI Roles v1.
 *
 * Invariants:
 * 1. Deterministic data and findings are the source of truth; AI outputs cannot overwrite them.
 * 2. Full ClinicalContext must NEVER leak into the Pharmacy Assistant.
 * 3. The proposed prescription must be an authentic physician-authored PrescriptionDraft; it must never be invented when absent.
 * 4. Clinical Assistant cannot create or approve a prescription.
 * 5. ReviewComparison exposes discrepancies and shared points but never declares a winner.
 */
export async function executeDualAIRoles(params: {
  context: ClinicalContext
  proposedPrescription: PrescriptionDraft
  deterministicFindings: ClinicalFinding[]
  options?: DualAIOptions
}): Promise<DualAIRunResult> {
  const { context, proposedPrescription, deterministicFindings, options } = params

  if (!proposedPrescription) {
    throw new Error(
      'Execution of Dual AI review requires a valid physician-authored PrescriptionDraft. A prescription draft must never be fabricated.'
    )
  }

  // Clone deterministic findings to guarantee immutability against downstream AI execution
  const immutableFindings = Object.freeze(
    deterministicFindings.map((f) => ({
      ...f,
      supportingDataKeys: [...f.supportingDataKeys],
      missingDataKeys: [...f.missingDataKeys],
    }))
  )

  const clinicalProvider: ClinicalAssistantProvider =
    options?.clinicalProvider ?? new MockClinicalAssistantProvider()

  const pharmacyProvider: PharmacyAssistantProvider =
    options?.pharmacyProvider ?? new MockPharmacyAssistantProvider()

  // 1. Build controlled, medication-relevant PharmacyReviewInput
  // Full raw ClinicalContext is strictly excluded from this payload
  const pharmacyInput = buildPharmacyReviewInput({
    context,
    proposedPrescription,
    deterministicFindings: immutableFindings as unknown as ClinicalFinding[],
    relevantObservationCodes: options?.relevantObservationCodes,
  })

  // 2. Execute both independent assistant roles
  const [clinicalSummary, pharmacyReview] = await Promise.all([
    clinicalProvider.generateAssessment(
      context,
      immutableFindings as unknown as ClinicalFinding[],
      proposedPrescription
    ),
    pharmacyProvider.reviewPrescription(pharmacyInput),
  ])

  // 3. Deterministic comparison layer (never picks a winner)
  const comparison = compareReviews(clinicalSummary, pharmacyReview)

  return {
    clinicalSummary,
    pharmacyReview,
    comparison,
    deterministicFindings: immutableFindings as unknown as ClinicalFinding[],
  }
}
