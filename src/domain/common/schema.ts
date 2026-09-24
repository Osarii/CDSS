import { z } from 'zod'

/**
 * Data availability state enum for clinical parameters.
 * Safety Invariant: UNKNOWN !== NORMAL, MISSING !== NORMAL, STALE !== NORMAL, UNAVAILABLE !== NORMAL.
 */
export const dataAvailabilityStateSchema = z.enum([
  'AVAILABLE',
  'MISSING',
  'UNKNOWN',
  'STALE',
  'UNAVAILABLE',
])

export type DataAvailabilityState = z.infer<typeof dataAvailabilityStateSchema>

/**
 * Canonical domain severity model for clinical findings and rule definitions.
 * Note: 'safe' is a visual/status semantic, not an alert finding severity.
 */
export const clinicalSeveritySchema = z.enum([
  'critical',
  'warning',
  'low',
  'info',
])

export type ClinicalSeverity = z.infer<typeof clinicalSeveritySchema>
