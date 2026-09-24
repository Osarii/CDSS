import { z } from 'zod'

export const medicationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  dosage: z.string(),
  route: z.string(),
})

export type Medication = z.infer<typeof medicationSchema>
