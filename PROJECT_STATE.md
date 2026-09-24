# CDSS-CR — Current Project State

> **Canonical changing-state summary.**  
> Provides the smallest current-state summary needed for a coding agent to understand where CDSS-CR currently is without reconstructing project history.  
> **Rule:** Only important milestones may update this file; routine tasks must not update it unnecessarily. Replace obsolete state rather than appending indefinitely.

---

## 1. Execution Coordinates
- **Current Phase:** Agent Infrastructure & Context Optimization
- **Current Branch:** `main`
- **Last Important Commit:** `bc0969b` (`docs: add prompt contract and curated project journal`)
- **Last Update Date:** 2026-09-24

## 2. Phase Status
- **Completed Phases:**
  - Phase 0: Development Environment & Architecture Scaffolding (`bbae9c6`)
  - Phase 0.5: Starter Boilerplate Cleanup (`4b456f2`)
  - Agent Infrastructure: Rule Library & Prompt Router (`c1bc956`, `ead3430`, `8605383`)
  - Prompt Gate & Curated Journal Setup (`bc0969b`)
- **Current Work:** Context & Token Optimization Infrastructure (Context Packs, Tool Index, Optimization Profiles)
- **Next Allowed Phase / Task:** Design System Alignment (Graphite + Bone + Aubergine tokens consolidation)
- **Explicit Tasks NOT to Start Yet:**
  - DO NOT implement final clinical screens (Dashboard, Medication Review).
  - DO NOT implement final clinical rule sets or invent unvalidated guidance.
  - DO NOT connect to real EDUS / FHIR or external clinical APIs.
  - DO NOT alter synthetic data schemas under `src/domain/` without explicit prompt instruction.
  - DO NOT introduce raw or healthcare-blue colors as primary brand identity.

## 3. Known Blockers & Issues
- None blocking infrastructure. Design system tokens in `src/index.css` require alignment with `DESIGN.md` in the upcoming Design System Alignment milestone.

## 4. Active Invariants
- **Clinical Safety:** `UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`.
- **Truth Hierarchy:** Deterministic finding (`json-rules-engine`) > AI explanations (downstream only) > Clinician retains final authority.
- **Data Boundary:** 100% synthetic data. External/mock data must pass Zod validation before domain consumption.
- **Visual Identity:** Graphite (`#1A1D1E`) + Bone (`#F7F7F5`) + Aubergine (`#4A2040`). Clinical semantic tokens are decoupled from brand colors.
- **Prompt Gate:** `PROMPT_CONTRACT.md` is the only file read permitted before validation. Invalid prompts immediately cancel all execution.
- **Token Efficiency:** Serena for symbol navigation, RTK for shell compression, Ponytail/YAGNI for abstractions. Never preload all rules.

## 5. Canonical File Locations
- **Prompt Gate & Router:** [PROMPT_CONTRACT.md](file:///Users/osariii/Documents/proyecto_final/PROMPT_CONTRACT.md), [.agents/rules/00-rule-router.md](file:///Users/osariii/Documents/proyecto_final/.agents/rules/00-rule-router.md), [.agents/rules/01-prompt-gate.md](file:///Users/osariii/Documents/proyecto_final/.agents/rules/01-prompt-gate.md)
- **Core Rules & Design:** [AGENTS.md](file:///Users/osariii/Documents/proyecto_final/AGENTS.md), [DESIGN.md](file:///Users/osariii/Documents/proyecto_final/DESIGN.md)
- **Tool & Context Indices:** [docs/agent-rules/TOOL_INDEX.md](file:///Users/osariii/Documents/proyecto_final/docs/agent-rules/TOOL_INDEX.md), [docs/context/CONTEXT_INDEX.md](file:///Users/osariii/Documents/proyecto_final/docs/context/CONTEXT_INDEX.md)
- **Architecture & Decisions:** [docs/architecture/DECISIONS.md](file:///Users/osariii/Documents/proyecto_final/docs/architecture/DECISIONS.md)
- **Visual Index:** [docs/design/VISUAL_INDEX.md](file:///Users/osariii/Documents/proyecto_final/docs/design/VISUAL_INDEX.md)
- **Historical Milestones:** [docs/PROJECT_JOURNAL.md](file:///Users/osariii/Documents/proyecto_final/docs/PROJECT_JOURNAL.md)
- **Domain Logic:** `src/domain/` (patient, medication, clinical-context, rules, findings)
- **Data Adapters:** `src/services/adapters/ClinicalDataAdapter.ts`

## 6. Frozen Decisions Summary
- See [docs/architecture/DECISIONS.md](file:///Users/osariii/Documents/proyecto_final/docs/architecture/DECISIONS.md) (`DEC-001` through `DEC-009`) for stable architectural, clinical, and token decisions.
