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

## Required prompt format

Every execution prompt must contain all six fields:

TASK: <single clear objective>
RULESET: <valid ruleset alias or combined aliases>
SCOPE: <explicit paths/area or AUTO>
ACCEPTANCE: <observable completion criteria>
STOP: <boundary / what must not be continued automatically>
DOC: <AUTO | YES | NO>

Optional:

REFS: <design files, URLs, screenshots, commits, issue IDs, or other references>
GIT: <NONE | COMMIT | PUSH>

## Valid RULESET values

DOMAIN
UI
DATA
FORMS
TABLES
RULES
TEST
ROUTING
LAYOUT
AGENT
REPO
CORE
DOCS

Rulesets may be combined with `+`.

Examples:

RULESET:DOMAIN+DATA
RULESET:UI+TEST

## Field rules

### TASK
Must describe one coherent task.
Avoid combining unrelated phases.

### RULESET
Must contain only aliases supported by `.agents/rules/00-rule-router.md`.

### SCOPE
Use repository paths when known.
Use `AUTO` only when Serena should discover the smallest relevant scope.

### ACCEPTANCE
Must define how the agent knows the task is complete.
May contain multiple bullet points.

### STOP
Must define the execution boundary.
Example: `Stop after tests and report. Do not continue to the next phase.`

### DOC

`AUTO`
Document only if the result qualifies as an important project milestone.

`YES`
Always append an entry to `docs/PROJECT_JOURNAL.md`.

`NO`
Do not append a journal entry.

Documentation rules are defined in:
`docs/agent-rules/workflows/documentation.md`

### GIT

If omitted, treat as `NONE`.

`NONE`
Do not commit or push.

`COMMIT`
Create a focused commit only after verification.

`PUSH`
Commit and push only after verification.

Never rewrite Git history unless explicitly requested.

## Invalid prompt behavior

If any required field is absent or invalid, do not execute the task.

Respond only with a compact validation message:

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

No commands, tools, repository reads, edits, installs, tests or Git actions were executed.

Then stop.

## Meta-help exception

The following prompt is allowed without the full format:

PROMPT_HELP

For `PROMPT_HELP`, display the required template and stop.
Do not execute project work.

## Canonical short template

TASK:
RULESET:
SCOPE:
ACCEPTANCE:
STOP:
DOC: AUTO

## Example

TASK: Align the CDSS design tokens with the approved visual baseline.
RULESET: UI
SCOPE: DESIGN.md, src/index.css, src/styles/
ACCEPTANCE:
- Approved Graphite + Bone + Aubergine tokens are authoritative.
- Duplicate shadcn defaults no longer override them.
- Lint and build pass.
STOP: Stop after verification and report. Do not implement screens.
DOC: YES
GIT: NONE
