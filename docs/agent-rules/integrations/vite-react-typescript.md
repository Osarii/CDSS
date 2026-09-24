# React + TypeScript + Vite — Core Rules

## TypeScript
- Prefer explicit domain types and inferred Zod types.
- Avoid `any`; use `unknown` at untrusted boundaries and validate/narrow it.
- Do not use `@ts-ignore` to hide design problems.

## React
- Keep domain logic outside components.
- Prefer composition and local state before adding global state.
- Avoid unnecessary effects; derive values when possible.
- Keep providers limited to real cross-cutting concerns.

## Vite
- Keep Vite configuration minimal.
- Use the existing `@` alias.
- Add plugins only with a concrete project need.

Do not replace this stack without explicit project approval.
