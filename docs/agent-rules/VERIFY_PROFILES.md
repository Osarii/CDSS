# CDSS-CR Verification Profiles

Canonical specification for task verification tiers. Defines the exact verification depth required per task profile to avoid running wasteful test suites while ensuring clinical safety.

## Verification Tiers

| Profile | Actions & Commands | Appropriate Context |
| :--- | :--- | :--- |
| `DOCS` | `rtk git diff --check`<br>Validate referenced paths/links | Documentation, rules, and context changes with zero code modifications. |
| `TARGETED` | `rtk npm test -- <specific.test.ts>`<br>`rtk npm run lint` (if code touched) | Isolated bug fixes or single-function changes. |
| `DOMAIN` | `rtk npm test -- src/domain/`<br>`rtk npm run lint`<br>`rtk npm run build` | Modifications to clinical schemas, domain types, rules, or adapters. |
| `UI` | `rtk npm run test -- src/components/`<br>`rtk npm run lint`<br>`rtk npm run build`<br>`rtk npm run build-storybook` | Component, token, layout, or story changes. (Playwright only if requested). |
| `FULL` | `rtk npm run lint`<br>`rtk npm run test`<br>`rtk npm run build`<br>`rtk npm run test:e2e` | Milestone releases, architectural refactors, or Phase completion checkpoints. |
| `AUTO` | *Dynamically select the cheapest sufficient tier.* | Default mode when `VERIFY` is omitted. |

---

## Operating Principles
1. **Never Over-Verify:** Never run `FULL` for documentation, markdown, or config-only changes.
2. **Never Under-Verify:** Never skip domain unit tests (`DOMAIN`) when modifying clinical logic, schemas, or the `RequiredDataGate`.
3. **RTK Output Filtering:** Prefix all verification commands with `rtk` (when enabled) to prevent verbose logs from consuming model context.
