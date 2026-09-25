# Data Context Pack

Compact orientation for working with data access and synthetic storage in CDSS-CR.

## 1. Adapter Boundary
- **CURRENT:** All data access is governed by the `ClinicalDataAdapter` interface (`src/services/adapters/ClinicalDataAdapter.ts`), with `JsonServerAdapter` (`src/services/adapters/JsonServerAdapter.ts`) currently structured as a development stub.
- **TARGET:** Full adapter implementation bridging stored mock/scenario data to the application layer.
- **Rule:** UI components and domain services must remain decoupled from specific backend transport formats.

## 2. Mock Storage (JSON Server) & Synthetic Fixtures
- **CURRENT:** Synthetic entity records stored in `db.json` (`patients`, `medications`, `medicationExposures`, `allergies`, `conditions`, `observations`) populated from `SYN-001` through `SYN-008`, alongside the typed scenario catalog in `src/data/scenarios/`, exposure fixtures in `src/data/scenarios/exposures.ts`, and `buildClinicalContext` (`src/domain/clinical-context/builder.ts`) assembling source records deterministically. Stored `db.json` fixtures are persistence records and are not yet actively integrated through adapter queries.
- **Entity & Boundary Roles:**
  - **Medication:** Current prototype medication/regimen record (`id`, `code`, `name`, `dosage`, `route`), capturing scenario-level prescribed medications rather than a pure pharmacological catalog definition. Medication IDs are never implicit patient foreign keys.
  - **MedicationExposure:** Patient-specific temporal relationship to a medication (`id`, `patientId`, `medicationId`, `therapyContext: 'chronic' | 'acute' | 'unknown'`, `status: 'active' | 'stopped' | 'unknown'`, `startedAt?`, `endedAt?`).
  - **ClinicalContext:** Derived evaluation snapshot assembled from patient-linked source records (boundary defined by `ClinicalContextSourceInput` and produced by `buildClinicalContext`, containing patient, medications, medicationExposures, allergies, conditions, observations, dataPoints, and timestamp).
- **TARGET:** Data adapter layer connecting stored mock/scenario records directly to `buildClinicalContext` for deterministic rule engine evaluation and UI presentation.


## 3. Zod Boundary Validation
- All external data entering via adapters is validated against domain Zod schemas before being returned to callers.
- Invalid external data must fail cleanly at the boundary rather than corrupting domain logic.

## 4. TanStack Query Role
- **CURRENT:** Configured in `AppProviders.tsx`.
- **TARGET:** Domain-specific query hooks (`usePatient`, `useMedicationReview`) wrapping adapter calls.

## 5. Synthetic-Data Invariant
- 100% synthetic data. No real hospital connections, EDUS links, or PHI.
