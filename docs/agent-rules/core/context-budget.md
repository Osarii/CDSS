# Context and Token Budget Policy

Use this policy on every CDSS-CR task.

## Repository exploration
1. When a LOCATOR is provided, follow the explicit token-efficiency hierarchy: `locator -> smallest relevant read -> incremental expansion only if required`.
2. Prefer Serena symbol/index tools before opening whole files.
3. Read only files and slices relevant to the requested change; never begin with full-file reads when a locator or symbol is specified.
4. Do not recursively dump the repository unless the task explicitly requires it.
5. Reuse information already learned during the current task; do not reread unchanged files.

## Terminal
1. Prefer RTK for verbose commands.
2. Run targeted tests before full suites when practical.
3. Use full unfiltered output only when RTK output is insufficient to diagnose a failure.
4. Avoid repeated `npm install`, dependency listings, full lockfile output and large tree dumps.

## Rules
1. Load only the ruleset named by `.agents/rules/00-rule-router.md`.
2. Do not read every integration guide by default.
3. Do not paste external library documentation into code comments or task reports.
4. Persist durable architectural decisions in project docs rather than repeating them in future prompts.

## Implementation
1. Modify the smallest coherent set of files.
2. Reuse existing helpers, domain types, components and dependencies.
3. Avoid speculative files, wrappers and abstractions.
4. Do not add a dependency if an installed dependency or platform API already solves the need.

## Reports
Final agent reports should contain:
- changed files;
- important decisions;
- checks run and result;
- blockers;
- next recommended step.

Do not include full file contents or long command output unless requested.
