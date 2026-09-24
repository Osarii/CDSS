# Storybook — Component Workshop Rules

Storybook is for isolated visual/behavioral states of reusable components.

## Best candidates
- severity/status badges;
- missing-data banners;
- alert/finding cards;
- evidence blocks;
- rule traceability;
- patient context headers;
- professional action controls.

## Rules
- Stories use synthetic data only.
- Create stories for clinically meaningful states, not arbitrary decorative variants.
- Reuse small fixtures.
- Use MSW only when the component needs request behavior.
- Keep stories close to the component when practical.

Storybook is not a second application router.
