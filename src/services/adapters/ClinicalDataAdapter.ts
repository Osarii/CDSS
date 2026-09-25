import type { Patient } from '@/domain/patient/types'
import type { Medication } from '@/domain/medication/types'
import type { ClinicalFinding } from '@/domain/findings/types'
import type { NormalizedScenario } from '@/domain/scenarios/schema'
import type { ClinicalContextSourceInput, ClinicalContext } from '@/domain/clinical-context/schema'

export interface ClinicalDataAdapter {
  getPatients(): Promise<Patient[]>
  getPatientById(id: string): Promise<Patient | null>
  getMedications(): Promise<Medication[]>
  getFindings(patientId: string): Promise<ClinicalFinding[]>
  getScenarios(): Promise<NormalizedScenario[]>
  getScenarioById(id: string): Promise<NormalizedScenario | null>
  getScenarioSourceInput(scenarioId: string): Promise<ClinicalContextSourceInput>
  getScenarioContext(scenarioId: string): Promise<ClinicalContext>
}
