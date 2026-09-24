# CDSS-CR Prompt Contract

This contract is mandatory for every execution prompt sent to a coding agent working on CDSS-CR.

## First action — mandatory

The only repository read permitted before validation is `PROMPT_CONTRACT.md`.

No Serena call, shell command, file read other than `PROMPT_CONTRACT.md`, browser action, edit, install, test, or Git action may occur before validation passes.

1. Read this file.
2. Validate the current user prompt against the required format below.
3. If valid, continue.
4. If invalid, cancel the task immediately.

Do not infer missing fields.
Do not silently repair an invalid prompt.
Do not begin repository exploration before validation.

---

## Required prompt format

Every execution prompt must contain all six mandatory fields:

TASK: <single clear objective>
RULESET: <valid ruleset alias or combined aliases>
SCOPE: <explicit paths/area or AUTO>
ACCEPTANCE: <observable completion criteria>
STOP: <boundary / what must not be continued automatically>
DOC: <AUTO | YES | NO>

Optional fields:

REFS: <design files, URLs, screenshots, commits, issue IDs, or other references>
GIT: <NONE | COMMIT | PUSH>
TOOLS: <AUTO | MINIMAL | DEEP | list of tool overrides>
CONTEXT: <AUTO | MINIMAL | DEEP>
BUDGET: <AUTO | list of planning limits>
VERIFY: <AUTO | DOCS | TARGETED | UI | DOMAIN | FULL>
PRESERVE: <list of DEC-XXX decision IDs>

Defaults when optional fields are omitted:
- `GIT: NONE`
- `TOOLS: AUTO`
- `CONTEXT: AUTO`
- `BUDGET: AUTO`
- `VERIFY: AUTO`

---

## Valid RULESET values

DOMAIN | UI | DATA | FORMS | TABLES | RULES | TEST | ROUTING | LAYOUT | AGENT | REPO | CORE | DOCS

Rulesets may be combined with `+` (e.g. `RULESET:DOMAIN+DATA`). The agent router deduplicates shared files.

---

## Field rules

### TASK
Must describe one coherent task. Avoid combining unrelated phases.

### RULESET
Must contain only aliases supported by `.agents/rules/00-rule-router.md`.

### SCOPE
Use repository paths when known. Use `AUTO` only when Serena should discover the smallest relevant scope.

### ACCEPTANCE
Must define how the agent knows the task is complete.

### STOP
Must define the execution boundary (e.g., `Stop after tests and report. Do not continue to UI.`).

### DOC
- `AUTO`: Document only if the result qualifies as an important project milestone.
- `YES`: Always append an entry to `docs/PROJECT_JOURNAL.md`.
- `NO`: Do not append a journal entry.
Detailed criteria in `docs/agent-rules/workflows/documentation.md`.

### GIT
If omitted, treat as `NONE`. `COMMIT` creates a focused commit after verification. `PUSH` commits and pushes after verification.

### TOOLS
Optional tool configuration. Presets:
- `AUTO`: `SERENA=AUTO`, `RTK=AUTO`, `PONYTAIL=AUTO`, `CONTEXT_BUDGET=STRICT` (Default)
- `MINIMAL`: `SERENA=NO`, `RTK=AUTO`, `PONYTAIL=YES`, `CONTEXT_BUDGET=STRICT`
- `DEEP`: `SERENA=YES`, `RTK=YES`, `PONYTAIL=AUTO`, `CONTEXT_BUDGET=NORMAL`

Granular overrides:
- `SERENA: AUTO | YES | NO` (`YES` resolves doc and uses symbol tools first; `NO` disables Serena entirely).
- `RTK: AUTO | YES | NO` (`YES` filters shell output; `NO` skips RTK).
- `PONYTAIL: AUTO | YES | NO` (`YES` loads ponytail guide; `NO` avoids loading optional guide).
- `CONTEXT_BUDGET: STRICT | NORMAL | OFF` (`STRICT` = minimal reads; `OFF` = exceptional debug only).

Tool documentation resolves exclusively via `docs/agent-rules/TOOL_INDEX.md`. Invalid tool values reject the prompt.

### CONTEXT
- `AUTO`: Smallest sufficient context mode (Default).
- `MINIMAL`: `PROJECT_STATE.md` + active ruleset context pack(s) from `docs/context/CONTEXT_INDEX.md` + targeted exploration. No historical journal.
- `DEEP`: Permits broader architecture and context inspection when required for complex refactors.

### BUDGET
Planning budget. `AUTO` (Default) or explicit limits:
- `FILES: <integer>` (max distinct files to inspect)
- `FULL_READS: <integer>` (max complete-file reads; prefer symbol/slice reads)
- `COMMANDS: <integer>` (max terminal commands)
If a budget limit is reached, pause, explain reason, and record escalation in report.

### VERIFY
Verification profile: `AUTO` (Default), `DOCS`, `TARGETED`, `DOMAIN`, `UI`, `FULL`. Specifications in `docs/agent-rules/VERIFY_PROFILES.md`.

### PRESERVE
Optional reminder list of decision IDs from `docs/architecture/DECISIONS.md` (e.g., `PRESERVE: DEC-001, DEC-007`). Mandatory decisions apply even if omitted.

---

## Context Architecture & Optimization Rules

### Stable vs. Changing Context
- **Stable Context:** `AGENTS.md`, `PROMPT_CONTRACT.md`, `.agents/rules/`, `DESIGN.md`, `docs/architecture/DECISIONS.md`. Durable principles and invariants.
- **Changing Context:** `PROJECT_STATE.md`, active blockers, current phase, implementation status.
Agents must read `PROJECT_STATE.md` for current state rather than rereading historical documentation.

### Context Receipt Rule
Maintain an internal conceptual Context Receipt during execution. Track files read, symbols inspected, and context packs loaded. Never reread unchanged files or reload identical documentation packs within the same task. Do NOT persist or create receipt files.

### File Size Limits
- `AGENTS.md` <= 150 lines
- `PROJECT_STATE.md` <= 150 lines
- `docs/agent-rules/TOOL_INDEX.md` <= 150 lines
- `docs/context/CONTEXT_INDEX.md` <= 100 lines
- Each context pack <= 120 lines
- `docs/design/VISUAL_INDEX.md` <= 150 lines

**Non-Overridable Core:** Prompt Gate, clinical safety invariants (`AGENTS.md`), and `PROMPT_CONTRACT.md` can NEVER be disabled.

---

## Invalid prompt behavior

If any required field is absent or invalid, or an invalid tool value is specified:

PROMPT REJECTED — FORMAT INVALID

Missing/invalid:
- <field>

Expected:
TASK: ...
RULESET: ...
SCOPE: ...
ACCEPTANCE: ...
STOP: ...
DOC: AUTO|YES|NO

No commands, tools, repository reads (other than PROMPT_CONTRACT.md), edits, installs, tests or Git actions were executed.

Then stop.

---

## Meta-help exception

`PROMPT_HELP` displays the canonical template and stops without executing work.

## Canonical short template

TASK:
RULESET:
SCOPE:
ACCEPTANCE:
STOP:
DOC: AUTO

## Canonical full template

TASK:
RULESET:
SCOPE:
ACCEPTANCE:
STOP:
DOC: AUTO
TOOLS: AUTO
CONTEXT: AUTO
BUDGET: AUTO
VERIFY: AUTO
GIT: NONE
