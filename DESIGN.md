# CDSS-CR Design System Specification

## Visual Identity: Graphite + Bone + Aubergine

CDSS-CR utilizes a disciplined, calm, high-contrast palette tailored for high-stakes clinical decision support. The interface avoids generic "healthcare blue" and instead emphasizes clinical readability, hierarchical focus, and intentional contrast.

### Brand & Structural Tokens
- **Graphite** (`--color-graphite` / `--graphite`): Structural text, headings, dark surfaces, and deep borders.
  - Primary Graphite: `#1F242D` (HSL: `220 18% 15%`)
  - Graphite Light: `#333945` (HSL: `220 15% 24%`)
  - Graphite Muted: `#5C6473` (HSL: `220 11% 41%`)
- **Bone** (`--color-bone` / `--bone`): Primary canvas, clinical card backgrounds, surface resting states.
  - Bone Canvas: `#F8F7F4` (HSL: `43 20% 97%`)
  - Bone Surface: `#FFFFFF` (HSL: `0 0% 100%`)
  - Bone Border: `#E5E2DA` (HSL: `43 14% 88%`)
  - Bone Muted: `#EDEAE1` (HSL: `43 18% 91%`)
- **Aubergine** (`--color-aubergine` / `--aubergine`): Primary brand accent, selected navigation elements, subtle interactive highlights.
  - Aubergine Primary: `#4A154B` (HSL: `299 56% 19%`)
  - Aubergine Deep: `#320E33` (HSL: `299 56% 13%`)
  - Aubergine Light: `#732B74` (HSL: `299 45% 31%`)
  - Aubergine Muted: `#F3EAF4` (HSL: `299 30% 94%`)

### Clinical Semantic Tokens
Clinical semantic colors are strictly separated from brand colors. They communicate clinical status deterministically and must NEVER be confused with brand accents.

- **clinical-critical** (`--color-clinical-critical`):
  - Severe drug-drug interaction, contraindication, high-risk alert.
  - Value: `#C53030` / `#9B1C1C` (Muted red / crimson)
  - Surface: `#FDE8E8`
- **clinical-warning** (`--color-clinical-warning`):
  - Moderate interaction, dosage adjustment precaution, renal alert.
  - Value: `#B45309` / `#92400E` (Deep amber)
  - Surface: `#FEF3C7`
- **clinical-safe** (`--color-clinical-safe`):
  - Verified compatibility, within normal range, safe co-administration.
  - Value: `#166534` (Deep forest green)
  - Surface: `#DEF7EC`
- **clinical-low** (`--color-clinical-low`):
  - Minor interaction, informational observation, sub-threshold.
  - Value: `#475569` (Muted slate)
  - Surface: `#F1F5F9`
- **clinical-missing** (`--color-clinical-missing`):
  - Missing laboratory value, unknown allergen status, pending observation.
  - Value: `#6B7280` / `#4B5563` (Neutral dashed/bordered indicator)
  - Surface: `#F3F4F6`
  - **Clinical Safety Note**: Missing data is NEVER treated as normal data (`MISSING !== NORMAL`).

### Rules
1. Never use generic `blue-500`, `cyan-500`, or `indigo-600` as primary branding.
2. Clinical semantic colors must always be accompanied by textual labels or icons for accessibility.
3. Contrast ratios must meet WCAG AAA for clinical data and AA for secondary text.
