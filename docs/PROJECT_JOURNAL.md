# CDSS-CR — Project Journal

> Historial curado de decisiones, prompts y hitos importantes.
>
> Este archivo NO es un log completo de actividad.
> Solo se documentan cambios que aportan contexto útil para decisiones futuras.
>
> **Datos del prototipo:** exclusivamente sintéticos.

## Cómo usar este Journal

- Los prompts importantes se conservan para reproducibilidad.
- Las capturas se almacenan en `docs/project-journal/images/`.
- Las correcciones menores no se registran.
- El Journal no debe cargarse completo en tareas normales; consultar únicamente la sección relevante.

---

## 2026-09-24 — Foundation environment

**Phase:** Phase 0 — Environment
**Status:** COMPLETE
**Commit:** `bbae9c6`
**Agent/model:** Antigravity / Gemini 3.8 High

**Objective**

Preparar la base técnica de CDSS-CR antes de desarrollar lógica clínica o pantallas finales.

**Important decisions**

- React + TypeScript + Vite como núcleo.
- JSON Server para datos sintéticos.
- `json-rules-engine` como infraestructura determinística.
- Zod para validación en boundaries.
- TanStack Query/Table para datos y tablas.
- Storybook, Vitest, React Testing Library y Playwright para calidad.
- Serena, RTK y Ponytail como herramientas permanentes de agentes.
- La IA queda fuera de la fuente de verdad clínica.
- `Dato no disponible ≠ normal`.

**Verification**

- lint: PASS
- tests: PASS
- build: PASS
- Playwright: PASS
- JSON Server: PASS
- Storybook: PASS
- Serena: PASS
- RTK: PASS
- Ponytail: PASS

**Result**

El repositorio quedó preparado para comenzar el desarrollo por fases sin implementar todavía lógica clínica definitiva.

---

## 2026-09-24 — Starter boilerplate cleanup

**Phase:** Phase 0.5
**Status:** COMPLETE
**Commit:** `4b456f2`
**Agent/model:** not recorded

**Objective**

Eliminar ejemplos y assets generados por Vite/Storybook que no pertenecían a CDSS-CR, preservando la configuración útil.

**Important decisions**

- Mantener Storybook como herramienta.
- Mantener stories útiles de componentes base.
- Evitar que Serena/Antigravity interpreten ejemplos genéricos como arquitectura del producto.

**Result**

El repositorio quedó con menos ruido antes de comenzar el dominio real.

---

## 2026-09-24 — Token-optimized agent rule library

**Phase:** Agent Infrastructure
**Status:** COMPLETE
**Commit:** `c1bc956`
**Agent/model:** not recorded

**Objective**

Reducir prompts repetitivos y consumo de contexto mediante reglas persistentes por integración y workflow.

**Important decisions**

- Documentación granular bajo `docs/agent-rules/`.
- No cargar toda la biblioteca en cada tarea.
- Serena = exploración semántica.
- RTK = compresión de terminal.
- Ponytail = YAGNI y mínima ingeniería.
- Los prompts pueden seleccionar reglas mediante `RULESET:*`.

**Result**

Las instrucciones repetitivas pasan a vivir dentro del repositorio.

---

## 2026-09-24 — Agent rule router

**Phase:** Agent Infrastructure
**Status:** COMPLETE
**Commit:** `ead3430`
**Agent/model:** not recorded

**Objective**

Agregar el router faltante que resuelve los aliases `RULESET:*` hacia el conjunto mínimo de reglas necesario.

**Important decisions**

- Permitir rulesets combinados como `DOMAIN+DATA`.
- Deduplicar documentos compartidos.
- Prohibir la carga completa de `docs/agent-rules/` por defecto.

**Result**

Los prompts pueden mantenerse cortos sin perder reglas específicas de cada tecnología.

---

## 2026-09-24 — Rule router linked from AGENTS

**Phase:** Agent Infrastructure
**Status:** COMPLETE
**Commit:** `8605383`
**Agent/model:** not recorded

**Objective**

Hacer descubrible el router desde las reglas principales del proyecto.

**Important decisions**

- `AGENTS.md` referencia `.agents/rules/00-rule-router.md`.
- Solo se carga el RULESET solicitado.
- La biblioteca completa no se precarga.

**Result**

