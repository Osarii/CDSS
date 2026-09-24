# Workflow — Domain Changes

Use for patient, medication, allergy, condition, observation, ClinicalContext, Finding, RuleDefinition and audit models.

## Sequence
1. Use Serena to inspect existing domain symbols and references.
2. Identify the smallest domain shape needed by the current phase.
3. Define/update Zod schema.
4. Infer/reuse TypeScript type.
5. Update dependent adapters/mappers only if required.
6. Add focused Vitest coverage.
7. Run targeted tests, lint and build.

## Constraints
- Synthetic prototype only.
- No invented validated clinical knowledge.
- Preserve explicit missing/unknown/stale/unavailable states.
- Do not design UI in the domain layer.
