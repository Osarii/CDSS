# CDSS-CR Deterministic Rules Engine

## Overview
CDSS-CR utilizes a deterministic rule engine (`json-rules-engine`) as the clinical source of truth. Clinical findings originate exclusively from deterministic evaluation; AI does not fabricate clinical evidence or determine clinical truth.

## Principles
1. **Determinism**: All clinical alerts, drug-drug interaction warnings, and contraindications originate from versioned, audited deterministic rules.
2. **Traceability**: Every generated finding links directly to the specific rule version that triggered it.
3. **Phase Notice**: No definitive clinical rules are implemented during this setup phase. Only artificial harness tests (e.g. `demoFlag === true`) are permitted for integration verification.
