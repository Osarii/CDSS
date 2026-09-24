# Failure Escalation Policy

Progressive escalation procedure for handling unexpected test failures, build errors, or ambiguities during agent execution tasks.

---

## Escalation Levels

### LEVEL 1 — Minimal / Targeted (Default)
- Operate strictly within selected `CONTEXT` mode (e.g. `MINIMAL` or `AUTO`).
- Use targeted symbol reads, range reads, and git diff inspection.
- Run targeted verification tests (`TARGETED` or `DOMAIN`).
- If task succeeds, stop and report without expanding context.

### LEVEL 2 — Broadened Context (When Blocked)
*Trigger: Initial targeted edit or test fails due to cross-module dependency, unmapped type, or missing requirement.*
- Escalation Action:
  1. Expand context profile from `MINIMAL` toward `NORMAL` or `DEEP`.
  2. Inspect directly importing or imported files.
  3. Activate Serena symbol lookup (`find_referencing_symbols`, `find_declaration`) if previously dormant.
- Must document escalation reason compactly in the final report.

### LEVEL 3 — Diagnostic Expansion (When Persistently Blocked)
*Trigger: Multiple failing attempts after Level 2 context expansion.*
- Escalation Action:
  1. Run broader diagnostics or uncompressed terminal commands ONLY if RTK filtered essential compiler error traces.
  2. Broaden test execution to upstream integration suites (`FULL` or `UI`).
  3. Re-examine architectural decisions in `docs/architecture/DECISIONS.md`.
- Never execute repeated identical actions without new diagnostic insights.

---

## Operating Rules
1. **Never Start at Level 3:** Always begin with the minimal sufficient context.
2. **Document Escalation:** Explicitly note when and why an escalation occurred.
3. **No Hardcoded Model Dependencies:** Escalation policy governs context and tool depth within the workspace; model or provider selection is managed by the user/IDE environment.
