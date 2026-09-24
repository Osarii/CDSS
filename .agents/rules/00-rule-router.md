# CDSS-CR Agent Rule Router

> **CRITICAL TOKEN POLICY:**  
> **DO NOT load every file under `docs/agent-rules/` by default.**  
> Loading the entire rules directory exhausts context needlessly. Load only the specific integration and workflow documents required by the active task's ruleset.

---

## 1. Always Applied Core Rules
The following files are permanently active and apply unconditionally across all tasks:
1. `PROMPT_CONTRACT.md` (Mandatory execution contract & prompt format validation)
2. `.agents/rules/01-prompt-gate.md` (Immediate cancellation gate before any tool or repo exploration)
3. `AGENTS.md` (Clinical invariants, architecture, visual identity, workflow)
4. `.agents/rules/antigravity-rtk-rules.md` (RTK command optimizations)
5. `.agents/rules/ponytail.md` (Minimal engineering, YAGNI, reuse checklist)
6. `docs/agent-rules/core/context-budget.md` (Token and context conservation policy)

### Core Operating Principles
- **Prompt Gate First**: Validate prompt against `PROMPT_CONTRACT.md` before using Serena, RTK, file exploration, or execution tools.
- **Serena First**: Prefer Serena semantic and symbol tools (`find_symbol`, `get_symbols_overview`, etc.) for repository exploration and targeted symbol edits before reading full files.
- **RTK Preferred**: Always prefix verbose shell commands (`git`, `npm test`, `npm run build`, `npm run lint`) with `rtk` to filter redundant tokens.
- **Ponytail / YAGNI**: Never create speculative abstractions, dead code, or add unneeded dependencies. Reuse existing code first.

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
| `RULESET:REPO` | *(None)* | `docs/agent-rules/integrations/git-github.md`<br>`docs/agent-rules/integrations/serena.md` |
| `RULESET:CORE` | *(None)* | `docs/agent-rules/integrations/vite-react-typescript.md` |
| `RULESET:DOCS` | `docs/agent-rules/workflows/documentation.md` | `docs/agent-rules/integrations/git-github.md` |

---

## 3. Combined Rulesets & Deduplication

Prompts may combine ruleset aliases using the `+` operator, for example:
- `RULESET:DOMAIN+DATA`
- `RULESET:UI+FORMS`
- `RULESET:RULES+TEST`

### Deduplication Rule
When combining rulesets, union the target files and **deduplicate** common references. Each file must be loaded at most once.

*Example (`RULESET:DOMAIN+DATA`)*:
- Workflow files: `docs/agent-rules/workflows/domain.md`, `docs/agent-rules/workflows/data.md`
- Integration files: `docs/agent-rules/integrations/zod.md` (deduplicated), `docs/agent-rules/integrations/tanstack-query.md`, `docs/agent-rules/integrations/json-server.md`
