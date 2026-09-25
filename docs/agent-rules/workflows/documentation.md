# Workflow — Important Project Documentation

The canonical project history is:

`docs/PROJECT_JOURNAL.md`

Images belong in:

`docs/project-journal/images/`

## Goal

Document decisions and milestones that a future developer or agent would genuinely need to understand why the project looks and behaves the way it does.

`PROJECT_JOURNAL.md` must remain milestone/history-oriented and must NOT become a per-prompt activity log.
For active progress tracking, use `PROJECT_STATE.md` with its `COMPLETE | IN_PROGRESS | PENDING | BLOCKED` system.

## Document when DOC=YES

Always create/update a journal entry.

## Document when DOC=AUTO only if at least one is true

- a project phase or milestone completed;
- an architecture decision was introduced or changed;
- a permanent agent/tooling rule changed;
- a dependency/integration was added or removed for architectural reasons;
- a domain contract/schema was established;
- a deterministic rule behavior was established;
- an approved UI screen/baseline was integrated;
- an important root-cause bug was discovered and fixed;
- a release/tag/checkpoint was created;
- a safety invariant or data-handling policy changed.

## Do NOT document routine noise

Do not create entries for:
- formatting;
- trivial rename;
- ordinary lint fix;
- one-line typo;
- routine package install already covered by a milestone;
- repeated test runs;
- routine pushes;
- minor refactors with no architectural effect.

## Journal entry format

### YYYY-MM-DD — <Milestone title>

**Phase:** <phase>
**Status:** COMPLETE | PARTIAL | DECISION
**Commit:** <sha or pending>
**Agent/model:** <if known; otherwise "not recorded">

**Objective**
One short paragraph.

**Accepted prompt**
Use the exact accepted prompt, preferably inside a collapsible `<details>` block.

**Important decisions**
Only decisions that affect future work.

**Changed/created**
Only important files or architectural areas.

**Verification**
Short PASS/FAIL summary. Do not paste full terminal output.

**Evidence**
Embed screenshots only when they add useful visual proof.

**Result**
One concise paragraph.

## Screenshots

Use screenshots for:
- approved/frozen UI screens;
- meaningful visual before/after;
- architecture diagrams;
- a setup/tooling screen only if visual proof is useful.

Do not screenshot routine terminal output when text is clearer.

Store images as:

`docs/project-journal/images/YYYY-MM-DD-<short-slug>.png`

Prefer:
- PNG/WebP;
- max width around 1600 px when practical;
- compressed size;
- no secrets;
- no real patient/clinical data.

Embed with relative paths:

`![Description](./project-journal/images/YYYY-MM-DD-example.png)`

## Prompt storage

Keep the exact prompt used for important milestones.

Use:

<details>
<summary>Prompt utilizado</summary>

```text
TASK: ...
RULESET: ...
...
```
</details>

This keeps the journal readable without losing reproducibility.

## Token policy

`docs/PROJECT_JOURNAL.md` is historical documentation.
Do NOT load the entire journal during normal coding tasks.
Read only the relevant section when historical context is needed.
