# Test Context Pack

Compact conceptual orientation for testing strategies in CDSS-CR.

## 1. Test Layers & Responsibilities
- **Vitest (`src/**/*.test.ts`):** Domain logic, Zod validation, Required Data Gate, and rule engine execution. Runs in jsdom or node.
- **React Testing Library (`src/**/*.test.tsx`):** Component rendering, user interactions, and accessibility checks.
- **Storybook 10:** Visual testing of isolated components against `DESIGN.md` tokens.
- **Playwright (`tests/e2e/`):** Full end-to-end user workflows and critical browser paths.

## 2. Cheapest-Correct-Test-Layer Principle
- Test pure domain functions at the unit level (Vitest) first.
- Test component DOM rendering with RTL only when DOM behavior is being verified.
- Reserve Playwright E2E tests for smoke tests and end-to-end integration flows to conserve execution time and tokens.

## 3. Visual Regression & Design Testing
- Visual token adherence (Graphite + Bone + Aubergine) is validated through Storybook stories and visual inspection before finalizing UI screens.

## 4. Current Test Structure
- Unit tests: `src/test/setup.ts`, `src/domain/**/*.test.ts`
- E2E tests: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Component stories: `src/components/ui/*.stories.tsx`
