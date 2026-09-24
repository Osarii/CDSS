# CDSS-CR Agent Rules

## Product safety
- Synthetic data only.
- Never imply real EDUS integration.
- Unknown data is not normal data.
- Never invent clinical evidence or validated rules.
- Deterministic findings are the source of truth.
- AI may explain findings later but may not create clinical truth.
- The healthcare professional retains final decision authority.

## Architecture
- React + TypeScript + Vite.
- Reuse before creating.
- Keep domain logic outside UI components.
- Use adapters between frontend and data sources.
- Rules must be versioned and traceable.
- Validate external/mock data with Zod.

## UI
- Follow DESIGN.md.
- Preserve Graphite + Bone + Aubergine.
- Clinical semantic colors are not brand colors.
- Do not introduce healthcare-blue as primary identity.
- Do not use arbitrary raw colors when a token exists.

## Agent workflow
- Prefer Serena for codebase exploration and symbol-level edits.
- Prefer RTK for verbose shell output.
- Follow Ponytail/YAGNI principles.
- Do not add dependencies without justification.
- Run lint, tests and build before declaring a task complete.

## Task-specific rules
- `.agents/rules/00-rule-router.md` is the task-specific rule router.
- Load only the requested RULESET.
- Never preload the complete `docs/agent-rules/` directory.
