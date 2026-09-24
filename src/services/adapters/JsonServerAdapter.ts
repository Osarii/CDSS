import type { ClinicalDataAdapter } from './ClinicalDataAdapter'
import type { Patient } from '@/domain/patient/types'
import type { Medication } from '@/domain/medication/types'
import type { ClinicalFinding } from '@/domain/findings/types'

/**
 * JsonServerAdapter (Stub)
 * Bridges the ClinicalDataAdapter interface to JSON Server / Mock API.
 */
export class JsonServerAdapter implements ClinicalDataAdapter {
  private readonly baseUrl: string

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl
  }

  async getPatients(): Promise<Patient[]> {
    return []
  }

  async getPatientById(_id: string): Promise<Patient | null> {
    return null
  }

  async getMedications(): Promise<Medication[]> {
    return []
  }

  async getFindings(_patientId: string): Promise<ClinicalFinding[]> {
    return []
  }

  getBaseUrl(): string {
    return this.baseUrl
  }
}
