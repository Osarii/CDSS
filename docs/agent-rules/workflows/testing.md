# Workflow — Testing

Choose the cheapest correct test layer.

## Domain/schema/rule
Vitest.

## Component behavior
React Testing Library.

## Isolated visual states
Storybook.

## Full user navigation/integration
Playwright E2E.

## Frozen UI comparison
Playwright visual snapshots.

## API simulation in stories/tests
MSW.

Do not duplicate the same assertion across every layer without a reason.
Run targeted tests while developing; run the project-required verification set before task completion.
