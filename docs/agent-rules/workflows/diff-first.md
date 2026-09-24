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
