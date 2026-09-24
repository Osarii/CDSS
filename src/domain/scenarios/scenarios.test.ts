import { describe, expect, it } from 'vitest'
import {
  syntheticScenarioSchema,
  clinicalContextSchema,
  evaluateDataGate,
  patientSchema,
  medicationSchema,
  allergySchema,
  conditionSchema,
  observationSchema,
} from '@/domain'
import {
  getSyntheticScenarios,
  getSyntheticScenarioById,
  SYN_001,
  SYN_002,
  SYN_003,
  SYN_004,
  SYN_005,
  SYN_006,
  SYN_007,
  SYN_008,
} from '@/data'

describe('Synthetic Clinical Scenarios v1 Suite', () => {
  const scenarios = getSyntheticScenarios()

  describe('Scenario Schema Validation & Structural Invariants', () => {
    it('contains exactly 8 synthetic scenarios (SYN-001 through SYN-008)', () => {
      expect(scenarios).toHaveLength(8)
      const expectedIds = [
        'SYN-001',
        'SYN-002',
        'SYN-003',
        'SYN-004',
        'SYN-005',
        'SYN-006',
        'SYN-007',
        'SYN-008',
      ]
      expect(scenarios.map((s) => s.scenarioId)).toEqual(expectedIds)
    })

    it('validates each scenario against syntheticScenarioSchema', () => {
      scenarios.forEach((scenario) => {
        const parsed = syntheticScenarioSchema.parse(scenario)
        expect(parsed.scenarioId).toBe(scenario.scenarioId)
        expect(parsed.title.length).toBeGreaterThan(0)
        expect(parsed.description.length).toBeGreaterThan(0)
        expect(parsed.evaluationFocus.length).toBeGreaterThan(0)
      })
    })

    it('validates that each clinicalContext parses cleanly through clinicalContextSchema', () => {
      scenarios.forEach((scenario) => {
        const parsedContext = clinicalContextSchema.parse(scenario.clinicalContext)
        expect(parsedContext.patient.id).toBe(scenario.clinicalContext.patient.id)
        expect(parsedContext.timestamp).toBe(scenario.clinicalContext.timestamp)
      })
    })

    it('enforces unique scenarioId, patientId, and syntheticIdentifier across all scenarios', () => {
      const scenarioIds = new Set(scenarios.map((s) => s.scenarioId))
      const patientIds = new Set(scenarios.map((s) => s.clinicalContext.patient.id))
      const syntheticIdentifiers = new Set(
        scenarios.map((s) => s.clinicalContext.patient.syntheticIdentifier)
      )

      expect(scenarioIds.size).toBe(scenarios.length)
      expect(patientIds.size).toBe(scenarios.length)
      expect(syntheticIdentifiers.size).toBe(scenarios.length)
    })

    it('ensures individual domain entities in all scenarios parse against their respective schemas', () => {
      scenarios.forEach((scenario) => {
        const ctx = scenario.clinicalContext
        expect(() => patientSchema.parse(ctx.patient)).not.toThrow()
        ctx.medications.forEach((med) => expect(() => medicationSchema.parse(med)).not.toThrow())
        ctx.allergies.forEach((alg) => expect(() => allergySchema.parse(alg)).not.toThrow())
        ctx.conditions.forEach((cnd) => expect(() => conditionSchema.parse(cnd)).not.toThrow())
        ctx.observations.forEach((obs) => expect(() => observationSchema.parse(obs)).not.toThrow())
      })
    })
  })

  describe('Complexity Benchmark & Separation of Concerns', () => {
    it('verifies that SYN-002 through SYN-008 meet or exceed the reference complexity benchmark', () => {
      // Benchmark: at least 4 medications and at least 3 conditions
      const complexScenarios = [
        SYN_002,
        SYN_003,
        SYN_004,
        SYN_005,
        SYN_006,
        SYN_007,
        SYN_008,
      ]

      complexScenarios.forEach((scenario) => {
        const ctx = scenario.clinicalContext
        expect(ctx.medications.length).toBeGreaterThanOrEqual(4)
        expect(ctx.conditions.length).toBeGreaterThanOrEqual(3)
        expect(ctx.observations.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('ensures no medical conclusions or recommendations are encoded in fixtures', () => {
      scenarios.forEach((scenario) => {
        // Scenarios expose evaluationFocus, not conclusions
        expect(scenario).not.toHaveProperty('recommendation')
        expect(scenario).not.toHaveProperty('finding')
        expect(scenario).not.toHaveProperty('clinicalConclusion')
        expect(scenario.evaluationFocus.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('ensures scenario evaluationFocus uses neutral inspection terminology without pre-authored finding labels', () => {
      const outcomeConclusions = [
        'risk',
        'toxicity',
        'contraindication',
        'therapeutic_duplication',
        'hyperkalemia',
        'bradycardia',
      ]

      scenarios.forEach((scenario) => {
        scenario.evaluationFocus.forEach((focus) => {
          outcomeConclusions.forEach((term) => {
            expect(focus.toLowerCase()).not.toContain(term)
          })
        })
      })
    })
  })

  describe('Availability-State Handling & Safety Invariants', () => {
    it('SYN-001: verifies complete availability where all data points pass evaluation gate', () => {
      const dataPoints = Object.values(SYN_001.clinicalContext.dataPoints)
      const gateResult = evaluateDataGate(dataPoints)

      expect(gateResult.canProceed).toBe(true)
      expect(gateResult.blockedReasons).toHaveLength(0)
      expect(gateResult.failedRequirements).toHaveLength(0)
    })

    it('SYN-002: verifies allergy scenario exposes critical penicillin hypersensitivity record', () => {
      const penicillinAllergy = SYN_002.clinicalContext.allergies.find(
        (a) => a.substance.toLowerCase() === 'penicillin'
      )
      expect(penicillinAllergy).toBeDefined()
      expect(penicillinAllergy?.severity).toBe('critical')
      expect(penicillinAllergy?.reaction).toBe('Anaphylaxis')
    })

    it('SYN-003: matches the acute AFib + CKD + triple ACEi/diuretic polypharmacy reference case', () => {
      const medNames = SYN_003.clinicalContext.medications.map((m) => m.name.toLowerCase())
      expect(medNames).toContain('enalapril')
      expect(medNames).toContain('furosemide')
      expect(medNames).toContain('spironolactone')
      expect(medNames).toContain('amiodarone')
      expect(SYN_003.clinicalContext.patient.age).toBe(65)
      expect(SYN_003.clinicalContext.patient.gender).toBe('male')
    })

    it('SYN-004: detects MISSING required renal data and blocks evaluation gate', () => {
      const dataPoints = Object.values(SYN_004.clinicalContext.dataPoints)
      const gateResult = evaluateDataGate(dataPoints)

      expect(gateResult.canProceed).toBe(false)
      expect(gateResult.blockedReasons).toContain('MISSING')
      expect(gateResult.failedRequirements).toEqual(
        expect.arrayContaining([
          { key: 'serum_creatinine', status: 'MISSING' },
          { key: 'egfr', status: 'MISSING' },
        ])
      )
    })

    it('SYN-005: detects STALE required renal data and blocks evaluation gate', () => {
      const dataPoints = Object.values(SYN_005.clinicalContext.dataPoints)
      const gateResult = evaluateDataGate(dataPoints)

      expect(gateResult.canProceed).toBe(false)
      expect(gateResult.blockedReasons).toContain('STALE')
      expect(gateResult.failedRequirements).toEqual(
        expect.arrayContaining([
          { key: 'serum_creatinine', status: 'STALE' },
          { key: 'egfr', status: 'STALE' },
          { key: 'potassium', status: 'STALE' },
          { key: 'uric_acid', status: 'STALE' },
        ])
      )
    })

    it('SYN-006: contains multiple concurrent NSAIDs in a polypharmacy context', () => {
      const medNames = SYN_006.clinicalContext.medications.map((m) => m.name.toLowerCase())
      expect(medNames).toContain('ibuprofen')
      expect(medNames).toContain('naproxen')
      expect(medNames).toContain('escitalopram')
    })

    it('SYN-007: models simultaneous evaluation concerns (anticoagulation + antiarrhythmic + antibiotic)', () => {
      const medNames = SYN_007.clinicalContext.medications.map((m) => m.name.toLowerCase())
      expect(medNames).toContain('warfarin')
      expect(medNames).toContain('amiodarone')
      expect(medNames).toContain('ciprofloxacin')
      expect(SYN_007.evaluationFocus).toEqual(
        expect.arrayContaining([
          'concomitant_warfarin_amiodarone_ciprofloxacin_review',
          'inr_and_qtc_measurement_evaluation',
          'antimicrobial_renal_clearance_review',
        ])
      )
    })

    it('SYN-008: validates high-complexity multi-availability states (AVAILABLE, MISSING, STALE, UNKNOWN, UNAVAILABLE)', () => {
      const points = SYN_008.clinicalContext.dataPoints
      const statuses = Object.values(points).map((p) => p.status)

      expect(statuses).toContain('AVAILABLE')
      expect(statuses).toContain('MISSING')
      expect(statuses).toContain('STALE')
      expect(statuses).toContain('UNKNOWN')
      expect(statuses).toContain('UNAVAILABLE')

      const gateResult = evaluateDataGate(Object.values(points))
      expect(gateResult.canProceed).toBe(false)
      expect(gateResult.blockedReasons).toEqual(
        expect.arrayContaining(['MISSING', 'STALE', 'UNKNOWN', 'UNAVAILABLE'])
      )
      expect(gateResult.failedRequirements).toHaveLength(4)
    })
  })

  describe('Deterministic Fixture Retrieval Functions', () => {
    it('retrieves scenario by id with getSyntheticScenarioById', () => {
      const s1 = getSyntheticScenarioById('SYN-001')
      expect(s1).toBeDefined()
      expect(s1?.title).toBe(SYN_001.title)

      const s8 = getSyntheticScenarioById('SYN-008')
      expect(s8).toBeDefined()
      expect(s8?.scenarioId).toBe('SYN-008')

      const nonExistent = getSyntheticScenarioById('SYN-999')
      expect(nonExistent).toBeUndefined()
    })

    it('produces deterministic immutable fixture outputs', () => {
      const run1 = getSyntheticScenarios()
      const run2 = getSyntheticScenarios()
      expect(run1).toEqual(run2)
    })
  })
})
