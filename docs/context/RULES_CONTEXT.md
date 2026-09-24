# Rules Context Pack

Compact orientation for working with clinical decision rules in CDSS-CR.

## 1. Engine & Schema Status
- **CURRENT:** `src/domain/rules/engine.ts` exports `createRuleEngine()`, initializing an instance of `json-rules-engine`. `src/domain/rules/schema.ts` defines `ruleDefinitionSchema` (`id`, `version`, `name`, `description`, `severity`, `enabled`, `requiredDataKeys`) using canonical severity (`critical`, `warning`, `low`, `info`).
- **TARGET:** Concrete clinical rules catalog (drug-drug interactions, renal dosing, contraindications) implemented in Phase 3.

## 2. Required Data Gate Relationship
- **CURRENT:** `evaluateDataGate` (`src/domain/clinical-context/requiredDataGate.ts`) evaluates required data points and returns `{ canProceed, blockedReasons, failedRequirements }`, preserving WHICH required datum failed (`key`) and its availability status.
- **TARGET:** Integrated pipeline evaluating data readiness before clinical rule execution in Phase 2/3.
- **Invariant:** Missing required data prevents assumption of normal or safe status (`UNKNOWN !== NORMAL`).

## 3. Findings Relationship
- **CURRENT:** `clinicalFindingSchema` (`src/domain/findings/schema.ts`) models deterministic, traceable findings (`id`, `patientId`, `ruleId`, `ruleVersion`, `severity: 'critical'|'warning'|'low'|'info'`, `title`, `detail`, `supportingDataKeys`, `missingDataKeys`, `timestamp`, `isDeterministic: true`). Safe/confirmed is a visual status, not a finding alert severity.
- **TARGET:** Finding generator converting rule evaluation events into structured finding instances during Phase 2.

## 4. AI Separation & Guideline Invariant
- **No AI Truth:** AI models may generate natural-language explanations downstream from deterministic findings, but NEVER author or modify clinical truth.
- **Unvalidated Rules Restriction:** Never invent clinical guidelines. Prototype rules are strictly demo fixtures until validated by clinicians.
