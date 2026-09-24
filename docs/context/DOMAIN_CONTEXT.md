# Domain Context Pack

Compact conceptual orientation for working within the CDSS-CR clinical domain.

## 1. Domain Areas & Boundaries
- **Patient (`src/domain/patient/`):** Patient demographics, clinical conditions, known allergies.
- **Medication (`src/domain/medication/`):** Active prescriptions, dosage, route, administration frequency, ATC codes.
- **Clinical Context (`src/domain/clinical-context/`):** Aggregates patient state, active medications, lab observations, and executes the `RequiredDataGate`.
- **Rules Engine (`src/domain/rules/`):** Evaluates deterministic logic against structured clinical facts.
- **Findings (`src/domain/findings/`):** Structured alerts, severity (`critical`, `warning`, `info`), and evidence rationale.
- **Audit (`src/domain/audit/`):** Traceability events for rule execution and clinical decisions.

## 2. Current Model State
- Core TypeScript interfaces and Zod schemas are established under `src/domain/*/schema.ts` and `types.ts`.
- Domain models are isolated from React/UI components and from direct data-source clients.

## 3. Key Safety Invariants
- **Non-Normal Unknowns:** `UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`.
- **Required Data Gate:** If an active clinical evaluation requires missing parameters, it MUST yield a missing-data finding rather than evaluating to benign/normal.
- **Source of Truth:** Deterministic rules are the sole source of clinical findings. AI models cannot invent or alter findings.
- **Clinician Primacy:** Findings advise the healthcare professional; the professional retains final clinical authority.

## 4. Canonical Domain Paths
- Patient schema & types: `src/domain/patient/`
- Medication schema & types: `src/domain/medication/`
- Clinical context & gate: `src/domain/clinical-context/`
- Rules evaluation: `src/domain/rules/`
- Findings: `src/domain/findings/`
