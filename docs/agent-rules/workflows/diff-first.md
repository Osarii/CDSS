# Workflow — Diff-First Inspection

Token-optimized workflow for reviewing follow-up tasks, milestone checkpoints, bug fixes, and regression inquiries.

## Core Principle
When a known prior commit, tag, or baseline exists, **inspect the Git diff first** before opening full source files or performing wide directory scans.

---

## 5-Step Diff-First Execution

1. **Inspect Git Diff First:**
   Run a targeted diff using RTK:
   ```bash
   rtk git diff <checkpoint-commit>..HEAD
   # or for working directory changes:
   rtk git diff
   ```
2. **Identify Changed Symbols & Boundaries:**
   Extract precisely which functions, interfaces, schemas, or CSS tokens were touched.
3. **Targeted Serena Inspection (if enabled):**
   Use symbol search (`find_symbol`, `get_symbols_overview`) strictly on the modified symbols and their immediate call sites.
4. **Targeted File Slice Reads (if needed):**
   Read only the affected line ranges rather than entire modules.
5. **Context Expansion Escalation:**
   Expand context to surrounding files only if the diff and symbol overview leave unresolved architectural ambiguities.

---

## When to Apply Diff-First
- Reviewing tasks completed by agents or pair-programming steps.
- Post-fix validation and PR review checks.
- Regression diagnostics ("what broke since commit X?").
- Generic "revisa repo" tasks where a baseline commit or tag is available.
- Verification prior to milestone commits.

---

## Repository-Review Locators (Targeted Fixes)

Token-optimized workflow for executing targeted fixes derived from external or peer code review:

```text
repository changes
    -> commit/push
    -> external repository review
    -> diagnosis with FILE + LINES + SYMBOL + CAUSE
    -> targeted Antigravity prompt with LOCATOR
    -> localized fix
    -> targeted verification
```

### Locator Behavior Rules

1. **Concrete LOCATOR provided (`path:lines`, `symbol=Name`, or `path:lines | symbol=Name`):**
   - Inspect the specified file slice, line range, or symbol **FIRST**.
   - Do NOT begin with a full-file read.
   - Do NOT scan unrelated repository areas.
   - Prefer symbol navigation (Serena) when available.
   - Treat line numbers as commit-specific hints; treat `path + symbol` as the durable locator if lines have shifted.
2. **`LOCATOR: AUTO`:**
   - Locate the relevant symbol or range using targeted search or Serena.
   - Once identified, continue strictly from that localized region.
   - Avoid repeated whole-file reads.
3. **Insufficient Locator:**
   - Expand context incrementally around the target slice.
   - Inspect dependencies/references only when strictly necessary.
   - Do NOT jump immediately to full-repository exploration.
4. **`SOURCE_COMMIT` provided:**
   - Treat file/line references as corresponding to that commit.
   - Never claim line numbers are current if the working tree has changed substantially; verify against the durable symbol.
