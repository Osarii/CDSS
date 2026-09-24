# Domain Context Pack

Compact orientation for working within the CDSS-CR clinical domain models and boundaries.

## 1. Current State vs. Target Architecture

### Patient
- **CURRENT:** `src/domain/patient/schema.ts` defines `patientSchema` (`id`, `syntheticIdentifier`, `age`, `gender`).
- **TARGET:** Synthetic patient fixture factory and scenario linkage.

### Medication (Medication Definition / Snapshot)
- **CURRENT:** `src/domain/medication/schema.ts` defines `medicationSchema` (`id`, `code`, `name`, `dosage`, `route`). Represents the pure medication catalog definition/snapshot. Medication IDs are never implicit patient foreign keys.
- **TARGET:** Extended pharmacology structures (ATC classifications, dosage frequencies, active ingredients).

### Medication Exposure (Patient-Specific Relationship)
- **CURRENT:** `src/domain/medication/schema.ts` defines `medicationExposureSchema` (`id`, `patientId`, `medicationId`, `therapyContext: 'chronic' | 'acute' | 'unknown'`, `status: 'active' | 'stopped' | 'unknown'`, `startedAt?`, `endedAt?`). Models the patient's specific relationship to a medication. Fixtures in `src/data/scenarios/exposures.ts` and `db.json`.
- **TARGET:** Ingestion of patient exposure records via adapters and Clinical Context Builder.

### Allergy, Condition & Observation
- **CURRENT:** `src/domain/allergy/schema.ts` (`allergySchema`), `src/domain/condition/schema.ts` (`conditionSchema`), `src/domain/observation/schema.ts` (`observationSchema`).
- **TARGET:** Extended ontology codes (SNOMED, RxNorm) for advanced clinical mappings.

### Synthetic Scenarios
- **CURRENT:** `src/domain/scenarios/schema.ts` (`syntheticScenarioSchema`) and `src/data/scenarios/` (`SYN-001` through `SYN-008`).
- **TARGET:** Clinical Context Builder aggregating scenario source records for evaluation pipelines.

### Clinical Context (Derived Evaluation Snapshot) & Data Gate
- **CURRENT:** `src/domain/clinical-context/schema.ts` defines:
  - `clinicalContextSchema`: Derived evaluation snapshot containing resolved patient, medications, allergies, conditions, observations, dataPoints, and timestamp.
  - `clinicalContextSourceInputSchema`: Explicit raw-source input boundary for the Clinical Context Builder (`patient`, `medications`, `medicationExposures`, `allergies`, `conditions`, `observations`, `dataPoints?`, `evaluationTimestamp`), making explicit that a context is assembled from patient-linked source records rather than copied from an already-built snapshot.
  - `clinicalDataPointSchema`: Serializable key-value data point with availability state.
  - `requiredDataGate.ts`: Evaluates data readiness preserving `failedRequirements` (`key`, `status`).
- **TARGET:** Clinical Context Builder assembling `ClinicalContextSourceInput` records into `ClinicalContext` evaluation snapshots for deterministic rule engine execution.


### Rules Engine
- **CURRENT:** `src/domain/rules/schema.ts` (`ruleDefinitionSchema`: `id`, `version`, `name`, `description`, `severity`, `enabled`, `requiredDataKeys`) and `src/domain/rules/engine.ts` (`createRuleEngine` returning `Engine` from `json-rules-engine`).
- **TARGET:** Synthetic demo rule definitions for drug-drug interactions and dosage alerts.

### Findings
- **CURRENT:** `src/domain/findings/schema.ts` defines `clinicalFindingSchema` (`id`, `patientId`, `ruleId`, `ruleVersion`, `severity: 'critical'|'warning'|'low'|'info'`, `title`, `detail`, `supportingDataKeys`, `missingDataKeys`, `timestamp`, `isDeterministic: true`).
- **TARGET:** Finding generator converting rule evaluation events into structured finding instances during Deterministic Findings milestone.

### Audit
- **CURRENT:** `src/domain/audit/schema.ts` defines `auditEventSchema` (`id`, `action`, `userId`, `timestamp`, `payloadSummary`).

---

## 2. Mandatory Domain Invariants
- **Non-Normal Unknowns:** `UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`.
- **Gate Precedence:** Incomplete required data points prevent rule evaluation (`canProceed: false`).
- **Deterministic Truth:** AI never authors findings. Findings derive strictly from deterministic evaluation.
- **Clinician Authority:** The healthcare professional retains final decision-making power.
