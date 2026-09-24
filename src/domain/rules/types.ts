export type { RuleDefinition } from './schema'

export interface RuleExecutionResult {
  ruleId: string
  passed: boolean
  events: Array<{
    type: string
    params?: Record<string, unknown>
  }>
}
