import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  JsonServerAdapter,
  syntheticDatabaseSchema,
  type SyntheticDatabase,
} from './JsonServerAdapter'
import {
  getScenarioSourceInput,
  getSyntheticScenarioById,
  syntheticScenarios,
} from '@/data'
import {
  clinicalContextSchema,
  evaluateClinicalContextDataGate,
  evaluateDemoRules,
} from '@/domain'

// Load and parse the canonical normalized synthetic database from repository root
const dbPath = path.resolve(process.cwd(), 'db.json')
const rawDbContent = fs.readFileSync(dbPath, 'utf-8')
const parsedDb = JSON.parse(rawDbContent) as SyntheticDatabase

describe('Synthetic DB Normalization & JsonServerAdapter Integration', () => {
  describe('Database Normalization Invariants', () => {
    it('db.json strictly adheres to syntheticDatabaseSchema with all normalized collections', () => {
      const validated = syntheticDatabaseSchema.parse(parsedDb)

      expect(validated.patients.length).toBe(8)
      expect(validated.medications.length).toBe(39)
      expect(validated.medicationExposures.length).toBe(39)
      expect(validated.allergies.length).toBe(3)
      expect(validated.conditions.length).toBe(33)
      expect(validated.observations.length).toBe(46)
      expect(validated.clinicalDataPoints.length).toBe(51)
      expect(validated.scenarios.length).toBe(8)
    })

    it('db.json does NOT store prebuilt ClinicalContext objects in scenario records', () => {
      for (const scenario of parsedDb.scenarios as unknown as Record<string, unknown>[]) {
        expect(scenario).not.toHaveProperty('clinicalContext')
        expect(scenario).toHaveProperty('patientId')
        expect(scenario).toHaveProperty('medicationIds')
        expect(scenario).toHaveProperty('medicationExposureIds')
        expect(scenario).toHaveProperty('allergyIds')
        expect(scenario).toHaveProperty('conditionIds')
        expect(scenario).toHaveProperty('observationIds')
        expect(scenario).toHaveProperty('clinicalDataPointIds')
        expect(scenario).toHaveProperty('evaluationTimestamp')
      }
    })

    it('scenarios reference normalized records rather than duplicating full clinical snapshots', () => {
      const scenario1 = parsedDb.scenarios.find((s) => s.scenarioId === 'SYN-001')
      expect(scenario1).toBeDefined()
      expect(scenario1?.patientId).toBe('pat-syn-001')
      expect(scenario1?.medicationIds).toEqual(['med-syn-001-1', 'med-syn-001-2'])
      expect(scenario1?.medicationExposureIds).toEqual(['exp-syn-001-1', 'exp-syn-001-2'])
    })
  })

  describe('8/8 Scenario Regression Oracle Equivalence', () => {
    const adapter = new JsonServerAdapter({ db: parsedDb })

    const scenarioIds = [
      'SYN-001',
      'SYN-002',
      'SYN-003',
      'SYN-004',
      'SYN-005',
      'SYN-006',
      'SYN-007',
      'SYN-008',
    ]

    it.each(scenarioIds)(
      'assembles an equivalent ClinicalContextSourceInput for %s compared to TypeScript fixture',
      async (scenarioId) => {
        const expectedInput = getScenarioSourceInput(scenarioId)
        expect(expectedInput).toBeDefined()

        const actualInput = await adapter.getScenarioSourceInput(scenarioId)

        expect(actualInput.patient).toEqual(expectedInput!.patient)
        expect(actualInput.medications).toEqual(expectedInput!.medications)
        expect(actualInput.medicationExposures).toEqual(expectedInput!.medicationExposures)
        expect(actualInput.allergies).toEqual(expectedInput!.allergies)
        expect(actualInput.conditions).toEqual(expectedInput!.conditions)
        expect(actualInput.observations).toEqual(expectedInput!.observations)
        expect(actualInput.dataPoints).toEqual(expectedInput!.dataPoints)
        expect(actualInput.evaluationTimestamp).toBe(expectedInput!.evaluationTimestamp)
      }
    )

    it.each(scenarioIds)(
      'builds an equivalent ClinicalContext snapshot for %s matching synthetic scenario fixture',
      async (scenarioId) => {
        const syntheticScenario = getSyntheticScenarioById(scenarioId)
        expect(syntheticScenario).toBeDefined()

        const actualContext = await adapter.getScenarioContext(scenarioId)

        // Validate resulting context against domain schema
        expect(() => clinicalContextSchema.parse(actualContext)).not.toThrow()

        // Deep equality check against the fixture clinicalContext
        expect(actualContext.patient).toEqual(syntheticScenario!.clinicalContext.patient)
        expect(actualContext.medications).toEqual(syntheticScenario!.clinicalContext.medications)
        expect(actualContext.medicationExposures).toEqual(
          syntheticScenario!.clinicalContext.medicationExposures
        )
        expect(actualContext.allergies).toEqual(syntheticScenario!.clinicalContext.allergies)
        expect(actualContext.conditions).toEqual(syntheticScenario!.clinicalContext.conditions)
        expect(actualContext.observations).toEqual(syntheticScenario!.clinicalContext.observations)
        expect(actualContext.dataPoints).toEqual(syntheticScenario!.clinicalContext.dataPoints)
        expect(actualContext.timestamp).toBe(syntheticScenario!.clinicalContext.timestamp)
      }
    )

    it('preserves exact medication exposure metadata for all 8 scenarios', async () => {
      for (const scenario of syntheticScenarios) {
        const context = await adapter.getScenarioContext(scenario.scenarioId)
        const expectedExposures = scenario.clinicalContext.medicationExposures

        expect(context.medicationExposures).toHaveLength(expectedExposures.length)
        for (let i = 0; i < expectedExposures.length; i++) {
          expect(context.medicationExposures[i].id).toBe(expectedExposures[i].id)
          expect(context.medicationExposures[i].patientId).toBe(expectedExposures[i].patientId)
          expect(context.medicationExposures[i].medicationId).toBe(
            expectedExposures[i].medicationId
          )
          expect(context.medicationExposures[i].therapyContext).toBe(
            expectedExposures[i].therapyContext
          )
          expect(context.medicationExposures[i].status).toBe(expectedExposures[i].status)
          expect(context.medicationExposures[i].startedAt).toBe(expectedExposures[i].startedAt)
          expect(context.medicationExposures[i].endedAt).toBe(expectedExposures[i].endedAt)
        }
      }
    })

    it('preserves all data availability states (AVAILABLE, MISSING, UNKNOWN, STALE, UNAVAILABLE)', async () => {
      // SYN-004 has MISSING data points
      const syn004 = await adapter.getScenarioContext('SYN-004')
      expect(syn004.dataPoints['serum_creatinine'].status).toBe('MISSING')
      expect(syn004.dataPoints['egfr'].status).toBe('MISSING')

      // SYN-005 has STALE data points
      const syn005 = await adapter.getScenarioContext('SYN-005')
      expect(syn005.dataPoints['egfr'].status).toBe('STALE')
      expect(syn005.dataPoints['serum_creatinine'].status).toBe('STALE')

      // SYN-008 has multi-state availability (AVAILABLE, MISSING, UNKNOWN, STALE, UNAVAILABLE)
      const syn008 = await adapter.getScenarioContext('SYN-008')
      const statuses = Object.values(syn008.dataPoints).map((dp) => dp.status)
      expect(statuses).toContain('AVAILABLE')
      expect(statuses).toContain('MISSING')
      expect(statuses).toContain('UNKNOWN')
      expect(statuses).toContain('STALE')
      expect(statuses).toContain('UNAVAILABLE')
    })

    it('produces identical Required Data Gate and DEMO Rules evaluation results', async () => {
      // SYN-001: Data gate passes, no demo rules trigger
      const ctx1 = await adapter.getScenarioContext('SYN-001')
      const gate1 = evaluateClinicalContextDataGate(ctx1, { requiredDataKeys: ['hba1c', 'egfr'] })
      expect(gate1.canProceed).toBe(true)
      const eval1 = await evaluateDemoRules(ctx1)
      expect(eval1.findings).toHaveLength(0)

      // SYN-002: DEMO-ALG-001 triggers (amoxicillin exposure + penicillin allergy)
      const ctx2 = await adapter.getScenarioContext('SYN-002')
      const eval2 = await evaluateDemoRules(ctx2)
      expect(eval2.findings).toHaveLength(1)
      expect(eval2.findings[0].ruleId).toBe('DEMO-ALG-001')

      // SYN-004: Missing renal data blocks DEMO-REN-001 at the Data Gate
      const ctx4 = await adapter.getScenarioContext('SYN-004')
      const eval4 = await evaluateDemoRules(ctx4)
      const renResult4 = eval4.results.find((r) => r.ruleId === 'DEMO-REN-001')
      expect(renResult4?.gateResult.canProceed).toBe(false)
      expect(renResult4?.status).toBe('blocked')

      // SYN-003: DEMO-DDI-001 triggers (amiodarone + spironolactone exposure + available potassium)
      const ctx3 = await adapter.getScenarioContext('SYN-003')
      const eval3 = await evaluateDemoRules(ctx3)
      const ddiFinding = eval3.findings.find((f) => f.ruleId === 'DEMO-DDI-001')
      expect(ddiFinding).toBeDefined()
      expect(ddiFinding?.patientId).toBe('pat-syn-003')
    })
  })

  describe('Referential Integrity Enforcement & Error Rejection', () => {
    it('rejects non-existent scenario ID', async () => {
      const adapter = new JsonServerAdapter({ db: parsedDb })
      await expect(adapter.getScenarioSourceInput('SYN-999')).rejects.toThrow(
        "Scenario 'SYN-999' not found"
      )
    })

    it('detects and rejects orphan patient reference', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-ORPHAN-PAT',
            scenarioId: 'SYN-901',
            patientId: 'pat-nonexistent',
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-901')).rejects.toThrow(
        "Orphan patient reference: Scenario 'SYN-901' references non-existent patient 'pat-nonexistent'"
      )
    })

    it('detects and rejects orphan medication reference', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-ORPHAN-MED',
            scenarioId: 'SYN-902',
            medicationIds: ['med-nonexistent'],
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-902')).rejects.toThrow(
        "Orphan medication reference: Scenario 'SYN-902' references non-existent medication 'med-nonexistent'"
      )
    })

    it('detects and rejects orphan medicationExposure reference', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-ORPHAN-EXP',
            scenarioId: 'SYN-903',
            medicationExposureIds: ['exp-nonexistent'],
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-903')).rejects.toThrow(
        "Orphan medicationExposure reference: Scenario 'SYN-903' references non-existent medicationExposure 'exp-nonexistent'"
      )
    })

    it('detects and rejects inconsistent medicationExposure reference (wrong patientId)', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-INCONSISTENT-EXP',
            scenarioId: 'SYN-904',
            medicationExposureIds: ['exp-syn-002-1'], // Belongs to pat-syn-002, scenario is pat-syn-001
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-904')).rejects.toThrow(
        "Inconsistent medicationExposure reference: Exposure 'exp-syn-002-1' belongs to patient 'pat-syn-002', expected 'pat-syn-001'"
      )
    })

    it('detects and rejects inconsistent medicationExposure reference (medication not in scenario medicationIds)', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-EXP-NOT-IN-MEDS',
            scenarioId: 'SYN-905',
            medicationIds: ['med-syn-001-1'], // Missing med-syn-001-2 which exp-syn-001-2 references
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-905')).rejects.toThrow(
        "Inconsistent medicationExposure reference: Exposure 'exp-syn-001-2' references medication 'med-syn-001-2' which is not in scenario medicationIds"
      )
    })

    it('detects and rejects orphan allergy reference', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-ORPHAN-ALL',
            scenarioId: 'SYN-906',
            allergyIds: ['all-nonexistent'],
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-906')).rejects.toThrow(
        "Orphan allergy reference: Scenario 'SYN-906' references non-existent allergy 'all-nonexistent'"
      )
    })

    it('detects and rejects inconsistent allergy reference (wrong patientId)', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-INCONSISTENT-ALL',
            scenarioId: 'SYN-907',
            allergyIds: ['all-syn-002-1'], // Belongs to pat-syn-002
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-907')).rejects.toThrow(
        "Inconsistent allergy reference: Allergy 'all-syn-002-1' belongs to patient 'pat-syn-002', expected 'pat-syn-001'"
      )
    })

    it('detects and rejects orphan condition reference', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-ORPHAN-COND',
            scenarioId: 'SYN-908',
            conditionIds: ['cond-nonexistent'],
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-908')).rejects.toThrow(
        "Orphan condition reference: Scenario 'SYN-908' references non-existent condition 'cond-nonexistent'"
      )
    })

    it('detects and rejects inconsistent condition reference (wrong patientId)', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-INCONSISTENT-COND',
            scenarioId: 'SYN-909',
            conditionIds: ['cond-syn-002-1'], // Belongs to pat-syn-002
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-909')).rejects.toThrow(
        "Inconsistent condition reference: Condition 'cond-syn-002-1' belongs to patient 'pat-syn-002', expected 'pat-syn-001'"
      )
    })

    it('detects and rejects orphan observation reference', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-ORPHAN-OBS',
            scenarioId: 'SYN-910',
            observationIds: ['obs-nonexistent'],
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-910')).rejects.toThrow(
        "Orphan observation reference: Scenario 'SYN-910' references non-existent observation 'obs-nonexistent'"
      )
    })

    it('detects and rejects inconsistent observation reference (wrong patientId)', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-INCONSISTENT-OBS',
            scenarioId: 'SYN-911',
            observationIds: ['obs-syn-002-1'], // Belongs to pat-syn-002
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-911')).rejects.toThrow(
        "Inconsistent observation reference: Observation 'obs-syn-002-1' belongs to patient 'pat-syn-002', expected 'pat-syn-001'"
      )
    })

    it('detects and rejects orphan clinicalDataPoint reference', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-ORPHAN-CDP',
            scenarioId: 'SYN-912',
            clinicalDataPointIds: ['cdp-nonexistent'],
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-912')).rejects.toThrow(
        "Orphan clinicalDataPoint reference: Scenario 'SYN-912' references non-existent clinicalDataPoint 'cdp-nonexistent'"
      )
    })

    it('detects and rejects inconsistent clinicalDataPoint reference (wrong patientId)', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        scenarios: [
          {
            ...parsedDb.scenarios[0],
            id: 'SYN-TEST-INCONSISTENT-CDP',
            scenarioId: 'SYN-913',
            clinicalDataPointIds: ['cdp-syn-002-temperature'], // Belongs to pat-syn-002
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-913')).rejects.toThrow(
        "Inconsistent clinicalDataPoint reference: ClinicalDataPoint 'cdp-syn-002-temperature' belongs to patient 'pat-syn-002', expected 'pat-syn-001'"
      )
    })
  })

  describe('Zod Schema Boundary Validation', () => {
    it('fails when patient record has invalid fields (e.g. negative age)', async () => {
      const malformedDb: SyntheticDatabase = {
        ...parsedDb,
        patients: [
          {
            ...parsedDb.patients[0],
            age: -5,
          },
        ],
      }
      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getPatients()).rejects.toThrow()
    })

    it('fails when medication record has missing code', async () => {
      const malformedDb = {
        ...parsedDb,
        medications: [
          {
            id: 'med-invalid',
            // code missing
            name: 'Bad Med',
            dosage: '10mg',
            route: 'oral',
          },
        ],
      } as unknown as SyntheticDatabase

      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getMedications()).rejects.toThrow()
    })

    it('fails when clinicalDataPoint has invalid status value', async () => {
      const malformedDb = {
        ...parsedDb,
        clinicalDataPoints: [
          {
            id: 'cdp-syn-001-hba1c',
            patientId: 'pat-syn-001',
            key: 'hba1c',
            value: 6.8,
            status: 'SOME_INVALID_STATUS',
          },
        ],
      } as unknown as SyntheticDatabase

      const adapter = new JsonServerAdapter({ db: malformedDb })
      await expect(adapter.getScenarioSourceInput('SYN-001')).rejects.toThrow()
    })
  })

  describe('HTTP Fetch Transport & Endpoint Routing', () => {
    it('queries endpoints and parses results via mock fetch', async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.endsWith('/patients')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => parsedDb.patients,
          })
        }
        if (url.endsWith('/patients/pat-syn-001')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => parsedDb.patients[0],
          })
        }
        if (url.endsWith('/scenarios/SYN-001')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => parsedDb.scenarios[0],
          })
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({}),
        })
      })

      const adapter = new JsonServerAdapter({
        baseUrl: 'http://localhost:3001',
        fetch: mockFetch as unknown as typeof fetch,
      })

      const patients = await adapter.getPatients()
      expect(patients).toHaveLength(8)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/patients')

      const patient = await adapter.getPatientById('pat-syn-001')
      expect(patient?.id).toBe('pat-syn-001')
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/patients/pat-syn-001')

      const scenario = await adapter.getScenarioById('SYN-001')
      expect(scenario?.scenarioId).toBe('SYN-001')
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/scenarios/SYN-001')

      const nonExistent = await adapter.getPatientById('pat-nonexistent')
      expect(nonExistent).toBeNull()
    })

    it('throws descriptive error on HTTP 500 network failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      })

      const adapter = new JsonServerAdapter({
        baseUrl: 'http://localhost:3001',
        fetch: mockFetch as unknown as typeof fetch,
      })

      await expect(adapter.getPatients()).rejects.toThrow(
        'Failed to fetch from http://localhost:3001/patients: 500 Internal Server Error'
      )
    })

    it('executes default fetch bound to globalThis preventing Illegal invocation on Window', async () => {
      // Emulate browser Window.prototype.fetch requiring this === window / globalThis
      const originalFetch = globalThis.fetch

      try {
        const strictFetch = function (this: unknown, _input: RequestInfo | URL, _init?: RequestInit) {
          if (this !== globalThis) {
            throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation")
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => parsedDb.patients,
          } as Response)
        }

        globalThis.fetch = strictFetch as typeof fetch

        const defaultAdapter = new JsonServerAdapter('http://localhost:3001')
        const patients = await defaultAdapter.getPatients()
        expect(patients).toHaveLength(8)

        const defaultObjAdapter = new JsonServerAdapter({ baseUrl: 'http://localhost:3001' })
        const patientsFromObj = await defaultObjAdapter.getPatients()
        expect(patientsFromObj).toHaveLength(8)
      } finally {
        globalThis.fetch = originalFetch
      }
    })
  })
})
