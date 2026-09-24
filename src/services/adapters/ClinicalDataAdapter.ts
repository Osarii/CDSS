import type { Patient } from '@/domain/patient/types'
import type { Medication } from '@/domain/medication/types'
import type { ClinicalFinding } from '@/domain/findings/types'

export interface ClinicalDataAdapter {
  getPatients(): Promise<Patient[]>
  getPatientById(id: string): Promise<Patient | null>
  getMedications(): Promise<Medication[]>
  getFindings(patientId: string): Promise<ClinicalFinding[]>
}
