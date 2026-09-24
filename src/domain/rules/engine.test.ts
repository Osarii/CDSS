import { describe, expect, it } from 'vitest'
import { createRuleEngine } from './engine'

describe('Rules Engine Integration (Artificial / Non-clinical)', () => {
  it('evaluates artificial demoFlag rule deterministically', async () => {
    const engine = createRuleEngine()

    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'demoFlag',
            operator: 'equal',
            value: true,
          },
        ],
      },
      event: {
        type: 'DEMO_TRIGGERED',
        params: {
          message: 'Harness test verified',
        },
      },
    })

    const result = await engine.run({ demoFlag: true })
    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('DEMO_TRIGGERED')

    const failedResult = await engine.run({ demoFlag: false })
    expect(failedResult.events).toHaveLength(0)
  })
})
