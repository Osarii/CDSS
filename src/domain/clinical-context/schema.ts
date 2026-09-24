import { z } from 'zod'
import { dataAvailabilityStateSchema } from '../common/schema'
import { patientSchema } from '../patient/schema'
import { medicationSchema } from '../medication/schema'
import { allergySchema } from '../allergy/schema'
import { conditionSchema } from '../condition/schema'
import { observationSchema } from '../observation/schema'

export const clinicalDataPointSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  status: dataAvailabilityStateSchema,
  timestamp: z.string().optional(),
  source: z.string().optional(),
})

export type ClinicalDataPoint<T = unknown> = {
  key: string
  value: T | null
  status: z.infer<typeof dataAvailabilityStateSchema>
  timestamp?: string
  source?: string
}

export const clinicalContextSchema = z.object({
  patient: patientSchema,
  medications: z.array(medicationSchema),
  allergies: z.array(allergySchema),
  conditions: z.array(conditionSchema),
  observations: z.array(observationSchema),
  dataPoints: z.record(z.string(), clinicalDataPointSchema),
  timestamp: z.string(),
})

export type ClinicalContext = z.infer<typeof clinicalContextSchema>
