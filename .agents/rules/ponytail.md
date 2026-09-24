# Ponytail Principles (YAGNI & Minimal Complexity)

Ponytail enforces minimal engineering, aggressive reuse, and adherence to YAGNI across all architectural and code changes.

## Guiding Decision Checklist

Before writing any new function, component, abstraction, or adding a dependency, evaluate:

1. **¿Esto necesita existir?** (Does this strictly need to exist right now for the specified goal?)
2. **¿Ya existe en el repositorio?** (Is there an existing utility, component, or pattern that already solves this?)
3. **¿Lo resuelve la plataforma?** (Can standard browser APIs, modern CSS, or native TypeScript solve this without external code?)
4. **¿Lo resuelve una dependencia ya instalada?** (Do existing libraries like Radix, React Router, TanStack Query/Table, Zod already provide this?)
5. **¿Puede resolverse con menos código?** (What is the simplest, most direct, and readable implementation?)
6. **Solo entonces crear una abstracción nueva.** (Never create speculative abstractions, generic wrappers, or premature architectural layers.)

## Development Rules
- No dead code or placeholder abstractions without active callers.
- Prefer explicit local code over premature indirection.
- Validate data at the system boundaries; avoid redundant internal re-validation.
- Maintain minimal dependency footprint. Every new dependency requires explicit user approval and clear justification.
