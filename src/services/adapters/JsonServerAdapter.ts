import { z } from 'zod'
import type { ClinicalDataAdapter } from './ClinicalDataAdapter'
import type { Patient } from '@/domain/patient/types'
import { patientSchema } from '@/domain/patient/schema'
import type { Medication, MedicationExposure } from '@/domain/medication/types'
import { medicationSchema, medicationExposureSchema } from '@/domain/medication/schema'
import type { Allergy } from '@/domain/allergy/types'
import { allergySchema } from '@/domain/allergy/schema'
import type { Condition } from '@/domain/condition/types'
import { conditionSchema } from '@/domain/condition/schema'
import type { Observation } from '@/domain/observation/types'
import { observationSchema } from '@/domain/observation/schema'
import type { ClinicalFinding } from '@/domain/findings/types'
import { clinicalFindingSchema } from '@/domain/findings/schema'
import type {
  ClinicalContext,
  ClinicalContextSourceInput,
  ClinicalDataPoint,
  ClinicalDataPointRecord,
} from '@/domain/clinical-context/schema'
import {
  clinicalDataPointRecordSchema,
  clinicalContextSourceInputSchema,
} from '@/domain/clinical-context/schema'
import { buildClinicalContext } from '@/domain/clinical-context/builder'
import type { NormalizedScenario } from '@/domain/scenarios/schema'
import { normalizedScenarioSchema } from '@/domain/scenarios/schema'

export const syntheticDatabaseSchema = z.object({
  patients: z.array(patientSchema),
  medications: z.array(medicationSchema),
  medicationExposures: z.array(medicationExposureSchema),
  allergies: z.array(allergySchema),
  conditions: z.array(conditionSchema),
  observations: z.array(observationSchema),
  clinicalDataPoints: z.array(clinicalDataPointRecordSchema),
  scenarios: z.array(normalizedScenarioSchema),
  rules: z.array(z.unknown()).optional().default([]),
  findings: z.array(z.unknown()).optional().default([]),
  auditEvents: z.array(z.unknown()).optional().default([]),
})

export type SyntheticDatabase = z.infer<typeof syntheticDatabaseSchema>

export interface JsonServerAdapterOptions {
  baseUrl?: string
  db?: SyntheticDatabase
  fetch?: typeof fetch
}

/**
 * JsonServerAdapter
 * Bridges the ClinicalDataAdapter interface to JSON Server / Mock API.
 * Supports both HTTP fetch transport and direct normalized database ingestion.
 */
export class JsonServerAdapter implements ClinicalDataAdapter {
  private readonly baseUrl: string
  private readonly db?: SyntheticDatabase
  private readonly fetchFn: typeof fetch

