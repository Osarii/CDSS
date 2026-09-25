# Rules Context Pack

Compact orientation for working with clinical decision rules in CDSS-CR.

## 1. Engine & Schema Status
- **CURRENT:** `src/domain/rules/engine.ts` exports `createRuleEngine()`, initializing an instance of `json-rules-engine`. `src/domain/rules/schema.ts` defines `ruleDefinitionSchema` (`id`, `version`, `name`, `description`, `severity`, `enabled`, `requiredDataKeys`) using canonical severity (`critical`, `warning`, `low`, `info`).
- **TARGET:** Concrete clinical rules catalog (drug-drug interactions, renal dosing, contraindications) implemented in clinical rules evaluation milestone.

## 2. Required Data Gate Relationship
- **CURRENT:** `evaluateDataGate` and `evaluateClinicalContextDataGate` (`src/domain/clinical-context/requiredDataGate.ts`) evaluate required data points against `ClinicalContext` snapshots and `RuleDefinition.requiredDataKeys`, returning `{ canProceed, blockedReasons, failedRequirements }`. The gate preserves WHICH required datum failed (`key`), its availability status, and reason (`NOT_USABLE` vs `NOT_PRESENT`), evaluating ONLY keys required by the given rule without blocking on unrelated non-available data points.
- **TARGET:** Integrated evaluation loop feeding cleared `ClinicalContext` snapshots to `Engine.run()` and generating deterministic findings.
- **Invariant:** Missing required data prevents assumption of normal or safe status (`UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `STALE !== NORMAL`, `UNAVAILABLE !== NORMAL`).

## 3. Findings Relationship
- **CURRENT:** `buildClinicalFinding` and `buildClinicalFindingFromRule` (`src/domain/findings/builder.ts`) assemble canonical `ClinicalFinding` objects from explicit evaluation outcomes and triggered `RuleDefinition`s, preserving `patientId`, `ruleId`, `ruleVersion`, `severity`, `title`, `detail`, `supportingDataKeys`, `missingDataKeys`, `timestamp`, and `isDeterministic: true`. The Finding layer does not invent or infer clinical truth; findings reflect exclusively deterministic evaluation events. Automatic IDs are scoped to the v1 invariant: `patientId` + `ruleId` + `ruleVersion` + `timestamp` defines one finding identity per evaluation loop.
- **TARGET:** Direct wiring between rule evaluation events and finding generation in the deterministic evaluation loop.

## 4. AI Separation & Guideline Invariant
- **No AI Truth:** AI models may generate natural-language explanations downstream from deterministic findings, but NEVER author or modify clinical truth.
- **Unvalidated Rules Restriction:** Never invent clinical guidelines. Prototype rules are strictly demo fixtures until validated by clinicians.