La capa base de optimización de agentes quedó conectada al flujo normal del repositorio.

---

## 2026-09-24 — Prompt Contract + Documentation Gate

**Phase:** Agent Infrastructure
**Status:** COMPLETE
**Commit:** `bc0969b`
**Agent/model:** Antigravity / Gemini 3.8 High

**Objective**

Implementar un Prompt Gate estricto y un Project Journal curado para garantizar que todo prompt de ejecución futuro cumpla con un contrato validable antes de realizar cualquier acción sobre el repositorio.

**Important decisions**

- Todo prompt de ejecución requiere 6 campos obligatorios: `TASK`, `RULESET`, `SCOPE`, `ACCEPTANCE`, `STOP` y `DOC`.
- `PROMPT_CONTRACT.md` es la única lectura del repositorio permitida antes de la validación.
- Si el prompt es inválido, el agente cancela la tarea inmediatamente sin ejecutar llamadas posteriores a herramientas ni exploración.
- Excepción meta: `PROMPT_HELP` muestra la plantilla canónica sin ejecutar trabajo.
- Incorporación de `RULESET:DOCS` para documentar decisiones e hitos en `docs/PROJECT_JOURNAL.md`.
- Política de tokens: el Journal no se precarga en tareas normales; solo se consulta o actualiza cuando `DOC=YES` o `DOC=AUTO` con hito calificado.

**Verification**

- contract validation: PASS
- reference integrity: PASS (36 manifest files, 53 router references)
- git diff --check: PASS

**Result**

El repositorio cuenta con una barrera permanente de validación de prompts (`01-prompt-gate.md`) y un historial curado de arquitectura y decisiones (`PROJECT_JOURNAL.md`).

---

## 2026-09-24 — Context & Token Optimization Infrastructure

**Phase:** Agent Infrastructure
**Status:** COMPLETE
**Commit:** `d7d7037` / `f1f7c89`
**Agent/model:** Antigravity / Gemini 3.8 High

**Objective**

Construir la infraestructura completa de optimización de contexto y tokens sobre el Prompt Contract, Rule Router, Serena, RTK, Ponytail y Project Journal.

**Accepted prompt**

<details>
<summary>Prompt utilizado</summary>

```text
TASK: Build the complete CDSS-CR context and token optimization infrastructure on top of the existing Prompt Contract, Rule Router, Serena, RTK, Ponytail and Project Journal.
RULESET: AGENT+DOCS+REPO
SCOPE: PROMPT_CONTRACT.md, PROJECT_STATE.md, AGENTS.md, RULES_MANIFEST.json, .agents/rules/, docs/agent-rules/, docs/context/, docs/architecture/, docs/design/, docs/PROJECT_JOURNAL.md
ACCEPTANCE: Context packs, tool index, optimization profiles, verification profiles, visual index, decision IDs, diff-first, escalation policy, and line count guards.
STOP: Stop after verification and report the exact files changed.
DOC: YES
TOOLS: SERENA: NO, RTK: YES, PONYTAIL: YES, CONTEXT_BUDGET: STRICT
GIT: NONE
```
</details>

**Important decisions**

- Separación canónica entre contexto estable (`AGENTS.md`, `PROMPT_CONTRACT.md`, `.agents/rules/`, `DESIGN.md`) y contexto cambiante (`PROJECT_STATE.md`).
- Creación de `PROJECT_STATE.md` (<= 150 líneas) como resumen canónico del estado activo para evitar releer historial.
- Paquetes de contexto compactos (`docs/context/` para `DOMAIN`, `UI`, `DATA`, `RULES`, `TEST`) indexados vía `docs/context/CONTEXT_INDEX.md`.
- Índice canónico de herramientas (`docs/agent-rules/TOOL_INDEX.md`) para resolución determinística de paths sin búsqueda libre en el repo.
- Perfiles de herramientas configurables (`TOOLS: AUTO | MINIMAL | DEEP` y granular `SERENA`, `RTK`, `PONYTAIL`, `CONTEXT_BUDGET`).
- Modos de contexto (`CONTEXT: AUTO | MINIMAL | DEEP`) y presupuestos de lectura planificados (`BUDGET: AUTO | FILES, FULL_READS, COMMANDS`).
- Regla de Context Receipt conceptual interna (sin persistir ni generar archivos).
- Flujo de inspección `diff-first` (`docs/agent-rules/workflows/diff-first.md`) para revisiones y regresiones.
- Perfiles de verificación por tier (`docs/agent-rules/VERIFY_PROFILES.md`) y política de escalamiento (`docs/agent-rules/core/escalation-policy.md`).
- Registro canónico de decisiones estables (`docs/architecture/DECISIONS.md`) con IDs (`DEC-001` a `DEC-009`) y referencias visuales (`docs/design/VISUAL_INDEX.md`).
- Guardas de tamaño de archivo (límites estrictos de líneas) para evitar la degradación de contexto.

