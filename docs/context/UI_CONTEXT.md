# UI Context Pack

Compact conceptual orientation for working on the CDSS-CR interface.

## 1. Approved Design Authority
- **Primary Source:** `DESIGN.md` is the authoritative visual reference.
- **Palette Identity:** Graphite (`#1A1D1E`) + Bone (`#F7F7F5`) + Aubergine (`#4A2040`).
- **Semantic Separation:** Clinical severity colors (`critical`, `warning`, `safe`, `missing`) are strictly decoupled from brand/accent colors. Never use healthcare-blue as the primary brand color.

## 2. Component Boundaries
- **Atoms / Primitives (`src/components/ui/`):** Headless Radix components wrapped with shadcn/ui.
- **Clinical Components (`src/components/`):** Domain-aware presentation components that consume domain types via props or adapters.
- **No Embedded Domain Logic:** Complex business rules and scoring algorithms must reside in `src/domain/`, not in UI components or table cells.

## 3. Current Implementation Status
- Base shadcn components (`button`, `card`, `badge`, `dialog`, `tabs`, `tooltip`, `table`, `separator`, `input`, `sheet`) are installed and styled.
- Colocated Storybook stories exist for verifying visual tokens.
- Clinical screens (Dashboard, Medication Review) are NOT yet implemented.

## 4. Frozen Visual References
- Consult `docs/design/VISUAL_INDEX.md` before implementing or modifying screens.

## 5. Canonical UI Paths
- Design tokens & specification: `DESIGN.md`, `src/styles/tokens.css`, `src/styles/globals.css`
- UI primitives: `src/components/ui/`
- Layout configuration: `src/components/layout/`
