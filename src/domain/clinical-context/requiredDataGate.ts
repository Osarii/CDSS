import type { DataAvailabilityState, ClinicalDataPoint } from './types'

/**
 * Detailed requirement failure preserving which datum failed and its status.
 */
export interface FailedRequirement {
  key: string
  status: DataAvailabilityState
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
