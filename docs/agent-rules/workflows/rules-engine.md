# Workflow — Deterministic Rule Engine Changes

## Sequence
1. Inspect RuleDefinition, ClinicalContext, Required Data Gate and Finding models.
2. Define the rule as versioned data.
3. Identify required facts/data states.
4. Evaluate data completeness explicitly.
5. Run deterministic engine logic.
6. Map engine result to a traceable Finding.
7. Test trigger, non-trigger and missing/unknown cases.
8. Run lint/build.

## Restrictions
- No invented production clinical standards.
- Demo rules must be marked as demonstration/pending validation.
- AI does not participate in rule truth.
- UI is downstream of findings.
