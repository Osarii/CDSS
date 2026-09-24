# shadcn/ui — CDSS-CR Rules

shadcn/ui provides editable primitives, not the CDSS visual identity.

## Rules
- Reuse existing components from `src/components/ui/`.
- Add a new shadcn component only when required by an active feature.
- Do not install the entire shadcn catalog.
- Do not treat shadcn default colors/typography as authoritative.
- `DESIGN.md` and CDSS tokens override visual defaults.
- Clinical components belong in `src/components/clinical/`, not `src/components/ui/`.

## Component boundary
`src/components/ui/` = generic visual primitives.
`src/components/clinical/` = CDSS-specific semantics such as findings, missing data, evidence and traceability.

## Styling
Prefer token classes and existing variants.
Do not introduce generic healthcare-blue styling.
