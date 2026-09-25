import { describe, expect, it } from 'vitest'
import {
  buildClinicalContext,
  clinicalContextSchema,
  type ClinicalContextSourceInput,
} from '@/domain'
import {
  getSyntheticScenarios,
  getScenarioSourceInput,
  SYN_003,
  SYN_004,
  SYN_005,
  SYN_008,
} from '@/data'


describe('Clinical Context Builder v1', () => {
  describe('Deterministic Construction & Schema Validation', () => {
    it('builds a valid ClinicalContext from valid ClinicalContextSourceInput', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')
      expect(sourceInput).toBeDefined()

      const built = buildClinicalContext(sourceInput!)
      expect(() => clinicalContextSchema.parse(built)).not.toThrow()
      expect(built.patient.id).toBe('pat-syn-001')
      expect(built.timestamp).toBe(sourceInput!.evaluationTimestamp)
    })

    it('maps evaluationTimestamp directly to ClinicalContext.timestamp', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const customTimestamp = '2026-09-24T15:30:00Z'
      const modifiedInput: ClinicalContextSourceInput = {
        ...sourceInput,
        evaluationTimestamp: customTimestamp,
      }

      const built = buildClinicalContext(modifiedInput)
      expect(built.timestamp).toBe(customTimestamp)
    })

    it('preserves patient-linked MedicationExposure metadata in the resulting ClinicalContext', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const built = buildClinicalContext(sourceInput)

      expect('medicationExposures' in built).toBe(true)
      expect(built.medicationExposures).toHaveLength(2)
      expect(built.medicationExposures).toEqual(sourceInput.medicationExposures)
      expect(built.medications).toHaveLength(2)
    })

    it('rejects source input failing Zod validation (e.g. invalid patient age)', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const invalidInput = {
        ...sourceInput,
        patient: {
          ...sourceInput.patient,
          age: -10, // Invalid age
        },
      }

      expect(() => buildClinicalContext(invalidInput as unknown as ClinicalContextSourceInput)).toThrow()
    })
  })

  describe('Medication Resolution via MedicationExposures', () => {
    it('resolves medications strictly through patient-linked exposures, excluding unexposed catalog medications', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      // Add extraneous medications to the catalog that the patient is NOT exposed to
      const extraMedication = {
        id: 'med-extra-999',
        code: 'EXT-999',
        name: 'Extra Unrelated Medication',
        dosage: '50mg',
        route: 'oral',
      }

      const expandedInput: ClinicalContextSourceInput = {
        ...sourceInput,
        medications: [...sourceInput.medications, extraMedication],
      }

      const built = buildClinicalContext(expandedInput)
      // Patient pat-syn-001 only has exposures for med-syn-001-1 and med-syn-001-2
      expect(built.medications).toHaveLength(2)
      expect(built.medications.some((m) => m.id === 'med-extra-999')).toBe(false)
      expect(built.medications.map((m) => m.id)).toEqual(['med-syn-001-1', 'med-syn-001-2'])
    })

    it('preserves SYN-003 patient medication set assembled through exposures', () => {
      const sourceInput = getScenarioSourceInput('SYN-003')!
      expect(sourceInput).toBeDefined()

      const built = buildClinicalContext(sourceInput)
      expect(built.patient.id).toBe('pat-syn-003')
      expect(built.medications).toHaveLength(6)

      const expectedMedicationIds = [
        'med-syn-003-1', // enalapril
        'med-syn-003-2', // furosemide
        'med-syn-003-3', // spironolactone
        'med-syn-003-4', // amiodarone
        'med-syn-003-5', // bisoprolol
        'med-syn-003-6', // atorvastatin
      ]
      expect(built.medications.map((m) => m.id)).toEqual(expectedMedicationIds)
      expect(built.medications).toEqual(SYN_003.clinicalContext.medications)
    })

    it('SYN-003 output preserves: enalapril chronic, furosemide chronic, spironolactone chronic, amiodarone acute', () => {
      const sourceInput = getScenarioSourceInput('SYN-003')!
      expect(sourceInput).toBeDefined()

      const built = buildClinicalContext(sourceInput)
      expect(built.medicationExposures).toHaveLength(6)

      const enalaprilExp = built.medicationExposures.find((e) => e.medicationId === 'med-syn-003-1')
      const furosemideExp = built.medicationExposures.find((e) => e.medicationId === 'med-syn-003-2')
      const spironolactoneExp = built.medicationExposures.find((e) => e.medicationId === 'med-syn-003-3')
      const amiodaroneExp = built.medicationExposures.find((e) => e.medicationId === 'med-syn-003-4')

      expect(enalaprilExp).toBeDefined()
      expect(enalaprilExp?.therapyContext).toBe('chronic')
      expect(enalaprilExp?.status).toBe('active')

      expect(furosemideExp).toBeDefined()
      expect(furosemideExp?.therapyContext).toBe('chronic')
      expect(furosemideExp?.status).toBe('active')

      expect(spironolactoneExp).toBeDefined()
      expect(spironolactoneExp?.therapyContext).toBe('chronic')
      expect(spironolactoneExp?.status).toBe('active')

      expect(amiodaroneExp).toBeDefined()
      expect(amiodaroneExp?.therapyContext).toBe('acute')
      expect(amiodaroneExp?.status).toBe('active')
    })

    it('preserves therapyContext, status, startedAt and endedAt exactly without inference or normalization', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const customExposures = [
        {
          id: 'exp-custom-1',
          patientId: 'pat-syn-001',
          medicationId: 'med-syn-001-1',
          therapyContext: 'chronic' as const,
          status: 'stopped' as const,
          startedAt: '2020-01-01T00:00:00Z',
          endedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'exp-custom-2',
          patientId: 'pat-syn-001',
          medicationId: 'med-syn-001-2',
          therapyContext: 'unknown' as const,
          status: 'unknown' as const,
        },
      ]

      const built = buildClinicalContext({
        ...sourceInput,
        medicationExposures: customExposures,
      })

      expect(built.medicationExposures).toEqual(customExposures)
      expect(built.medicationExposures[0].status).toBe('stopped')
      expect(built.medicationExposures[0].therapyContext).toBe('chronic')
      expect(built.medicationExposures[0].endedAt).toBe('2024-01-01T00:00:00Z')
      expect(built.medicationExposures[1].status).toBe('unknown')
      expect(built.medicationExposures[1].therapyContext).toBe('unknown')
      expect(built.medicationExposures[1].startedAt).toBeUndefined()
      expect(built.medicationExposures[1].endedAt).toBeUndefined()
    })

    it('rejects exposures referencing medications not supplied in the input catalog', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const unsuppliedExposure = {
        id: 'exp-missing-catalog',
        patientId: 'pat-syn-001',
        medicationId: 'med-non-existent-in-catalog',
        therapyContext: 'unknown' as const,
        status: 'active' as const,
      }

      const invalidInput: ClinicalContextSourceInput = {
        ...sourceInput,
        medicationExposures: [...sourceInput.medicationExposures, unsuppliedExposure],
      }

      expect(() => buildClinicalContext(invalidInput)).toThrow(
        /references medication 'med-non-existent-in-catalog' which is not supplied in the input catalog/
      )
    })
  })

  describe('Patient Referential Integrity & Cross-Patient Leak Prevention', () => {
    it('rejects source bundles with a MedicationExposure belonging to another patient', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const foreignExposure = {
        id: 'exp-foreign',
        patientId: 'pat-syn-002', // Belongs to different patient
        medicationId: 'med-syn-001-1',
        therapyContext: 'unknown' as const,
        status: 'active' as const,
      }

      const invalidInput: ClinicalContextSourceInput = {
        ...sourceInput,
        medicationExposures: [...sourceInput.medicationExposures, foreignExposure],
      }

      expect(() => buildClinicalContext(invalidInput)).toThrow(
        /MedicationExposure 'exp-foreign' is linked to patient 'pat-syn-002', expected source patient 'pat-syn-001'/
      )
    })

    it('rejects source bundles with an Allergy belonging to another patient', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const foreignAllergy = {
        id: 'all-foreign',
        patientId: 'pat-syn-002',
        substance: 'Penicillin',
        severity: 'critical' as const,
      }

      const invalidInput: ClinicalContextSourceInput = {
        ...sourceInput,
        allergies: [foreignAllergy],
      }

      expect(() => buildClinicalContext(invalidInput)).toThrow(
        /Allergy 'all-foreign' is linked to patient 'pat-syn-002', expected source patient 'pat-syn-001'/
      )
    })

    it('rejects source bundles with a Condition belonging to another patient', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const foreignCondition = {
        id: 'cond-foreign',
        patientId: 'pat-syn-002',
        code: 'I10',
        name: 'Hypertension',
      }

      const invalidInput: ClinicalContextSourceInput = {
        ...sourceInput,
        conditions: [...sourceInput.conditions, foreignCondition],
      }

      expect(() => buildClinicalContext(invalidInput)).toThrow(
        /Condition 'cond-foreign' is linked to patient 'pat-syn-002', expected source patient 'pat-syn-001'/
      )
    })

    it('rejects source bundles with an Observation belonging to another patient', () => {
      const sourceInput = getScenarioSourceInput('SYN-001')!
      const foreignObservation = {
        id: 'obs-foreign',
        patientId: 'pat-syn-002',
        code: '2160-0',
        name: 'Serum Creatinine',
        value: 1.2,
        timestamp: '2026-09-24T10:00:00Z',
      }

      const invalidInput: ClinicalContextSourceInput = {
        ...sourceInput,
        observations: [...sourceInput.observations, foreignObservation],
      }

      expect(() => buildClinicalContext(invalidInput)).toThrow(
        /Observation 'obs-foreign' is linked to patient 'pat-syn-002', expected source patient 'pat-syn-001'/
      )
    })
  })

  describe('Preservation of DataPoint Availability States (SYN-004, SYN-005, SYN-008)', () => {
    it('SYN-004: strictly preserves MISSING availability states for renal function data points', () => {
      const sourceInput = getScenarioSourceInput('SYN-004')!
      expect(sourceInput).toBeDefined()

      const built = buildClinicalContext(sourceInput)
      expect(built.dataPoints.serum_creatinine.status).toBe('MISSING')
      expect(built.dataPoints.serum_creatinine.value).toBeNull()

      expect(built.dataPoints.egfr.status).toBe('MISSING')
      expect(built.dataPoints.egfr.value).toBeNull()

      // Ensure dataPoints match fixture exactly
      expect(built.dataPoints).toEqual(SYN_004.clinicalContext.dataPoints)
    })

    it('SYN-005: strictly preserves STALE availability states for historical laboratory data', () => {
      const sourceInput = getScenarioSourceInput('SYN-005')!
      expect(sourceInput).toBeDefined()

      const built = buildClinicalContext(sourceInput)
      expect(built.dataPoints.serum_creatinine.status).toBe('STALE')
      expect(built.dataPoints.serum_creatinine.value).toBe(2.8)
      expect(built.dataPoints.serum_creatinine.timestamp).toBe('2025-03-15T08:00:00Z')

      expect(built.dataPoints.egfr.status).toBe('STALE')
      expect(built.dataPoints.egfr.value).toBe(23)

      expect(built.dataPoints.uric_acid.status).toBe('STALE')
      expect(built.dataPoints.uric_acid.value).toBe(8.6)


      expect(built.dataPoints).toEqual(SYN_005.clinicalContext.dataPoints)
    })

    it('SYN-008: strictly preserves multi-state availability (AVAILABLE, MISSING, STALE, UNKNOWN, UNAVAILABLE)', () => {
      const sourceInput = getScenarioSourceInput('SYN-008')!
      expect(sourceInput).toBeDefined()

      const built = buildClinicalContext(sourceInput)
      expect(built.dataPoints.serum_creatinine.status).toBe('MISSING')
      expect(built.dataPoints.egfr.status).toBe('UNAVAILABLE')
      expect(built.dataPoints.potassium.status).toBe('STALE')
      expect(built.dataPoints.digoxin_level.status).toBe('UNKNOWN')
      expect(built.dataPoints.heart_rate.status).toBe('AVAILABLE')
      expect(built.dataPoints.systolic_bp.status).toBe('AVAILABLE')
      expect(built.dataPoints.diastolic_bp.status).toBe('AVAILABLE')

      expect(built.dataPoints).toEqual(SYN_008.clinicalContext.dataPoints)
    })
  })

  describe('Full Scenario Catalog Verification (SYN-001 through SYN-008)', () => {
    it('reproduces equivalent ClinicalContext evaluation snapshots for all 8 synthetic scenarios', () => {
      const scenarios = getSyntheticScenarios()
      expect(scenarios).toHaveLength(8)

      scenarios.forEach((scenario) => {
        const sourceInput = getScenarioSourceInput(scenario.scenarioId)
        expect(sourceInput).toBeDefined()

        const built = buildClinicalContext(sourceInput!)
        expect(built.patient).toEqual(scenario.clinicalContext.patient)
        expect(built.medications).toEqual(scenario.clinicalContext.medications)
        expect(built.medicationExposures).toEqual(scenario.clinicalContext.medicationExposures)
        expect(built.allergies).toEqual(scenario.clinicalContext.allergies)
        expect(built.conditions).toEqual(scenario.clinicalContext.conditions)
        expect(built.observations).toEqual(scenario.clinicalContext.observations)
        expect(built.dataPoints).toEqual(scenario.clinicalContext.dataPoints)
        expect(built.timestamp).toBe(scenario.clinicalContext.timestamp)
      })
    })
  })

  describe('Purity, Determinism & Immutability', () => {
    it('produces identical output for identical inputs across multiple runs', () => {
      const sourceInput = getScenarioSourceInput('SYN-003')!
      const run1 = buildClinicalContext(sourceInput)
      const run2 = buildClinicalContext(sourceInput)

      expect(run1).toEqual(run2)
    })

    it('does not mutate the source input or source fixtures', () => {
      const sourceInput = getScenarioSourceInput('SYN-003')!
      const originalInputSnapshot = JSON.stringify(sourceInput)
      const originalScenarioSnapshot = JSON.stringify(SYN_003)

      const built = buildClinicalContext(sourceInput)

      // Mutate the built context
      built.medications.push({
        id: 'med-mutated',
        code: 'MUT',
        name: 'Mutated',
        dosage: '10mg',
        route: 'oral',
      })
      built.patient.age = 999

      expect(JSON.stringify(sourceInput)).toBe(originalInputSnapshot)
      expect(JSON.stringify(SYN_003)).toBe(originalScenarioSnapshot)
    })
  })
})
