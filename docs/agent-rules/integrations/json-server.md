# JSON Server — Mock API Rules

JSON Server is a prototype/mock data source, not a production clinical backend.

## Rules
- All records are synthetic.
- Never imply real EDUS/CCSS/hospital connectivity.
- Keep `db.json` human-readable and scenario-driven.
- Use stable synthetic identifiers.
- Components should access data through the adapter/query layer, not hardcoded JSON Server URLs throughout the UI.
- Do not model production authentication/security around JSON Server.

## Data quality
Synthetic cases should be intentional test scenarios, not large random datasets.
