# Data Context Pack

Compact conceptual orientation for working with data access and synthetic storage in CDSS-CR.

## 1. Adapter Boundary
- All frontend data access must pass through `ClinicalDataAdapter` (`src/services/adapters/ClinicalDataAdapter.ts`).
- UI components and domain services must remain decoupled from specific backend endpoints or wire transport formats.

## 2. Mock Backend (JSON Server)
- Prototype endpoints are served by JSON Server using `db.json`.
- Resources include `patients`, `medications`, `allergies`, `conditions`, `observations`, `rules`, `findings`, and `auditEvents`.

## 3. Zod Boundary Validation
- All data retrieved from external APIs, mocks, or storage must be validated with Zod schemas at the adapter boundary before entering the domain layer.
- Invalid or malformed external payloads must fail cleanly rather than contaminating domain logic.

## 4. TanStack Query Role
- Handles asynchronous state, caching, query keys, invalidation, and optimistic mutations in React.
- Query hooks wrap `ClinicalDataAdapter` calls without embedding direct `fetch` logic in UI components.

## 5. Synthetic-Data Invariant
- Every record is 100% synthetic.
- Never connect to real hospital networks, CCSS EDUS, or real patient databases.
- Never embed PHI (Protected Health Information) in mock payloads or test fixtures.
