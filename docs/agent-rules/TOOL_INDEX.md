# CDSS-CR Tool Documentation Index

Canonical index mapping tool and integration keys to their persistent documentation paths under `docs/agent-rules/`.

## Token Resolution Policy

- **Do not search the repository** for tool or integration guidelines; resolve keys directly using this index.
- After prompt validation passes, agents may read this file (`docs/agent-rules/TOOL_INDEX.md`) to resolve documentation paths for requested or required tools.
- **Mandatory Core (Cannot be disabled):**
  - Prompt Gate: `PROMPT_CONTRACT.md` & `.agents/rules/01-prompt-gate.md`
  - Clinical Safety & Core Architecture: `AGENTS.md`
- **Tool Selection States:**
  - `NO`: Do **NOT** load the tool's integration markdown document.
  - `AUTO`: Load the integration markdown document **only** if the current task execution directly requires that tool.
  - `YES`: Load the integration markdown document before using the tool.

---

## Tool & Integration Key Index

| Key | Documentation Path | Category | Description |
| :--- | :--- | :--- | :--- |
| `SERENA` | `docs/agent-rules/integrations/serena.md` | Agent Tool | Semantic codebase navigation, symbol discovery, and surgical edits. |
| `RTK` | `docs/agent-rules/integrations/rtk.md` | Agent Tool | Rust Token Killer for shell command output compression. |
| `PONYTAIL` | `docs/agent-rules/integrations/ponytail.md` | Agent Tool | YAGNI, minimal engineering, and anti-duplication principles. |
| `CONTEXT_BUDGET` | `docs/agent-rules/core/context-budget.md` | Core Rule | Token efficiency and strict rule-loading budget guidelines. |
| `ROUTER` | `.agents/rules/00-rule-router.md` | Core Rule | Ruleset alias resolution and deduplication mapping. |
| `GIT` | `docs/agent-rules/integrations/git-github.md` | Workflow | Commit conventions, branch etiquette, and verification gates. |
| `CORE` | `docs/agent-rules/integrations/vite-react-typescript.md` | Framework | Vite 8, React 19, and TypeScript build conventions. |
| `TAILWIND` | `docs/agent-rules/integrations/tailwind.md` | UI / Styling | Tailwind CSS v4 and token preservation. |
| `SHADCN` | `docs/agent-rules/integrations/shadcn-ui.md` | UI Components | shadcn/ui components (Radix) and variant usage. |
| `SHADCN_LINT` | `docs/agent-rules/integrations/shadcn-lint.md` | Linter | shadcn registry rules and automated linting. |
| `LUCIDE` | `docs/agent-rules/integrations/lucide.md` | UI Icons | Lucide React clinical and navigation icon standards. |
| `RESIZABLE_PANELS` | `docs/agent-rules/integrations/react-resizable-panels.md` | UI Layout | Split panels for medication review and clinical layout. |
| `TANSTACK_QUERY` | `docs/agent-rules/integrations/tanstack-query.md` | Data State | Server-state caching, queries, and mutations. |
| `TANSTACK_TABLE` | `docs/agent-rules/integrations/tanstack-table.md` | Data Tables | Headless data tables for clinical records. |
| `ZOD` | `docs/agent-rules/integrations/zod.md` | Validation | Runtime schema validation at system and domain boundaries. |
| `RHF` | `docs/agent-rules/integrations/react-hook-form.md` | Forms | React Hook Form integration with Zod resolvers. |
| `JSON_SERVER` | `docs/agent-rules/integrations/json-server.md` | Mock Backend | Synthetic patient and clinical data mocking (`db.json`). |
| `MSW` | `docs/agent-rules/integrations/msw.md` | Testing / Mock | Mock Service Worker for component and Storybook mocks. |
| `RULES_ENGINE` | `docs/agent-rules/integrations/json-rules-engine.md` | Clinical Logic | Deterministic rule engine for interaction alerts. |
| `VITEST` | `docs/agent-rules/integrations/vitest.md` | Testing | Fast unit and integration testing engine. |
| `RTL` | `docs/agent-rules/integrations/react-testing-library.md` | Testing | User-centric DOM testing with `@testing-library/react`. |
| `PLAYWRIGHT` | `docs/agent-rules/integrations/playwright.md` | Testing | E2E browser smoke tests in Chromium. |
| `STORYBOOK` | `docs/agent-rules/integrations/storybook.md` | UI Dev | Isolated component development and visual validation. |
| `REACT_ROUTER` | `docs/agent-rules/integrations/react-router.md` | Navigation | Client-side routing configuration. |
