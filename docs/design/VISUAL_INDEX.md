# CDSS-CR Visual Reference Index

Canonical registry of approved and pending visual references, screen baselines, and design snapshots.

## Reference Policy
- Prompts may refer directly to reference IDs (e.g., `REFS: DASHBOARD_BASELINE_V1`).
- Only references marked `APPROVED` or `FROZEN` represent binding visual baselines.
- References marked `PENDING_ALIGNMENT` are scheduled for consolidation in Phase 0.6.
- Items marked `EXTERNAL_REFERENCE_PENDING` or `NOT_IMPORTED` await official design import into `docs/project-journal/images/`.

---

## Visual Reference Registry

| Reference ID | Status | Screen | File / Location | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `DESIGN_SYSTEM_TOKENS` | `APPROVED` | All / Global Tokens | `DESIGN.md`, `src/styles/tokens.css` | Graphite + Bone + Aubergine palette & Inter + Source Serif 4 baseline fully consolidated in Phase 0.6. |
| `BUTTON_CARD_STORIES` | `APPROVED` | Base Primitives | `src/components/ui/*.stories.tsx` | Visual verification of base atoms via Storybook. |
| `DASHBOARD_BASELINE_V1` | `CONVERGENCE_IN_PROGRESS` | Clinical Dashboard | `src/features/dashboard/Dashboard.tsx`, `src/components/layout/AppShell.tsx`, `src/styles/dashboard.css` | Convergence to Stitch adjusted reference 1:1. Active runtime data integration with synthetic scenarios; deterministic findings (`evaluation.findings`) serve as single source of truth; static demo fallbacks and fabricated AI blocks removed; missing data banner gated on actual blocked evaluations. |
| `MEDICATION_REVIEW_V1` | `CONVERGENCE_IN_PROGRESS` | Pharmacotherapeutic Review | `src/features/medication-review/MedicationReview.tsx` | Visual baseline v1 convergence using adjusted Stitch reference. Interactive prescription table with findings-grounded risk badges (unsupported triple-whammy hemodynamic block removed for clinical truth consistency), contextual detail inspector, physician-authored PrescriptionDraft workspace, progressive Dual AI review (Clinical Assistant + Pharmacy Assistant + neutral Comparison), safety disclaimers, and scenario integration. |
| `ALERT_DETAIL_V1` | `EXTERNAL_REFERENCE_PENDING` | Finding / Alert Detail | *Pending import* | Planned modal or drawer with deterministic rationale and evidence citations. |
| `PATIENT_CONTEXT_V1` | `EXTERNAL_REFERENCE_PENDING` | Patient Summary Bar | *Pending import* | Planned top bar display of patient vitals, conditions, and missing-data badges. |
| `AI_AUDIT_V1` | `EXTERNAL_REFERENCE_PENDING` | AI Explanation & Audit Log | *Pending import* | Planned downstream explanation panel with audit traceability. |
