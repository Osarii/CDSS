# Playwright — E2E and Visual Rules

Use Playwright for real user flows and visual regression of approved baselines.

## E2E
Test critical navigation and deterministic review workflows rather than every implementation detail.

## Visual
When a Stitch/design screen is frozen as a baseline:
- use a fixed viewport;
- use stable synthetic fixture data;
- disable/avoid non-deterministic animation for screenshots;
- compare the same route/state consistently.

## Rules
- Do not update baselines merely to silence a regression.
- First determine whether the code or the approved baseline should change.
- Keep screenshot names stable and feature-oriented.
