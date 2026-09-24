# Serena — Repository Exploration Rules

Use Serena to reduce context consumption and make targeted code changes.

## Use Serena first for
- locating types, functions, classes and exports;
- finding references;
- understanding symbol relationships;
- identifying callers before refactors;
- targeted edits to known symbols.

## Avoid
- reading entire large files when one symbol is sufficient;
- recursively dumping directories for context;
- broad replacements before checking references.

## Workflow
1. Activate the CDSS project if not active.
2. Locate the relevant symbol(s).
3. Inspect references/callers.
4. Read only surrounding code needed for the decision.
5. Make the smallest coherent edit.
6. Run targeted checks.

## Antigravity activation
If Serena has not been activated for the session:

`Activate the current project using Serena's activation tool.`

## Fallback
If Serena cannot expose information needed for a file, use direct file reading only for the smallest relevant range.
