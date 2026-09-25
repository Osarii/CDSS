import { describe, expect, it } from 'vitest'
import {
  evaluateDataGate,
  evaluateClinicalContextDataGate,
  isDataPointAvailable,
} from './requiredDataGate'
import type { ClinicalDataPoint } from './types'
import type { RuleDefinition } from '../rules/schema'
import { SYN_001, SYN_004, SYN_005, SYN_008 } from '@/data'

describe('Required Data Gate Safety Invariants', () => {
  it('identifies AVAILABLE data as ready to proceed', () => {
    const validPoint: ClinicalDataPoint<number> = {
      key: 'creatinine',
      value: 1.1,
      status: 'AVAILABLE',
    }
    expect(isDataPointAvailable(validPoint)).toBe(true)

    const gate = evaluateDataGate([validPoint])
    expect(gate.canProceed).toBe(true)
    expect(gate.blockedReasons).toHaveLength(0)
    expect(gate.failedRequirements).toHaveLength(0)
  })

  it('enforces UNKNOWN !== NORMAL and blocks evaluation', () => {
    const unknownPoint: ClinicalDataPoint<number> = {
      key: 'allergen_penicillin',
      value: null,
      status: 'UNKNOWN',
    }
    expect(isDataPointAvailable(unknownPoint)).toBe(false)

    const gate = evaluateDataGate([unknownPoint])
    expect(gate.canProceed).toBe(false)
    expect(gate.blockedReasons).toContain('UNKNOWN')
    expect(gate.failedRequirements).toEqual([
      { key: 'allergen_penicillin', status: 'UNKNOWN' },
    ])
  })

  it('enforces MISSING !== NORMAL and blocks evaluation', () => {
    const missingPoint: ClinicalDataPoint<number> = {
      key: 'egfr',
      value: null,
      status: 'MISSING',
    }
    expect(isDataPointAvailable(missingPoint)).toBe(false)

    const gate = evaluateDataGate([missingPoint])
    expect(gate.canProceed).toBe(false)
    expect(gate.blockedReasons).toContain('MISSING')
    expect(gate.failedRequirements).toEqual([
      { key: 'egfr', status: 'MISSING' },
    ])
  })

  it('enforces STALE and UNAVAILABLE !== NORMAL and blocks evaluation', () => {
    const stalePoint: ClinicalDataPoint<number> = {
      key: 'potassium',
      value: 4.5,
      status: 'STALE',
    }
    const unavailPoint: ClinicalDataPoint<number> = {
      key: 'alt_ast',
      value: null,
      status: 'UNAVAILABLE',
    }

    const gate = evaluateDataGate([stalePoint, unavailPoint])
    expect(gate.canProceed).toBe(false)
    expect(gate.blockedReasons).toEqual(['STALE', 'UNAVAILABLE'])
    expect(gate.failedRequirements).toEqual([
      { key: 'potassium', status: 'STALE' },
      { key: 'alt_ast', status: 'UNAVAILABLE' },
    ])
  })
})

