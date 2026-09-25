# CDSS-CR Prompt Gate

## Highest-priority execution rule

Before ANY repository exploration or execution action, read:

`PROMPT_CONTRACT.md`

The only repository read permitted before validation is `PROMPT_CONTRACT.md`.

No Serena call, shell command, file read other than `PROMPT_CONTRACT.md`, browser action, edit, install, test, or Git action may occur before validation passes.

If the prompt fails the contract:
- execute nothing;
- make no further repository/tool calls;
- return the rejection format defined in `PROMPT_CONTRACT.md`;
- stop.

Do not infer or repair missing prompt fields.

`PROMPT_HELP` is the only format-exempt meta command.

---

## Canonical Post-Validation Execution Flow

After the prompt passes validation:
1. **Resolve Parameters:** Resolve optional/default `TOOLS`, `CONTEXT`, `BUDGET`, `VERIFY`, `GIT`, `LOCATOR`, `SOURCE_COMMIT`, and `ISSUE`. Validate `LOCATOR` syntax if provided (reject immediately if malformed).
2. **Core Governance:** Apply `AGENTS.md` clinical safety and architectural invariants.
3. **Changing State:** Read `PROJECT_STATE.md` (never reread historical journal merely for state).
4. **Ruleset Routing:** Load active `RULESET` via `.agents/rules/00-rule-router.md`.
5. **Context Packs:** Resolve targeted context packs via `docs/context/CONTEXT_INDEX.md`.
6. **Tool Documentation:** Resolve tool docs via `docs/agent-rules/TOOL_INDEX.md` respecting `YES`/`AUTO`/`NO`.
7. **Targeted Inspection & Diff-First:** If `LOCATOR` is provided, inspect the targeted file slice or symbol FIRST (do not begin with full-file reads; lines are hints relative to `SOURCE_COMMIT`). For reviews and follow-ups, apply `docs/agent-rules/workflows/diff-first.md`.
8. **Exploration & Tooling:** If `LOCATOR: AUTO`, locate the target symbol/range first. Use Serena first for symbol navigation (unless `SERENA: NO`); use RTK for terminal compression. Expand context incrementally only if required. Maintain internal Context Receipt.
9. **Implementation:** Apply Ponytail/YAGNI. Do not introduce unneeded abstractions or dependencies.
10. **Targeted Verification:** Execute corresponding profile from `docs/agent-rules/VERIFY_PROFILES.md`. Apply `docs/agent-rules/core/escalation-policy.md` if blocked.
11. **Documentation & State:** Evaluate `DOC` policy (`docs/agent-rules/workflows/documentation.md`). Update `PROJECT_STATE.md` only on material state changes. Update `docs/PROJECT_JOURNAL.md` only for important milestones.
12. **Git Action:** Execute commit or push only when explicitly permitted by `GIT` field.
