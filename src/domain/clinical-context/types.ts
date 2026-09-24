export type DataAvailabilityState =
  | 'AVAILABLE'
  | 'MISSING'
  | 'UNKNOWN'
  | 'STALE'
  | 'UNAVAILABLE'

export interface ClinicalDataPoint<T> {
  value: T | null
  status: DataAvailabilityState
  timestamp?: string
  source?: string
}
