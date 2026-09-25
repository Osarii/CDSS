# CDSS-CR Contractual Prompt Shortcuts

All execution prompts must comply with `PROMPT_CONTRACT.md`. Raw single-line prompts are invalid and will be rejected by the Prompt Gate.

Use `PROMPT_HELP` to display the blank template.

---

## Canonical Templates

### Minimal Template
```text
TASK: <single clear objective>
RULESET: <alias from 00-rule-router.md>
SCOPE: <paths or AUTO>
ACCEPTANCE: <observable criteria>
STOP: <execution boundary>
DOC: <AUTO | YES | NO>
```

### Full Optimization Template
```text
TASK: <single clear objective>
RULESET: <alias from 00-rule-router.md>
SCOPE: <paths or AUTO>
ACCEPTANCE: <observable criteria>
STOP: <execution boundary>
DOC: <AUTO | YES | NO>
TOOLS: <AUTO | MINIMAL | DEEP | list of tool overrides>
CONTEXT: <AUTO | MINIMAL | DEEP>
BUDGET: <AUTO | list of limits>
VERIFY: <AUTO | DOCS | TARGETED | UI | DOMAIN | FULL>
PRESERVE: <optional DEC-XXX IDs>
GIT: <NONE | COMMIT | PUSH>
```

### Targeted Fix Template
```text
TASK: <single clear objective>
RULESET: <alias from 00-rule-router.md>
SCOPE: <paths>
SOURCE_COMMIT: <commit SHA or ref>
LOCATOR: <AUTO | path[:start-end] [| symbol=Name]>
ISSUE: <concise problem, cause, and fix boundary diagnosis>
ACCEPTANCE: <observable criteria>
STOP: <execution boundary>
DOC: NO
VERIFY: TARGETED
GIT: NONE
```

---

## Canonical Examples

### Example A — Minimal Task (Documentation / Trivial Fix)
```text
TASK: Fix repository-relative documentation links.
RULESET: DOCS
SCOPE: README.md
ACCEPTANCE: All affected repository links are relative and valid.
STOP: Stop after diff verification.
DOC: NO
```

### Example B — Normal AUTO Task (Inspection / UI Assessment)
```text
TASK: Inspect the current design-system implementation and report conflicts.
RULESET: REPO+UI
SCOPE: DESIGN.md, src/index.css, src/styles/
ACCEPTANCE: Report conflicts and affected files without edits.
STOP: Stop after report.
DOC: NO
TOOLS: AUTO
CONTEXT: MINIMAL
VERIFY: DOCS
```

### Example C — Deep Complex Task (Domain Architecture Refactor)
```text
TASK: Refactor ClinicalContext while preserving public behavior.
RULESET: DOMAIN+DATA+TEST
SCOPE: src/domain/clinical-context/, src/services/adapters/
ACCEPTANCE:
- Existing behavior preserved.
- Domain tests pass.
- Build passes.
STOP: Stop after verification. Do not continue to UI.
DOC: AUTO
TOOLS: DEEP
CONTEXT: DEEP
VERIFY: DOMAIN
PRESERVE: DEC-001, DEC-006
```

### Example D — Targeted Fix (Review Locators)
```text
TASK: Fix alert count consistency.
RULESET: UI+TEST
SCOPE:
src/features/dashboard/Dashboard.tsx
src/features/dashboard/Dashboard.test.tsx

SOURCE_COMMIT: abc1234

LOCATOR:
src/features/dashboard/Dashboard.tsx:684-713
symbol=AlertInspectorTrigger

ISSUE:
Badge count and rendered alerts use different data sources.

ACCEPTANCE:
- Use one canonical alert collection.
- Preserve unrelated UI behavior.
- Add regression coverage.

STOP:
Stop after the localized fix and verification.

DOC: NO
VERIFY: TARGETED
GIT: NONE
```