  constructor(optionsOrBaseUrl?: string | JsonServerAdapterOptions) {
    if (typeof optionsOrBaseUrl === 'string') {
      this.baseUrl = optionsOrBaseUrl
      this.fetchFn = globalThis.fetch
    } else if (optionsOrBaseUrl) {
      this.baseUrl = optionsOrBaseUrl.baseUrl ?? 'http://localhost:3001'
      this.db = optionsOrBaseUrl.db
      this.fetchFn = optionsOrBaseUrl.fetch ?? globalThis.fetch
    } else {
      this.baseUrl = 'http://localhost:3001'
      this.fetchFn = globalThis.fetch
    }
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  private async fetchCollection<T>(path: string): Promise<T[]> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    const res = await this.fetchFn(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch from ${url}: ${res.status} ${res.statusText}`)
    }
    return (await res.json()) as T[]
  }

  private async fetchItem<T>(path: string): Promise<T | null> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    const res = await this.fetchFn(url)
    if (res.status === 404) {
      return null
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch from ${url}: ${res.status} ${res.statusText}`)
    }
    return (await res.json()) as T
  }

  async getPatients(): Promise<Patient[]> {
    if (this.db) {
      return this.db.patients.map((p) => patientSchema.parse(p))
    }
    const raw = await this.fetchCollection<unknown>('/patients')
    return z.array(patientSchema).parse(raw)
  }

  async getPatientById(id: string): Promise<Patient | null> {
    if (this.db) {
      const patient = this.db.patients.find((p) => p.id === id)
      return patient ? patientSchema.parse(patient) : null
    }
    const raw = await this.fetchItem<unknown>(`/patients/${id}`)
    return raw ? patientSchema.parse(raw) : null
  }

  async getMedications(): Promise<Medication[]> {
    if (this.db) {
      return this.db.medications.map((m) => medicationSchema.parse(m))
    }
    const raw = await this.fetchCollection<unknown>('/medications')
    return z.array(medicationSchema).parse(raw)
  }

  async getFindings(patientId: string): Promise<ClinicalFinding[]> {
    if (this.db) {
      const findings = (this.db.findings || []) as Record<string, unknown>[]
      return findings
        .filter((f) => f && f.patientId === patientId)
        .map((f) => clinicalFindingSchema.parse(f))
    }
    const raw = await this.fetchCollection<unknown>(`/findings?patientId=${encodeURIComponent(patientId)}`)
    return z.array(clinicalFindingSchema).parse(raw)
  }

  async getScenarios(): Promise<NormalizedScenario[]> {
    if (this.db) {
      return this.db.scenarios.map((s) => normalizedScenarioSchema.parse(s))
    }
    const raw = await this.fetchCollection<unknown>('/scenarios')
    return z.array(normalizedScenarioSchema).parse(raw)
  }

  async getScenarioById(id: string): Promise<NormalizedScenario | null> {
    if (this.db) {
      const scenario = this.db.scenarios.find((s) => s.id === id || s.scenarioId === id)
      return scenario ? normalizedScenarioSchema.parse(scenario) : null
    }
    const raw = await this.fetchItem<unknown>(`/scenarios/${id}`)
    if (raw) {
      return normalizedScenarioSchema.parse(raw)
    }
    const list = await this.fetchCollection<unknown>(`/scenarios?scenarioId=${encodeURIComponent(id)}`)
    if (list && list.length > 0) {
      return normalizedScenarioSchema.parse(list[0])
    }
    return null
  }

  private async findPatient(patientId: string): Promise<Patient | null> {
    if (this.db) {
      const found = this.db.patients.find((p) => p.id === patientId)
      return found ? patientSchema.parse(found) : null
    }
    const raw = await this.fetchItem<unknown>(`/patients/${patientId}`)
    return raw ? patientSchema.parse(raw) : null
  }

  private async findMedication(medId: string): Promise<Medication | null> {
    if (this.db) {
      const found = this.db.medications.find((m) => m.id === medId)
      return found ? medicationSchema.parse(found) : null
    }
    const raw = await this.fetchItem<unknown>(`/medications/${medId}`)
    return raw ? medicationSchema.parse(raw) : null
  }

  private async findMedicationExposure(expId: string): Promise<MedicationExposure | null> {
    if (this.db) {
      const found = this.db.medicationExposures.find((e) => e.id === expId)
      return found ? medicationExposureSchema.parse(found) : null
    }
    const raw = await this.fetchItem<unknown>(`/medicationExposures/${expId}`)
    return raw ? medicationExposureSchema.parse(raw) : null
  }

  private async findAllergy(allId: string): Promise<Allergy | null> {
    if (this.db) {
      const found = this.db.allergies.find((a) => a.id === allId)
      return found ? allergySchema.parse(found) : null
    }
    const raw = await this.fetchItem<unknown>(`/allergies/${allId}`)
    return raw ? allergySchema.parse(raw) : null
  }

  private async findCondition(condId: string): Promise<Condition | null> {
    if (this.db) {
      const found = this.db.conditions.find((c) => c.id === condId)
      return found ? conditionSchema.parse(found) : null
    }
    const raw = await this.fetchItem<unknown>(`/conditions/${condId}`)
    return raw ? conditionSchema.parse(raw) : null
  }

  private async findObservation(obsId: string): Promise<Observation | null> {
    if (this.db) {
      const found = this.db.observations.find((o) => o.id === obsId)
      return found ? observationSchema.parse(found) : null
    }
    const raw = await this.fetchItem<unknown>(`/observations/${obsId}`)
    return raw ? observationSchema.parse(raw) : null
  }

  private async findClinicalDataPoint(cdpId: string): Promise<ClinicalDataPointRecord | null> {
    if (this.db) {
      const found = this.db.clinicalDataPoints.find((dp) => dp.id === cdpId)
      return found ? clinicalDataPointRecordSchema.parse(found) : null
    }
    const raw = await this.fetchItem<unknown>(`/clinicalDataPoints/${cdpId}`)
    return raw ? clinicalDataPointRecordSchema.parse(raw) : null
  }

  async getScenarioSourceInput(scenarioId: string): Promise<ClinicalContextSourceInput> {
    const scenario = await this.getScenarioById(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario '${scenarioId}' not found`)
    }

    // 1. Patient referential integrity check
    const patient = await this.findPatient(scenario.patientId)
    if (!patient) {
      throw new Error(
        `Orphan patient reference: Scenario '${scenarioId}' references non-existent patient '${scenario.patientId}'`
      )
    }

    // 2. Medications referential integrity check
    const medications: Medication[] = []
    for (const medId of scenario.medicationIds) {
      const med = await this.findMedication(medId)
      if (!med) {
        throw new Error(
          `Orphan medication reference: Scenario '${scenarioId}' references non-existent medication '${medId}'`
        )
      }
      medications.push(med)
    }

    // 3. MedicationExposures referential integrity check
    const medicationExposures: MedicationExposure[] = []
    for (const expId of scenario.medicationExposureIds) {
      const exp = await this.findMedicationExposure(expId)
      if (!exp) {
        throw new Error(
          `Orphan medicationExposure reference: Scenario '${scenarioId}' references non-existent medicationExposure '${expId}'`
        )
      }
      if (exp.patientId !== scenario.patientId) {
        throw new Error(
          `Inconsistent medicationExposure reference: Exposure '${exp.id}' belongs to patient '${exp.patientId}', expected '${scenario.patientId}'`
        )
      }
      if (!scenario.medicationIds.includes(exp.medicationId)) {
        throw new Error(
          `Inconsistent medicationExposure reference: Exposure '${exp.id}' references medication '${exp.medicationId}' which is not in scenario medicationIds`
        )
      }
      medicationExposures.push(exp)
    }

    // 4. Allergies referential integrity check
    const allergies: Allergy[] = []
    for (const allId of scenario.allergyIds) {
      const allergy = await this.findAllergy(allId)
      if (!allergy) {
        throw new Error(
          `Orphan allergy reference: Scenario '${scenarioId}' references non-existent allergy '${allId}'`
        )
      }
      if (allergy.patientId !== scenario.patientId) {
        throw new Error(
          `Inconsistent allergy reference: Allergy '${allergy.id}' belongs to patient '${allergy.patientId}', expected '${scenario.patientId}'`
        )
      }
      allergies.push(allergy)
    }

    // 5. Conditions referential integrity check
    const conditions: Condition[] = []
    for (const condId of scenario.conditionIds) {
      const condition = await this.findCondition(condId)
      if (!condition) {
        throw new Error(
          `Orphan condition reference: Scenario '${scenarioId}' references non-existent condition '${condId}'`
        )
      }
      if (condition.patientId !== scenario.patientId) {
        throw new Error(
          `Inconsistent condition reference: Condition '${condition.id}' belongs to patient '${condition.patientId}', expected '${scenario.patientId}'`
        )
      }
      conditions.push(condition)
    }

    // 6. Observations referential integrity check
    const observations: Observation[] = []
    for (const obsId of scenario.observationIds) {
      const obs = await this.findObservation(obsId)
      if (!obs) {
        throw new Error(
          `Orphan observation reference: Scenario '${scenarioId}' references non-existent observation '${obsId}'`
        )
      }
      if (obs.patientId !== scenario.patientId) {
        throw new Error(
          `Inconsistent observation reference: Observation '${obs.id}' belongs to patient '${obs.patientId}', expected '${scenario.patientId}'`
        )
      }
      observations.push(obs)
    }

    // 7. ClinicalDataPoints referential integrity check
    const dataPoints: Record<string, ClinicalDataPoint> = {}
    for (const cdpId of scenario.clinicalDataPointIds) {
      const cdp = await this.findClinicalDataPoint(cdpId)
      if (!cdp) {
        throw new Error(
          `Orphan clinicalDataPoint reference: Scenario '${scenarioId}' references non-existent clinicalDataPoint '${cdpId}'`
        )
      }
      if (cdp.patientId !== scenario.patientId) {
        throw new Error(
          `Inconsistent clinicalDataPoint reference: ClinicalDataPoint '${cdp.id}' belongs to patient '${cdp.patientId}', expected '${scenario.patientId}'`
        )
      }
      dataPoints[cdp.key] = {
        key: cdp.key,
        value: cdp.value,
        status: cdp.status,
        ...(cdp.timestamp !== undefined ? { timestamp: cdp.timestamp } : {}),
        ...(cdp.source !== undefined ? { source: cdp.source } : {}),
      }
    }

    // 8. Assemble raw source input bundle and validate via canonical Zod schema
    const rawBundle = {
      patient,
      medications,
      medicationExposures,
      allergies,
      conditions,
      observations,
      dataPoints,
      evaluationTimestamp: scenario.evaluationTimestamp,
    }

    return clinicalContextSourceInputSchema.parse(rawBundle)
  }

  async getScenarioContext(scenarioId: string): Promise<ClinicalContext> {
    const sourceInput = await this.getScenarioSourceInput(scenarioId)
    return buildClinicalContext(sourceInput)
  }
}
