import { z } from 'zod'
import { dataAvailabilityStateSchema } from '../common/schema'
import { allergySchema } from '../allergy/schema'
import { conditionSchema } from '../condition/schema'
import { observationSchema } from '../observation/schema'
import { medicationSchema } from '../medication/schema'
import { clinicalFindingSchema } from '../findings/schema'
import { prescriptionDraftSchema } from '../prescription/schema'

/**
 * Explicit data gap representation for AI roles.
 * Safety invariant: UNKNOWN !== NORMAL, MISSING !== NORMAL, STALE !== NORMAL, UNAVAILABLE !== NORMAL.
 */
export const dataAvailabilityGapSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  status: dataAvailabilityStateSchema,
  reason: z.string().optional(),
})

export type DataAvailabilityGap = z.infer<typeof dataAvailabilityGapSchema>

/**
 * Structured clinical summary produced by the Clinical Assistant.
 * Receives full ClinicalContext snapshot + deterministic findings.
 * Safety invariant: Cannot create, author, or approve a prescription.
 */
export const clinicalAssessmentSummarySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  summary: z.string().min(1, 'Summary is required'),
  clinicalConsiderations: z.array(z.string()).default([]),
  dataAvailabilityGaps: z.array(dataAvailabilityGapSchema).default([]),
  deterministicFindingsReferenced: z.array(z.string()).default([]),
  generatedAt: z.string().min(1, 'Generated timestamp is required'),
  role: z.literal('clinical_assistant').default('clinical_assistant'),
})

export type ClinicalAssessmentSummary = z.infer<typeof clinicalAssessmentSummarySchema>

/**
 * Controlled, medication-relevant input for the Pharmacy Assistant.
 * Architectural invariant: Full raw ClinicalContext must NOT leak into this input.
 */
export const pharmacyUnavailableDataSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  status: dataAvailabilityStateSchema,
  reason: z.string().optional(),
})

export type PharmacyUnavailableData = z.infer<typeof pharmacyUnavailableDataSchema>

export const pharmacyReviewInputSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  proposedPrescription: prescriptionDraftSchema,
  relevantDiagnoses: z.array(conditionSchema),
  allergies: z.array(allergySchema),
  currentMedications: z.array(medicationSchema),
  relevantObservations: z.array(observationSchema),
  deterministicFindings: z.array(clinicalFindingSchema),
  unavailableData: z.array(pharmacyUnavailableDataSchema),
})

export type PharmacyReviewInput = z.infer<typeof pharmacyReviewInputSchema>

/**
 * Canonical status for an independent Pharmacy Assistant review.
 */
export const pharmacyReviewStatusSchema = z.enum([
  'NO_ADDITIONAL_CONCERNS',
  'REVIEW_RECOMMENDED',
  'BLOCKED_BY_MISSING_DATA',
])

export type PharmacyReviewStatus = z.infer<typeof pharmacyReviewStatusSchema>

/**
 * Independent medication-focused review produced by the Pharmacy Assistant.
 * Safety invariant: Performs an independent review rather than validating the Clinical Assistant.
 */
export const pharmacyReviewSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  prescriptionDraftId: z.string().min(1, 'Prescription draft ID is required'),
  status: pharmacyReviewStatusSchema,
  summary: z.string().min(1, 'Summary is required'),
  pharmacologicalConsiderations: z.array(z.string()).default([]),
  requiredDataGaps: z.array(pharmacyUnavailableDataSchema).default([]),
  deterministicFindingsReferenced: z.array(z.string()).default([]),
  reviewedAt: z.string().min(1, 'Reviewed timestamp is required'),
  role: z.literal('pharmacy_assistant').default('pharmacy_assistant'),
})

export type PharmacyReview = z.infer<typeof pharmacyReviewSchema>

/**
 * Deterministic comparison schema between Clinical Assistant and Pharmacy Assistant reviews.
 * Architectural invariant: Must never decide which AI is correct.
 */
export const reviewComparisonSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  clinicalSummaryId: z.string().min(1, 'Clinical summary ID is required'),
  pharmacyReviewId: z.string().min(1, 'Pharmacy review ID is required'),
  sharedConsiderations: z.array(z.string()),
  clinicalAssistantOnlyConsiderations: z.array(z.string()),
  pharmacyAssistantOnlyConsiderations: z.array(z.string()),
  unresolvedDiscrepancies: z.array(z.string()),
  missingDataDisagreements: z.array(z.string()),
  comparedAt: z.string().min(1, 'Comparison timestamp is required'),
})

export type ReviewComparison = z.infer<typeof reviewComparisonSchema>
