# UI Context Pack

Compact orientation for working on the CDSS-CR interface.

## 1. Design Authority & Visual Identity
- **Primary Source:** `DESIGN.md` defines the approved visual identity: Graphite + Bone + Aubergine.
- **Current Token Status (PENDING ALIGNMENT):** Design tokens in `src/styles/tokens.css` and `src/index.css` are scheduled for final consolidation and cleanup in Phase 0.6 (resolving shadcn default overrides). Exact values are pending alignment, not frozen.
- **Semantic Separation:** Clinical severity colors (`critical`, `warning`, `safe`, `missing`) are strictly decoupled from brand/accent colors. Never use healthcare-blue as primary brand identity.

## 2. Current Implementation vs. Target Architecture
- **Base Primitives (CURRENT):** Headless Radix components wrapped with shadcn/ui under `src/components/ui/` (`button`, `card`, `badge`, `dialog`, `tabs`, `tooltip`, `table`, `separator`, `input`, `sheet`).
- **Storybook Stories (CURRENT):** Colocated stories under `src/components/ui/*.stories.tsx`.
- **Clinical Layout (TARGET):** Split clinical panels under `src/components/layout/` (planned for Phase 1).
- **Clinical Screens (TARGET):** Dashboard and Medication Review screens (planned for Phase 1).

## 3. Boundaries & Invariants
- UI components must never contain business rules or scoring algorithms; domain logic resides in `src/domain/`.
- UI components consume data via props or TanStack Query hooks wrapping `ClinicalDataAdapter`.
- Consult `docs/design/VISUAL_INDEX.md` before adding or modifying visual components.
