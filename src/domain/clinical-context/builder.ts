import { clinicalContextSchema, clinicalContextSourceInputSchema } from './schema'
import type { ClinicalContext, ClinicalContextSourceInput } from './types'

/**
 * Builds a ClinicalContext evaluation snapshot deterministically from a ClinicalContextSourceInput bundle.
 *
 * Requirements & Invariants:
 * - Pure and side-effect free: never mutates input records or fixtures.
 * - Validates source input before building via clinicalContextSourceInputSchema.
 * - Enforces patient referential integrity: rejects source bundles containing records
 *   (medication exposures, allergies, conditions, observations) linked to another patient.
 * - Resolves medications through patient-linked MedicationExposure records (never inferred from IDs).
 * - Rejects exposures referencing medications not supplied in the input medication catalog.
 * - Preserves ClinicalDataPoint values, availability states, timestamps, and sources without normalization.
 * - Maps evaluationTimestamp to ClinicalContext.timestamp.
 * - Validates the resulting snapshot against clinicalContextSchema before returning.
 */
export function buildClinicalContext(input: ClinicalContextSourceInput): ClinicalContext {
  const validatedInput = clinicalContextSourceInputSchema.parse(input)
  const patientId = validatedInput.patient.id

  // 1. Verify that all patient-linked source records belong strictly to the source patient
  for (const exposure of validatedInput.medicationExposures) {
    if (exposure.patientId !== patientId) {
      throw new Error(
        `Inconsistent source bundle: MedicationExposure '${exposure.id}' is linked to patient '${exposure.patientId}', expected source patient '${patientId}'`
      )
    }
  }

  for (const allergy of validatedInput.allergies) {
    if (allergy.patientId !== patientId) {
      throw new Error(
        `Inconsistent source bundle: Allergy '${allergy.id}' is linked to patient '${allergy.patientId}', expected source patient '${patientId}'`
      )
    }
  }

  for (const condition of validatedInput.conditions) {
    if (condition.patientId !== patientId) {
      throw new Error(
        `Inconsistent source bundle: Condition '${condition.id}' is linked to patient '${condition.patientId}', expected source patient '${patientId}'`
      )
    }
  }

  for (const observation of validatedInput.observations) {
    if (observation.patientId !== patientId) {
      throw new Error(
        `Inconsistent source bundle: Observation '${observation.id}' is linked to patient '${observation.patientId}', expected source patient '${patientId}'`
      )
    }
  }

  // 2. Resolve medications through patient-linked MedicationExposure records
  const medicationCatalogMap = new Map(
    validatedInput.medications.map((medication) => [medication.id, medication])
  )

  const resolvedMedications: typeof validatedInput.medications = []
  const resolvedMedicationIds = new Set<string>()

  for (const exposure of validatedInput.medicationExposures) {
    const medication = medicationCatalogMap.get(exposure.medicationId)
    if (!medication) {
      throw new Error(
        `Inconsistent source bundle: MedicationExposure '${exposure.id}' references medication '${exposure.medicationId}' which is not supplied in the input catalog`
      )
    }

    if (!resolvedMedicationIds.has(medication.id)) {
      resolvedMedicationIds.add(medication.id)
      resolvedMedications.push({ ...medication })
    }
  }

  // Filter exposures belonging to context patient and referencing medications in resolvedMedications
  // (Deep cloned to ensure no side-effects/mutations, preserving therapyContext, status, startedAt, endedAt exactly)
  const resolvedExposures = validatedInput.medicationExposures
    .filter(
      (exposure) =>
        exposure.patientId === patientId && resolvedMedicationIds.has(exposure.medicationId)
    )
    .map((exposure) => ({ ...exposure }))

  // 3. Assemble ClinicalContext snapshot (deep clone to prevent mutation of source records)

  const candidateContext = {
    patient: { ...validatedInput.patient },
    medications: resolvedMedications,
    medicationExposures: resolvedExposures,
    allergies: validatedInput.allergies.map((allergy) => ({ ...allergy })),
    conditions: validatedInput.conditions.map((condition) => ({ ...condition })),
    observations: validatedInput.observations.map((observation) => ({ ...observation })),
    dataPoints: Object.fromEntries(
      Object.entries(validatedInput.dataPoints).map(([key, point]) => [key, { ...point }])
    ),
    timestamp: validatedInput.evaluationTimestamp,
  }

  // 4. Validate the resulting snapshot before returning
  return clinicalContextSchema.parse(candidateContext)
}
