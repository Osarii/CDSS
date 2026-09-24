# Tailwind CSS — CDSS-CR Rules

Tailwind is the styling mechanism; `DESIGN.md` is the design authority.

## Rules
- Use project tokens instead of raw palette colors whenever available.
- Avoid arbitrary values unless the design specification requires a value not represented by a token.
- Do not introduce `blue-*`, `cyan-*` or `indigo-*` as primary branding.
- Keep clinical semantic colors separate from brand/action colors.
- Missing data must never visually resemble a safe/normal state.
- Preserve accessible text/icon labels; color alone must not communicate clinical state.

## Do not
- create parallel CSS systems for the same component;
- mix large inline-style objects with Tailwind;
- duplicate token values in many components.
