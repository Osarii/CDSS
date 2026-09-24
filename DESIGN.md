# CDSS-CR Design System Specification

## Visual Identity: Graphite + Bone + Aubergine

CDSS-CR utilizes a disciplined, calm, high-contrast palette tailored for high-stakes clinical decision support. The interface avoids generic "healthcare blue" and instead emphasizes clinical readability, hierarchical focus, and intentional contrast.

### Typography Baseline
- **Clinical UI & Body (`--font-sans`):** **Inter Variable** (`@fontsource-variable/inter`)
- **Headings & Editorial Narrative (`--font-heading`):** **Source Serif 4** (`@fontsource/source-serif-4`)

### Brand & Structural Tokens
- **Graphite**: Structural text, headings, dark surfaces, and deep borders.
  - Graphite 1 (Canvas Dark / Text Primary): `#151419`
  - Graphite 2 (Surface Dark): `#1C1B21`
  - Graphite 3 (Card / Border Dark): `#27252D`
  - Graphite 4 (Hover / Border Light Dark): `#35323C`
  - Graphite Muted: `#6D6672`
- **Bone**: Primary canvas, clinical card backgrounds, surface resting states.
  - Bone Canvas: `#FAF7F1`
  - Bone Surface: `#F4EFE7`
  - Bone Border: `#E9E1D7`
- **Aubergine**: Primary brand accent, selected navigation elements, subtle interactive highlights.
  - Aubergine Primary: `#4D2F5C`
  - Aubergine Deep: `#62406F`
  - Aubergine Light: `#775382`
  - Aubergine Accent Border: `#B89BC4`
  - Aubergine Muted Surface: `#EEE5F1`

### Clinical Semantic Tokens
Clinical semantic colors are strictly separated from brand colors. They communicate clinical status deterministically and must NEVER be confused with brand accents.

- **clinical-critical** (`--color-clinical-critical`):
  - Severe drug-drug interaction, contraindication, high-risk alert.
  - Value: `#C83F49` (Crimson) | Surface: `#FDF2F3`
- **clinical-warning** (`--color-clinical-warning`):
  - Moderate interaction, dosage adjustment precaution, renal alert.
  - Value: `#C88728` (Warm Amber) | Surface: `#FDF8F0`
- **clinical-safe** (`--color-clinical-safe`):
  - Verified compatibility, within normal range, safe co-administration.
  - Value: `#3F765B` (Forest Green) | Surface: `#F2F8F5`
- **clinical-low** (`--color-clinical-low`):
  - Minor interaction, informational observation, sub-threshold.
  - Value: `#6D6672` (Muted Slate) | Surface: `#F4F3F5`
- **clinical-missing** (`--color-clinical-missing`):
  - Missing laboratory value, unknown allergen status, pending observation.
  - Value: `#B97821` (Warm Missing Amber - dashed border indicator) | Surface: `#FDF8F2`
  - **Clinical Safety Note**: Missing data is NEVER treated as normal or safe data (`MISSING !== NORMAL`).

### Rules
1. Never use generic `blue-500`, `cyan-500`, or `indigo-600` as primary branding.
2. Clinical semantic colors must always be accompanied by textual labels or icons for accessibility.
3. Contrast ratios must meet WCAG AAA for clinical data and AA for secondary text.
