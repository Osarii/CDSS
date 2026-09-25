# Rules Context Pack

Compact orientation for working with clinical decision rules in CDSS-CR.

## 1. Engine & Schema Status
- **CURRENT:** `src/domain/rules/engine.ts` exports `createRuleEngine()`, initializing an instance of `json-rules-engine`. `src/domain/rules/schema.ts` defines `ruleDefinitionSchema` (`id`, `version`, `name`, `description`, `severity`, `enabled`, `requiredDataKeys`). `src/domain/rules/demoRules.ts` defines synthetic prototype demo rules (`DEMO-ALG-001`, `DEMO-DDI-001`, `DEMO-REN-001`). `src/domain/rules/evaluator.ts` implements `evaluateDemoRule` and `evaluateDemoRules`. All demo conditions, thresholds (e.g. eGFR <= 50), and medication pairings are strictly synthetic demonstration logic and NOT validated clinical guidance or authoritative recommendations.
- **TARGET:** Production clinical rules catalog (drug-drug interactions, renal dosing, contraindications) validated by healthcare professionals.

## 2. Required Data Gate Relationship
- **CURRENT:** `evaluateClinicalContextDataGate` runs before any rule evaluation in `evaluateDemoRule`. If required data is MISSING, UNKNOWN, STALE, UNAVAILABLE, or NOT_PRESENT, the rule is BLOCKED (`status: 'blocked'`) and strictly prevented from running in the engine or generating a `ClinicalFinding`.
- **TARGET:** Expanded rule engine pipeline integrating batch rule sets with multi-stage evaluation workflows.
- **Invariant:** Missing required data prevents assumption of normal or safe status (`UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `STALE !== NORMAL`, `UNAVAILABLE !== NORMAL`).

## 3. Findings Relationship
- **CURRENT:** When an enabled rule passes the data gate and triggers in `json-rules-engine`, `evaluateDemoRule` generates exactly one deterministic `ClinicalFinding` via `buildClinicalFindingFromRule`, preserving `patientId`, `ruleId`, `ruleVersion`, `severity`, `title`, `detail`, `supportingDataKeys`, `missingDataKeys`, `timestamp`, and `isDeterministic: true`. Automatic IDs follow the v1 invariant (`finding-${patientId}-${ruleId}-${ruleVersion}-${timestamp}`).
- **TARGET:** Direct wiring between rule evaluation events and finding generation in UI/API workflows.

## 4. AI Separation & Guideline Invariant
- **No AI Truth:** AI models may generate natural-language explanations downstream from deterministic findings, but NEVER author or modify clinical truth.
- **Unvalidated Rules Restriction:** Never invent clinical guidelines. Prototype rules (`DEMO-ALG-001`, `DEMO-DDI-001`, `DEMO-REN-001`) are strictly synthetic demonstration fixtures for pipeline verification; their conditions, numerical thresholds (eGFR <= 50), and medication pairings are non-authoritative demo logic and NOT validated clinical recommendations.
