# CDSS-CR Context Index

Canonical index mapping ruleset categories to compact context packs.

## Resolution Rules
1. **Direct Resolution:** Do not search the repository manually for context documentation; resolve packs directly through this index.
2. **Ruleset Gating:** Load ONLY the context pack(s) relevant to the active `RULESET` alias.
3. **Deduplication:** When multiple rulesets map to the same context pack (e.g. combined `RULESET:DOMAIN+DATA`), load each pack at most once.
4. **Single Read Per Task:** A context pack must be read at most once during a task session unless modified during execution.

---

## Canonical Mapping

| Category / Ruleset | Context Pack Path | Scope & Focus |
| :--- | :--- | :--- |
| `DOMAIN` | `docs/context/DOMAIN_CONTEXT.md` | Patient, medication, clinical context boundaries, and safety invariants. |
| `UI` | `docs/context/UI_CONTEXT.md` | Design authority, token boundaries, and visual references. |
| `DATA` | `docs/context/DATA_CONTEXT.md` | ClinicalDataAdapter, JSON Server, Zod boundaries, and TanStack Query. |
| `RULES` | `docs/context/RULES_CONTEXT.md` | Deterministic engine, Required Data Gate, and finding hierarchy. |
| `TEST` | `docs/context/TEST_CONTEXT.md` | Vitest, RTL, Storybook, Playwright, and cheapest-layer principle. |

---

## Combined Ruleset Mapping Reference

- `RULESET:DOMAIN`: `DOMAIN_CONTEXT.md`
- `RULESET:UI`: `UI_CONTEXT.md`
- `RULESET:DATA`: `DATA_CONTEXT.md`
- `RULESET:FORMS`: `UI_CONTEXT.md` + `DATA_CONTEXT.md`
- `RULESET:TABLES`: `UI_CONTEXT.md` + `DATA_CONTEXT.md`
- `RULESET:RULES`: `RULES_CONTEXT.md` + `DOMAIN_CONTEXT.md`
- `RULESET:TEST`: `TEST_CONTEXT.md`
- `RULESET:ROUTING`: `UI_CONTEXT.md`
- `RULESET:LAYOUT`: `UI_CONTEXT.md`
- `RULESET:AGENT`: *(No context pack needed)*
- `RULESET:REPO`: *(No context pack needed)*
- `RULESET:CORE`: *(No context pack needed)*
- `RULESET:DOCS`: *(No context pack needed)*
