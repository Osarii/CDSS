# CDSS-CR Prompt Gate

## Highest-priority execution rule

Before ANY repository exploration or execution action, read:

`PROMPT_CONTRACT.md`

The only repository read permitted before validation is `PROMPT_CONTRACT.md`.

No Serena call, shell command, file read other than `PROMPT_CONTRACT.md`, browser action, edit, install, test, or Git action may occur before validation passes.

If the prompt fails the contract:
- execute nothing;
- make no repository/tool call;
- return the rejection format defined in `PROMPT_CONTRACT.md`;
- stop.

Do not infer or repair missing prompt fields.

`PROMPT_HELP` is the only format-exempt meta command.

After the prompt passes validation:
1. load the requested RULESET through `.agents/rules/00-rule-router.md`;
2. use Serena first for repository discovery;
3. use RTK for verbose terminal output;
4. apply Ponytail/YAGNI;
5. respect DOC and GIT fields.
