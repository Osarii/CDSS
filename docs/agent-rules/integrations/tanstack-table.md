# TanStack Table — Table Rules

Use TanStack Table for data-heavy tables that require sorting, filtering, selection or reusable row models.

## Rules
- Keep TanStack headless; visual styling comes from CDSS/shadcn components.
- Column definitions should remain near the feature that owns the table.
- Do not store domain logic in cell renderers.
- Avoid memoization unless profiling or table behavior requires it.
- Use stable IDs for rows.
- Clinical labels must come from domain data, not inferred in presentation code.

## Use for
- medication lists;
- findings;
- knowledge-base rules;
- audit events;
- patient lists.

Do not use TanStack Table for trivial static content.
