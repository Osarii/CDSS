import { clinicalFindingSchema, clinicalFindingInputSchema } from './schema'
import type { ClinicalFinding, ClinicalFindingInput } from './schema'
import type { RuleDefinition } from '../rules/schema'

/**
 * Explicit deterministic evaluation input referencing a RuleDefinition.
 */
export interface RuleEvaluationFindingInput {
  id?: string
  patientId: string
  rule: Pick<RuleDefinition, 'id' | 'version' | 'name' | 'severity'>
  detail: string
  title?: string
  supportingDataKeys?: string[]
  missingDataKeys?: string[]
  timestamp: string
}

/**
 * Builds a canonical ClinicalFinding deterministically from explicit evaluation input.
 *
 * Core Invariants:
 * - Pure and side-effect free: never mutates input records.
 * - Deterministic truth: isDeterministic is strictly true.
 * - Traceability: explicitly preserves patientId, ruleId, ruleVersion, severity,
 *   title, detail, supportingDataKeys, missingDataKeys, timestamp.
 * - No inference: never invents or alters clinical conclusions.
 * - Validation: rejects incomplete or invalid inputs against canonical schemas.
 */
export function buildClinicalFinding(input: ClinicalFindingInput): ClinicalFinding {
  const validatedInput = clinicalFindingInputSchema.parse(input)

  const candidate: ClinicalFinding = {
    id:
      validatedInput.id ??
      `finding-${validatedInput.patientId}-${validatedInput.ruleId}-${validatedInput.ruleVersion}-${validatedInput.timestamp}`,
    patientId: validatedInput.patientId,
    ruleId: validatedInput.ruleId,
    ruleVersion: validatedInput.ruleVersion,
    severity: validatedInput.severity,
    title: validatedInput.title,
    detail: validatedInput.detail,
    supportingDataKeys: [...validatedInput.supportingDataKeys],
    missingDataKeys: [...validatedInput.missingDataKeys],
    timestamp: validatedInput.timestamp,
    isDeterministic: true,
  }

  return clinicalFindingSchema.parse(candidate)
}

/**
 * Convenience alias for buildClinicalFinding.
 */
export const buildFinding = buildClinicalFinding

/**
 * Builds a canonical ClinicalFinding directly from a triggered RuleDefinition
 * and explicit evaluation details.
 */
export function buildClinicalFindingFromRule(
  input: RuleEvaluationFindingInput
): ClinicalFinding {
  return buildClinicalFinding({
    id: input.id,
    patientId: input.patientId,
    ruleId: input.rule.id,
    ruleVersion: input.rule.version,
    severity: input.rule.severity,
    title: input.title ?? input.rule.name,
    detail: input.detail,
    supportingDataKeys: input.supportingDataKeys,
    missingDataKeys: input.missingDataKeys,
    timestamp: input.timestamp,
  })
}

/**
 * Batch builder for multiple deterministic findings.
 */
export function buildClinicalFindings(
  inputs: readonly ClinicalFindingInput[]
): ClinicalFinding[] {
  return inputs.map((input) => buildClinicalFinding(input))
}
