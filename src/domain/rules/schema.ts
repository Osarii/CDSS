import { z } from 'zod'

export const ruleDefinitionSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'warning', 'safe', 'low', 'info']),
  enabled: z.boolean(),
})

export type RuleDefinition = z.infer<typeof ruleDefinitionSchema>
