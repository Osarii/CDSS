# Rules Context Pack

Compact orientation for working with clinical decision rules in CDSS-CR.

## 1. Engine & Schema Status
- **CURRENT:** `src/domain/rules/engine.ts` exports `createRuleEngine()`, initializing an instance of `json-rules-engine`. `src/domain/rules/schema.ts` defines `ruleDefinitionSchema` (`id`, `version`, `name`, `description`, `severity`, `enabled`).
- **TARGET:** Concrete clinical rules catalog (drug-drug interactions, renal dosing, contraindications). No validated clinical rules are implemented in the environment setup phase.

## 2. Required Data Gate Relationship
- **CURRENT:** `evaluateDataGate` (`src/domain/clinical-context/requiredDataGate.ts`) evaluates required data points and returns `{ canProceed, blockedReasons }`.
- **TARGET:** Integrated pipeline evaluating data readiness before clinical rule execution. Phase 1 will define whether and how `canProceed === false` produces missing-data Finding instances or blocks downstream evaluation.
- **Invariant:** Missing required data prevents assumption of normal or safe status.

## 3. Findings Relationship
- **CURRENT:** `clinicalFindingSchema` (`src/domain/findings/schema.ts`) models deterministic findings (`id`, `ruleId`, `severity: 'critical'|'warning'|'safe'|'low'`, `title`, `detail`, `timestamp`, `isDeterministic: true`).
- **TARGET:** Finding generator converting rule evaluation events into structured finding instances.

## 4. AI Separation & Guideline Invariant
- **No AI Truth:** AI models may generate natural-language explanations downstream from deterministic findings, but NEVER author or modify clinical truth.
- **Unvalidated Rules Restriction:** Never invent clinical guidelines. Prototype rules are strictly demo fixtures until validated by clinicians.
