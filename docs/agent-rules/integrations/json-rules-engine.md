# json-rules-engine — Deterministic Rules Rules

This engine supports deterministic rule execution. It is not a clinical knowledge source.

## Rules
- Rule content must be explicit data, versioned and traceable.
- Do not hardcode clinical thresholds in UI components.
- Do not invent real clinical rules or evidence.
- Demonstration rules must be clearly marked as demonstration/unvalidated.
- Engine facts should be normalized domain facts, not raw UI state.
- Keep mapping from engine event -> CDSS Finding explicit and testable.

## Required data
The Required Data Gate describes availability/completeness. A missing datum does not always mean "do not run any rule"; rules may intentionally reason about missingness.

## Tests
Every rule added later requires deterministic tests for:
- expected trigger;
- expected non-trigger;
- missing/unknown input behavior;
- version/traceability metadata.
