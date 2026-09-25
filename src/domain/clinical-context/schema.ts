import { z } from 'zod'
import { dataAvailabilityStateSchema } from '../common/schema'
import { patientSchema } from '../patient/schema'
import { medicationExposureSchema, medicationSchema } from '../medication/schema'
import { allergySchema } from '../allergy/schema'
import { conditionSchema } from '../condition/schema'
import { observationSchema } from '../observation/schema'

export const jsonValueSchema = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  ])
  .nullable()

export const clinicalDataPointSchema = z.object({
  key: z.string(),
  value: jsonValueSchema,
  status: dataAvailabilityStateSchema,
  timestamp: z.string().optional(),
  source: z.string().optional(),
})

export const clinicalDataPointRecordSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  key: z.string().min(1, 'Key is required'),
  value: jsonValueSchema,
  status: dataAvailabilityStateSchema,
  timestamp: z.string().optional(),
  source: z.string().optional(),
})

export type ClinicalDataPointRecord = z.infer<typeof clinicalDataPointRecordSchema>

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
  medicationExposures: z.array(medicationExposureSchema),
  allergies: z.array(allergySchema),
  conditions: z.array(conditionSchema),
  observations: z.array(observationSchema),
  dataPoints: z.record(z.string(), clinicalDataPointSchema),
  timestamp: z.string(),
})

export type ClinicalContext = z.infer<typeof clinicalContextSchema>


export const clinicalContextSourceInputSchema = z.object({
  patient: patientSchema,
  medications: z.array(medicationSchema),
  medicationExposures: z.array(medicationExposureSchema),
  allergies: z.array(allergySchema),
  conditions: z.array(conditionSchema),
  observations: z.array(observationSchema),
  dataPoints: z.record(z.string(), clinicalDataPointSchema).optional().default({}),
  evaluationTimestamp: z.string(),
})

export type ClinicalContextSourceInput = z.infer<typeof clinicalContextSourceInputSchema>
