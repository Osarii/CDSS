import { z } from 'zod'
import { clinicalSeveritySchema } from '../common/schema'

export const allergySchema = z.object({
  id: z.string(),
  patientId: z.string(),
  substance: z.string(),
  reaction: z.string().optional(),
  severity: clinicalSeveritySchema.optional(),
})

export type Allergy = z.infer<typeof allergySchema>
