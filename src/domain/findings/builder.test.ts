import { describe, expect, it } from 'vitest'
import {
  buildClinicalFinding,
  buildFinding,
  buildClinicalFindingFromRule,
  buildClinicalFindings,
  clinicalFindingSchema,
  clinicalFindingInputSchema,
  type ClinicalFindingInput,
  type RuleDefinition,
} from '@/domain'

describe('Deterministic Findings v1 — Builder & Factory', () => {
  const validFindingInput: ClinicalFindingInput = {
    patientId: 'pat-syn-003',
    ruleId: 'rule-ddi-amiodarone-spironolactone',
    ruleVersion: '1.2.0',
    severity: 'warning',
    title: 'Concurrent Potassium-Sparing Diuretic and Antiarrhythmic Therapy',
    detail:
      'Co-administration of spironolactone and amiodarone in patient pat-syn-003 requires serum potassium and ECG monitoring.',
    supportingDataKeys: ['med-syn-003-3', 'med-syn-003-4', 'potassium'],
    missingDataKeys: [],
    timestamp: '2026-09-24T18:00:00Z',
  }

  describe('Schema Validation & Construction', () => {
    it('builds a valid ClinicalFinding from valid ClinicalFindingInput', () => {
      const finding = buildClinicalFinding(validFindingInput)

      expect(() => clinicalFindingSchema.parse(finding)).not.toThrow()
      expect(finding.patientId).toBe('pat-syn-003')
      expect(finding.ruleId).toBe('rule-ddi-amiodarone-spironolactone')
      expect(finding.ruleVersion).toBe('1.2.0')
      expect(finding.severity).toBe('warning')
      expect(finding.title).toBe(validFindingInput.title)
      expect(finding.detail).toBe(validFindingInput.detail)
      expect(finding.supportingDataKeys).toEqual([
        'med-syn-003-3',
        'med-syn-003-4',
        'potassium',
      ])
      expect(finding.missingDataKeys).toEqual([])
      expect(finding.timestamp).toBe('2026-09-24T18:00:00Z')
      expect(finding.isDeterministic).toBe(true)
    })

    it('works identically via buildFinding convenience alias', () => {
      const finding = buildFinding(validFindingInput)
      expect(finding.isDeterministic).toBe(true)
      expect(finding.ruleId).toBe('rule-ddi-amiodarone-spironolactone')
    })

    it('generates a deterministic ID including evaluation timestamp when id is omitted', () => {
      const finding = buildClinicalFinding(validFindingInput)
      expect(finding.id).toBe(
        'finding-pat-syn-003-rule-ddi-amiodarone-spironolactone-1.2.0-2026-09-24T18:00:00Z'
      )
    })

    it('preserves an explicit id when provided in input', () => {
      const customIdInput: ClinicalFindingInput = {
        ...validFindingInput,
        id: 'finding-custom-001',
      }
      const finding = buildClinicalFinding(customIdInput)
      expect(finding.id).toBe('finding-custom-001')
    })

    it('rejects invalid severity like "safe" or "extreme"', () => {
      const invalidSeverityInput = {
        ...validFindingInput,
        severity: 'safe',
      }
      expect(() =>
        buildClinicalFinding(invalidSeverityInput as unknown as ClinicalFindingInput)
      ).toThrow()

      const unknownSeverityInput = {
        ...validFindingInput,
        severity: 'extreme',
      }
      expect(() =>
        buildClinicalFinding(unknownSeverityInput as unknown as ClinicalFindingInput)
      ).toThrow()
    })

    it('rejects input with isDeterministic set to false', () => {
      const nonDeterministicInput = {
        ...validFindingInput,
        isDeterministic: false,
      }
      expect(() =>
        buildClinicalFinding(nonDeterministicInput as unknown as ClinicalFindingInput)
      ).toThrow()
    })

    it('rejects input with empty strings for required fields', () => {
      expect(() =>
        buildClinicalFinding({ ...validFindingInput, patientId: '' })
      ).toThrow()

      expect(() =>
        buildClinicalFinding({ ...validFindingInput, ruleId: '' })
      ).toThrow()

      expect(() =>
        buildClinicalFinding({ ...validFindingInput, ruleVersion: '' })
      ).toThrow()

      expect(() =>
        buildClinicalFinding({ ...validFindingInput, title: '' })
      ).toThrow()

      expect(() =>
        buildClinicalFinding({ ...validFindingInput, detail: '' })
      ).toThrow()

      expect(() =>
        buildClinicalFinding({ ...validFindingInput, timestamp: '' })
      ).toThrow()
    })

    it('rejects input when mandatory fields are omitted', () => {
      const { patientId: _, ...missingPatient } = validFindingInput
      expect(() =>
        buildClinicalFinding(missingPatient as unknown as ClinicalFindingInput)
      ).toThrow()

      const { ruleId: __, ...missingRule } = validFindingInput
      expect(() =>
        buildClinicalFinding(missingRule as unknown as ClinicalFindingInput)
      ).toThrow()

      const { title: ___, ...missingTitle } = validFindingInput
      expect(() =>
        buildClinicalFinding(missingTitle as unknown as ClinicalFindingInput)
      ).toThrow()

      const { detail: ____, ...missingDetail } = validFindingInput
      expect(() =>
        buildClinicalFinding(missingDetail as unknown as ClinicalFindingInput)
      ).toThrow()

      const { timestamp: _____, ...missingTimestamp } = validFindingInput
      expect(() =>
        buildClinicalFinding(missingTimestamp as unknown as ClinicalFindingInput)
      ).toThrow()
    })
  })

  describe('Traceability & Rule Version Preservation', () => {
    it('strictly preserves ruleVersion without silent defaulting or alteration', () => {
      const findingV1 = buildClinicalFinding({
        ...validFindingInput,
        ruleVersion: '2.0.0-rc.1',
      })
      expect(findingV1.ruleVersion).toBe('2.0.0-rc.1')

      const findingV2 = buildClinicalFinding({
        ...validFindingInput,
        ruleVersion: '0.0.1',
      })
      expect(findingV2.ruleVersion).toBe('0.0.1')
    })

    it('rejects finding construction when ruleVersion is missing', () => {
      const { ruleVersion: _, ...missingVersion } = validFindingInput
      expect(() =>
        buildClinicalFinding(missingVersion as unknown as ClinicalFindingInput)
      ).toThrow()
    })

    it('preserves full audit linkage via buildClinicalFindingFromRule', () => {
      const rule: RuleDefinition = {
        id: 'rule-ddi-warfarin-amiodarone',
        version: '1.4.0',
        name: 'Warfarin and Amiodarone Serious Interaction',
        description: 'Potentiation of anticoagulant effect',
        severity: 'critical',
        enabled: true,
        requiredDataKeys: ['med-syn-007-1', 'med-syn-007-2', 'inr'],
      }

      const finding = buildClinicalFindingFromRule({
        patientId: 'pat-syn-007',
        rule,
        detail: 'Simultaneous prescription of Warfarin and Amiodarone increases bleeding risk.',
        supportingDataKeys: ['med-syn-007-1', 'med-syn-007-2'],
        missingDataKeys: ['inr'],
        timestamp: '2026-09-24T10:00:00Z',
      })

      expect(finding.id).toBe(
        'finding-pat-syn-007-rule-ddi-warfarin-amiodarone-1.4.0-2026-09-24T10:00:00Z'
      )
      expect(finding.patientId).toBe('pat-syn-007')
      expect(finding.ruleId).toBe('rule-ddi-warfarin-amiodarone')
      expect(finding.ruleVersion).toBe('1.4.0')
      expect(finding.severity).toBe('critical')
      expect(finding.title).toBe('Warfarin and Amiodarone Serious Interaction')
      expect(finding.detail).toBe(
        'Simultaneous prescription of Warfarin and Amiodarone increases bleeding risk.'
      )
      expect(finding.supportingDataKeys).toEqual(['med-syn-007-1', 'med-syn-007-2'])
      expect(finding.missingDataKeys).toEqual(['inr'])
      expect(finding.timestamp).toBe('2026-09-24T10:00:00Z')
      expect(finding.isDeterministic).toBe(true)
    })

    it('allows custom title override in buildClinicalFindingFromRule', () => {
      const rule: RuleDefinition = {
        id: 'rule-test',
        version: '1.0.0',
        name: 'Default Rule Title',
        description: 'Test rule',
        severity: 'low',
        enabled: true,
        requiredDataKeys: [],
      }

      const finding = buildClinicalFindingFromRule({
        patientId: 'pat-1',
        rule,
        title: 'Custom Evaluation Title',
        detail: 'Specific scenario context',
        timestamp: '2026-09-24T10:00:00Z',
      })

      expect(finding.title).toBe('Custom Evaluation Title')
    })
  })

  describe('SupportingDataKeys & MissingDataKeys Preservation', () => {
    it('preserves exact order and content of supportingDataKeys and missingDataKeys', () => {
      const finding = buildClinicalFinding({
        ...validFindingInput,
        supportingDataKeys: ['key-alpha', 'key-gamma', 'key-beta'],
        missingDataKeys: ['missing-1', 'missing-2'],
      })

      expect(finding.supportingDataKeys).toEqual(['key-alpha', 'key-gamma', 'key-beta'])
      expect(finding.missingDataKeys).toEqual(['missing-1', 'missing-2'])
    })

    it('defaults supportingDataKeys and missingDataKeys to empty arrays when omitted', () => {
      const minimalInput = {
        patientId: 'pat-syn-001',
        ruleId: 'rule-simple',
        ruleVersion: '1.0.0',
        severity: 'info' as const,
        title: 'Simple Alert',
        detail: 'Information alert detail',
        timestamp: '2026-09-24T12:00:00Z',
      }

      const finding = buildClinicalFinding(minimalInput)
      expect(finding.supportingDataKeys).toEqual([])
      expect(finding.missingDataKeys).toEqual([])
    })

    it('parses input directly through clinicalFindingInputSchema', () => {
      const parsed = clinicalFindingInputSchema.parse(validFindingInput)
      expect(parsed.supportingDataKeys).toEqual(validFindingInput.supportingDataKeys)
      expect(parsed.missingDataKeys).toEqual([])
    })
  })

  describe('Determinism, Purity & Immutability', () => {
    it('produces identical output for identical inputs across multiple runs', () => {
      const run1 = buildClinicalFinding(validFindingInput)
      const run2 = buildClinicalFinding(validFindingInput)
      const run3 = buildClinicalFinding(validFindingInput)

      expect(run1).toEqual(run2)
      expect(run2).toEqual(run3)
    })

    it('does not mutate input records or allow input array mutations to affect built finding', () => {
      const mutableSupporting = ['med-1', 'med-2']
      const mutableMissing = ['lab-creatinine']

      const input: ClinicalFindingInput = {
        ...validFindingInput,
        supportingDataKeys: mutableSupporting,
        missingDataKeys: mutableMissing,
      }

      const snapshotBefore = JSON.stringify(input)
      const built = buildClinicalFinding(input)

      // Mutate the original arrays after building
      mutableSupporting.push('med-MUTATED')
      mutableMissing.push('lab-MUTATED')

      // Input was mutated externally, but built finding must remain clean
      expect(built.supportingDataKeys).toEqual(['med-1', 'med-2'])
      expect(built.missingDataKeys).toEqual(['lab-creatinine'])
      expect(built.supportingDataKeys).not.toContain('med-MUTATED')
      expect(built.missingDataKeys).not.toContain('lab-MUTATED')

      // And building again creates a fresh clone
      const built2 = buildClinicalFinding(JSON.parse(snapshotBefore))
      expect(built2.supportingDataKeys).toEqual(['med-1', 'med-2'])
    })

    it('supports batch building through buildClinicalFindings', () => {
      const inputs: ClinicalFindingInput[] = [
        validFindingInput,
        {
          ...validFindingInput,
          ruleId: 'rule-second',
          ruleVersion: '1.0.0',
          severity: 'info',
        },
      ]

      const findings = buildClinicalFindings(inputs)
      expect(findings).toHaveLength(2)
      expect(findings[0].ruleId).toBe('rule-ddi-amiodarone-spironolactone')
      expect(findings[1].ruleId).toBe('rule-second')
      expect(findings.every((f) => f.isDeterministic)).toBe(true)
    })
  })

  describe('Identifier Integrity & Collision Prevention across Evaluations', () => {
    it('produces distinct automatic IDs for separate evaluations of the same patient, rule, and ruleVersion at different timestamps', () => {
      const evaluationT1 = buildClinicalFinding({
        ...validFindingInput,
        timestamp: '2026-09-24T10:00:00Z',
      })

      const evaluationT2 = buildClinicalFinding({
        ...validFindingInput,
        timestamp: '2026-09-25T14:30:00Z',
      })

      expect(evaluationT1.id).toBe(
        'finding-pat-syn-003-rule-ddi-amiodarone-spironolactone-1.2.0-2026-09-24T10:00:00Z'
      )
      expect(evaluationT2.id).toBe(
        'finding-pat-syn-003-rule-ddi-amiodarone-spironolactone-1.2.0-2026-09-25T14:30:00Z'
      )
      expect(evaluationT1.id).not.toBe(evaluationT2.id)
    })

    it('produces identical IDs for identical complete inputs (idempotence)', () => {
      const runA = buildClinicalFinding(validFindingInput)
      const runB = buildClinicalFinding({ ...validFindingInput })

      expect(runA.id).toBe(runB.id)
      expect(runA.id).toBe(
        'finding-pat-syn-003-rule-ddi-amiodarone-spironolactone-1.2.0-2026-09-24T18:00:00Z'
      )
    })

    it('resolves to the same automatic finding ID for two inputs sharing the v1 invariant (patientId, ruleId, ruleVersion, timestamp)', () => {
      const runA = buildClinicalFinding({
        ...validFindingInput,
        title: 'Title A',
        detail: 'Detail A',
      })
      const runB = buildClinicalFinding({
        ...validFindingInput,
        title: 'Title B',
        detail: 'Detail B',
      })

      expect(runA.id).toBe(runB.id)
      expect(runA.id).toBe(
        'finding-pat-syn-003-rule-ddi-amiodarone-spironolactone-1.2.0-2026-09-24T18:00:00Z'
      )
    })

    it('preserves explicit custom IDs unchanged across evaluations', () => {
      const customIdT1 = buildClinicalFinding({
        ...validFindingInput,
        id: 'explicit-audit-id-001',
        timestamp: '2026-09-24T10:00:00Z',
      })

      const customIdT2 = buildClinicalFinding({
        ...validFindingInput,
        id: 'explicit-audit-id-002',
        timestamp: '2026-09-25T14:30:00Z',
      })

      expect(customIdT1.id).toBe('explicit-audit-id-001')
      expect(customIdT2.id).toBe('explicit-audit-id-002')
    })

    it('preserves identifier integrity in batch finding creation with mixed automatic and custom IDs', () => {
      const batchInputs: ClinicalFindingInput[] = [
        // Finding 1: Morning evaluation of rule 1
        {
          patientId: 'pat-syn-001',
          ruleId: 'rule-hba1c-monitoring',
          ruleVersion: '1.0.0',
          severity: 'info',
          title: 'HbA1c Monitoring',
          detail: 'Routine review',
          timestamp: '2026-09-24T08:00:00Z',
        },
        // Finding 2: Afternoon evaluation of rule 1 on the same patient and ruleVersion
        {
          patientId: 'pat-syn-001',
          ruleId: 'rule-hba1c-monitoring',
          ruleVersion: '1.0.0',
          severity: 'info',
          title: 'HbA1c Monitoring Follow-up',
          detail: 'Afternoon review',
          timestamp: '2026-09-24T16:00:00Z',
        },
        // Finding 3: Finding with explicit custom ID
        {
          id: 'custom-batch-finding-99',
          patientId: 'pat-syn-001',
          ruleId: 'rule-renal-function',
          ruleVersion: '2.1.0',
          severity: 'warning',
          title: 'Renal Check',
          detail: 'Explicit audit id',
          timestamp: '2026-09-24T16:00:00Z',
        },
      ]

      const batchFindings = buildClinicalFindings(batchInputs)

      expect(batchFindings).toHaveLength(3)

      // Finding 1 automatic ID includes morning timestamp
      expect(batchFindings[0].id).toBe(
        'finding-pat-syn-001-rule-hba1c-monitoring-1.0.0-2026-09-24T08:00:00Z'
      )

      // Finding 2 automatic ID includes afternoon timestamp, preventing collision
      expect(batchFindings[1].id).toBe(
        'finding-pat-syn-001-rule-hba1c-monitoring-1.0.0-2026-09-24T16:00:00Z'
      )
      expect(batchFindings[0].id).not.toBe(batchFindings[1].id)

      // Finding 3 explicit custom ID remains unchanged
      expect(batchFindings[2].id).toBe('custom-batch-finding-99')

      // Entire batch remains deterministic upon re-execution
      const batchRun2 = buildClinicalFindings(batchInputs)
      expect(batchFindings).toEqual(batchRun2)
    })
  })
})

