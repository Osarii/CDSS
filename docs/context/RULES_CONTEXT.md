# Rules Context Pack

Compact conceptual orientation for working with clinical decision rules in CDSS-CR.

## 1. Deterministic Engine Role
- Rule execution is performed deterministically using `json-rules-engine` (`src/domain/rules/engine.ts`).
- Rules evaluate facts extracted from `ClinicalContext` (patient conditions, allergies, active prescriptions, lab values).
- Rule definitions must be versioned, auditable, and traceable to explicit clinical criteria.

## 2. Required Data Gate Relationship
- Before a rule evaluates clinical risk, the `RequiredDataGate` (`src/domain/clinical-context/requiredDataGate.ts`) verifies that all necessary clinical facts are present.
- Missing required facts must produce a missing-data warning/finding instead of silently allowing the rule to pass as non-triggered or safe.

## 3. Finding Relationship
- Successful rule evaluations generate structured `Finding` objects (`src/domain/findings/types.ts`).
- Findings include severity levels (`critical`, `warning`, `info`), identified medication or condition references, and structured evidence citations.

## 4. AI Separation & Validation Restrictions
- **No AI Truth:** AI models may generate natural-language explanations of existing deterministic findings downstream, but may NEVER invent, modify, or author clinical findings directly.
- **Demo / Unvalidated Rules Restriction:** Never invent clinical guidelines. All prototype rules are explicitly tagged as DEMO or PROTOTYPE until officially validated by clinical specialists.
