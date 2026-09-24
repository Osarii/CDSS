# CDSS-CR Agent Rule Router

> **CRITICAL TOKEN POLICY:**
> **DO NOT load every file under `docs/agent-rules/` by default.**
> Loading the entire rules directory exhausts context needlessly. Load only the specific integration and workflow documents required by the active task's ruleset.

---

## 1. Non-Disableable Core Rules
The following files are permanently active and apply unconditionally across all tasks (cannot be disabled by any prompt override):
1. `PROMPT_CONTRACT.md` (Mandatory execution contract & prompt format validation)
2. `.agents/rules/01-prompt-gate.md` (Immediate cancellation gate before any tool or repo exploration)
3. `AGENTS.md` (Clinical safety invariants, core architecture principles, clinician decision authority)

### Configurable Tool & Optimization Governance
Tool-specific rule files are NOT loaded unconditionally if disabled by prompt `TOOLS` overrides:
- **RTK Rules (`.agents/rules/antigravity-rtk-rules.md`):** Loaded when `RTK: YES` or `AUTO`. Skipped when `RTK: NO`.
- **Ponytail Rules (`.agents/rules/ponytail.md`):** Loaded when `PONYTAIL: YES` or `AUTO`. Skipped when `PONYTAIL: NO`.
- **Context Budget (`docs/agent-rules/core/context-budget.md`):** Active when `CONTEXT_BUDGET: STRICT` (default) or `NORMAL`. Inactive when `OFF`.

### Canonical System Indices & Policies
- **Tool Index (`docs/agent-rules/TOOL_INDEX.md`):** Resolves all tool and integration documentation paths. Never search the repository manually for tool guidelines.
- **Context Index (`docs/context/CONTEXT_INDEX.md`):** Resolves domain and technical context packs per ruleset.
- **Verification Profiles (`docs/agent-rules/VERIFY_PROFILES.md`):** Resolves execution verification tiers (`DOCS`, `TARGETED`, `DOMAIN`, `UI`, `FULL`, `AUTO`).
- **Escalation Policy (`docs/agent-rules/core/escalation-policy.md`):** Governs context expansion levels when encountering failures.
- **Diff-First Workflow (`docs/agent-rules/workflows/diff-first.md`):** Mandatory inspection order for review, checkpoint, and regression tasks.

---

## 2. Ruleset Aliases & Target File Mapping

When a prompt specifies a ruleset alias (e.g. `RULESET:DOMAIN`), load **only** the associated workflow and integration files listed below:

| Ruleset Alias | Workflow Document | Integration Documents |
| :--- | :--- | :--- |
| `RULESET:DOMAIN` | `docs/agent-rules/workflows/domain.md` | `docs/agent-rules/integrations/zod.md` |
| `RULESET:UI` | `docs/agent-rules/workflows/ui.md` | `docs/agent-rules/integrations/tailwind.md`<br>`docs/agent-rules/integrations/shadcn-ui.md`<br>`docs/agent-rules/integrations/shadcn-lint.md`<br>`docs/agent-rules/integrations/lucide.md`<br>`docs/agent-rules/integrations/storybook.md` |
| `RULESET:DATA` | `docs/agent-rules/workflows/data.md` | `docs/agent-rules/integrations/tanstack-query.md`<br>`docs/agent-rules/integrations/json-server.md`<br>`docs/agent-rules/integrations/zod.md` |
| `RULESET:FORMS` | `docs/agent-rules/workflows/ui.md` | `docs/agent-rules/integrations/react-hook-form.md`<br>`docs/agent-rules/integrations/zod.md`<br>`docs/agent-rules/integrations/shadcn-ui.md` |
| `RULESET:TABLES` | `docs/agent-rules/workflows/ui.md` | `docs/agent-rules/integrations/tanstack-table.md`<br>`docs/agent-rules/integrations/shadcn-ui.md` |
| `RULESET:RULES` | `docs/agent-rules/workflows/rules-engine.md` | `docs/agent-rules/integrations/json-rules-engine.md`<br>`docs/agent-rules/integrations/zod.md` |
| `RULESET:TEST` | `docs/agent-rules/workflows/testing.md` | `docs/agent-rules/integrations/vitest.md`<br>`docs/agent-rules/integrations/react-testing-library.md`<br>`docs/agent-rules/integrations/playwright.md`<br>`docs/agent-rules/integrations/msw.md` |
| `RULESET:ROUTING` | `docs/agent-rules/workflows/ui.md` | `docs/agent-rules/integrations/react-router.md` |
| `RULESET:LAYOUT` | `docs/agent-rules/workflows/ui.md` | `docs/agent-rules/integrations/react-resizable-panels.md`<br>`docs/agent-rules/integrations/tailwind.md`<br>`docs/agent-rules/integrations/shadcn-ui.md` |
| `RULESET:AGENT` | *(None)* | `docs/agent-rules/integrations/serena.md`<br>`docs/agent-rules/integrations/rtk.md`<br>`docs/agent-rules/integrations/ponytail.md` |
| `RULESET:REPO` | `docs/agent-rules/workflows/diff-first.md` | `docs/agent-rules/integrations/git-github.md`<br>`docs/agent-rules/integrations/serena.md` |
| `RULESET:CORE` | *(None)* | `docs/agent-rules/integrations/vite-react-typescript.md` |
| `RULESET:DOCS` | `docs/agent-rules/workflows/documentation.md` | `docs/agent-rules/integrations/git-github.md` |

---

## 3. Combined Rulesets & Deduplication

Prompts may combine ruleset aliases using the `+` operator, for example:
- `RULESET:DOMAIN+DATA`
- `RULESET:UI+FORMS`
- `RULESET:RULES+TEST`
- `RULESET:AGENT+DOCS+REPO`

### Deduplication Rule
When combining rulesets, union the target files and **deduplicate** common references. Each file must be loaded at most once per task.
