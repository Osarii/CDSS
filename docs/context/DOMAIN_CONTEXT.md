# Domain Context Pack

Compact orientation for working within the CDSS-CR clinical domain models and boundaries.

## 1. Current State vs. Target Architecture

### Patient
- **CURRENT:** `src/domain/patient/schema.ts` defines `patientSchema` (`id`, `syntheticIdentifier`, `age`, `gender`).
- **TARGET:** Synthetic patient fixture factory and scenario linkage.

### Medication
- **CURRENT:** `src/domain/medication/schema.ts` defines `medicationSchema` (`id`, `code`, `name`, `dosage`, `route`).
- **TARGET:** Extended pharmacology structures (ATC classifications, dosage frequencies, active ingredients).

### Allergy, Condition & Observation
- **CURRENT:** `src/domain/allergy/schema.ts` (`allergySchema`), `src/domain/condition/schema.ts` (`conditionSchema`), `src/domain/observation/schema.ts` (`observationSchema`).
- **TARGET:** Synthetic clinical scenario generation for testing deterministic rule sets.

### Clinical Context & Data Gate
- **CURRENT:** `src/domain/clinical-context/schema.ts` defines `clinicalContextSchema` (serializable snapshot of patient, medications, allergies, conditions, observations, dataPoints, timestamp) and `clinicalDataPointSchema`. `requiredDataGate.ts` evaluates data readiness preserving `failedRequirements` (`key`, `status`).
- **TARGET:** Pipeline integration assembling clinical context snapshots for deterministic rule engine execution.

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
