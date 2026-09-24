# Installing the CDSS-CR Agent Rules Pack

Copy the contents of this pack into the root of the CDSS repository.

It is designed to **add** files, not replace existing:
- `AGENTS.md`
- `.agents/rules/antigravity-rtk-rules.md`
- `.agents/rules/ponytail.md`
- `DESIGN.md`

The new automatically loaded routing file is:

`.agents/rules/00-rule-router.md`

The detailed guides live under:

`docs/agent-rules/`

## Why detailed guides are not all in `.agents/rules/`
Putting every long integration guide into an automatically loaded rules directory may increase context usage on every task. The router remains short and asks the agent to load only the relevant files.

## After copying
Ask Antigravity:

`RULESET:AGENT. Verify that the CDSS rule router is visible and list the available ruleset aliases. Do not modify application code.`

Then future prompts can use the shortcuts in `docs/agent-rules/PROMPT_SHORTCUTS.md`.
