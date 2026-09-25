import type { ClinicalContext } from '../clinical-context/schema'
import type { ClinicalFinding } from '../findings/schema'
import type { PrescriptionDraft } from '../prescription/schema'
import {
  pharmacyReviewInputSchema,
  type PharmacyReviewInput,
  type PharmacyUnavailableData,
} from './schema'

export interface BuildPharmacyReviewInputOptions {
  context: ClinicalContext
  proposedPrescription: PrescriptionDraft
  deterministicFindings: ClinicalFinding[]
  relevantObservationCodes?: string[]
}

/**
 * Common observation codes relevant to pharmacotherapeutic review (renal, hepatic, electrolytes, vitals).
 */
export const DEFAULT_PHARMACY_RELEVANT_OBSERVATIONS = [
  'serum_creatinine',
  'egfr',
  'creatinine_clearance',
  'potassium',
  'sodium',
  'alt',
  'ast',
  'inr',
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
]

/**
 * Builds a strictly controlled, medication-focused PharmacyReviewInput from a ClinicalContext.
 *
 * Invariant: The full raw ClinicalContext must NOT leak into the Pharmacy Assistant.
 * Invariant: The proposed prescription must be an authentic physician-authored PrescriptionDraft.
 * Invariant: Unavailable, missing, stale, or unknown data states are explicitly preserved.
 */
export function buildPharmacyReviewInput(
  options: BuildPharmacyReviewInputOptions
): PharmacyReviewInput {
  const { context, proposedPrescription, deterministicFindings, relevantObservationCodes } = options

  if (!proposedPrescription) {
    throw new Error('Proposed prescription draft is required and cannot be fabricated or inferred')
  }

  // Filter observations to only those clinically relevant to medication safety / pharmacology
  const allowedObservationCodes = new Set(
    relevantObservationCodes ?? DEFAULT_PHARMACY_RELEVANT_OBSERVATIONS
  )

  const relevantObservations = context.observations.filter((obs) =>
    allowedObservationCodes.has(obs.code)
  )

  // Extract explicit unavailable/missing/stale/unknown data points
  const unavailableData: PharmacyUnavailableData[] = []
  if (context.dataPoints) {
    for (const [key, dp] of Object.entries(context.dataPoints)) {
      if (dp.status !== 'AVAILABLE') {
        unavailableData.push({
          key,
          status: dp.status,
          reason: `Data point '${key}' is marked as ${dp.status}`,
        })
      }
    }
  }

  // Construct strictly filtered payload without raw patient object or raw dataPoints dictionary
  const rawInput = {
    patientId: context.patient.id,
    proposedPrescription,
    relevantDiagnoses: [...context.conditions],
    allergies: [...context.allergies],
    currentMedications: [...context.medications],
    relevantObservations,
    deterministicFindings: [...deterministicFindings],
    unavailableData,
  }

  return pharmacyReviewInputSchema.parse(rawInput)
}
