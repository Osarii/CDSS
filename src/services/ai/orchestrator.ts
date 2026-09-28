import type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReview,
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
  AIProviderMode,
  RemoteAIProviderConfig,
} from './types'
import {
  MockClinicalAssistantProvider,
  MockPharmacyAssistantProvider,
} from './mockProviders'
import {
  RemoteClinicalAssistantProvider,
  RemotePharmacyAssistantProvider,
} from './remoteProviders'

/**
 * Executes the Clinical Assistant role independently.
 */
export async function executeClinicalAssistantRole(params: {
  context: ClinicalContext
  deterministicFindings: ClinicalFinding[]
  proposedPrescription?: PrescriptionDraft
  provider?: ClinicalAssistantProvider
  mode?: AIProviderMode
  remoteConfig?: RemoteAIProviderConfig
}): Promise<ClinicalAssessmentSummary> {
  const { context, deterministicFindings, proposedPrescription, provider, mode, remoteConfig } = params

  const effectiveMode =
    mode ??
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_PROVIDER_MODE === 'remote'
      ? 'remote'
      : 'mock')

  const effectiveProvider =
    provider ??
    (effectiveMode === 'remote'
      ? new RemoteClinicalAssistantProvider(remoteConfig)
      : new MockClinicalAssistantProvider())

  return effectiveProvider.generateAssessment(
    context,
    deterministicFindings,
    proposedPrescription
  )
}

/**
 * Executes the Pharmacy Assistant role independently.
 */
export async function executePharmacyAssistantRole(params: {
  context: ClinicalContext
  proposedPrescription: PrescriptionDraft
  deterministicFindings: ClinicalFinding[]
  relevantObservationCodes?: string[]
  provider?: PharmacyAssistantProvider
  mode?: AIProviderMode
  remoteConfig?: RemoteAIProviderConfig
}): Promise<PharmacyReview> {
  const {
    context,
    proposedPrescription,
    deterministicFindings,
    relevantObservationCodes,
    provider,
    mode,
    remoteConfig,
  } = params

  if (!proposedPrescription) {
    throw new Error(
      'Execution of Pharmacy Assistant review requires a valid physician-authored PrescriptionDraft.'
    )
  }

  const effectiveMode =
    mode ??
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_PROVIDER_MODE === 'remote'
      ? 'remote'
      : 'mock')

  const effectiveProvider =
    provider ??
    (effectiveMode === 'remote'
      ? new RemotePharmacyAssistantProvider(remoteConfig)
      : new MockPharmacyAssistantProvider())

  const pharmacyInput = buildPharmacyReviewInput({
    context,
    proposedPrescription,
    deterministicFindings,
    relevantObservationCodes,
  })

  return effectiveProvider.reviewPrescription(pharmacyInput)
}

/**
 * Orchestrator service for executing SAMED Dual AI Roles v1.
 *
 * Invariants:
 * 1. Deterministic data and findings are the source of truth; AI outputs cannot overwrite them.
 * 2. Full ClinicalContext must NEVER leak into the Pharmacy Assistant.
 * 3. The proposed prescription must be an authentic physician-authored PrescriptionDraft; it must never be invented when absent.
 * 4. Clinical Assistant cannot create or approve a prescription.
 * 5. Clinical Assistant and Pharmacy Assistant execute independently and non-blockingly.
 * 6. Slower provider does not block display of faster provider; failure of one does not discard the other.
 * 7. ReviewComparison is generated ONLY when both valid reviews are available (never fabricated).
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

  const mode =
    options?.mode ??
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_PROVIDER_MODE === 'remote'
      ? 'remote'
      : 'mock')

  const clinicalProvider: ClinicalAssistantProvider =
    options?.clinicalProvider ??
    (mode === 'remote'
      ? new RemoteClinicalAssistantProvider(options?.remoteConfig)
      : new MockClinicalAssistantProvider())

  const pharmacyProvider: PharmacyAssistantProvider =
    options?.pharmacyProvider ??
    (mode === 'remote'
      ? new RemotePharmacyAssistantProvider(options?.remoteConfig)
      : new MockPharmacyAssistantProvider())

  // 1. Build controlled, medication-relevant PharmacyReviewInput
  // Full raw ClinicalContext is strictly excluded from this payload
  const pharmacyInput = buildPharmacyReviewInput({
    context,
    proposedPrescription,
    deterministicFindings: immutableFindings as unknown as ClinicalFinding[],
    relevantObservationCodes: options?.relevantObservationCodes,
  })

  // 2. Execute both independent assistant roles non-blockingly
  const clinicalPromise = clinicalProvider
    .generateAssessment(
      context,
      immutableFindings as unknown as ClinicalFinding[],
      proposedPrescription
    )
    .then((summary) => {
      options?.onClinicalComplete?.(summary)
      return { ok: true as const, value: summary }
    })
    .catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      options?.onClinicalError?.(errMsg)
      return { ok: false as const, error: errMsg }
    })

  const pharmacyPromise = pharmacyProvider
    .reviewPrescription(pharmacyInput)
    .then((review) => {
      options?.onPharmacyComplete?.(review)
      return { ok: true as const, value: review }
    })
    .catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      options?.onPharmacyError?.(errMsg)
      return { ok: false as const, error: errMsg }
    })

  const [clinicalResult, pharmacyResult] = await Promise.all([clinicalPromise, pharmacyPromise])

  // If both failed and throwOnError was not disabled, throw to preserve callers expecting rejection on total failure
  if (options?.throwOnError !== false && !clinicalResult.ok && !pharmacyResult.ok) {
    throw new Error(
      `Dual AI execution failed: Clinical Assistant (${clinicalResult.error}) | Pharmacy Assistant (${pharmacyResult.error})`
    )
  }

  const clinicalSummary = clinicalResult.ok ? clinicalResult.value : null
  const pharmacyReview = pharmacyResult.ok ? pharmacyResult.value : null

  // 3. Deterministic comparison layer: generated ONLY when both valid reviews are available
  const comparison =
    clinicalSummary && pharmacyReview
      ? compareReviews(clinicalSummary, pharmacyReview)
      : null

  return {
    clinicalSummary,
    pharmacyReview,
    comparison,
    deterministicFindings: immutableFindings as unknown as ClinicalFinding[],
    clinicalError: clinicalResult.ok ? null : clinicalResult.error,
    pharmacyError: pharmacyResult.ok ? null : pharmacyResult.error,
  }
}
