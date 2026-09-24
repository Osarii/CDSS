import { describe, expect, it } from 'vitest'
import {
  medicationExposureSchema,
  clinicalContextSourceInputSchema,
  type MedicationExposure,
} from '@/domain'
import {
  getSyntheticScenarios,
  syntheticMedicationExposures,
  getSyntheticMedicationExposures,
  getMedicationExposuresByPatientId,
  getMedicationExposureById,
} from '@/data'
import dbJson from '../../../db.json'

describe('Medication Exposure & Clinical Context Source Boundary', () => {
  const scenarios = getSyntheticScenarios()
  const allScenarioPatients = scenarios.map((s) => s.clinicalContext.patient)
  const allScenarioMedications = scenarios.flatMap((s) => s.clinicalContext.medications)

  describe('MedicationExposure Schema Validation', () => {
    it('parses a valid minimal medication exposure', () => {
      const validExposure = medicationExposureSchema.parse({
        id: 'exp-test-1',
        patientId: 'pat-1',
        medicationId: 'med-1',
        therapyContext: 'chronic',
        status: 'active',
      })
      expect(validExposure.id).toBe('exp-test-1')
      expect(validExposure.therapyContext).toBe('chronic')
      expect(validExposure.status).toBe('active')
    })

    it('parses exposure with optional startedAt and endedAt timestamps', () => {
      const exposureWithDates = medicationExposureSchema.parse({
        id: 'exp-test-2',
        patientId: 'pat-1',
        medicationId: 'med-2',
        therapyContext: 'acute',
        status: 'stopped',
        startedAt: '2026-09-01T08:00:00Z',
        endedAt: '2026-09-10T18:00:00Z',
      })
      expect(exposureWithDates.startedAt).toBe('2026-09-01T08:00:00Z')
      expect(exposureWithDates.endedAt).toBe('2026-09-10T18:00:00Z')
    })

    it('rejects invalid therapyContext values', () => {
      expect(() =>
        medicationExposureSchema.parse({
          id: 'exp-test-3',
          patientId: 'pat-1',
          medicationId: 'med-1',
          therapyContext: 'subacute', // Invalid
          status: 'active',
        })
      ).toThrow()
    })

    it('rejects invalid status values', () => {
      expect(() =>
        medicationExposureSchema.parse({
          id: 'exp-test-4',
          patientId: 'pat-1',
          medicationId: 'med-1',
          therapyContext: 'unknown',
          status: 'paused', // Invalid
        })
      ).toThrow()
    })

    it('rejects missing required fields', () => {
      expect(() =>
        medicationExposureSchema.parse({
          id: 'exp-test-5',
          patientId: 'pat-1',
          // medicationId missing
          therapyContext: 'unknown',
          status: 'active',
        })
      ).toThrow()
    })
  })

  describe('Synthetic Medication Exposures Integrity', () => {
    it('validates every synthetic medication exposure with Zod', () => {
      expect(syntheticMedicationExposures.length).toBe(39)
      syntheticMedicationExposures.forEach((exp) => {
        const parsed = medicationExposureSchema.parse(exp)
        expect(parsed.id).toBe(exp.id)
      })
    })

    it('ensures all exposure IDs are unique', () => {
      const ids = syntheticMedicationExposures.map((e) => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(syntheticMedicationExposures.length)
    })

    it('verifies all patientId references resolve to an existing synthetic scenario patient', () => {
      const knownPatientIds = new Set(allScenarioPatients.map((p) => p.id))
      syntheticMedicationExposures.forEach((exp) => {
        expect(knownPatientIds.has(exp.patientId)).toBe(true)
      })
    })

    it('verifies all medicationId references resolve to an existing synthetic scenario medication', () => {
      const knownMedicationIds = new Set(allScenarioMedications.map((m) => m.id))
      syntheticMedicationExposures.forEach((exp) => {
        expect(knownMedicationIds.has(exp.medicationId)).toBe(true)
      })
    })

    it('verifies every scenario medication has a corresponding patient exposure', () => {
      const exposedMedicationIds = new Set(
        syntheticMedicationExposures.map((exp) => exp.medicationId)
      )
      allScenarioMedications.forEach((med) => {
        expect(exposedMedicationIds.has(med.id)).toBe(true)
      })
    })

    it('verifies that each exposure links patient and medication within the same scenario', () => {
      scenarios.forEach((scenario) => {
        const patientId = scenario.clinicalContext.patient.id
        const scenarioMedicationIds = new Set(
          scenario.clinicalContext.medications.map((m) => m.id)
        )
        const patientExposures = getMedicationExposuresByPatientId(patientId)

        expect(patientExposures.length).toBe(scenario.clinicalContext.medications.length)
        patientExposures.forEach((exp) => {
          expect(exp.patientId).toBe(patientId)
          expect(scenarioMedicationIds.has(exp.medicationId)).toBe(true)
        })
      })
    })

    it('detects orphan patient reference during integrity checking', () => {
      const orphanExposure: MedicationExposure = {
        id: 'exp-orphan-1',
        patientId: 'pat-non-existent',
        medicationId: 'med-syn-001-1',
        therapyContext: 'unknown',
        status: 'active',
      }
      const knownPatientIds = new Set(allScenarioPatients.map((p) => p.id))
      expect(knownPatientIds.has(orphanExposure.patientId)).toBe(false)
    })

    it('detects orphan medication reference during integrity checking', () => {
      const orphanExposure: MedicationExposure = {
        id: 'exp-orphan-2',
        patientId: 'pat-syn-001',
        medicationId: 'med-non-existent',
        therapyContext: 'unknown',
        status: 'active',
      }
      const knownMedicationIds = new Set(allScenarioMedications.map((m) => m.id))
      expect(knownMedicationIds.has(orphanExposure.medicationId)).toBe(false)
    })

    it('detects duplicate exposure IDs during integrity checking', () => {
      const listWithDuplicates: MedicationExposure[] = [
        ...syntheticMedicationExposures,
        {
          id: 'exp-syn-001-1', // Duplicate
          patientId: 'pat-syn-001',
          medicationId: 'med-syn-001-2',
          therapyContext: 'unknown',
          status: 'active',
        },
      ]
      const idSet = new Set<string>()
      let hasDuplicate = false
      for (const item of listWithDuplicates) {
        if (idSet.has(item.id)) {
          hasDuplicate = true
          break
        }
        idSet.add(item.id)
      }
      expect(hasDuplicate).toBe(true)
    })
  })

  describe('SYN-003 Reference Case Temporal Classification', () => {
    it('preserves the physician-provided temporal structure for SYN-003', () => {
      const syn003Exposures = getMedicationExposuresByPatientId('pat-syn-003')
      expect(syn003Exposures).toHaveLength(6)

      const expByMedId = new Map(syn003Exposures.map((e) => [e.medicationId, e]))

      // enalapril -> chronic
      expect(expByMedId.get('med-syn-003-1')?.therapyContext).toBe('chronic')
      // furosemide -> chronic
      expect(expByMedId.get('med-syn-003-2')?.therapyContext).toBe('chronic')
      // spironolactone -> chronic
      expect(expByMedId.get('med-syn-003-3')?.therapyContext).toBe('chronic')
      // amiodarone -> acute
      expect(expByMedId.get('med-syn-003-4')?.therapyContext).toBe('acute')
      // bisoprolol -> unknown (neutral fixture default)
      expect(expByMedId.get('med-syn-003-5')?.therapyContext).toBe('unknown')
      // atorvastatin -> unknown (neutral fixture default)
      expect(expByMedId.get('med-syn-003-6')?.therapyContext).toBe('unknown')
    })

    it('sets status to active for all SYN-003 exposures', () => {
      const syn003Exposures = getMedicationExposuresByPatientId('pat-syn-003')
      syn003Exposures.forEach((exp) => {
        expect(exp.status).toBe('active')
      })
    })
  })

  describe('Helper Functions', () => {
    it('getSyntheticMedicationExposures returns all exposures', () => {
      expect(getSyntheticMedicationExposures()).toHaveLength(39)
    })

    it('getMedicationExposuresByPatientId returns matching exposures', () => {
      expect(getMedicationExposuresByPatientId('pat-syn-001')).toHaveLength(2)
      expect(getMedicationExposuresByPatientId('pat-syn-002')).toHaveLength(5)
      expect(getMedicationExposuresByPatientId('pat-syn-003')).toHaveLength(6)
      expect(getMedicationExposuresByPatientId('pat-syn-004')).toHaveLength(5)
      expect(getMedicationExposuresByPatientId('pat-syn-005')).toHaveLength(5)
      expect(getMedicationExposuresByPatientId('pat-syn-006')).toHaveLength(5)
      expect(getMedicationExposuresByPatientId('pat-syn-007')).toHaveLength(6)
      expect(getMedicationExposuresByPatientId('pat-syn-008')).toHaveLength(5)
    })

    it('getMedicationExposureById returns single exposure or undefined', () => {
      const exp = getMedicationExposureById('exp-syn-003-4')
      expect(exp).toBeDefined()
      expect(exp?.medicationId).toBe('med-syn-003-4')
      expect(exp?.therapyContext).toBe('acute')

      expect(getMedicationExposureById('non-existent')).toBeUndefined()
    })
  })

  describe('db.json Synchronization', () => {
    it('contains medicationExposures array with matching count and valid schemas', () => {
      expect(dbJson.medicationExposures).toBeDefined()
      expect(Array.isArray(dbJson.medicationExposures)).toBe(true)
      expect(dbJson.medicationExposures.length).toBe(39)

      dbJson.medicationExposures.forEach((exp) => {
        const parsed = medicationExposureSchema.parse(exp)
        expect(parsed.id).toBe(exp.id)
      })
    })

    it('matches the code fixture syntheticMedicationExposures', () => {
      expect(dbJson.medicationExposures).toEqual(syntheticMedicationExposures)
    })
  })

  describe('Clinical Context Source Input Boundary Schema', () => {
    it('validates a complete source input bundle with patient-linked source records', () => {
      const syn001 = scenarios[0]
      const exposures = getMedicationExposuresByPatientId(syn001.clinicalContext.patient.id)

      const sourceInput = {
        patient: syn001.clinicalContext.patient,
        medications: syn001.clinicalContext.medications,
        medicationExposures: [...exposures],
        allergies: syn001.clinicalContext.allergies,
        conditions: syn001.clinicalContext.conditions,
        observations: syn001.clinicalContext.observations,
        dataPoints: syn001.clinicalContext.dataPoints,
        evaluationTimestamp: '2026-09-24T12:00:00Z',
      }

      const parsed = clinicalContextSourceInputSchema.parse(sourceInput)
      expect(parsed.patient.id).toBe('pat-syn-001')
      expect(parsed.medicationExposures).toHaveLength(2)
      expect(parsed.evaluationTimestamp).toBe('2026-09-24T12:00:00Z')
    })

    it('defaults dataPoints to empty object when omitted from source input', () => {
      const syn001 = scenarios[0]
      const exposures = getMedicationExposuresByPatientId(syn001.clinicalContext.patient.id)

      const minimalSource = {
        patient: syn001.clinicalContext.patient,
        medications: syn001.clinicalContext.medications,
        medicationExposures: [...exposures],
        allergies: syn001.clinicalContext.allergies,
        conditions: syn001.clinicalContext.conditions,
        observations: syn001.clinicalContext.observations,
        evaluationTimestamp: '2026-09-24T12:00:00Z',
      }

      const parsed = clinicalContextSourceInputSchema.parse(minimalSource)
      expect(parsed.dataPoints).toEqual({})
    })

    it('rejects invalid medication exposure inside clinicalContextSourceInput', () => {
      const syn001 = scenarios[0]
      const invalidSource = {
        patient: syn001.clinicalContext.patient,
        medications: syn001.clinicalContext.medications,
        medicationExposures: [
          {
            id: 'bad-exp',
            patientId: 'pat-syn-001',
            medicationId: 'med-syn-001-1',
            therapyContext: 'invalid-therapy',
            status: 'active',
          },
        ],
        allergies: [],
        conditions: [],
        observations: [],
        evaluationTimestamp: '2026-09-24T12:00:00Z',
      }

      expect(() => clinicalContextSourceInputSchema.parse(invalidSource)).toThrow()
    })
  })
})
