# RTK — Terminal Output Rules

RTK is used to reduce terminal output and token consumption.

## Default
Prefer RTK for shell commands that may produce meaningful output:

```bash
rtk git status
rtk git diff
rtk npm run build
rtk npm test
rtk grep "pattern" src
```

## Use raw/unfiltered output only when
- RTK output is empty although output was expected;
- an error is truncated in a way that prevents diagnosis;
- a tool requires interactive/raw behavior.

Use the RTK recovery mechanism or raw command only for that command.

## Rules
- Do not run the same command repeatedly without a reason.
- Prefer targeted tests during development.
- Run the required full verification suite only at task completion.
- Never use token savings as a reason to hide failures.
