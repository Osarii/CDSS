import { z } from 'zod'

export const medicationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  dosage: z.string(),
  route: z.string(),
})

export type Medication = z.infer<typeof medicationSchema>

export const therapyContextSchema = z.enum(['chronic', 'acute', 'unknown'])
export type TherapyContext = z.infer<typeof therapyContextSchema>

export const medicationExposureStatusSchema = z.enum(['active', 'stopped', 'unknown'])
export type MedicationExposureStatus = z.infer<typeof medicationExposureStatusSchema>

export const medicationExposureSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  medicationId: z.string(),
  therapyContext: therapyContextSchema,
  status: medicationExposureStatusSchema,
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
})

export type MedicationExposure = z.infer<typeof medicationExposureSchema>
