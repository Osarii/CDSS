# CDSS-CR Prompt Contract

This contract is mandatory for every execution prompt sent to a coding agent working on CDSS-CR.

## First action — mandatory

The only repository read permitted before validation is `PROMPT_CONTRACT.md`.

No Serena call, shell command, file read other than `PROMPT_CONTRACT.md`, browser action, edit, install, test, or Git action may occur before validation passes.

1. Read this file.
2. Validate the current user prompt against the required format below.
3. If valid, continue.
4. If invalid, cancel the task immediately using the rejection format below.

Do not infer missing fields, silently repair invalid prompts, or begin exploration before validation.

---

## Required prompt format

Every execution prompt must contain all six mandatory fields:

TASK: <single clear objective>
RULESET: <valid ruleset alias or combined aliases>
SCOPE: <explicit paths/area or AUTO>
ACCEPTANCE: <observable completion criteria>
STOP: <boundary / what must not be continued automatically>
DOC: <AUTO | YES | NO>

Optional fields (with defaults when omitted):
- `GIT: <NONE | COMMIT | PUSH>` (Default: `NONE`)
- `TOOLS: <AUTO | MINIMAL | DEEP | tool overrides>` (Default: `AUTO`)
- `CONTEXT: <AUTO | MINIMAL | DEEP>` (Default: `AUTO`)
- `BUDGET: <AUTO | explicit limits>` (Default: `AUTO`)
- `VERIFY: <AUTO | DOCS | TARGETED | UI | DOMAIN | FULL>` (Default: `AUTO`)
- `REFS: <references>`
- `PRESERVE: <list of DEC-XXX decision IDs>`

---

## Valid RULESET values

DOMAIN | UI | DATA | FORMS | TABLES | RULES | TEST | ROUTING | LAYOUT | AGENT | REPO | CORE | DOCS

Combine with `+` (e.g. `RULESET:DOMAIN+DATA`). The agent router ([.agents/rules/00-rule-router.md](./.agents/rules/00-rule-router.md)) deduplicates shared files.

---

## Field & Tool Rules

- **TASK / SCOPE / ACCEPTANCE / STOP:** Define a single objective, paths/area, completion criteria, and a strict boundary.
- **DOC:** `AUTO` (milestones only), `YES` (append entry), `NO` (no entry). Governed by [docs/agent-rules/workflows/documentation.md](./docs/agent-rules/workflows/documentation.md).
- **GIT:** `NONE` (no commit/push), `COMMIT` (local commit after verify), `PUSH` (commit and push after verify).
- **TOOLS:**
  - Presets: `AUTO` (Serena: AUTO, RTK: AUTO, Ponytail: AUTO, Context Budget: STRICT), `MINIMAL` (Serena: NO, RTK: AUTO, Ponytail: YES, Context Budget: STRICT), `DEEP` (Serena: YES, RTK: YES, Ponytail: AUTO, Context Budget: NORMAL).
  - Granular overrides: `SERENA: AUTO|YES|NO`, `RTK: AUTO|YES|NO`, `PONYTAIL: AUTO|YES|NO`, `CONTEXT_BUDGET: STRICT|NORMAL|OFF`.
  - Tool documentation resolves exclusively via [docs/agent-rules/TOOL_INDEX.md](./docs/agent-rules/TOOL_INDEX.md). Invalid tool values reject the prompt.
- **CONTEXT:** `AUTO` (smallest sufficient), `MINIMAL` (`PROJECT_STATE.md` + active ruleset pack via [docs/context/CONTEXT_INDEX.md](./docs/context/CONTEXT_INDEX.md)), `DEEP` (broader inspection for complex refactors).
- **BUDGET:** `AUTO` or limits: `FILES: <n>`, `FULL_READS: <n>`, `COMMANDS: <n>`. If exceeded, pause, explain reason, and record escalation.
- **VERIFY:** Tiered profiles (`DOCS`, `TARGETED`, `DOMAIN`, `UI`, `FULL`, `AUTO`) defined in [docs/agent-rules/VERIFY_PROFILES.md](./docs/agent-rules/VERIFY_PROFILES.md).
- **PRESERVE:** Optional reminder of decision IDs from [docs/architecture/DECISIONS.md](./docs/architecture/DECISIONS.md).

---

## Context Architecture & Optimization Rules

- **Stable vs. Changing Context:** Stable rules ([AGENTS.md](./AGENTS.md), [DESIGN.md](./DESIGN.md), decisions) are durable. Changing state lives in [PROJECT_STATE.md](./PROJECT_STATE.md). Agents must read `PROJECT_STATE.md` rather than rereading historical documentation.
- **Context Receipt:** Maintain internal conceptual tracking during tasks; never reload unchanged files or duplicate context packs. Do NOT create or persist receipt files.
- **File Size Limits:** `AGENTS.md` <= 150 lines, `PROJECT_STATE.md` <= 150 lines, `TOOL_INDEX.md` <= 150 lines, `CONTEXT_INDEX.md` <= 100 lines, context packs <= 120 lines, `VISUAL_INDEX.md` <= 150 lines.
- **Non-Disableable Core:** Prompt Gate, clinical safety invariants ([AGENTS.md](./AGENTS.md)), and `PROMPT_CONTRACT.md` can NEVER be disabled.

---

## PROJECT_STATE Tracking Policy

Agents must automatically update `PROJECT_STATE.md` after any execution task that materially changes:
- active milestone progress, current work, blockers, verification state, next allowed task, or important architectural state.

Do NOT update `PROJECT_STATE.md` for:
- conversational prompts, read-only analysis, verification-only runs with no state change, trivial formatting, typo-only changes, or routine commands with no material project impact.

- `GIT: NONE` must never fabricate a commit SHA.
- `Last Important Commit` must only change when the referenced commit actually exists in the repository.

---

## Invalid prompt behavior

If any required field is missing or invalid, or an invalid tool value is specified:

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

`PROMPT_HELP` displays the canonical template and stops without executing project work.

## Canonical Templates

### Minimal Template
TASK:
RULESET:
SCOPE:
ACCEPTANCE:
STOP:
DOC: AUTO

### Full Optimization Template
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