**Changed/created**
- `PROJECT_STATE.md`
- `docs/context/` (`CONTEXT_INDEX.md`, `DOMAIN_CONTEXT.md`, `UI_CONTEXT.md`, `DATA_CONTEXT.md`, `RULES_CONTEXT.md`, `TEST_CONTEXT.md`)
- `docs/architecture/DECISIONS.md`
- `docs/design/VISUAL_INDEX.md`
- `docs/agent-rules/TOOL_INDEX.md`
- `docs/agent-rules/workflows/diff-first.md`
- `docs/agent-rules/VERIFY_PROFILES.md`
- `docs/agent-rules/core/escalation-policy.md`
- `PROMPT_CONTRACT.md`, `.agents/rules/00-rule-router.md`, `.agents/rules/01-prompt-gate.md`, `RULES_MANIFEST.json`, `docs/agent-rules/PROMPT_SHORTCUTS.md`

**Verification**
- reference integrity: PASS
- line count guards: PASS
- git diff --check: PASS

**Result**
El repositorio cuenta con una arquitectura de contexto completa, determinística y token-optimizada que previene el consumo redundante de tokens en tareas posteriores.

---

## 2026-09-24 — Context & Documentation Integrity Fix

**Phase:** Agent Infrastructure
**Status:** COMPLETE
**Commit:** `bb8c8e3`
**Agent/model:** Antigravity / Gemini 3.8 Medium

**Objective**

Subsanar inconsistencias entre las herramientas configurables y las reglas obligatorias, auditar los paquetes de contexto contra el código real existente (separando CURRENT de TARGET) y asegurar la validez de referencias relativas sin enlaces `file:///`.

**Important decisions**

- Las reglas no inhabilitables del proyecto quedan estrictamente reducidas a `PROMPT_CONTRACT.md`, `.agents/rules/01-prompt-gate.md` y las reglas de seguridad clínica/arquitectura en `AGENTS.md`.
- `RTK`, `PONYTAIL` y `CONTEXT_BUDGET` dejan de ser precargadas incondicionalmente si entran en conflicto con overrides `TOOLS`.
- `AGENTS.md` se actualiza para reflejar que Serena y RTK son preferidas cuando están habilitadas (`YES` o `AUTO`).
- Los paquetes de contexto bajo `docs/context/` separan explícitamente lo implementado actualmente (`CURRENT`) de lo proyectado (`TARGET`).
- `DEC-001`, `DEC-002` y `DEC-007` se corrigen para no asumir funcionalidades o valores de tokens que no han sido consolidados.
- `DESIGN_SYSTEM_TOKENS` en `docs/design/VISUAL_INDEX.md` se etiqueta como `PENDING_ALIGNMENT` para la Fase 0.6.
- Se eliminan todos los enlaces `file:///` en favor de rutas relativas limpias.
- `PROMPT_CONTRACT.md` se compacta preservando validación estricta y enlaces canónicos.

**Verification**
- reference integrity: PASS (0 missing)
- file:/// audit: PASS (0 remaining)
- line count limits: PASS (all within guards)
- git diff --check: PASS
- application code untouched: PASS

**Result**
La infraestructura de contexto y tokens refleja con total veracidad el estado actual del repositorio, eliminando ambigüedades antes de iniciar la Fase 0.6.

---

## 2026-09-24 — Phase 0.6: Design System Alignment

**Phase:** Phase 0.6
**Status:** COMPLETE
**Commit:** `e76a7cf`
**Agent/model:** Antigravity / Gemini 3.6 Flash

**Objective**

