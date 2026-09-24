import { z } from 'zod'

export const patientSchema = z.object({
  id: z.string(),
  syntheticIdentifier: z.string(),
  age: z.number().int().nonnegative(),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
})

export type Patient = z.infer<typeof patientSchema>
