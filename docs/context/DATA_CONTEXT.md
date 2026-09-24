# Data Context Pack

Compact orientation for working with data access and synthetic storage in CDSS-CR.

## 1. Adapter Boundary
- **CURRENT:** All data access is governed by the `ClinicalDataAdapter` interface (`src/services/adapters/ClinicalDataAdapter.ts`), with `JsonServerAdapter` (`src/services/adapters/JsonServerAdapter.ts`) currently structured as a development stub.
- **TARGET:** Full adapter implementation bridging stored mock/scenario data to the application layer.
- **Rule:** UI components and domain services must remain decoupled from specific backend transport formats.

## 2. Mock Storage (JSON Server) & Synthetic Fixtures
- **CURRENT:** Synthetic entity records stored in `db.json` (`patients`, `medications`, `allergies`, `conditions`, `observations`) populated from `SYN-001` through `SYN-008`, alongside the typed scenario catalog in `src/data/scenarios/`. Note: Stored `db.json` fixtures are persistence records and are not yet actively integrated through adapter queries.
- **TARGET:** Adapter ingestion and Clinical Context Builder assembling scenario snapshots for evaluation and UI consumption.

## 3. Zod Boundary Validation
- All external data entering via adapters is validated against domain Zod schemas before being returned to callers.
- Invalid external data must fail cleanly at the boundary rather than corrupting domain logic.

## 4. TanStack Query Role
- **CURRENT:** Configured in `AppProviders.tsx`.
- **TARGET:** Domain-specific query hooks (`usePatient`, `useMedicationReview`) wrapping adapter calls.

## 5. Synthetic-Data Invariant
- 100% synthetic data. No real hospital connections, EDUS links, or PHI.
