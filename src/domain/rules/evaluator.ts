import { createRuleEngine } from './engine'
import type { DemoRule } from './demoRules'
import { DEMO_RULES } from './demoRules'
import {
  evaluateClinicalContextDataGate,
  type DataGateEvaluationResult,
} from '../clinical-context/requiredDataGate'
import type { ClinicalContext } from '../clinical-context/types'
import { buildClinicalFindingFromRule } from '../findings/builder'
import type { ClinicalFinding } from '../findings/schema'

/**
 * Result of evaluating a single rule against a ClinicalContext.
 */
export interface RuleEvaluationResult {
  ruleId: string
  ruleVersion: string
  status: 'triggered' | 'not_triggered' | 'blocked' | 'skipped'
  gateResult: DataGateEvaluationResult
  finding?: ClinicalFinding
}

/**
 * Result of batch evaluating multiple rules against a ClinicalContext.
 */
export interface RuleBatchEvaluationResult {
  results: RuleEvaluationResult[]
  findings: ClinicalFinding[]
}

/**
 * Extracts facts from a canonical ClinicalContext snapshot for ingestion
 * into the deterministic json-rules-engine.
 */
export function extractEvaluationFacts(context: ClinicalContext): Record<string, unknown> {
  const dataPointValues: Record<string, unknown> = {}
  for (const [key, dp] of Object.entries(context.dataPoints)) {
    if (dp.status === 'AVAILABLE' && dp.value !== null && dp.value !== undefined) {
      dataPointValues[key] = dp.value
    }
  }

  return {
    patientId: context.patient.id,
    age: context.patient.age,
    gender: context.patient.gender,
    allergies: context.allergies.map((a) => a.substance.toLowerCase()),
    medications: context.medications.map((m) => m.name.toLowerCase()),
    medicationCodes: context.medications.map((m) => m.code.toLowerCase()),
    conditions: context.conditions.map((c) => c.code.toLowerCase()),
    dataPoints: dataPointValues,
    serum_creatinine: dataPointValues['serum_creatinine'] ?? null,
    egfr: dataPointValues['egfr'] ?? null,
    potassium: dataPointValues['potassium'] ?? null,
  }
}

/**
 * Evaluates a single DemoRule against a ClinicalContext.
 *
 * Strict execution sequence:
 * 1. If rule is disabled, return status 'skipped' and no finding.
 * 2. Required Data Gate runs BEFORE rule evaluation.
 *    If blocked (missing/stale/unavailable/not-present), return status 'blocked'
 *    and NEVER generate a ClinicalFinding.
 * 3. Run json-rules-engine on extracted context facts.
 * 4. If triggered, generate EXACTLY ONE deterministic ClinicalFinding via the
 *    canonical finding builder, preserving ruleId, ruleVersion, severity,
 *    supportingDataKeys, missingDataKeys, and timestamp.
 * 5. If not triggered, return status 'not_triggered' and no finding.
 */
export async function evaluateDemoRule(
  rule: DemoRule,
  context: ClinicalContext
): Promise<RuleEvaluationResult> {
  if (!rule.definition.enabled) {
    return {
      ruleId: rule.definition.id,
      ruleVersion: rule.definition.version,
      status: 'skipped',
      gateResult: {
        canProceed: false,
        blockedReasons: [],
        failedRequirements: [],
      },
    }
  }

  // Required Data Gate MUST run before rule evaluation.
  const gateResult = evaluateClinicalContextDataGate(context, rule.definition)
  if (!gateResult.canProceed) {
    // A blocked rule must NOT generate a ClinicalFinding.
    return {
      ruleId: rule.definition.id,
      ruleVersion: rule.definition.version,
      status: 'blocked',
      gateResult,
    }
  }

  // Engine evaluation
  const facts = extractEvaluationFacts(context)
  const engine = createRuleEngine()
  engine.addRule(rule.engineRule)
  const engineResult = await engine.run(facts)

  const matchingEvent = engineResult.events.find(
    (e) =>
      e.params?.ruleId === rule.definition.id ||
      e.type === `${rule.definition.id}_TRIGGERED`
  )

  if (!matchingEvent) {
    return {
      ruleId: rule.definition.id,
      ruleVersion: rule.definition.version,
      status: 'not_triggered',
      gateResult,
    }
  }

  // Triggered: build exactly one deterministic finding
  const supportingDataKeys = rule.getSupportingDataKeys
    ? rule.getSupportingDataKeys(context)
    : [...rule.definition.requiredDataKeys]

  const finding = buildClinicalFindingFromRule({
    patientId: context.patient.id,
    rule: rule.definition,
    title: matchingEvent.params?.title ?? rule.definition.name,
    detail: matchingEvent.params?.detail ?? rule.definition.description,
    supportingDataKeys,
    missingDataKeys: [],
    timestamp: context.timestamp,
  })

  return {
    ruleId: rule.definition.id,
    ruleVersion: rule.definition.version,
    status: 'triggered',
    gateResult,
    finding,
  }
}

/**
 * Convenience alias for evaluateDemoRule.
 */
export const evaluateRule = evaluateDemoRule

/**
 * Evaluates multiple DemoRules against a ClinicalContext in batch.
 */
export async function evaluateDemoRules(
  context: ClinicalContext,
  rules: readonly DemoRule[] = DEMO_RULES
): Promise<RuleBatchEvaluationResult> {
  const results: RuleEvaluationResult[] = []
  const findings: ClinicalFinding[] = []

  for (const rule of rules) {
    const result = await evaluateDemoRule(rule, context)
    results.push(result)
    if (result.finding) {
      findings.push(result.finding)
    }
  }

  return { results, findings }
}

/**
 * Convenience alias for evaluateDemoRules.
 */
export const evaluateRules = evaluateDemoRules
