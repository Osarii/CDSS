# CDSS-CR Architecture & Clinical Decisions

Compact registry of durable project decisions and invariants. These IDs (`DEC-XXX`) may be referenced in prompts via `PRESERVE: DEC-XXX`.

---

## DEC-001 — Non-Normal Unknowns
**Status:** ACTIVE
**Decision:** Missing, unknown, stale, or unavailable clinical data is never treated as normal (`UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`). Clinical evaluation gates prevent rules from treating missing parameters as safe or non-triggered without explicit data presence verification.
**Canonical references:**
- `AGENTS.md`
- `src/domain/clinical-context/requiredDataGate.ts`
- `docs/context/DOMAIN_CONTEXT.md`

## DEC-002 — Deterministic Source of Truth
**Status:** ACTIVE
**Decision:** All clinical alerts, interaction detections, and contraindications originate strictly from deterministic clinical logic as the single source of truth. The `json-rules-engine` library represents current infrastructure, not the only possible deterministic producer. Findings must be versioned, auditable, and repeatable. AI models cannot create, author, or alter clinical findings.
**Canonical references:**
- `AGENTS.md`
- `src/domain/rules/engine.ts`
- `docs/context/RULES_CONTEXT.md`

## DEC-003 — AI is Downstream and Non-Authoritative
**Status:** ACTIVE
**Decision:** Artificial Intelligence models may generate natural language summaries or explanations of deterministic findings downstream, but may NEVER invent, alter, score, or independently assert clinical truth.
**Canonical references:**
- `AGENTS.md`
- `docs/context/RULES_CONTEXT.md`

## DEC-004 — Clinician Primacy
**Status:** ACTIVE
**Decision:** CDSS-CR is a clinical decision support system. The licensed healthcare professional retains exclusive decision-making authority and clinical responsibility.
**Canonical references:**
- `AGENTS.md`
- `README.md`

## DEC-005 — 100% Synthetic Data
**Status:** ACTIVE
**Decision:** The prototype utilizes exclusively synthetic patient, prescription, and observation records. No integration with live hospital records, CCSS EDUS, or genuine PHI is permitted.
**Canonical references:**
- `AGENTS.md`
- `docs/context/DATA_CONTEXT.md`

## DEC-006 — Isolated ClinicalDataAdapter Boundary
**Status:** ACTIVE
**Decision:** All external or mock data must flow through `ClinicalDataAdapter` and be parsed with Zod schemas. Domain models and UI components must never communicate directly with raw HTTP endpoints or JSON Server.
**Canonical references:**
- `AGENTS.md`
- `src/services/adapters/ClinicalDataAdapter.ts`
- `docs/context/DATA_CONTEXT.md`

## DEC-007 — Graphite + Bone + Aubergine Visual Identity
**Status:** ACTIVE
**Decision:** The visual identity is established around the Graphite + Bone + Aubergine palette per `DESIGN.md`. Clinical semantic tokens (`critical`, `warning`, `safe`, `missing`) are strictly decoupled from brand colors. Healthcare-blue is disallowed as the primary brand identity. Exact token values are subject to consolidation in Phase 0.6 Design System Alignment.
**Canonical references:**
- `DESIGN.md`
- `AGENTS.md`
- `src/styles/tokens.css`

## DEC-008 — Token-Optimized Agent Tooling
**Status:** ACTIVE
**Decision:** Coding agents configure Serena (symbol/AST discovery), RTK (terminal output filtering), and Ponytail (strict YAGNI/anti-duplication) according to `SERENA`, `RTK`, and `PONYTAIL` `YES | AUTO | NO` settings. Prompt `TOOLS` overrides take precedence over inherited ruleset tool mappings. Full rule directories must never be preloaded automatically.
**Canonical references:**
- `AGENTS.md`
- `.agents/rules/00-rule-router.md`
- `docs/agent-rules/TOOL_INDEX.md`

## DEC-009 — Mandatory Prompt Gate
**Status:** ACTIVE
**Decision:** Every execution prompt must be validated against `PROMPT_CONTRACT.md` before any execution tool or repository read (other than `PROMPT_CONTRACT.md`) occurs. Invalid prompts reject immediately without tool execution.
**Canonical references:**
- `PROMPT_CONTRACT.md`
- `.agents/rules/01-prompt-gate.md`

## DEC-010 — Canonical Domain Severity & Data Readiness Failure Model
**Status:** ACTIVE
**Decision:** Clinical finding alerts and rule definitions share a single canonical domain severity model (`critical`, `warning`, `low`, `info`). Visual status semantics such as `safe`/`confirmed` are not used as finding alert severities. Required Data Gate evaluations preserve detailed failure metadata (`failedRequirements: Array<{ key, status }>`) ensuring that non-ready evaluations retain traceability of which required datum failed and its availability status.
**Canonical references:**
- `src/domain/common/schema.ts`
- `src/domain/clinical-context/requiredDataGate.ts`
- `src/domain/findings/schema.ts`

## DEC-011 — SAMED Dual AI Roles Architecture (Clinical & Pharmacy Assistants)
**Status:** ACTIVE
**Decision:** SAMED implements two independent downstream AI roles: (1) Clinical Assistant, which receives the full permitted ClinicalContext snapshot and deterministic findings to produce a structured clinical assessment summary without prescription creation or approval authority; and (2) Pharmacy Assistant, which receives strictly controlled, medication-relevant PharmacyReviewInput (proposed physician PrescriptionDraft, relevant diagnoses, allergies, current medications, relevant observations, deterministic findings, and explicit unavailable data) and never the raw ClinicalContext. An independent, deterministic ReviewComparison layer reconciles shared considerations, assistant-only considerations, unresolved discrepancies, and missing-data disagreements without ever declaring a winner or deciding which AI is correct. Deterministic data and findings remain the single source of truth, and the licensed clinician retains sole decision-making authority.
**Canonical references:**
- `src/domain/ai/schema.ts`
- `src/domain/ai/inputFilter.ts`
- `src/domain/ai/comparison.ts`
- `src/domain/prescription/schema.ts`
- `src/services/ai/types.ts`
- `src/services/ai/orchestrator.ts`
