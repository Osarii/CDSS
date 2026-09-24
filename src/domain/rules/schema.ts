import { z } from 'zod'
import { clinicalSeveritySchema } from '../common/schema'

export const ruleDefinitionSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  severity: clinicalSeveritySchema,
  enabled: z.boolean(),
  requiredDataKeys: z.array(z.string()).default([]),
})

export type RuleDefinition = z.infer<typeof ruleDefinitionSchema>
