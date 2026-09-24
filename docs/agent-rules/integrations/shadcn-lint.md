# @shadcn/lint — Design Enforcement Rules

Purpose: prevent agent-generated UI from drifting away from the project design system.

## Desired enforcement
Flag or prevent:
- raw colors when a project token exists;
- unnecessary arbitrary Tailwind values;
- inline styles used to bypass tokens;
- duplicated component styling;
- invalid/nonexistent Tailwind utilities.

## Agent behavior
- Never disable lint rules merely to make a task pass.
- Fix the source of the violation.
- If a rule conflicts with a documented CDSS requirement, report the conflict before changing lint configuration.
- Changes to ESLint or shadcn lint configuration must be isolated and justified.

## Verification
UI tasks should finish with:

```bash
rtk npm run lint
```
