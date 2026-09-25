# CDSS-CR — Current Project State

> **Canonical current-state and active-progress document.**
> Provides the smallest current-state summary needed for a coding agent to understand where CDSS-CR currently is.
> **Rule:** Must be updated after any execution task that materially changes active milestone progress, current work, blockers, verification state, next allowed task, or important architectural state.
> **Rule:** Do NOT update for conversational prompts, read-only analysis, verification-only runs, trivial formatting, typos, or routine commands. Replace obsolete state rather than accumulating history.

---

## 1. Execution Coordinates
- **Product Brand:** SAMED — *Sistema de Apoyo Médico para Evaluación y Decisión*
- **Tagline:** *"SAMED apoya la decisión. El profesional toma la decisión."*
- **Architecture Role:** Product brand = **SAMED** | Technical project / repository = **CDSS**
- **Current Work:** Scenario-driven alerts complete: static demo alert fallbacks (`DEFAULT_DEMO_ALERTS`) removed; visible alerts sourced strictly from deterministic evaluation of the active scenario; clean 0-alert empty state with disabled pulse/inspector on SYN-001/0-finding scenarios; dynamic cards, count, severity, and inspector on scenarios with findings; regression tests verified; 219/219 tests passing; lint & build clean.
- **Next Allowed Task:** Next review or next workflow per user direction (Patients / Medication Review halted)
- **Current Branch:** `main`
- **Last Important Commit:** `158884b` (tracking policy; dashboard not yet committed)
- **Last Update Date:** 2026-09-25

## 2. Current Progress
- COMPLETE: SAMED Product Branding Alignment
- COMPLETE: PROJECT_STATE progress tracking policy implementation
- COMPLETE: Dashboard Visual Baseline v1 (AppShell + Dashboard + TanStack Query hooks)
- COMPLETE: Browser runtime fetch invocation fix & regression test
- COMPLETE: Dashboard 1:1 convergence iteration 1 (desktop sidebar, top header, context card, table, prioritized alerts, analytical group, AI explanation box, credo banner)
- COMPLETE: Dashboard alert detail density reduction & on-demand contextual inspector (hidden by default, dismissible X, redundant fields removed, full-width canvas expansion when closed)
- COMPLETE: Dashboard animated alert inspector trigger with active alert counter and severity pulse
- COMPLETE: Alert inspector count, cards, footer, and pulse state consistency & regression test suite
- COMPLETE: Scenario-driven alert evaluation & removal of static demo alert fallbacks
- PENDING: Patients view

## 3. Completed Phases (Compacted)
- Phase 0 - 0.6: Scaffolding, Boilerplate Cleanup, Design System Alignment
- Agent Infrastructure: Rule Library, Prompt Router, Prompt Gate, Context Optimization
- Phase 1: Domain Model v1, Synthetic Scenarios v1, Context Builder v1, Data Gate v1, Deterministic Findings v1, DEMO Rules v1
- Data: Synthetic DB Normalization + Adapter Integration
- Branding: SAMED Product Branding Alignment
- Dashboard Visual Baseline v1: AppShell + Sidebar + Dashboard page + TanStack Query hooks (useClinicalData), PlaceholderScreen for all other routes; KPI bar, findings panel, blocked evaluations panel, scenario overview, rule evaluation results; loading/empty/error states; synthetic data label visible; 21 focused UI tests (203 total); build + lint clean

- **Explicit Tasks NOT to Start Yet:**
  - DO NOT implement Medication Review or AI explanation panels in the current cycle.
  - DO NOT implement final clinical rule sets or invent unvalidated guidance.
  - DO NOT connect to real EDUS / FHIR or external clinical APIs.
  - DO NOT alter synthetic data schemas under `src/domain/` without explicit prompt instruction.
  - DO NOT introduce raw or healthcare-blue colors as primary brand identity.

## 3. Known Blockers & Issues
- None. Design tokens, cascade, typography, and @shadcn/lint are aligned and verified.

## 4. Active Invariants
- **Clinical Safety:** `UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`.
- **Truth Hierarchy:** Deterministic clinical findings > AI explanations (downstream only) > Clinician retains final authority.
- **Data Boundary:** 100% synthetic data. External/mock data must pass Zod validation before domain consumption.
- **Visual Identity:** Graphite + Bone + Aubergine. Clinical semantic tokens are decoupled from brand colors.
- **Prompt Gate:** `PROMPT_CONTRACT.md` is the only file read permitted before validation. Invalid prompts immediately cancel all execution.
- **Token Efficiency:** Serena for symbol navigation, RTK for shell compression, Ponytail/YAGNI for abstractions. Never preload all rules.
- **Finding Identity (v1):** `patientId` + `ruleId` + `ruleVersion` + `timestamp` defines one automatic `ClinicalFinding` identity. The deterministic loop emits at most one finding for that identity. Multiple findings for the same rule/evaluation require explicit discriminators or caller-supplied IDs.

## 5. Canonical File Locations
- **Prompt Gate & Router:** [PROMPT_CONTRACT.md](./PROMPT_CONTRACT.md), [.agents/rules/00-rule-router.md](./.agents/rules/00-rule-router.md), [.agents/rules/01-prompt-gate.md](./.agents/rules/01-prompt-gate.md)
- **Core Rules & Design:** [AGENTS.md](./AGENTS.md), [DESIGN.md](./DESIGN.md)
- **Tool & Context Indices:** [docs/agent-rules/TOOL_INDEX.md](./docs/agent-rules/TOOL_INDEX.md), [docs/context/CONTEXT_INDEX.md](./docs/context/CONTEXT_INDEX.md)
- **Architecture & Decisions:** [docs/architecture/DECISIONS.md](./docs/architecture/DECISIONS.md)
- **Visual Index:** [docs/design/VISUAL_INDEX.md](./docs/design/VISUAL_INDEX.md)
- **Historical Milestones:** [docs/PROJECT_JOURNAL.md](./docs/PROJECT_JOURNAL.md)
- **Domain Logic:** `src/domain/` (patient, medication, clinical-context, rules, findings, scenarios, audit)
- **Synthetic Scenarios Catalog:** `src/data/scenarios/` (`SYN-001` through `SYN-008`)
- **Data Adapters:** `src/services/adapters/ClinicalDataAdapter.ts`
- **Dashboard & Shell:** `src/features/dashboard/Dashboard.tsx`, `src/components/layout/AppShell.tsx`, `src/styles/dashboard.css`
- **UI Data Hooks:** `src/services/api/useClinicalData.ts`

## 6. Established Decisions Summary
- See [docs/architecture/DECISIONS.md](./docs/architecture/DECISIONS.md) (`DEC-001` through `DEC-010`) for stable architectural, clinical, token, and domain severity decisions.
