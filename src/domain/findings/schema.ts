import { z } from 'zod'
import { clinicalSeveritySchema } from '../common/schema'

export const clinicalFindingSchema = z.object({
  id: z.string().min(1),
  patientId: z.string().min(1),
  ruleId: z.string().min(1),
  ruleVersion: z.string().min(1),
  severity: clinicalSeveritySchema,
  title: z.string().min(1),
  detail: z.string().min(1),
  supportingDataKeys: z.array(z.string()).default([]),
  missingDataKeys: z.array(z.string()).default([]),
  timestamp: z.string().min(1),
  isDeterministic: z.literal(true),
})

export type ClinicalFinding = z.infer<typeof clinicalFindingSchema>
export type Finding = ClinicalFinding

export const clinicalFindingInputSchema = z.object({
  id: z.string().min(1).optional(),
  patientId: z.string().min(1),
  ruleId: z.string().min(1),
  ruleVersion: z.string().min(1),
  severity: clinicalSeveritySchema,
  title: z.string().min(1),
  detail: z.string().min(1),
  supportingDataKeys: z.array(z.string()).optional().default([]),
  missingDataKeys: z.array(z.string()).optional().default([]),
  timestamp: z.string().min(1),
  isDeterministic: z.literal(true).optional(),
})

export type ClinicalFindingInput = z.input<typeof clinicalFindingInputSchema>
