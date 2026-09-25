# Data Context Pack — SAMED (CDSS)

Compact orientation for working with data access and synthetic storage in SAMED (technical project: CDSS).

## 1. Adapter Boundary
- **CURRENT:** All clinical data access is governed by the `ClinicalDataAdapter` interface (`src/services/adapters/ClinicalDataAdapter.ts`), fully implemented by `JsonServerAdapter` (`src/services/adapters/JsonServerAdapter.ts`).
  - Supports both HTTP transport (JSON Server on port 3001) and direct normalized database ingestion.
  - Exposes `getPatients()`, `getPatientById()`, `getMedications()`, `getFindings()`, `getScenarios()`, `getScenarioById()`, `getScenarioSourceInput()`, and `getScenarioContext()`.
  - Enforces referential integrity and detects/rejects orphan and cross-patient inconsistent references across all 7 referenced entity types.
  - All external data entering via adapters is validated against canonical Zod schemas before domain consumption.
- **Rule:** UI components and domain services must remain decoupled from specific backend transport formats.

## 2. Mock Storage (JSON Server) & Synthetic Fixtures
- **CURRENT:** `db.json` is the canonical normalized synthetic source for all scenario and clinical data.
  - Normalized collections: `patients`, `medications`, `medicationExposures`, `allergies`, `conditions`, `observations`, `clinicalDataPoints`, `scenarios`.
  - Scenarios reference normalized source records by ID (`patientId`, `medicationIds`, `medicationExposureIds`, `allergyIds`, `conditionIds`, `observationIds`, `clinicalDataPointIds`) rather than duplicating clinical snapshots.
  - `db.json` does NOT store prebuilt `ClinicalContext` objects.
  - Raw availability states (`AVAILABLE`, `MISSING`, `UNKNOWN`, `STALE`, `UNAVAILABLE`) and medication exposure metadata (`therapyContext`, `status`, `startedAt`, `endedAt`) are preserved with exact fidelity without coercion or normalization.
  - Verified against TypeScript fixtures `SYN-001` through `SYN-008` as regression oracle (producing equivalent `ClinicalContextSourceInput` and `ClinicalContext` snapshots).
- **Entity & Boundary Roles:**
  - **Medication:** Current prototype medication/regimen record (`id`, `code`, `name`, `dosage`, `route`). Prescribed medications rather than a pure pharmacological catalog definition. Medication IDs are never implicit patient foreign keys.
  - **MedicationExposure:** Patient-specific temporal relationship to a medication (`id`, `patientId`, `medicationId`, `therapyContext: 'chronic' | 'acute' | 'unknown'`, `status: 'active' | 'stopped' | 'unknown'`, `startedAt?`, `endedAt?`).
  - **ClinicalDataPointRecord:** Normalized data point record in `db.json` (`id`, `patientId`, `key`, `value`, `status`, `timestamp?`, `source?`).
  - **NormalizedScenario:** Scenario definition referencing normalized collections (`id`, `scenarioId`, `title`, `description`, `evaluationFocus`, `patientId`, `medicationIds`, `medicationExposureIds`, `allergyIds`, `conditionIds`, `observationIds`, `clinicalDataPointIds`, `evaluationTimestamp`).
  - **ClinicalContext:** Derived evaluation snapshot assembled from patient-linked source records via `buildClinicalContext` (`src/domain/clinical-context/builder.ts`).


## 3. Zod Boundary Validation
- All external data entering via adapters is validated against domain Zod schemas before being returned to callers.
- Invalid external data must fail cleanly at the boundary rather than corrupting domain logic.

## 4. TanStack Query Role
- **CURRENT:** Configured in `AppProviders.tsx`.
- **TARGET:** Domain-specific query hooks (`usePatient`, `useMedicationReview`) wrapping adapter calls.

## 5. Synthetic-Data Invariant
- 100% synthetic data. No real hospital connections, EDUS links, or PHI.
