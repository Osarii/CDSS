import type {
  ClinicalAssessmentSummary,
  PharmacyReview,
  ReviewComparison,
} from './schema'
import { reviewComparisonSchema } from './schema'

export interface CompareReviewsOptions {
  id?: string
  comparedAt?: string
}

/**
 * Pure helper to normalize text for comparison.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ')
}

/**
 * Checks if two considerations share substantial semantic overlap.
 */
function hasConsiderationOverlap(a: string, b: string): boolean {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (normA === normB) return true

  // Check keyword overlap (words > 4 chars)
  const wordsA = new Set(normA.split(/\s+/).filter((w) => w.length > 4))
  const wordsB = normB.split(/\s+/).filter((w) => w.length > 4)

  let matches = 0
  for (const word of wordsB) {
    if (wordsA.has(word)) matches++
  }

  return matches >= 2
}

/**
 * Pure deterministic comparison layer between Clinical Assistant and Pharmacy Assistant reviews.
 *
 * Invariant: Must expose shared considerations, assistant-only considerations,
 * unresolved discrepancies, and missing-data disagreements.
 * Invariant: Must NEVER decide which AI is correct or declare a winner.
 */
export function compareReviews(
  clinicalSummary: ClinicalAssessmentSummary,
  pharmacyReview: PharmacyReview,
  options?: CompareReviewsOptions
): ReviewComparison {
  if (clinicalSummary.patientId !== pharmacyReview.patientId) {
    throw new Error(
      `Cannot compare reviews for different patients: ${clinicalSummary.patientId} vs ${pharmacyReview.patientId}`
    )
  }

  const sharedConsiderations: string[] = []
  const clinicalMatchedIndices = new Set<number>()
  const pharmacyMatchedIndices = new Set<number>()

  // 1. Identify shared considerations vs assistant-only
  clinicalSummary.clinicalConsiderations.forEach((cCons, cIdx) => {
    pharmacyReview.pharmacologicalConsiderations.forEach((pCons, pIdx) => {
      if (hasConsiderationOverlap(cCons, pCons)) {
        clinicalMatchedIndices.add(cIdx)
        pharmacyMatchedIndices.add(pIdx)
        // Add shared summary noting both points
        sharedConsiderations.push(
          `Shared observation: Clinical Assistant noted "${cCons}"; Pharmacy Assistant noted "${pCons}".`
        )
      }
    })
  })

  const clinicalAssistantOnlyConsiderations = clinicalSummary.clinicalConsiderations.filter(
    (_, idx) => !clinicalMatchedIndices.has(idx)
  )

  const pharmacyAssistantOnlyConsiderations = pharmacyReview.pharmacologicalConsiderations.filter(
    (_, idx) => !pharmacyMatchedIndices.has(idx)
  )

  // 2. Identify unresolved discrepancies (without judging correctness)
  const unresolvedDiscrepancies: string[] = []

  // Check for status disparity
  if (
    pharmacyReview.status === 'BLOCKED_BY_MISSING_DATA' &&
    clinicalSummary.dataAvailabilityGaps.length === 0
  ) {
    unresolvedDiscrepancies.push(
      'Pharmacy Assistant evaluation is BLOCKED_BY_MISSING_DATA, whereas Clinical Assistant identified zero data availability gaps.'
    )
  } else if (
    pharmacyReview.status === 'REVIEW_RECOMMENDED' &&
    clinicalSummary.clinicalConsiderations.length === 0
  ) {
    unresolvedDiscrepancies.push(
      'Pharmacy Assistant recommends REVIEW_RECOMMENDED for proposed therapy, but Clinical Assistant flagged no specific clinical considerations.'
    )
  }

  // Check for perspective tension between general stability and targeted pharmacological review
  const clinicalSummaryNorm = normalizeText(clinicalSummary.summary)
  if (
    pharmacyReview.status === 'REVIEW_RECOMMENDED' &&
    (clinicalSummaryNorm.includes('stable') || clinicalSummaryNorm.includes('no concerns'))
  ) {
    unresolvedDiscrepancies.push(
      'Perspective tension: Clinical Assistant summary characterizes patient as clinically stable, while Pharmacy Assistant recommends REVIEW_RECOMMENDED for proposed pharmacotherapy.'
    )
  }

  // Pharmacological concerns raised exclusively by Pharmacy Assistant during active review
  if (
    pharmacyReview.status === 'REVIEW_RECOMMENDED' &&
    pharmacyAssistantOnlyConsiderations.length > 0
  ) {
    for (const pCons of pharmacyAssistantOnlyConsiderations) {
      unresolvedDiscrepancies.push(
        `Pharmacy Assistant raised specific pharmacological consideration not mirrored in Clinical Assistant assessment: "${pCons}"`
      )
    }
  }

  // Clinical considerations raised exclusively by Clinical Assistant when pharmacy found no concerns
  if (
    pharmacyReview.status === 'NO_ADDITIONAL_CONCERNS' &&
    clinicalAssistantOnlyConsiderations.length > 0
  ) {
    for (const cCons of clinicalAssistantOnlyConsiderations) {
      unresolvedDiscrepancies.push(
        `Clinical Assistant raised consideration not addressed in Pharmacy Assistant review: "${cCons}"`
      )
    }
  }

  // Check for finding reference discrepancies
  const clinicalFindingIds = new Set(clinicalSummary.deterministicFindingsReferenced)
  const pharmacyFindingIds = new Set(pharmacyReview.deterministicFindingsReferenced)

  for (const fId of pharmacyFindingIds) {
    if (!clinicalFindingIds.has(fId)) {
      unresolvedDiscrepancies.push(
        `Deterministic finding '${fId}' was referenced by Pharmacy Assistant but not highlighted by Clinical Assistant.`
      )
    }
  }

  for (const fId of clinicalFindingIds) {
    if (!pharmacyFindingIds.has(fId)) {
      unresolvedDiscrepancies.push(
        `Deterministic finding '${fId}' was highlighted by Clinical Assistant but not referenced in Pharmacy Assistant review.`
      )
    }
  }

  // 3. Identify missing-data disagreements
  const missingDataDisagreements: string[] = []
  const clinicalGapsByKey = new Map(
    clinicalSummary.dataAvailabilityGaps.map((g) => [g.key, g.status])
  )
  const pharmacyGapsByKey = new Map(
    pharmacyReview.requiredDataGaps.map((g) => [g.key, g.status])
  )

  // Check pharmacy gaps not in clinical
  for (const [key, pStatus] of pharmacyGapsByKey.entries()) {
    if (!clinicalGapsByKey.has(key)) {
      missingDataDisagreements.push(
        `Key '${key}' is marked as ${pStatus} by Pharmacy Assistant, but was not included in Clinical Assistant data gaps.`
      )
    } else {
      const cStatus = clinicalGapsByKey.get(key)
      if (cStatus !== pStatus) {
        missingDataDisagreements.push(
          `Disagreement on key '${key}': Clinical Assistant reports ${cStatus}, while Pharmacy Assistant reports ${pStatus}.`
        )
      }
    }
  }

  // Check clinical gaps not in pharmacy
  for (const [key, cStatus] of clinicalGapsByKey.entries()) {
    if (!pharmacyGapsByKey.has(key)) {
      missingDataDisagreements.push(
        `Key '${key}' is marked as ${cStatus} by Clinical Assistant, but was not considered a required gap by Pharmacy Assistant.`
      )
    }
  }

  const comparedAt = options?.comparedAt ?? new Date().toISOString()
  const id = options?.id ?? `comp-${clinicalSummary.id}-${pharmacyReview.id}-${Date.now()}`

  return reviewComparisonSchema.parse({
    id,
    patientId: clinicalSummary.patientId,
    clinicalSummaryId: clinicalSummary.id,
    pharmacyReviewId: pharmacyReview.id,
    sharedConsiderations,
    clinicalAssistantOnlyConsiderations,
    pharmacyAssistantOnlyConsiderations,
    unresolvedDiscrepancies,
    missingDataDisagreements,
    comparedAt,
  })
}
