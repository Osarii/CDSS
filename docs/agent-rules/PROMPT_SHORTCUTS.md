# CDSS-CR Short Prompt Patterns

These prompts assume `.agents/rules/00-rule-router.md` is active.

## Domain
`RULESET:DOMAIN. Implement <task>. Preserve CDSS safety invariants. Reuse existing models where possible. Run relevant tests, lint and build. Stop and report.`

## UI
`RULESET:UI. Implement <screen/component> according to DESIGN.md and the approved reference. Do not change domain logic. Verify lint/tests and report.`

## Data
`RULESET:DATA. Implement <adapter/query/data task>. Validate boundary data and keep components decoupled from JSON Server. Verify and report.`

## Rule engine
`RULESET:RULES. Implement <demo rule/engine task>. Do not invent validated clinical guidance. Test trigger, non-trigger and missing-data behavior. Report.`

## Table
`RULESET:TABLES. Implement <table>. Keep TanStack headless and preserve CDSS design tokens. Do not move domain logic into cells.`

## Tests
`RULESET:TEST. Add the minimum test coverage for <behavior>. Use the cheapest correct test layer. Do not duplicate coverage unnecessarily.`

## Repository inspection
`RULESET:REPO. Inspect <area> using Serena first. Do not modify files. Return findings, risks and recommended next step.`

## Agent/tooling check
`RULESET:AGENT. Verify Serena, RTK and Ponytail configuration. Do not modify application functionality.`

## Multi-ruleset
`RULESET:DOMAIN+DATA. Implement ClinicalContext loading from the adapter. Keep the change minimal and stop after verification.`

The router should deduplicate repeated integration files.
