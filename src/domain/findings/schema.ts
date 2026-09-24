import { z } from 'zod'

export const clinicalFindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  severity: z.enum(['critical', 'warning', 'safe', 'low']),
  title: z.string(),
  detail: z.string(),
  timestamp: z.string(),
  isDeterministic: z.literal(true),
})

export type ClinicalFinding = z.infer<typeof clinicalFindingSchema>
