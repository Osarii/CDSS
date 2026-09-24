# Ponytail — Minimal Engineering Rules

Before adding any function, abstraction, component, layer or dependency:

1. Does it need to exist for the current task?
2. Does the repository already contain a solution?
3. Can the platform or language solve it?
4. Can an installed dependency solve it?
5. Can the task be solved with less code?
6. Only then create something new.

## Prohibited patterns
- speculative generic wrappers;
- abstractions with one caller and no clear benefit;
- duplicate utilities;
- dependency additions for trivial functionality;
- premature state managers;
- placeholder architecture with no active use.

## Allowed complexity
Complexity is justified when it directly protects:
- clinical safety invariants;
- deterministic traceability;
- data-boundary validation;
- testability;
- adapter boundaries already required by the project.

Prefer explicit, readable code over clever code.
