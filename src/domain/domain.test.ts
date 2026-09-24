import { describe, expect, it } from 'vitest'
import {
  patientSchema,
  medicationSchema,
  allergySchema,
  conditionSchema,
  observationSchema,
  clinicalContextSchema,
  ruleDefinitionSchema,
  clinicalFindingSchema,
  auditEventSchema,
  evaluateDataGate,
  isDataPointAvailable,
  dataAvailabilityStateSchema,
  clinicalSeveritySchema,
  type ClinicalDataPoint,
} from './index'

describe('Phase 1 — Domain Model v1 Validation & Safety Invariants', () => {
  describe('Entity Schema Parsing', () => {
    it('parses valid Patient entity', () => {
      const valid = patientSchema.parse({
        id: 'pat-1',
        syntheticIdentifier: 'SYNTH-100',
        age: 45,
        gender: 'female',
      })
      expect(valid.syntheticIdentifier).toBe('SYNTH-100')
    })

    it('rejects invalid Patient (negative age)', () => {
      expect(() =>
        patientSchema.parse({
          id: 'pat-1',
          syntheticIdentifier: 'SYNTH-100',
          age: -5,
          gender: 'female',
        })
      ).toThrow()
    })

    it('parses valid Medication entity', () => {
      const med = medicationSchema.parse({
        id: 'med-1',
        code: 'MED-10',
        name: 'Enalapril',
        dosage: '10mg',
        route: 'oral',
      })
      expect(med.name).toBe('Enalapril')
    })

    it('parses valid Allergy entity', () => {
      const allergy = allergySchema.parse({
        id: 'all-1',
        patientId: 'pat-1',
        substance: 'Penicillin',
        reaction: 'Anaphylaxis',
        severity: 'critical',
      })
      expect(allergy.severity).toBe('critical')
    })

    it('parses valid Condition entity', () => {
      const cond = conditionSchema.parse({
        id: 'cond-1',
        patientId: 'pat-1',
        code: 'I10',
        name: 'Essential Hypertension',
        onsetTimestamp: '2025-01-01T00:00:00Z',
      })
      expect(cond.code).toBe('I10')
    })

    it('parses valid Observation entity', () => {
      const obs = observationSchema.parse({
        id: 'obs-1',
        patientId: 'pat-1',
        code: '2190-7',
        name: 'Serum Creatinine',
        value: 1.2,
        unit: 'mg/dL',
        timestamp: '2026-09-24T12:00:00Z',
      })
      expect(obs.value).toBe(1.2)
    })

    it('parses valid serializable ClinicalContext snapshot', () => {
      const snapshot = clinicalContextSchema.parse({
        patient: {
          id: 'pat-1',
          syntheticIdentifier: 'SYNTH-100',
          age: 60,
          gender: 'male',
        },
        medications: [
          {
            id: 'med-1',
            code: 'MED-1',
            name: 'Metformin',
            dosage: '850mg',
            route: 'oral',
          },
        ],
        allergies: [],
        conditions: [],
        observations: [],
        dataPoints: {
          egfr: {
            key: 'egfr',
            value: 55,
            status: 'AVAILABLE',
            timestamp: '2026-09-24T10:00:00Z',
          },
        },
        timestamp: '2026-09-24T12:00:00Z',
      })
      expect(snapshot.patient.id).toBe('pat-1')
      expect(snapshot.dataPoints['egfr'].status).toBe('AVAILABLE')
    })
  })

  describe('Canonical Severity Validation', () => {
    it('accepts valid canonical severities (critical, warning, low, info)', () => {
      expect(clinicalSeveritySchema.parse('critical')).toBe('critical')
      expect(clinicalSeveritySchema.parse('warning')).toBe('warning')
      expect(clinicalSeveritySchema.parse('low')).toBe('low')
      expect(clinicalSeveritySchema.parse('info')).toBe('info')
    })

    it('rejects "safe" as a Finding alert severity', () => {
      expect(() => clinicalSeveritySchema.parse('safe')).toThrow()
      expect(() =>
        clinicalFindingSchema.parse({
          id: 'f-1',
          patientId: 'pat-1',
          ruleId: 'r-1',
          ruleVersion: '1.0.0',
          severity: 'safe',
          title: 'Test',
          detail: 'Detail',
          timestamp: '2026-09-24T12:00:00Z',
          isDeterministic: true,
        })
      ).toThrow()
    })

    it('parses deterministic traceable Finding correctly with valid severity', () => {
      const finding = clinicalFindingSchema.parse({
        id: 'f-1',
        patientId: 'pat-1',
        ruleId: 'r-ddi-1',
        ruleVersion: '1.2.0',
        severity: 'critical',
        title: 'High Risk Drug Interaction',
        detail: 'Simvastatin co-administered with Amiodarone',
        supportingDataKeys: ['med-1', 'med-2'],
        missingDataKeys: [],
        timestamp: '2026-09-24T12:00:00Z',
        isDeterministic: true,
      })
      expect(finding.ruleVersion).toBe('1.2.0')
      expect(finding.isDeterministic).toBe(true)
    })

    it('parses structural RuleDefinition metadata correctly', () => {
      const rule = ruleDefinitionSchema.parse({
        id: 'rule-renal-1',
        version: '2.0.0',
        name: 'Renal Dose Adjustment Filter',
        description: 'Metadata structural declaration for eGFR < 30',
        severity: 'warning',
        enabled: true,
        requiredDataKeys: ['egfr', 'serum_creatinine'],
      })
      expect(rule.requiredDataKeys).toEqual(['egfr', 'serum_creatinine'])
    })
  })

  describe('Audit Event Validation', () => {
    it('parses valid AuditEvent without external dependencies', () => {
      const audit = auditEventSchema.parse({
        id: 'aud-100',
        action: 'EVALUATE_RULES',
        userId: 'clinician-sim-1',
        timestamp: '2026-09-24T12:00:00Z',
        payloadSummary: 'Evaluated 3 rules for patient pat-1',
      })
      expect(audit.action).toBe('EVALUATE_RULES')
    })
  })

  describe('Clinical Safety Invariant: UNKNOWN/MISSING/STALE/UNAVAILABLE !== NORMAL', () => {
    it('validates all data availability state values', () => {
      const states = ['AVAILABLE', 'MISSING', 'UNKNOWN', 'STALE', 'UNAVAILABLE']
      states.forEach((state) => {
        expect(dataAvailabilityStateSchema.parse(state)).toBe(state)
      })
    })

    it('ensures UNKNOWN, MISSING, STALE, and UNAVAILABLE never pass as AVAILABLE', () => {
      const unknownPoint: ClinicalDataPoint = {
        key: 'k1',
        value: 10,
        status: 'UNKNOWN',
      }
      const missingPoint: ClinicalDataPoint = {
        key: 'k2',
        value: null,
        status: 'MISSING',
      }
      const stalePoint: ClinicalDataPoint = {
        key: 'k3',
        value: 15,
        status: 'STALE',
      }
      const unavailPoint: ClinicalDataPoint = {
        key: 'k4',
        value: null,
        status: 'UNAVAILABLE',
      }

      expect(isDataPointAvailable(unknownPoint)).toBe(false)
      expect(isDataPointAvailable(missingPoint)).toBe(false)
      expect(isDataPointAvailable(stalePoint)).toBe(false)
      expect(isDataPointAvailable(unavailPoint)).toBe(false)
    })

    it('preserves WHICH required datum failed and its availability state in evaluateDataGate', () => {
      const result = evaluateDataGate([
        { key: 'creatinine', value: 1.0, status: 'AVAILABLE' },
        { key: 'potassium', value: null, status: 'MISSING' },
        { key: 'alt', value: 25, status: 'STALE' },
      ])

      expect(result.canProceed).toBe(false)
      expect(result.blockedReasons).toEqual(['MISSING', 'STALE'])
      expect(result.failedRequirements).toEqual([
        { key: 'potassium', status: 'MISSING' },
        { key: 'alt', status: 'STALE' },
      ])
    })
  })
})
