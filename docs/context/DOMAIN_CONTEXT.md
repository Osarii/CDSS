# Domain Context Pack

Compact orientation for working within the CDSS-CR clinical domain models and boundaries.

## 1. Current State vs. Target Architecture

### Patient
- **CURRENT:** `src/domain/patient/schema.ts` defines `patientSchema` (`id`, `syntheticIdentifier`, `age`, `gender`).
- **TARGET:** Synthetic patient fixture factory and scenario linkage.

### Medication (Prototype Medication / Regimen Record)
- **CURRENT:** `src/domain/medication/schema.ts` defines `medicationSchema` (`id`, `code`, `name`, `dosage`, `route`). Represents the current prototype medication/regimen record rather than a pure pharmacological catalog definition. Medication IDs are never implicit patient foreign keys.
- **TARGET:** Extended pharmacology structures (ATC classifications, dosage frequencies, active ingredients).

### Medication Exposure (Patient-Specific Temporal Relationship)
- **CURRENT:** `src/domain/medication/schema.ts` defines `medicationExposureSchema` (`id`, `patientId`, `medicationId`, `therapyContext: 'chronic' | 'acute' | 'unknown'`, `status: 'active' | 'stopped' | 'unknown'`, `startedAt?`, `endedAt?`). Models the patient's specific temporal relationship to a medication. Fixtures in `src/data/scenarios/exposures.ts` and `db.json`.
- **TARGET:** Ingestion of patient exposure records via adapters and Clinical Context Builder.

### Allergy, Condition & Observation
- **CURRENT:** `src/domain/allergy/schema.ts` (`allergySchema`), `src/domain/condition/schema.ts` (`conditionSchema`), `src/domain/observation/schema.ts` (`observationSchema`).
- **TARGET:** Extended ontology codes (SNOMED, RxNorm) for advanced clinical mappings.

### Synthetic Scenarios
- **CURRENT:** `src/domain/scenarios/schema.ts` (`syntheticScenarioSchema`), `src/data/scenarios/` (`SYN-001` through `SYN-008`), and `getScenarioSourceInput` assembling patient-linked source bundles.
- **TARGET:** Pipeline integration connecting scenario source inputs to evaluation workflows.

### Clinical Context (Derived Evaluation Snapshot) & Data Gate
- **CURRENT:** `src/domain/clinical-context/` defines:
  - `clinicalContextSchema`: Derived evaluation snapshot containing resolved patient, medications, medicationExposures, allergies, conditions, observations, dataPoints, and timestamp.
  - `clinicalContextSourceInputSchema`: Explicit raw-source input boundary for the Clinical Context Builder (`patient`, `medications`, `medicationExposures`, `allergies`, `conditions`, `observations`, `dataPoints?`, `evaluationTimestamp`).
  - `buildClinicalContext` (`src/domain/clinical-context/builder.ts`): Pure deterministic builder assembling `ClinicalContext` from `ClinicalContextSourceInput`, resolving medications and preserving exposure metadata strictly via `MedicationExposure` records belonging to the patient and resolved medication set, preserving therapyContext, status, startedAt and endedAt without inference or normalization, enforcing source patient referential integrity (rejecting cross-patient or uncataloged references), and preserving raw availability states (`AVAILABLE`, `MISSING`, `UNKNOWN`, `STALE`, `UNAVAILABLE`) without normalization.
  - `clinicalDataPointSchema`: Serializable key-value data point with availability state.
  - `requiredDataGate.ts`: Pure deterministic data gate evaluating data readiness before rule execution (`evaluateDataGate`, `evaluateClinicalContextDataGate`), preserving failed requirements (`key`, `status`, `reason`) across availability states (`AVAILABLE`, `MISSING`, `UNKNOWN`, `STALE`, `UNAVAILABLE`) and handling missing required keys (`NOT_PRESENT`) without assuming normal status.
- **TARGET:** Pipeline integration connecting `evaluateClinicalContextDataGate` directly to deterministic rule engine execution and clinical finding generation.



### Rules Engine
- **CURRENT:** `src/domain/rules/schema.ts` (`ruleDefinitionSchema`: `id`, `version`, `name`, `description`, `severity`, `enabled`, `requiredDataKeys`) and `src/domain/rules/engine.ts` (`createRuleEngine` returning `Engine` from `json-rules-engine`).
- **TARGET:** Synthetic demo rule definitions for drug-drug interactions and dosage alerts.

### Findings
- **CURRENT:** `src/domain/findings/` defines `clinicalFindingSchema`, `clinicalFindingInputSchema`, and pure deterministic builders `buildClinicalFinding`, `buildFinding`, `buildClinicalFindingFromRule`, `buildClinicalFindings` (`src/domain/findings/builder.ts`). Explicitly preserves traceability (`patientId`, `ruleId`, `ruleVersion`, `timestamp`), severity (`critical`, `warning`, `low`, `info`), titles/details, and data keys (`supportingDataKeys`, `missingDataKeys`) with `isDeterministic: true`. Does not infer clinical conclusions inside the Finding layer.
- **TARGET:** Evaluation pipeline connecting deterministic rule engine outcomes directly to finding generation.

### Audit
- **CURRENT:** `src/domain/audit/schema.ts` defines `auditEventSchema` (`id`, `action`, `userId`, `timestamp`, `payloadSummary`).

---

## 2. Mandatory Domain Invariants
- **Non-Normal Unknowns:** `UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`.
- **Gate Precedence:** Incomplete required data points prevent rule evaluation (`canProceed: false`).
- **Deterministic Truth:** AI never authors findings. Findings derive strictly from deterministic evaluation.
- **Clinician Authority:** The healthcare professional retains final decision-making power.
