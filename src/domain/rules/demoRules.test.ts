import { describe, expect, it } from 'vitest'
import {
  DEMO_ALG_001,
  DEMO_DDI_001,
  DEMO_REN_001,
  DEMO_RULES,
  evaluateDemoRule,
  evaluateDemoRules,
  evaluateRule,
  evaluateRules,
  ruleDefinitionSchema,
  clinicalFindingSchema,
  type ClinicalContext,
  type DemoRule,
} from '@/domain'
import {
  SYN_001,
  SYN_002,
  SYN_003,
  SYN_004,
  SYN_005,
} from '@/data/scenarios'

describe('DEMO Rules v1 — Synthetic Prototype Rules', () => {
  describe('Rule Definitions & Schema Integrity', () => {
    it('defines exactly three clearly labeled synthetic demo rules', () => {
      expect(DEMO_RULES).toHaveLength(3)
      const ids = DEMO_RULES.map((r) => r.definition.id)
      expect(ids).toEqual(['DEMO-ALG-001', 'DEMO-DDI-001', 'DEMO-REN-001'])
    })

    it('each demo rule conforms to the canonical ruleDefinitionSchema with explicit required fields', () => {
      for (const rule of DEMO_RULES) {
        expect(() => ruleDefinitionSchema.parse(rule.definition)).not.toThrow()
        expect(rule.definition.id).toMatch(/^DEMO-[A-Z]+-[0-9]{3}$/)
        expect(rule.definition.version).toBe('1.0.0')
        expect(rule.definition.name).toContain('DEMO:')
        expect(rule.definition.description.toLowerCase()).toContain('synthetic prototype')
        expect(['critical', 'warning', 'low', 'info']).toContain(rule.definition.severity)
        expect(rule.definition.enabled).toBe(true)
        expect(Array.isArray(rule.definition.requiredDataKeys)).toBe(true)
      }
    })

    it('has explicit requiredDataKeys for each rule', () => {
      expect(DEMO_ALG_001.definition.requiredDataKeys).toEqual([])
      expect(DEMO_DDI_001.definition.requiredDataKeys).toEqual(['potassium'])
      expect(DEMO_REN_001.definition.requiredDataKeys).toEqual(['serum_creatinine', 'egfr'])
    })
  })

  describe('Triggering Rules (Rules that trigger)', () => {
    it('DEMO-ALG-001 triggers on SYN-002 (Penicillin allergy + Amoxicillin-Clavulanate)', async () => {
      const result = await evaluateDemoRule(DEMO_ALG_001, SYN_002.clinicalContext)

      expect(result.status).toBe('triggered')
      expect(result.ruleId).toBe('DEMO-ALG-001')
      expect(result.ruleVersion).toBe('1.0.0')
      expect(result.gateResult.canProceed).toBe(true)

      // Must generate exactly one deterministic ClinicalFinding
      expect(result.finding).toBeDefined()
      const finding = result.finding!

      expect(() => clinicalFindingSchema.parse(finding)).not.toThrow()
      expect(finding.patientId).toBe('pat-syn-002')
      expect(finding.ruleId).toBe('DEMO-ALG-001')
      expect(finding.ruleVersion).toBe('1.0.0')
      expect(finding.severity).toBe('critical')
      expect(finding.title).toBe(DEMO_ALG_001.definition.name)
      expect(finding.detail).toContain('Penicillin allergy')
      expect(finding.isDeterministic).toBe(true)
      expect(finding.missingDataKeys).toEqual([])

      // Traceability: supportingDataKeys links allergy and medication records
      expect(finding.supportingDataKeys).toContain('all-syn-002-1')
      expect(finding.supportingDataKeys).toContain('med-syn-002-1')

      // Timestamp preservation
      expect(finding.timestamp).toBe(SYN_002.clinicalContext.timestamp)

      // Automatic ID preserves v1 invariant
      expect(finding.id).toBe(
        `finding-pat-syn-002-DEMO-ALG-001-1.0.0-${SYN_002.clinicalContext.timestamp}`
      )
    })

    it('DEMO-DDI-001 triggers on SYN-003 (Amiodarone + Spironolactone with available potassium)', async () => {
      const result = await evaluateDemoRule(DEMO_DDI_001, SYN_003.clinicalContext)

      expect(result.status).toBe('triggered')
      expect(result.ruleId).toBe('DEMO-DDI-001')
      expect(result.gateResult.canProceed).toBe(true)

      expect(result.finding).toBeDefined()
      const finding = result.finding!

      expect(finding.patientId).toBe('pat-syn-003')
      expect(finding.ruleId).toBe('DEMO-DDI-001')
      expect(finding.severity).toBe('warning')
      expect(finding.isDeterministic).toBe(true)
      expect(finding.missingDataKeys).toEqual([])

      // Supporting keys: spironolactone, amiodarone, potassium
      expect(finding.supportingDataKeys).toContain('med-syn-003-3')
      expect(finding.supportingDataKeys).toContain('med-syn-003-4')
      expect(finding.supportingDataKeys).toContain('potassium')
      expect(finding.timestamp).toBe(SYN_003.clinicalContext.timestamp)
    })

    it('DEMO-REN-001 triggers on SYN-003 (available renal labs with eGFR 38 <= 50)', async () => {
      const result = await evaluateDemoRule(DEMO_REN_001, SYN_003.clinicalContext)

      expect(result.status).toBe('triggered')
      expect(result.ruleId).toBe('DEMO-REN-001')
      expect(result.gateResult.canProceed).toBe(true)

      expect(result.finding).toBeDefined()
      const finding = result.finding!

      expect(finding.patientId).toBe('pat-syn-003')
      expect(finding.ruleId).toBe('DEMO-REN-001')
      expect(finding.severity).toBe('warning')
      expect(finding.isDeterministic).toBe(true)
      expect(finding.supportingDataKeys).toEqual(['egfr', 'serum_creatinine'])
      expect(finding.missingDataKeys).toEqual([])
      expect(finding.timestamp).toBe(SYN_003.clinicalContext.timestamp)
    })
  })

  describe('Non-Triggering Rules (Rules that evaluate safely but do not trigger)', () => {
    it('DEMO-ALG-001 does not trigger on SYN-001 (no penicillin allergy, no amoxicillin)', async () => {
      const result = await evaluateDemoRule(DEMO_ALG_001, SYN_001.clinicalContext)

      expect(result.status).toBe('not_triggered')
      expect(result.gateResult.canProceed).toBe(true)
      expect(result.finding).toBeUndefined()
    })

    it('DEMO-DDI-001 does not trigger on SYN-001 (potassium available, but no DDI pair)', async () => {
      const result = await evaluateDemoRule(DEMO_DDI_001, SYN_001.clinicalContext)

      expect(result.status).toBe('not_triggered')
      expect(result.gateResult.canProceed).toBe(true)
      expect(result.finding).toBeUndefined()
    })

    it('DEMO-REN-001 does not trigger on SYN-001 (renal labs available with eGFR 82 > 50)', async () => {
      const result = await evaluateDemoRule(DEMO_REN_001, SYN_001.clinicalContext)

      expect(result.status).toBe('not_triggered')
      expect(result.gateResult.canProceed).toBe(true)
      expect(result.finding).toBeUndefined()
    })
  })

  describe('Blocked Rules (Required Data Gate blocks evaluation on missing / stale / unavailable data)', () => {
    it('DEMO-REN-001 is blocked on SYN-004 due to MISSING required renal data points', async () => {
      const result = await evaluateDemoRule(DEMO_REN_001, SYN_004.clinicalContext)

      expect(result.status).toBe('blocked')
      expect(result.gateResult.canProceed).toBe(false)
      expect(result.gateResult.blockedReasons).toContain('MISSING')

      // Acceptance criterion: A blocked rule must NOT generate a ClinicalFinding
      expect(result.finding).toBeUndefined()

      const failedKeys = result.gateResult.failedRequirements.map((f) => f.key)
      expect(failedKeys).toContain('serum_creatinine')
      expect(failedKeys).toContain('egfr')
    })

    it('DEMO-REN-001 is blocked on SYN-005 due to STALE required renal data', async () => {
      const result = await evaluateDemoRule(DEMO_REN_001, SYN_005.clinicalContext)

      expect(result.status).toBe('blocked')
      expect(result.gateResult.canProceed).toBe(false)
      expect(result.gateResult.blockedReasons).toContain('STALE')

      // Must NOT generate a ClinicalFinding
      expect(result.finding).toBeUndefined()
    })

    it('DEMO-DDI-001 is blocked when required data key potassium is UNAVAILABLE', async () => {
      const contextWithUnavailable: ClinicalContext = {
        ...SYN_003.clinicalContext,
        dataPoints: {
          ...SYN_003.clinicalContext.dataPoints,
          potassium: {
            key: 'potassium',
            value: null,
            status: 'UNAVAILABLE',
          },
        },
      }

      const result = await evaluateDemoRule(DEMO_DDI_001, contextWithUnavailable)

      expect(result.status).toBe('blocked')
      expect(result.gateResult.canProceed).toBe(false)
      expect(result.gateResult.blockedReasons).toContain('UNAVAILABLE')
      expect(result.finding).toBeUndefined()
    })

    it('DEMO-DDI-001 is blocked when required data key potassium is completely NOT_PRESENT in dataPoints', async () => {
      const { potassium: _, ...dataPointsWithoutPotassium } = SYN_003.clinicalContext.dataPoints
      const contextWithoutPotassium: ClinicalContext = {
        ...SYN_003.clinicalContext,
        dataPoints: dataPointsWithoutPotassium,
      }

      const result = await evaluateDemoRule(DEMO_DDI_001, contextWithoutPotassium)

      expect(result.status).toBe('blocked')
      expect(result.gateResult.canProceed).toBe(false)
      expect(result.gateResult.failedRequirements[0].reason).toBe('NOT_PRESENT')
      expect(result.finding).toBeUndefined()
    })
  })

  describe('Batch Evaluation & Convenience Aliases', () => {
    it('evaluates all demo rules via evaluateDemoRules on SYN-001 with 0 findings', async () => {
      const { results, findings } = await evaluateDemoRules(SYN_001.clinicalContext)

      expect(results).toHaveLength(3)
      expect(findings).toHaveLength(0)
      expect(results.every((r) => r.status === 'not_triggered')).toBe(true)
    })

    it('evaluates all demo rules on SYN-002: only DEMO-ALG-001 triggers (1 finding)', async () => {
      const { results, findings } = await evaluateDemoRules(SYN_002.clinicalContext)

      expect(results).toHaveLength(3)
      expect(findings).toHaveLength(1)
      expect(findings[0].ruleId).toBe('DEMO-ALG-001')
    })

    it('evaluates all demo rules on SYN-003: DEMO-DDI-001 and DEMO-REN-001 trigger (2 findings)', async () => {
      const { results, findings } = await evaluateDemoRules(SYN_003.clinicalContext)

      expect(results).toHaveLength(3)
      expect(findings).toHaveLength(2)

      const ruleIds = findings.map((f) => f.ruleId)
      expect(ruleIds).toContain('DEMO-DDI-001')
      expect(ruleIds).toContain('DEMO-REN-001')
    })

    it('evaluates all demo rules on SYN-004: DEMO-REN-001 is blocked, no findings generated', async () => {
      const { results, findings } = await evaluateDemoRules(SYN_004.clinicalContext)

      expect(results).toHaveLength(3)
      expect(findings).toHaveLength(0)

      const renResult = results.find((r) => r.ruleId === 'DEMO-REN-001')
      expect(renResult?.status).toBe('blocked')
    })

    it('works identically via evaluateRule and evaluateRules convenience aliases', async () => {
      const single = await evaluateRule(DEMO_ALG_001, SYN_002.clinicalContext)
      expect(single.status).toBe('triggered')

      const batch = await evaluateRules(SYN_002.clinicalContext)
      expect(batch.findings).toHaveLength(1)
    })
  })

  describe('Invariants & Safety Guarantees', () => {
    it('skips disabled rules without gate check or findings', async () => {
      const disabledRule: DemoRule = {
        ...DEMO_ALG_001,
        definition: {
          ...DEMO_ALG_001.definition,
          enabled: false,
        },
      }

      const result = await evaluateDemoRule(disabledRule, SYN_002.clinicalContext)
      expect(result.status).toBe('skipped')
      expect(result.finding).toBeUndefined()
    })

    it('is pure and does not mutate ClinicalContext', async () => {
      const contextSnapshot = JSON.stringify(SYN_003.clinicalContext)
      await evaluateDemoRules(SYN_003.clinicalContext)
      expect(JSON.stringify(SYN_003.clinicalContext)).toBe(contextSnapshot)
    })

    it('is idempotent across repeated executions on identical inputs', async () => {
      const run1 = await evaluateDemoRule(DEMO_ALG_001, SYN_002.clinicalContext)
      const run2 = await evaluateDemoRule(DEMO_ALG_001, SYN_002.clinicalContext)

      expect(run1).toEqual(run2)
    })

    it('differentiates finding IDs when evaluation timestamp differs', async () => {
      const contextT1 = { ...SYN_002.clinicalContext, timestamp: '2026-09-24T10:00:00Z' }
      const contextT2 = { ...SYN_002.clinicalContext, timestamp: '2026-09-25T14:30:00Z' }

      const result1 = await evaluateDemoRule(DEMO_ALG_001, contextT1)
      const result2 = await evaluateDemoRule(DEMO_ALG_001, contextT2)

      expect(result1.finding?.id).not.toBe(result2.finding?.id)
      expect(result1.finding?.id).toContain('2026-09-24T10:00:00Z')
      expect(result2.finding?.id).toContain('2026-09-25T14:30:00Z')
    })
  })
})