Consolidar el sistema de diseño autoritativo CDSS-CR (Graphite + Bone + Aubergine & Inter + Source Serif 4) eliminando anulaciones por cascada CSS y estableciendo variaciones semánticas explícitas para estados clínicos (incluyendo faltante/desconocido con borde punteado ámbar).

**Important decisions & Changes**

- **Font Dependencies:** Se instalaron exclusivamente `@fontsource-variable/inter` y `@fontsource/source-serif-4`; se eliminó `@fontsource-variable/geist`.
- **CSS Cascade:** Se eliminaron los bloques duplicados de `:root` y `.dark` en `src/index.css` que sobreescribían variables CDSS con valores neutros/azules de shadcn.
- **Dark Mode:** Se alineó `.dark` a la paleta Graphite (`#151419`, `#1C1B21`, `#27252D`) con acentos Aubergine (`#B89BC4`), erradicando azul-salud.
- **Clinical Badges:** Se extendió `src/components/ui/badge.tsx` con variantes semánticas clínicas (`critical`, `warning`, `safe`, `low`, `missing`). El estado `missing` (`#B97821` en bg `#FDF8F2`) utiliza borde punteado para cumplir `MISSING !== NORMAL`.
- **Linter Enforcer:** Se activaron las reglas `'shadcn/no-raw-colors'` y `'shadcn/no-inline-styles'` en `eslint.config.js`.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (4 files, 8 tests passed)
- npm run build: PASS (Vite bundled Inter & Source Serif 4)
- npm run build-storybook: PASS (Storybook build success)
- domain/data changes: NONE

**Result**

El sistema de diseño CDSS-CR cuenta con una base visual coherente, determinística y libre de conflictos antes de la implementación de pantallas clínicas en la Fase 1.

---

## 2026-09-24 — Phase 1: Domain Model v1

**Phase:** Phase 1
**Status:** COMPLETE
**Commit:** 564b7b7
**Agent/model:** Antigravity / Gemini 3.6 Medium

**Objective**

Establecer la base del modelo de dominio clínico tipado y validado mediante esquemas Zod canónicos para las entidades `Patient`, `Medication`, `Allergy`, `Condition`, `Observation`, `ClinicalContext`, `RuleDefinition`, `Finding` y `AuditEvent`, garantizando la serializabilidad JSON y preservando estrictamente la invariante de seguridad clínica `UNKNOWN / MISSING / STALE / UNAVAILABLE !== NORMAL`.

**Important decisions & Changes**

- **Canonical Domain Models:** Se consolidaron esquemas Zod e inquiridos TypeScript para todas las entidades clínicas fundamentales sin acoplar infraestructura externa ni FHIR/EDUS.
- **Canonical Severity Model:** Se unificó el modelo de severidad del dominio (`critical`, `warning`, `low`, `info`). La etiqueta visual `safe`/`confirmed` se desacopló de los hallazgos de alerta (`Finding`).
- **Required Data Gate Enhancement:** Se mejoró `evaluateDataGate` para preservar exactamente qué dato requerido falló y su estado de disponibilidad (`failedRequirements: Array<{ key, status }>`).
- **ClinicalContext Snapshot:** Se definió la estructura serializable `ClinicalContext` compuesta por datos tipados del paciente, medicamentos, alergias, condiciones, observaciones y dataPoints.
- **RuleDefinition & Finding Traceability:** Se consolidó `RuleDefinition` como metadato estructural con versión y llaves de datos requeridos, y `Finding` como resultado determinístico trazable con metadatos de reglas y llaves de soporte/faltantes.
- **DEC-010:** Se registró el modelo canónico de severidad del dominio y fallas detalladas de disponibilidad de datos en `docs/architecture/DECISIONS.md`.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (5 files, 23 tests passed)
- npm run build: PASS (Vite & TypeScript compilation)
- domain test suite: PASS (`src/domain/domain.test.ts`)

**Result**

El repositorio cuenta con una base de modelo de dominio clínico tipada, validada y totalmente probada para soportar escenarios sintéticos y evaluación determinística en fases posteriores.

---

## Próximos hitos importantes

Registrar aquí únicamente al completarse:

- Synthetic Clinical Scenarios v1.
- Clinical Context Builder.
- Required Data Gate v1.
- Deterministic Findings v1.
- Primeras reglas DEMO.
- Dashboard Visual Baseline integrado.
- Medication Review Visual Baseline integrado.
