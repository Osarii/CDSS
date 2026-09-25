import { z } from 'zod'
import { clinicalContextSchema } from '../clinical-context/schema'

export const syntheticScenarioSchema = z.object({
  scenarioId: z.string().regex(/^SYN-\d{3}$/, 'Scenario ID must follow the SYN-XXX pattern'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  clinicalContext: clinicalContextSchema,
  evaluationFocus: z.array(z.string().min(1)).min(1, 'At least one evaluation focus must be specified'),
})

export type SyntheticScenario = z.infer<typeof syntheticScenarioSchema>

export const normalizedScenarioSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  scenarioId: z.string().regex(/^SYN-\d{3}$/, 'Scenario ID must follow the SYN-XXX pattern'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  evaluationFocus: z.array(z.string().min(1)).min(1, 'At least one evaluation focus must be specified'),
  patientId: z.string().min(1, 'Patient ID is required'),
  medicationIds: z.array(z.string()),
  medicationExposureIds: z.array(z.string()),
  allergyIds: z.array(z.string()),
  conditionIds: z.array(z.string()),
  observationIds: z.array(z.string()),
  clinicalDataPointIds: z.array(z.string()),
  evaluationTimestamp: z.string().min(1, 'Evaluation timestamp is required'),
})

export type NormalizedScenario = z.infer<typeof normalizedScenarioSchema>
