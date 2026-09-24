import { Engine } from 'json-rules-engine'

/**
 * Creates and initializes a deterministic rule engine instance.
 * No definitive clinical rules are defined during this environment setup phase.
 */
export function createRuleEngine(): Engine {
  const engine = new Engine()
  return engine
}
