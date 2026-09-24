# Test Context Pack

Compact orientation for testing strategies in CDSS-CR.

## 1. Test Layers & Responsibilities
- **Vitest (`src/**/*.test.ts`):** Domain logic, Zod validation, Required Data Gate, and rule engine execution. Runs in jsdom or node.
- **React Testing Library (`src/**/*.test.tsx`):** Component rendering, user interactions, and accessibility checks.
- **Storybook 10:** Visual testing of isolated components against `DESIGN.md` tokens.
- **Playwright (`tests/e2e/`):** Full end-to-end user workflows and critical browser paths.

## 2. Current Implementation vs. Target
- **CURRENT:** Unit tests for `RequiredDataGate` (`src/domain/clinical-context/requiredDataGate.test.ts`), `RuleEngine` (`src/domain/rules/engine.test.ts`), smoke tests (`src/test/smoke.test.ts`, `src/test/smoke.test.tsx`), E2E smoke (`tests/e2e/smoke.spec.ts`), and base component stories (`src/components/ui/*.stories.tsx`).
- **TARGET:** Domain rule integration suites, adapter integration tests with JSON Server/MSW, and visual snapshot regressions once screens are frozen.

## 3. Cheapest-Correct-Test-Layer Principle
- Test pure domain functions at unit level (Vitest) first.
- Test component DOM rendering with RTL only when DOM behavior is being verified.
- Reserve Playwright E2E tests for smoke tests and end-to-end integration flows to conserve execution time and tokens.
