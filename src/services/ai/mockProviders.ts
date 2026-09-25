import type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReviewInput,
  PharmacyReview,
  DataAvailabilityGap,
} from '../../domain'
import {
  clinicalAssessmentSummarySchema,
  pharmacyReviewSchema,
} from '../../domain'
import type { ClinicalAssistantProvider, PharmacyAssistantProvider } from './types'

export interface MockClinicalAssistantConfig {
  overrideSummary?: string
  extraConsiderations?: string[]
}

/**
 * Deterministic Mock Clinical Assistant Provider for v1.
 *
 * Invariant: Preserves MISSING, UNKNOWN, STALE, and UNAVAILABLE states explicitly.
 * Invariant: Cannot create or approve a prescription.
 * Invariant: Downstream synthesis of deterministic findings; never asserts independent truth.
 */
export class MockClinicalAssistantProvider implements ClinicalAssistantProvider {
  private config?: MockClinicalAssistantConfig

  constructor(config?: MockClinicalAssistantConfig) {
    this.config = config
  }

  async generateAssessment(
    context: ClinicalContext,
    deterministicFindings: ClinicalFinding[],
    _proposedPrescription?: PrescriptionDraft
  ): Promise<ClinicalAssessmentSummary> {
    const dataAvailabilityGaps: DataAvailabilityGap[] = []

    if (context.dataPoints) {
      for (const [key, dp] of Object.entries(context.dataPoints)) {
        if (dp.status !== 'AVAILABLE') {
          dataAvailabilityGaps.push({
            key,
            status: dp.status,
            reason: `Data point '${key}' is in status ${dp.status}`,
          })
        }
      }
    }

    const clinicalConsiderations: string[] = []

    // High-level patient context considerations
    if (context.conditions.length > 0) {
      clinicalConsiderations.push(
        `Patient has diagnosed conditions: ${context.conditions.map((c) => c.name).join(', ')}.`
      )
    }

    if (context.allergies.length > 0) {
      clinicalConsiderations.push(
        `Documented allergies to: ${context.allergies.map((a) => a.substance).join(', ')}.`
      )
    }

    // Synthesis of deterministic findings
    for (const finding of deterministicFindings) {
      clinicalConsiderations.push(
        `[${finding.severity.toUpperCase()}] ${finding.title}: ${finding.detail}`
      )
    }

    if (dataAvailabilityGaps.length > 0) {
      clinicalConsiderations.push(
        `Clinical gaps detected: ${dataAvailabilityGaps.map((g) => `${g.key} (${g.status})`).join(', ')}. Caution is required.`
      )
    }

    if (this.config?.extraConsiderations) {
      clinicalConsiderations.push(...this.config.extraConsiderations)
    }

    const deterministicFindingsReferenced = deterministicFindings.map((f) => f.id)
    const summary =
      this.config?.overrideSummary ??
      `Comprehensive clinical assessment for patient ${context.patient.id}: ${context.conditions.length} conditions, ${context.medications.length} active medications, ${deterministicFindings.length} deterministic findings, and ${dataAvailabilityGaps.length} data availability gaps identified.`

    return clinicalAssessmentSummarySchema.parse({
      id: `ca-summary-${context.patient.id}-${Date.now()}`,
      patientId: context.patient.id,
      summary,
      clinicalConsiderations,
      dataAvailabilityGaps,
      deterministicFindingsReferenced,
      generatedAt: new Date().toISOString(),
      role: 'clinical_assistant',
    })
  }
}

export interface MockPharmacyAssistantConfig {
  forceStatus?: 'NO_ADDITIONAL_CONCERNS' | 'REVIEW_RECOMMENDED' | 'BLOCKED_BY_MISSING_DATA'
  overrideSummary?: string
  extraPharmacologicalConsiderations?: string[]
}

/**
 * Deterministic Mock Pharmacy Assistant Provider for v1.
 *
 * Invariant: Receives ONLY controlled PharmacyReviewInput; never receives raw ClinicalContext.
 * Invariant: Performs independent medication-focused review rather than validating Clinical Assistant.
 */
export class MockPharmacyAssistantProvider implements PharmacyAssistantProvider {
  private config?: MockPharmacyAssistantConfig

  constructor(config?: MockPharmacyAssistantConfig) {
    this.config = config
  }

  async reviewPrescription(input: PharmacyReviewInput): Promise<PharmacyReview> {
    const pharmacologicalConsiderations: string[] = []
    const requiredDataGaps = [...input.unavailableData]

    // Determine status deterministically based on input
    let status: 'NO_ADDITIONAL_CONCERNS' | 'REVIEW_RECOMMENDED' | 'BLOCKED_BY_MISSING_DATA'

    if (this.config?.forceStatus) {
      status = this.config.forceStatus
    } else {
      // Check if critical renal/metabolic data is unavailable for prescription review
      const hasBlockingDataGap = input.unavailableData.some(
        (g) => g.key === 'serum_creatinine' || g.key === 'egfr' || g.key === 'potassium'
      )

      if (hasBlockingDataGap) {
        status = 'BLOCKED_BY_MISSING_DATA'
        pharmacologicalConsiderations.push(
          'Evaluation blocked by missing or stale renal/electrolyte monitoring data required to assess drug clearance and safety.'
        )
      } else if (input.deterministicFindings.some((f) => f.severity === 'critical' || f.severity === 'warning')) {
        status = 'REVIEW_RECOMMENDED'
        pharmacologicalConsiderations.push(
          'Pharmacotherapy review recommended due to triggered deterministic contraindications or drug interactions.'
        )
      } else {
        status = 'NO_ADDITIONAL_CONCERNS'
        pharmacologicalConsiderations.push(
          'No additional pharmacotherapeutic contraindications or high-risk interactions identified in current scope.'
        )
      }
    }

    // Evaluate proposed prescription items
    for (const item of input.proposedPrescription.items) {
      pharmacologicalConsiderations.push(
        `Reviewed proposed item ${item.medicationName} (${item.dosage}, ${item.route}, ${item.frequency}).`
      )
    }

    if (this.config?.extraPharmacologicalConsiderations) {
      pharmacologicalConsiderations.push(...this.config.extraPharmacologicalConsiderations)
    }

    const summary =
      this.config?.overrideSummary ??
      `Pharmacological review of prescription ${input.proposedPrescription.id}: Status is ${status}. ${requiredDataGaps.length} unavailable data points noted.`

    return pharmacyReviewSchema.parse({
      id: `pr-review-${input.patientId}-${Date.now()}`,
      patientId: input.patientId,
      prescriptionDraftId: input.proposedPrescription.id,
      status,
      summary,
      pharmacologicalConsiderations,
      requiredDataGaps,
      deterministicFindingsReferenced: input.deterministicFindings.map((f) => f.id),
      reviewedAt: new Date().toISOString(),
      role: 'pharmacy_assistant',
    })
  }
}
