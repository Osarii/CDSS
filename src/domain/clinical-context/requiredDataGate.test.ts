import { describe, expect, it } from 'vitest'
import { evaluateDataGate, isDataPointAvailable } from './requiredDataGate'
import type { ClinicalDataPoint } from './types'

describe('Required Data Gate Safety Invariants', () => {
  it('identifies AVAILABLE data as ready to proceed', () => {
    const validPoint: ClinicalDataPoint<number> = {
      value: 1.1,
      status: 'AVAILABLE',
    }
    expect(isDataPointAvailable(validPoint)).toBe(true)

    const gate = evaluateDataGate([validPoint])
    expect(gate.canProceed).toBe(true)
    expect(gate.blockedReasons).toHaveLength(0)
  })

  it('enforces UNKNOWN !== NORMAL and blocks evaluation', () => {
    const unknownPoint: ClinicalDataPoint<number> = {
      value: null,
      status: 'UNKNOWN',
    }
    expect(isDataPointAvailable(unknownPoint)).toBe(false)

    const gate = evaluateDataGate([unknownPoint])
    expect(gate.canProceed).toBe(false)
    expect(gate.blockedReasons).toContain('UNKNOWN')
  })

  it('enforces MISSING !== NORMAL and blocks evaluation', () => {
    const missingPoint: ClinicalDataPoint<number> = {
      value: null,
      status: 'MISSING',
    }
    expect(isDataPointAvailable(missingPoint)).toBe(false)

    const gate = evaluateDataGate([missingPoint])
    expect(gate.canProceed).toBe(false)
    expect(gate.blockedReasons).toContain('MISSING')
  })

  it('enforces STALE and UNAVAILABLE !== NORMAL and blocks evaluation', () => {
    const stalePoint: ClinicalDataPoint<number> = {
      value: 120,
      status: 'STALE',
    }
    const unavailPoint: ClinicalDataPoint<number> = {
      value: null,
      status: 'UNAVAILABLE',
    }

    const gate = evaluateDataGate([stalePoint, unavailPoint])
    expect(gate.canProceed).toBe(false)
    expect(gate.blockedReasons).toEqual(['STALE', 'UNAVAILABLE'])
  })
})
