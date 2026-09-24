# React Testing Library — Component Test Rules

Test components through user-observable behavior.

## Rules
- Prefer accessible queries (`getByRole`, labels, visible text).
- Do not test internal component state or private implementation details.
- Test clinical state labels together with semantic meaning.
- Missing/unknown states must remain distinguishable from normal/safe states.
- Keep UI tests focused; domain rule logic belongs in domain tests.
