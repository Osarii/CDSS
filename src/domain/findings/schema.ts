import { z } from 'zod'
import { clinicalSeveritySchema } from '../common/schema'

export const clinicalFindingSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  ruleId: z.string(),
  ruleVersion: z.string().default('1.0.0'),
  severity: clinicalSeveritySchema,
  title: z.string(),
  detail: z.string(),
  supportingDataKeys: z.array(z.string()).default([]),
  missingDataKeys: z.array(z.string()).default([]),
  timestamp: z.string(),
  isDeterministic: z.literal(true),
})

export type ClinicalFinding = z.infer<typeof clinicalFindingSchema>
export type Finding = ClinicalFinding
