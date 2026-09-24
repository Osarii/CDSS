# Data Context Pack

Compact orientation for working with data access and synthetic storage in CDSS-CR.

## 1. Adapter Boundary
- **CURRENT:** All data access is governed by the `ClinicalDataAdapter` interface (`src/services/adapters/ClinicalDataAdapter.ts`), implemented by `JsonServerAdapter` (`src/services/adapters/JsonServerAdapter.ts`).
- **TARGET:** Additional adapters (e.g. offline memory adapter, full synthetic scenario fixture adapter).
- **Rule:** UI components and domain services must remain decoupled from specific backend transport formats.

## 2. Mock Backend (JSON Server)
- **CURRENT:** Synthetic resources served by JSON Server using `db.json` (`patients`, `medications`, `allergies`, `conditions`, `observations`, `rules`, `findings`, `auditEvents`).
- **TARGET:** Complex multi-condition clinical patient scenarios for demo rule testing.

## 3. Zod Boundary Validation
- All external data entering via adapters is validated against domain Zod schemas before being returned to callers.
- Invalid external data must fail cleanly at the boundary rather than corrupting domain logic.

## 4. TanStack Query Role
- **CURRENT:** Configured in `AppProviders.tsx`.
- **TARGET:** Domain-specific query hooks (`usePatient`, `useMedicationReview`) wrapping adapter calls.

## 5. Synthetic-Data Invariant
- 100% synthetic data. No real hospital connections, EDUS links, or PHI.
