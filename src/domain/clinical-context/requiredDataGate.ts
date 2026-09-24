import type { DataAvailabilityState, ClinicalDataPoint } from './types'

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
  return point.status === 'AVAILABLE' && point.value !== null
}

export interface DataGateEvaluationResult {
  canProceed: boolean
  blockedReasons: DataAvailabilityState[]
}

export function evaluateDataGate(
  requiredPoints: Array<ClinicalDataPoint<unknown>>
): DataGateEvaluationResult {
  const nonAvailable = requiredPoints.filter(
    (point) => !isDataPointAvailable(point)
  )

  return {
    canProceed: nonAvailable.length === 0,
    blockedReasons: nonAvailable.map((point) => point.status),
  }
}
