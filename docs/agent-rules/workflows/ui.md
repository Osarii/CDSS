# Workflow — UI Changes

## Sequence
1. Read `DESIGN.md`.
2. Use Serena to find existing primitives/components.
3. Reuse shadcn primitives before creating new generic UI.
4. Put clinical semantics in `src/components/clinical/` or the owning feature.
5. Use project design tokens.
6. Add/update Storybook state when the component is reusable.
7. Run lint and relevant component tests.
8. For frozen screens, run Playwright visual checks when available.

## Safety
UI never invents clinical status. It renders domain/findings data.
Missing data must not be rendered as normal/safe.
