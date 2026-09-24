# CDSS-CR Architecture & Clinical Decisions

Compact registry of durable project decisions and invariants. These IDs (`DEC-XXX`) may be referenced in prompts via `PRESERVE: DEC-XXX`.

---

## DEC-001 — Non-Normal Unknowns
**Status:** ACTIVE  
**Decision:** Missing, unknown, stale, or unavailable clinical data is never treated as normal (`UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL`, `STALE !== NORMAL`). If a rule requires data that is missing, the system emits a missing-data warning finding rather than evaluating to benign/safe.  
**Canonical references:**
- `AGENTS.md`
- `src/domain/clinical-context/requiredDataGate.ts`
- `docs/context/DOMAIN_CONTEXT.md`

## DEC-002 — Deterministic Source of Truth
**Status:** ACTIVE  
**Decision:** All clinical findings, drug-drug interaction alerts, and contraindication detections originate strictly from deterministic rule execution (`json-rules-engine`). Findings must be versioned, traceable, and repeatable.  
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
**Decision:** CDSS-CR is a clinical decision *support* system. The licensed healthcare professional retains exclusive decision-making authority and clinical responsibility.  
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
**Decision:** The visual baseline is defined strictly by Graphite (`#1A1D1E`), Bone (`#F7F7F5`), and Aubergine (`#4A2040`). Clinical semantic tokens (`critical`, `warning`, `safe`, `missing`) are strictly decoupled from brand colors. Healthcare-blue is disallowed as the primary brand identity.  
**Canonical references:**
- `DESIGN.md`
- `AGENTS.md`
- `src/styles/tokens.css`

## DEC-008 — Token-Optimized Agent Tooling
**Status:** ACTIVE  
**Decision:** Coding agents must use Serena for targeted symbol/AST discovery, RTK for terminal output filtering, and Ponytail for strict YAGNI/anti-duplication. Full rule directories must never be preloaded automatically.  
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