describe('Clinical Context & RuleDefinition Integration (evaluateClinicalContextDataGate)', () => {
  it('passes when all required keys are AVAILABLE with usable values (SYN-001)', () => {
    // SYN-001 has hba1c, serum_creatinine, egfr, potassium, systolic_bp, diastolic_bp as AVAILABLE
    const result = evaluateClinicalContextDataGate(SYN_001.clinicalContext, [
      'serum_creatinine',
      'egfr',
      'potassium',
    ])

    expect(result.canProceed).toBe(true)
    expect(result.blockedReasons).toHaveLength(0)
    expect(result.failedRequirements).toHaveLength(0)
  })

  it('accepts RuleDefinition object directly via Pick<RuleDefinition, "requiredDataKeys">', () => {
    const mockRule: RuleDefinition = {
      id: 'rule-renal-dosing',
      version: '1.0.0',
      name: 'Renal Function Evaluation',
      description: 'Checks renal function prior to dosing',
      severity: 'warning',
      enabled: true,
      requiredDataKeys: ['serum_creatinine', 'egfr'],
    }

    const result = evaluateClinicalContextDataGate(SYN_001.clinicalContext, mockRule)
    expect(result.canProceed).toBe(true)
    expect(result.blockedReasons).toHaveLength(0)
    expect(result.failedRequirements).toHaveLength(0)
  })

  it('blocks evaluation when required data has MISSING status (SYN-004)', () => {
    // SYN-004 has serum_creatinine and egfr as MISSING
    const result = evaluateClinicalContextDataGate(SYN_004.clinicalContext, [
      'serum_creatinine',
      'egfr',
    ])

    expect(result.canProceed).toBe(false)
    expect(result.blockedReasons).toEqual(['MISSING', 'MISSING'])
    expect(result.failedRequirements).toEqual([
      { key: 'serum_creatinine', status: 'MISSING', reason: 'NOT_USABLE' },
      { key: 'egfr', status: 'MISSING', reason: 'NOT_USABLE' },
    ])
  })

  it('does NOT block evaluation when an unrelated key is MISSING but not required (SYN-004)', () => {
    // SYN-004 has potassium and systolic_bp AVAILABLE, while creatinine/egfr are MISSING
    const result = evaluateClinicalContextDataGate(SYN_004.clinicalContext, [
      'potassium',
      'systolic_bp',
    ])

    expect(result.canProceed).toBe(true)
    expect(result.blockedReasons).toHaveLength(0)
    expect(result.failedRequirements).toHaveLength(0)
  })

  it('blocks evaluation when required data has STALE status (SYN-005)', () => {
    // SYN-005 has serum_creatinine, egfr, potassium, uric_acid as STALE
    const result = evaluateClinicalContextDataGate(SYN_005.clinicalContext, [
      'serum_creatinine',
      'uric_acid',
    ])

    expect(result.canProceed).toBe(false)
    expect(result.blockedReasons).toEqual(['STALE', 'STALE'])
    expect(result.failedRequirements).toEqual([
      { key: 'serum_creatinine', status: 'STALE', reason: 'NOT_USABLE' },
      { key: 'uric_acid', status: 'STALE', reason: 'NOT_USABLE' },
    ])
  })

  it('preserves multiple distinct failed requirements across availability states (SYN-008)', () => {
    // SYN-008 has:
    // serum_creatinine: MISSING
    // egfr: UNAVAILABLE
    // potassium: STALE
    // digoxin_level: UNKNOWN
    // heart_rate: AVAILABLE
    const result = evaluateClinicalContextDataGate(SYN_008.clinicalContext, [
      'serum_creatinine',
      'egfr',
      'potassium',
      'digoxin_level',
      'heart_rate', // AVAILABLE
    ])

    expect(result.canProceed).toBe(false)
    expect(result.blockedReasons).toEqual([
      'MISSING',
      'UNAVAILABLE',
      'STALE',
      'UNKNOWN',
    ])
    expect(result.failedRequirements).toEqual([
      { key: 'serum_creatinine', status: 'MISSING', reason: 'NOT_USABLE' },
      { key: 'egfr', status: 'UNAVAILABLE', reason: 'NOT_USABLE' },
      { key: 'potassium', status: 'STALE', reason: 'NOT_USABLE' },
      { key: 'digoxin_level', status: 'UNKNOWN', reason: 'NOT_USABLE' },
    ])
  })

  it('strictly blocks when required key is NOT PRESENT in ClinicalContext.dataPoints', () => {
    // Request a key that does not exist in SYN-001.dataPoints
    const nonExistentKey = 'inr_ratio'
    expect(SYN_001.clinicalContext.dataPoints[nonExistentKey]).toBeUndefined()

    const result = evaluateClinicalContextDataGate(SYN_001.clinicalContext, [
      'serum_creatinine',
      nonExistentKey,
    ])

    expect(result.canProceed).toBe(false)
    expect(result.blockedReasons).toEqual(['MISSING'])
    expect(result.failedRequirements).toEqual([
      {
        key: 'inr_ratio',
        status: 'MISSING',
        reason: 'NOT_PRESENT',
      },
    ])
  })

  it('distinguishes NOT_USABLE vs NOT_PRESENT in failed requirements', () => {
    // SYN-004 has serum_creatinine as MISSING (NOT_USABLE), plus non-existent 'troponin' (NOT_PRESENT)
    const result = evaluateClinicalContextDataGate(SYN_004.clinicalContext, [
      'serum_creatinine',
      'troponin',
    ])

    expect(result.canProceed).toBe(false)
    expect(result.failedRequirements).toEqual([
      {
        key: 'serum_creatinine',
        status: 'MISSING',
        reason: 'NOT_USABLE',
      },
      {
        key: 'troponin',
        status: 'MISSING',
        reason: 'NOT_PRESENT',
      },
    ])
  })

  it('handles empty requiredDataKeys safely and allows proceeding', () => {
    const result = evaluateClinicalContextDataGate(SYN_001.clinicalContext, [])
    expect(result.canProceed).toBe(true)
    expect(result.blockedReasons).toHaveLength(0)
    expect(result.failedRequirements).toHaveLength(0)
  })

  it('is deterministic, pure, and does not mutate ClinicalContext', () => {
    const contextSnapshot = JSON.stringify(SYN_008.clinicalContext)
    const keys = ['serum_creatinine', 'heart_rate']

    const run1 = evaluateClinicalContextDataGate(SYN_008.clinicalContext, keys)
    const run2 = evaluateClinicalContextDataGate(SYN_008.clinicalContext, keys)

    expect(run1).toEqual(run2)
    expect(JSON.stringify(SYN_008.clinicalContext)).toBe(contextSnapshot)
  })
})
