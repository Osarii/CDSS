# MSW — Mocking Rules

MSW is for controlled API behavior in Storybook and tests.

## Rules
- Reuse endpoint shapes from the real mock adapter/API.
- Keep handlers scenario-specific and synthetic.
- Do not duplicate a large second database inside MSW handlers.
- Prefer small fixtures imported from dedicated test/story fixture files when multiple stories use the same scenario.
- Ensure Storybook initializes MSW before relying on handlers.

Use MSW when a component/story genuinely depends on API behavior; do not mock APIs for purely presentational primitives.
