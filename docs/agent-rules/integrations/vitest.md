# Vitest — Unit/Domain Test Rules

Use Vitest for fast domain, schema, utility and component-support tests.

## Priority
1. Domain invariants.
2. Rule execution/mapping.
3. Data completeness behavior.
4. Boundary validation.
5. Reusable utilities.

## Rules
- Prefer small deterministic tests.
- Avoid testing implementation details.
- Freeze/mock time only when the behavior depends on time.
- No network dependency in unit tests.
- A failing safety-invariant test must not be bypassed.

During development run targeted tests; before completion run the required suite.
