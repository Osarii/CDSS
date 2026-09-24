# Domain Context Pack

Compact orientation for working within the CDSS-CR clinical domain models and boundaries.

## 1. Current State vs. Target Architecture

### Patient
- **CURRENT:** `src/domain/patient/schema.ts` defines `patientSchema` (`id`, `syntheticIdentifier`, `age`, `gender`).
- **TARGET:** Domain aggregates linking conditions and allergies to patient entity.

### Medication
- **CURRENT:** `src/domain/medication/schema.ts` defines `medicationSchema` (`id`, `code`, `name`, `dosage`, `route`).
- **TARGET:** Extended pharmacology structures (ATC code classifications, dosage frequencies, duration).

### Clinical Context & Data Gate
- **CURRENT:** `src/domain/clinical-context/types.ts` defines `DataAvailabilityState` (`AVAILABLE`, `MISSING`, `UNKNOWN`, `STALE`, `UNAVAILABLE`) and `ClinicalDataPoint<T>`. `requiredDataGate.ts` implements `isDataPointAvailable` and `evaluateDataGate` (returns `{ canProceed, blockedReasons }`).
- **TARGET:** Full `ClinicalContext` aggregator class assembling patient, medication, observation facts into an evaluation snapshot.

### Rules Engine
- **CURRENT:** `src/domain/rules/schema.ts` (`ruleDefinitionSchema`) and `src/domain/rules/engine.ts` (`createRuleEngine` returning `Engine` from `json-rules-engine`).
- **TARGET:** Clinically validated rule sets (drug-drug interactions, dosing alerts).

### Findings
- **CURRENT:** `src/domain/findings/schema.ts` defines `clinicalFindingSchema` (`id`, `ruleId`, `severity: 'critical'|'warning'|'safe'|'low'`, `title`, `detail`, `timestamp`, `isDeterministic: true`).
- **TARGET:** Structured evidence citations, related entity references, and downstream AI explanation metadata.

### Audit
- **CURRENT:** `src/domain/audit/types.ts` (`AuditEvent` interface).

---

## 2. Mandatory Domain Invariants
- **Non-Normal Unknowns:** `UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`.
- **Gate Precedence:** Incomplete required data points prevent rule evaluation (`canProceed: false`).
- **Deterministic Truth:** AI never authors findings. Findings derive strictly from deterministic evaluation.
- **Clinician Authority:** The healthcare professional retains final decision-making power.
