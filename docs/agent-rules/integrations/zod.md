# Zod — Boundary Validation Rules

Zod validates data entering CDSS domain boundaries.

## Use for
- JSON Server responses;
- synthetic fixture ingestion;
- forms before domain mutation;
- persisted rule definitions;
- findings received through adapters.

## Rules
- Keep the Zod schema the runtime source of validation truth.
- Infer TypeScript types from schemas when practical.
- Avoid duplicate interfaces and schemas for the same structure.
- Do not revalidate the same trusted domain object at every internal function.
- Validation errors must fail explicitly; never silently coerce clinically important missing data to defaults.

## Clinical safety
Missing, unknown, unavailable and stale are explicit states. Do not normalize them to normal.
