# Workflow — Data/API Changes

## Sequence
1. Inspect adapters and schemas with Serena.
2. Define the API/mock boundary needed.
3. Validate boundary data with Zod.
4. Use the ClinicalDataAdapter abstraction.
5. Expose async state through TanStack Query where appropriate.
6. Add MSW behavior only for tests/stories that need it.
7. Test error/loading/empty states where relevant.

## Constraints
- JSON Server is synthetic only.
- Do not couple components directly to JSON Server URLs.
- Do not add a second server-state library.
