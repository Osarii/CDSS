# TanStack Query — Server State Rules

Use TanStack Query for asynchronous server/mock-API state.

## Rules
- Components should not scatter direct `fetch()` calls.
- Requests should flow through the project data/adapters layer.
- Query keys must be stable and feature/domain oriented.
- Mutations must invalidate or update only relevant query data.
- Do not mirror query data into global/local state without a clear UI reason.
- Do not use TanStack Query for purely local UI state.

## Safety
Validate external/mock API data at the boundary with Zod before domain use.
