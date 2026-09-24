import { z } from 'zod'

export const observationSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  code: z.string(),
  name: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]).nullable(),
  unit: z.string().optional(),
  timestamp: z.string(),
})

export type Observation = z.infer<typeof observationSchema>
