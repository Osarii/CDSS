# CDSS-CR Agent Rules Library

This directory is a reusable rule library for Antigravity and other coding agents working on CDSS-CR.

## Why this exists
Repeatedly pasting library instructions, architecture rules, test commands and safety constraints wastes context. The project therefore stores durable instructions once and loads them only when relevant.

## Important token rule
Do **not** preload this entire directory.

The routing file is:

`.agents/rules/00-rule-router.md`

## Prompt Gate

Every execution prompt must pass `PROMPT_CONTRACT.md` before tools or repository exploration are used.

If the format is invalid, the agent cancels the task.

Use `PROMPT_HELP` to display the template without executing project work.

Prompts should specify ruleset aliases such as:

- `RULESET:DOMAIN`
- `RULESET:UI`
- `RULESET:DATA`
- `RULESET:FORMS`
- `RULESET:TABLES`
- `RULESET:RULES`
- `RULESET:TEST`
- `RULESET:ROUTING`
- `RULESET:LAYOUT`
- `RULESET:AGENT`
- `RULESET:REPO`
- `RULESET:CORE`
- `RULESET:DOCS`

## Permanent tools
- **Serena**: semantic/symbol-level repository exploration and targeted edits.
- **RTK**: reduce terminal output sent to the model.
- **Ponytail**: avoid speculative abstractions, duplicated code and unnecessary dependencies.

Detailed guides exist under `integrations/`, but their full text should only be loaded when the task needs them.

## Project priorities
1. Synthetic data only.
2. Deterministic clinical findings are the source of truth.
3. Missing/unknown/stale/unavailable data is never treated as normal.
4. AI explanations are downstream and non-authoritative.
5. Preserve the approved CDSS-CR design system.
6. Reuse existing code and dependencies before adding anything.
7. Keep commits and diffs focused.
