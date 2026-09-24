# Git and GitHub — Repository Rules

Keep changes reviewable and reversible.

## Before work
- confirm current branch/status;
- avoid modifying unrelated user changes.

## During work
- keep task scope focused;
- do not rewrite history without explicit reason;
- do not commit secrets, local paths or `.env`.

## Commits
Prefer coherent commits such as:
- `chore: ...`
- `feat(domain): ...`
- `feat(ui): ...`
- `test: ...`
- `fix: ...`
- `docs: ...`

## Verification
Before a meaningful commit:
- lint;
- relevant tests;
- build when code/config changed;
- `git diff --check`.

Do not push or create PRs unless the task explicitly asks for it.
