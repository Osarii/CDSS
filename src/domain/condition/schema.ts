import { z } from 'zod'

export const conditionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  code: z.string(),
  name: z.string(),
  onsetTimestamp: z.string().optional(),
})

export type Condition = z.infer<typeof conditionSchema>
