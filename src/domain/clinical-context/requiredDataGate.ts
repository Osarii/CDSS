import type { DataAvailabilityState, ClinicalDataPoint, ClinicalContext } from './types'
import type { RuleDefinition } from '../rules/schema'

/**
 * Distinguishes whether the requirement failed because:
 * - 'NOT_USABLE': The key was present in dataPoints but its status is MISSING, UNKNOWN, STALE, UNAVAILABLE, or has a null/undefined value.
 * - 'NOT_PRESENT': The required key was completely missing from ClinicalContext.dataPoints (must never be treated as normal or AVAILABLE).
 */
export type FailedRequirementReason = 'NOT_USABLE' | 'NOT_PRESENT'

/**
 * Detailed requirement failure preserving which datum failed, its status, and failure reason.
 */
export interface FailedRequirement {
  key: string
  status: DataAvailabilityState
  reason?: FailedRequirementReason
}

export interface DataGateEvaluationResult {
  canProceed: boolean
  blockedReasons: DataAvailabilityState[]
  failedRequirements: FailedRequirement[]
}

/**
 * Validates whether all mandatory clinical data points required to safely
 * evaluate a clinical rule are present and fresh.
 *
 * CRITICAL CLINICAL SAFETY PRINCIPLE:
 * UNKNOWN !== NORMAL
 * MISSING !== NORMAL
 * UNAVAILABLE !== NORMAL
 * STALE !== NORMAL
 */
export function isDataPointAvailable<T>(point: ClinicalDataPoint<T>): boolean {
  return (
    point.status === 'AVAILABLE' &&
    point.value !== null &&
    point.value !== undefined
  )
}

/**
 * Evaluates a list of already-resolved ClinicalDataPoints.
 */
export function evaluateDataGate(
  requiredPoints: Array<ClinicalDataPoint<unknown>>
): DataGateEvaluationResult {
  const nonAvailable = requiredPoints.filter(
    (point) => !isDataPointAvailable(point)
  )

  const failedRequirements: FailedRequirement[] = nonAvailable.map((point) => ({
    key: point.key,
    status: point.status,
  }))

  return {
    canProceed: nonAvailable.length === 0,
    blockedReasons: nonAvailable.map((point) => point.status),
    failedRequirements,
  }
}

export type RequiredDataKeysInput =
  | readonly string[]
  | Pick<RuleDefinition, 'requiredDataKeys'>

/**
 * Evaluates the required data gate against a canonical ClinicalContext snapshot
 * for a specific rule definition or set of required data keys.
 *
 * Requirements:
 * - Evaluates ONLY the keys required by the specific rule/request.
 * - AVAILABLE data with a usable (non-null, non-undefined) value passes.
 * - MISSING, UNKNOWN, STALE and UNAVAILABLE required data blocks evaluation.
 * - A required key not present in ClinicalContext.dataPoints is categorized as 'MISSING' with reason 'NOT_PRESENT'
 *   and strictly blocks evaluation (never assumed normal or AVAILABLE).
 * - Distinguishes ready to evaluate vs blocked because not usable vs blocked because not present.
 * - Deterministic, pure, side-effect free.
 */
export function evaluateClinicalContextDataGate(
  context: ClinicalContext,
  requirement: RequiredDataKeysInput
): DataGateEvaluationResult {
  const requiredKeys: readonly string[] =
    typeof requirement === 'object' && requirement !== null && 'requiredDataKeys' in requirement
      ? requirement.requiredDataKeys ?? []
      : requirement

  const failedRequirements: FailedRequirement[] = []
  const blockedReasons: DataAvailabilityState[] = []

  for (const key of requiredKeys) {
    const dataPoint = context.dataPoints[key]

    if (!dataPoint) {
      // Required key not present in ClinicalContext.dataPoints.
      // Must never be interpreted as normal or AVAILABLE. Block evaluation with MISSING / NOT_PRESENT.
      failedRequirements.push({
        key,
        status: 'MISSING',
        reason: 'NOT_PRESENT',
      })
      blockedReasons.push('MISSING')
    } else if (!isDataPointAvailable(dataPoint)) {
      // Data point present, but status is not usable (MISSING, UNKNOWN, STALE, UNAVAILABLE, or null value).
      failedRequirements.push({
        key: dataPoint.key,
        status: dataPoint.status,
        reason: 'NOT_USABLE',
      })
      blockedReasons.push(dataPoint.status)
    }
  }

  return {
    canProceed: failedRequirements.length === 0,
    blockedReasons,
    failedRequirements,
  }
}
