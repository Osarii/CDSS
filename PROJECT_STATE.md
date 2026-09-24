# CDSS-CR — Current Project State

> **Canonical changing-state summary.**
> Provides the smallest current-state summary needed for a coding agent to understand where CDSS-CR currently is without reconstructing project history.
> **Rule:** Only important milestones may update this file; routine tasks must not update it unnecessarily. Replace obsolete state rather than appending indefinitely.

---

## 1. Execution Coordinates
- **Current Phase:** Medication Exposure + Clinical Context Source Boundary Complete -> Next: Clinical Context Builder
- **Current Branch:** `main`
- **Last Important Commit:** `564b7b7` (Phase 1 Domain Model v1)
- **Last Update Date:** 2026-09-24

## 2. Phase Status
- **Completed Phases:**
  - Phase 0: Development Environment & Architecture Scaffolding (`bbae9c6`)
  - Phase 0.5: Starter Boilerplate Cleanup (`4b456f2`)
  - Agent Infrastructure: Rule Library & Prompt Router (`c1bc956`, `ead3430`, `8605383`)
  - Prompt Gate & Curated Journal Setup (`bc0969b`)
  - Context & Token Optimization Infrastructure (`d7d7037`, `f1f7c89`)
  - Context & Documentation Integrity (`bb8c8e3`, `b92cd86`)
  - Phase 0.6: Design System Alignment (`e76a7cf`, `d8b3de7`)
  - Phase 1: Domain Model v1 (canonical Zod schemas, ClinicalContext snapshot, severity model, AuditEvent) (`564b7b7`)
  - Synthetic Clinical Scenarios v1 (`SYN-001` through `SYN-008`, typed catalog, multi-state availability tests, raw synthetic fixtures stored in `db.json`)
  - Medication Exposure + Clinical Context Source Boundary (`MedicationExposure` typed/Zod model, 39 synthetic exposures in `src/data/scenarios/exposures.ts` & `db.json`, SYN-003 physician temporal structure preserved, `clinicalContextSourceInputSchema` boundary)
- **Current Work:** Medication Exposure + Clinical Context Source Boundary Complete
- **Next Allowed Phase / Task:** Clinical Context Builder (assemble clinical context snapshots for rule evaluation from patient-linked source records)

- **Explicit Tasks NOT to Start Yet:**
  - DO NOT implement final clinical screens (Dashboard, Medication Review).
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

## 6. Established Decisions Summary
- See [docs/architecture/DECISIONS.md](./docs/architecture/DECISIONS.md) (`DEC-001` through `DEC-010`) for stable architectural, clinical, token, and domain severity decisions.
