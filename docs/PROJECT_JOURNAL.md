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

## 2026-09-24 — Synthetic Clinical Scenarios v1

**Phase:** Synthetic Clinical Scenarios v1
**Status:** COMPLETE
**Commit:** aa3232b
**Agent/model:** Antigravity / Gemini 3.8 Flash

**Objective**

Implementar el catálogo canónico tipado de 8 escenarios clínicos sintéticos (`SYN-001` a `SYN-008`), validados exhaustivamente mediante esquemas Zod del dominio, igualando o superando el caso clínico de referencia de alta complejidad médica (paciente mayor con comorbilidades cardiorrenales, polifarmacia, tratamientos agudos vs crónicos, estados múltiples de disponibilidad de datos y sin precodificar conclusiones diagnósticas o terapéuticas).

**Important decisions & Changes**

- **Scenario Schema & Type:** Se introdujo `syntheticScenarioSchema` en `src/domain/scenarios/schema.ts` requiriendo `scenarioId` (`SYN-XXX`), `title`, `description`, `clinicalContext` y `evaluationFocus` (separando estrictamente los focos de evaluación de los hallazgos de reglas).
- **Synthetic Scenarios Catalog (`src/data/scenarios/index.ts`):**
  - `SYN-001`: Contexto de evaluación basal con régimen dual ambulatorio (metformina y lisinopril) y datos de laboratorio completos.
  - `SYN-002`: Contexto de evaluación de alergia con celulitis aguda, prescripción de amoxicilina-clavulánico e historial de hipersensibilidad a penicilina y sulfametoxazol.
  - `SYN-003`: Contexto de evaluación de polifarmacia con hipertensión, ERC 3b, fibrilación auricular, enalapril, furosemida, espironolactona, amiodarona, bisoprolol y atorvastatina.
  - `SYN-004`: Contexto de evaluación renal con dabigatrán y metformina donde los datos de función renal (`serum_creatinine`, `egfr`) están faltantes (`MISSING`).
  - `SYN-005`: Contexto de evaluación renal con régimen de alopurinol y datos de laboratorio históricos (`STALE`: 18 meses de antigüedad).
  - `SYN-006`: Contexto de evaluación de prescripciones concurrentes con múltiples AINEs (ibuprofeno + naproxeno), ISRS (escitalopram) y omeprazol.
  - `SYN-007`: Contexto de regímenes concurrentes complejos (warfarina + amiodarona + ciprofloxacino en ERC 3b con registro de alergia a penicilina).
  - `SYN-008`: Contexto de evaluación con datos en múltiples estados de disponibilidad simultáneos (`AVAILABLE`, `MISSING`, `STALE`, `UNKNOWN`, `UNAVAILABLE`) para paciente con insuficiencia cardíaca, ERC 4 y digoxina.
- **Mock DB Persistence (`db.json`):** Se almacenaron registros sintéticos de entidades (`patients`, `medications`, `allergies`, `conditions`, `observations`) preservando la frontera de adaptadores; el adaptador `JsonServerAdapter` permanece como stub de desarrollo y su integración activa ocurrirá en hitos posteriores.
- **Suite de Pruebas Automatizadas (`src/domain/scenarios/scenarios.test.ts`):** 18 pruebas verificando validación Zod completa, unicidad de IDs, benchmark de complejidad médica, compuertas de datos `evaluateDataGate`, salidas determinísticas y lenguaje de inspección neutral sin hallazgos preautorizados.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (6 files, 43 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Result**

CDSS-CR cuenta con un catálogo canónico de 8 escenarios clínicos sintéticos de alta fidelidad, listo para alimentar el Clinical Context Builder y la evaluación determinística de reglas.

---

### Mini-Phase: Medication Exposure & Clinical Context Source Boundary

- **Fecha:** 2026-09-24
- **Commit:** e15e72f
- **Ruleset activado:** DOMAIN+DATA+TEST+DOCS
- **Context packs consultados:** `DATA_CONTEXT.md`, `DOMAIN_CONTEXT.md`

**Contexto y Racionalidad**

Para evitar el acoplamiento implícito entre registros de medicamentos e historiales de pacientes individuales (evitando el antipatrón de usar identificadores de medicamentos como claves foráneas implícitas de pacientes), se formalizó la distinción conceptual y arquitectónica entre:
1. `Medication`: registro prototipo de medicamento/régimen prescrito (`id`, `code`, `name`, `dosage`, `route`), en lugar de una definición pura de catálogo farmacológico.
2. `MedicationExposure`: relación temporal específica de un paciente con un medicamento (`patientId`, `medicationId`, `therapyContext`, `status`, `startedAt`, `endedAt`).
3. `ClinicalContext`: snapshot derivado de evaluación clínica.

Asimismo, se definió la frontera de entrada para el futuro Clinical Context Builder (`ClinicalContextSourceInput`) para garantizar que el contexto clínico se construya explícitamente agregando registros fuente vinculados a pacientes en lugar de copiarse de estructuras estáticas preconcebidas.

**Cambios clave**

- **Modelo `MedicationExposure` (`src/domain/medication/schema.ts`):** Esquema Zod mínimo y tipos TypeScript inferidos (`id`, `patientId`, `medicationId`, `therapyContext: 'chronic' | 'acute' | 'unknown'`, `status: 'active' | 'stopped' | 'unknown'`, `startedAt?`, `endedAt?`).
- **Frontera de entrada del Context Builder (`src/domain/clinical-context/schema.ts`):** Definición de `clinicalContextSourceInputSchema` y `ClinicalContextSourceInput` (`patient`, `medications`, `medicationExposures`, `allergies`, `conditions`, `observations`, `dataPoints?`, `evaluationTimestamp`).
- **Catálogo de Exposiciones Sintéticas (`src/data/scenarios/exposures.ts`):** 39 registros de exposición cubriendo la totalidad de medicamentos de `SYN-001` a `SYN-008`.
- **Estructura Temporal del Caso de Referencia SYN-003:** Se preservó fielmente la clasificación médica:
  - Enalapril → `chronic`
  - Furosemida → `chronic`
  - Espironolactona → `chronic`
  - Amiodarona → `acute`
  - Bisoprolol y Atorvastatina → `unknown` (contexto neutral por defecto).
- **Persistencia en `db.json`:** Incorporación del arreglo `"medicationExposures"` sincronizado con el catálogo de código.
- **Suite de Pruebas de Integridad (`src/domain/medication/exposure.test.ts`):** 24 pruebas cubriendo validación de esquemas Zod, resolución referencial completa de `patientId` y `medicationId`, cobertura de todos los medicamentos de escenarios, estructura temporal de SYN-003, detección de registros huérfanos/duplicados y validación de la frontera `clinicalContextSourceInputSchema`.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (7 files, 67 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Result**

Frontera de exposición a medicamentos y entrada fuente de contexto clínico formalizada, tipada y validada. La arquitectura queda lista para la implementación del Clinical Context Builder.

---

### 2026-09-24 — Clinical Context Builder v1

**Phase:** Clinical Context Builder v1
**Status:** COMPLETE
**Commit:** `d2b5738`
**Agent/model:** Antigravity / Gemini 3.8 Flash
**Ruleset activado:** DOMAIN+DATA+TEST+DOCS
**Context packs consultados:** `DATA_CONTEXT.md`, `DOMAIN_CONTEXT.md`

**Objetivo**

Implementar el ensamblador determinístico `buildClinicalContext` para derivar snapshots de evaluación clínica (`ClinicalContext`) a partir de paquetes de registros fuente vinculados al paciente (`ClinicalContextSourceInput`), garantizando integridad referencial estricta, resolución de medicamentos a través de registros `MedicationExposure`, prevención de fugas de datos entre pacientes y preservación inalterada de estados de disponibilidad de datos analíticos.

**Decisiones clave y cambios**

- **Ensamblador determinístico (`src/domain/clinical-context/builder.ts`):** Función pura `buildClinicalContext` libre de efectos secundarios y mutaciones que valida estrictamente la entrada mediante `clinicalContextSourceInputSchema` y valida el snapshot final con `clinicalContextSchema` antes de retornarlo.
- **Integración de metadatos de exposición a medicamentos en el snapshot canónico (`src/domain/clinical-context/schema.ts`):** Se incorporó `medicationExposures: z.array(medicationExposureSchema)` a `clinicalContextSchema` y al tipo `ClinicalContext`.
- **Preservación exacta de exposición en el ensamblador (`src/domain/clinical-context/builder.ts`):** `buildClinicalContext` incluye únicamente las exposiciones pertenecientes al paciente fuente y que referencian medicamentos resueltos en el conjunto prescrito, preservando de forma exacta `therapyContext`, `status`, `startedAt` y `endedAt` sin inferir ni normalizar estados.
- **Resolución de medicamentos por exposición:** Los medicamentos se resuelven exclusivamente mediante registros `MedicationExposure` vinculados al paciente, eliminando cualquier asunción o inferencia de propiedad por IDs de medicamentos o convenciones de nomenclatura.
- **Integridad referencial y rechazo de inconsistencias:** Validación exhaustiva de que todos los registros vinculados (`medicationExposures`, `allergies`, `conditions`, `observations`) pertenecen al `patientId` de la fuente, y que toda exposición referencia un medicamento existente en el catálogo suministrado, rechazando de forma determinística cualquier paquete inconsistente o cruzado entre pacientes.
- **Preservación de estados de disponibilidad sin normalización:** Se preservan fielmente los estados `AVAILABLE`, `MISSING`, `UNKNOWN`, `STALE` y `UNAVAILABLE` con sus respectivos valores, marcas de tiempo y orígenes (`timestamp` de evaluación mapeado a `ClinicalContext.timestamp`), sin interpretar datos faltantes o desconocidos como normales.
- **Actualización de fixtures de escenarios sintéticos (`src/data/scenarios/index.ts`):** Se actualizaron todos los fixtures de contexto clínico (`SYN-001` a `SYN-008`) incorporando sus respectivos registros `medicationExposures`, manteniendo 100% de validez frente al esquema canónico y preservando en `SYN-003`: enalapril crónico, furosemida crónica, espironolactona crónica y amiodarona aguda.
- **Suite de pruebas automatizadas (`src/domain/clinical-context/builder.test.ts`):** 19 pruebas unitarias y de integración verificando construcción determinística, preservación exacta de metadatos de exposición (`source -> builder -> ClinicalContext`), resolución de medicamentos y tiempos en `SYN-003`, preservación de estados en `SYN-004`/`SYN-005`/`SYN-008`, detección de registros huérfanos/foráneos e inmutabilidad estricta.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (8 files, 86 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Resultado**

El ensamblador de contexto clínico `buildClinicalContext` queda completamente finalizado, preservando los metadatos de exposición de medicamentos en el snapshot canónico `ClinicalContext`, verificado y listo para la compuerta de datos obligatoria (`evaluateDataGate`) y el motor de evaluación determinística de reglas.

---

### 2026-09-24 — Required Data Gate v1

**Phase:** Required Data Gate v1
**Status:** COMPLETE
**Commit:** `34a3f4f`
**Agent/model:** Antigravity / Gemini 3.8 Flash
**Ruleset activado:** DOMAIN+DATA+TEST+DOCS
**Context packs consultados:** `DOMAIN_CONTEXT.md`, `RULES_CONTEXT.md`

**Objetivo**

Integrar la lógica de compuerta de datos obligatorios (`evaluateClinicalContextDataGate`) con el snapshot canónico `ClinicalContext` y las definiciones de reglas (`RuleDefinition.requiredDataKeys`), garantizando que la evaluación se bloquee determinísticamente ante datos faltantes, obsoletos, desconocidos o no disponibles sin asumir nunca normalidad o seguridad.

**Decisiones clave y cambios**

- **Integración canónica de compuerta (`src/domain/clinical-context/requiredDataGate.ts`):** Se implementó `evaluateClinicalContextDataGate(context, requirement)` aceptando un `ClinicalContext` y una lista de claves requeridas o un `RuleDefinition` (`Pick<RuleDefinition, 'requiredDataKeys'>`).
- **Evaluación selectiva de claves requeridas:** La compuerta inspecciona únicamente las claves requeridas por la regla en evaluación. La presencia de datos no disponibles en claves no requeridas no bloquea reglas no relacionadas.
- **Invariante clínico fundamental (`UNKNOWN !== NORMAL`):** Cualquier clave requerida con estado `MISSING`, `UNKNOWN`, `STALE` o `UNAVAILABLE` bloquea la evaluación (`canProceed: false`).
- **Detección y tipado de causas de fallo (`FailedRequirementReason`):** Se distingue con precisión si el fallo se debe a un dato no utilizable (`NOT_USABLE`: presente pero no disponible o con valor nulo/indefinido) o a una clave requerida ausente en el snapshot (`NOT_PRESENT`: clave no provista en `dataPoints`). Una clave ausente se clasifica como `MISSING` / `NOT_PRESENT` y jamás se interpreta como normal o `AVAILABLE`.
- **Preservación exhaustiva de fallos:** Se preservan todas las claves fallidas y sus estados específicos en `failedRequirements` y `blockedReasons`.
- **Pureza y determinismo:** Función estrictamente pura, libre de efectos secundarios y mutaciones sobre `ClinicalContext`. No ejecuta aún reglas de `json-rules-engine` ni genera `Finding`s.
- **Suite de pruebas focalizadas (`src/domain/clinical-context/requiredDataGate.test.ts`):** 14 pruebas automatizadas verificando:
  - Paso limpio con datos disponibles en `SYN-001`.
  - Bloqueo determinístico por datos `MISSING` en `SYN-004` (`serum_creatinine`, `egfr`).
  - No interferencia de datos no requeridos en `SYN-004`.
  - Bloqueo determinístico por datos `STALE` en `SYN-005` (`serum_creatinine`, `uric_acid`).
  - Preservación múltiple de fallos heterogéneos en `SYN-008` (`MISSING`, `UNAVAILABLE`, `STALE`, `UNKNOWN`).
  - Bloqueo estricto por clave ausente (`NOT_PRESENT`).
  - Aceptación de objetos `RuleDefinition` directos y manejo seguro de conjuntos vacíos.
  - Inmutabilidad y determinismo en ejecuciones repetidas.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (8 files, 96 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Resultado**

La compuerta de datos obligatorios `evaluateClinicalContextDataGate` queda formalizada, verificada y lista para integrarse al ciclo de ejecución del motor de reglas determinísticas y a la generación de `Finding`s.

---

### 2026-09-24 — Deterministic Findings v1

**Phase:** Deterministic Findings v1
**Status:** COMPLETE
**Commit:** `34a3f4f`
**Agent/model:** Antigravity / Gemini 3.8 Flash
**Ruleset activado:** DOMAIN+TEST+DOCS
**Context packs consultados:** `DOMAIN_CONTEXT.md`, `RULES_CONTEXT.md`

**Objetivo**

Implementar el constructor/factoría determinístico puro de hallazgos clínicos (`buildClinicalFinding`, `buildFinding`, `buildClinicalFindingFromRule`, `buildClinicalFindings`) basado en el esquema canónico `clinicalFindingSchema`, garantizando trazabilidad completa hacia la regla y su versión, preservación inalterada de claves de datos de soporte y faltantes, y rechazo estricto de inferencias o conclusiones clínicas arbitrarias.

**Decisiones clave y cambios**

- **Constructor determinístico puro (`src/domain/findings/builder.ts`):** Función pura `buildClinicalFinding` libre de efectos secundarios que valida la entrada mediante `clinicalFindingInputSchema`, construye el hallazgo con `isDeterministic: true`, genera identificadores determinísticos reproducibles basados en la invariante v1 de identidad (`finding-${patientId}-${ruleId}-${ruleVersion}-${timestamp}` asegura identidad única por regla y ciclo temporal, múltiples hallazgos por regla requerirían discriminadores externos), preserva identificadores personalizados explícitos cuando se suministran, y valida el objeto resultante contra `clinicalFindingSchema`.
- **Preservación explícita de trazabilidad:** Se preservan íntegramente `patientId`, `ruleId`, `ruleVersion`, `severity`, `title`, `detail`, `supportingDataKeys`, `missingDataKeys` y `timestamp`.
- **Integración con definiciones de reglas (`buildClinicalFindingFromRule`):** Helper puro que mapea directamente un `RuleDefinition` (`id`, `version`, `name`, `severity`) junto con los detalles de evaluación a un `ClinicalFinding`, preservando la versión exacta de la regla sin omisiones ni valores por defecto tácitos.
- **Inmutabilidad y aislamiento de referencias:** Clonación defensiva de arreglos (`supportingDataKeys`, `missingDataKeys`) para impedir que mutaciones externas en el objeto de entrada o en el hallazgo construido alteren el estado de datos.
- **Rechazo estricto de entradas inválidas:** Validación en esquema canónico (`schema.ts`) que rechaza cadenas vacías en campos obligatorios, severidades no canónicas (`safe`, `unknown`, etc.) y banderas no deterministas (`isDeterministic: false`).
- **Suite de pruebas automatizadas (`src/domain/findings/builder.test.ts`):** 22 pruebas exhaustivas cubriendo validación de esquemas, preservación de versiones de regla, trazabilidad de auditoría, preservación de claves de soporte/faltantes, determinismo, inmutabilidad, construcción por lotes (`buildClinicalFindings`) e integridad de identificadores (diferenciación temporal de IDs en evaluaciones sucesivas, idempotencia y no colisión en lotes).

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (9 files, 118 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Resultado**

El constructor de hallazgos clínicos determinísticos `buildClinicalFinding` queda implementado, validado y probado, listo para conectarse con la ejecución de reglas clínicas evaluadas tras el paso por la compuerta de datos.

---

### 2026-09-25 — DEMO Rules v1

**Phase:** DEMO Rules v1
**Status:** COMPLETE
**Commit:** pending (GIT: NONE)
**Agent/model:** Antigravity / Gemini 3.8 Flash
**Ruleset activado:** DOMAIN+RULES+TEST+DOCS
**Context packs consultados:** `DOMAIN_CONTEXT.md`, `RULES_CONTEXT.md`, `TEST_CONTEXT.md`

**Objetivo**

Implementar las primeras tres reglas sintéticas/demo claramente delimitadas (`DEMO-ALG-001`, `DEMO-DDI-001`, `DEMO-REN-001`) con evaluación determinística mediante `json-rules-engine`, precedidas obligatoriamente por la compuerta de datos requeridos (`evaluateClinicalContextDataGate`), garantizando que ninguna regla bloqueada genere hallazgos y que toda regla activada genere exactamente un `ClinicalFinding` determinístico y trazable sin inventar guías clínicas reales.

**Decisiones clave y cambios**

- **Reglas sintéticas de demostración (`src/domain/rules/demoRules.ts`):** Definición explícita de tres reglas prototipo con `id`, `version`, `name`, `description`, `severity`, `enabled` y `requiredDataKeys`:
  - `DEMO-ALG-001` (crítica, alergia a beta-lactámicos en presencia de penicilina + amoxicilina-clavulanato, sin claves de laboratorio requeridas).
  - `DEMO-DDI-001` (advertencia, interacción amiodarona + espironolactona con monitoreo requerido de `potassium`).
  - `DEMO-REN-001` (advertencia, alerta de dosificación en insuficiencia renal con eGFR <= 50 mL/min/1.73m2 y monitoreo requerido de `serum_creatinine` y `egfr`).
- **Evaluador determinístico con compuerta de datos obligatoria (`src/domain/rules/evaluator.ts`):** Implementación de `evaluateDemoRule` y `evaluateDemoRules`:
  1. Si la regla está deshabilitada (`enabled: false`), se omite (`status: 'skipped'`) sin generar hallazgos.
  2. La compuerta de datos requeridos (`evaluateClinicalContextDataGate`) se ejecuta obligatoriamente ANTES de la evaluación del motor. Ante datos faltantes, obsoletos, desconocidos o ausentes (`MISSING`, `STALE`, `UNKNOWN`, `UNAVAILABLE`, `NOT_PRESENT`), la regla se bloquea (`status: 'blocked'`) y NO genera ningún `ClinicalFinding`.
  3. Extracción determinística de hechos del contexto clínico (`extractEvaluationFacts`) y ejecución en `json-rules-engine`.
  4. Si la regla se activa (`triggered`), genera exactamente un `ClinicalFinding` determinístico utilizando `buildClinicalFindingFromRule`, preservando `ruleId`, `ruleVersion`, `severity`, `title`, `detail`, `supportingDataKeys`, `missingDataKeys: []` y `timestamp`.
- **Encuadre explícito de seguridad clínica (lógica de demostración sintética no autoritativa):** Se documentó explícitamente en el código (`demoRules.ts`), descripciones de reglas y paquetes de contexto que las condiciones, umbrales numéricos (como eGFR <= 50 mL/min/1.73m2) y emparejamientos de fármacos son lógica de demostración sintética para verificación del pipeline y NO representan guías clínicas validadas ni recomendaciones médicas autoritativas.
- **Suite de pruebas focalizadas con escenarios SYN (`src/domain/rules/demoRules.test.ts`):** 22 pruebas automatizadas cubriendo:
  - Activación esperada: `DEMO-ALG-001` en SYN-002, `DEMO-DDI-001` en SYN-003, `DEMO-REN-001` en SYN-003.
  - No activación segura: `DEMO-ALG-001` en SYN-001, `DEMO-DDI-001` en SYN-001, `DEMO-REN-001` en SYN-001 (eGFR 82 > 50).
  - Bloqueo por compuerta de datos: `DEMO-REN-001` en SYN-004 (datos renales MISSING), en SYN-005 (creatinina STALE) y ante claves UNAVAILABLE o ausentes.
  - Evaluación por lotes (`evaluateDemoRules`): conteo exacto de hallazgos por escenario (0 en SYN-001, 1 en SYN-002, 2 en SYN-003, 0 en SYN-004).
  - Idempotencia, inmutabilidad y diferenciación de identificadores por timestamp de evaluación.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (10 files, 141 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Resultado**

El pipeline de reglas determinísticas DEMO Rules v1 queda completamente integrado y encuadrado bajo premisas de seguridad clínica, verificando la compuerta de datos como prerrequisito ineludible y emitiendo hallazgos clínicos determinísticos trazables hacia las reglas prototipo.

### 2026-09-25 — Synthetic DB Normalization + Adapter Integration

**Phase:** Synthetic DB Normalization + Adapter Integration
**Status:** COMPLETE
**Commit:** pending (GIT: NONE)
**Agent/model:** Antigravity / Gemini 3.8 Flash
**Ruleset activado:** DATA+DOMAIN+TEST+DOCS
**Context packs consultados:** `DATA_CONTEXT.md`, `DOMAIN_CONTEXT.md`, `TEST_CONTEXT.md`

**Objetivo**

Establecer `db.json` como la fuente de verdad sintética normalizada para los escenarios clínicos, eliminar la duplicación de snapshots `ClinicalContext` en persistencia, e implementar `JsonServerAdapter` detrás de la interfaz `ClinicalDataAdapter` para ensamblar `ClinicalContextSourceInput`, validar mediante esquemas canónicos Zod, alimentar `buildClinicalContext()` y preservar fielmente la integridad referencial y los estados de disponibilidad sin conectar servicios reales ni alterar la lógica clínica existente.

**Decisiones clave y cambios**

- **Normalización estricta de `db.json`:**
  - Se estructuraron 8 colecciones normalizadas: `patients` (8), `medications` (39), `medicationExposures` (39), `allergies` (3), `conditions` (33), `observations` (46), `clinicalDataPoints` (51) y `scenarios` (8).
  - Ningún objeto `ClinicalContext` preconstruido se almacena en `db.json`.
  - Cada escenario en `scenarios` referencia únicamente los identificadores de los registros normalizados (`patientId`, `medicationIds`, `medicationExposureIds`, `allergyIds`, `conditionIds`, `observationIds`, `clinicalDataPointIds`) y su `evaluationTimestamp`.
- **Esquemas canónicos de frontera (`src/domain/clinical-context/schema.ts`, `src/domain/scenarios/schema.ts`):**
  - `clinicalDataPointRecordSchema` y tipo `ClinicalDataPointRecord`: define la estructura normalizada en base de datos (`id`, `patientId`, `key`, `value`, `status`, `timestamp?`, `source?`).
  - `normalizedScenarioSchema` y tipo `NormalizedScenario`: define el registro de escenario por referencias foráneas a colecciones normalizadas.
  - Tipos exportados en `types.ts` e indexados en `src/domain/index.ts`.
- **Ampliación de la interfaz `ClinicalDataAdapter` (`src/services/adapters/ClinicalDataAdapter.ts`):**
  - Incorporación de métodos de consulta y ensamblaje: `getScenarios()`, `getScenarioById(id)`, `getScenarioSourceInput(scenarioId)` y `getScenarioContext(scenarioId)`.
- **Implementación completa de `JsonServerAdapter` (`src/services/adapters/JsonServerAdapter.ts`):**
  - Soporte dual: transporte HTTP REST vía JSON Server (`http://localhost:3001`) e ingestión directa de base de datos normalizada (`SyntheticDatabase`) para ejecución pura y determinística en tests y desarrollo.
  - Validación Zod estricta en cada frontera antes del consumo por capas de dominio.
  - Verificación rigurosa de integridad referencial para los 7 tipos de entidades referenciadas: detección y rechazo con errores informativos de referencias huérfanas (registros no existentes) e inconsistentes (filtración entre pacientes distintos o medicamentos no registrados en el escenario).
  - Ensamblaje determinístico de `ClinicalContextSourceInput` validado con `clinicalContextSourceInputSchema.parse()`, alimentando directamente `buildClinicalContext()`.
  - Preservación exacta de metadatos temporales de exposición (`therapyContext`, `status`, `startedAt`, `endedAt`) y estados de disponibilidad de datos (`AVAILABLE`, `MISSING`, `UNKNOWN`, `STALE`, `UNAVAILABLE`) sin coerción a normal.
- **Suite de pruebas integrales y regresión 8/8 (`src/services/adapters/JsonServerAdapter.test.ts`):**
  - 41 pruebas automatizadas utilizando los fixtures TypeScript de `SYN-001` a `SYN-008` como oráculo de regresión.
  - Validación de equivalencia exacta 8/8 en `ClinicalContextSourceInput` y `ClinicalContext`.
  - Verificación de comportamiento idéntico en la compuerta de datos requeridos y reglas DEMO (DEMO-ALG-001 en SYN-002, DEMO-DDI-001 en SYN-003, bloqueo en SYN-004).
  - Pruebas negativas completas para referencias huérfanas e inconsistentes en las 7 entidades.
  - Validación de transporte HTTP y manejo de errores 404/500 con fetch simulado.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (11 files, 182 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Resultado**

La base de datos sintética normalizada `db.json` y el adaptador `JsonServerAdapter` quedan plenamente operativos, garantizando que el consumo de escenarios se realice a través de la frontera de adaptadores con validación Zod canónica, preservación integral de metadatos clínicos y verificación de regresión exacta sobre los 8 escenarios sintéticos.

---

### 2026-09-25 — SAMED Product Branding Alignment

**Phase:** SAMED Product Branding Alignment
**Status:** COMPLETE
**Commit:** pending (GIT: NONE)
**Agent/model:** Antigravity / Gemini 3.8 Flash
**Ruleset activado:** UI+DOCS+REPO
**Context packs consultados:** `UI_CONTEXT.md`, `DOMAIN_CONTEXT.md`, `DATA_CONTEXT.md`

**Objetivo**

Alinear la identidad de marca del producto de cara al usuario final bajo el nombre **SAMED** (*Sistema de Apoyo Médico para Evaluación y Decisión*) y su lema oficial *"SAMED apoya la decisión. El profesional toma la decisión."*, estableciendo una clara separación conceptual entre la marca de producto y el proyecto técnico/repositorio **CDSS**, sin alterar la arquitectura técnica, esquemas, entidades de dominio ni adaptadores.

**Decisiones clave y cambios**

- **Definición de marca de producto y lema oficial:**
  - Nombre del producto: **SAMED** (*Sistema de Apoyo Médico para Evaluación y Decisión*).
  - Lema oficial: *"SAMED apoya la decisión. El profesional toma la decisión."*
  - Relación arquitectónica explícita: **Marca de producto = SAMED** | **Proyecto técnico y repositorio = CDSS**.
- **Alineación de interfaces y documentación visible al usuario:**
  - `index.html`: actualización del título del documento a `SAMED — Sistema de Apoyo Médico para Evaluación y Decisión`.
  - `src/app/router/AppRouter.tsx`: actualización del encabezado principal a `SAMED — Sistema de Apoyo Médico para Evaluación y Decisión` e incorporación visible del lema oficial.
  - `tests/e2e/smoke.spec.ts`: soporte para validación del título con `SAMED`.
  - `DESIGN.md`: actualización de la especificación del sistema de diseño, formalizando la identidad de marca SAMED y su lema, manteniendo intacto el sistema visual Graphite + Bone + Aubergine y los tokens semánticos clínicos.
  - `README.md`: actualización del encabezado, lema, contexto arquitectónico y descripción del rol de SAMED como sistema de soporte a decisiones clínicas.
  - Paquetes de contexto (`docs/context/UI_CONTEXT.md`, `docs/context/DOMAIN_CONTEXT.md`, `docs/context/DATA_CONTEXT.md`): reflejo de la marca de producto SAMED y la arquitectura técnica CDSS.
- **Preservación estricta de nombres técnicos y arquitectura:**
  - No se renombró el repositorio de GitHub.
  - No se renombraron carpetas de dominio, entidades (`Patient`, `Medication`, `MedicationExposure`, `ClinicalContext`, etc.), esquemas Zod, adaptadores (`ClinicalDataAdapter`, `JsonServerAdapter`), reglas determinísticas, pruebas ni imports.
  - La suite de pruebas y compilación se mantienen 100% estables.

**Verification**

- git diff --check: PASS
- npm run lint: PASS (0 errors, 0 warnings)
- npm run test: PASS (11 files, 182 tests passed)
- npm run build: PASS (Vite + TypeScript compilation)

**Resultado**

La identidad de marca del producto queda formalizada como SAMED con su lema clínico oficial, manteniendo total integridad en la arquitectura técnica, contratos de dominio y base de código CDSS.

---

### 2026-09-25 — Dashboard Visual Baseline v1

**Phase:** Dashboard Visual Baseline v1
**Status:** IMPLEMENTED_REVIEW_PENDING
**Commit:** pending (GIT: NONE)
**Agent/model:** Antigravity / Gemini 3.8 Flash
**Ruleset activado:** UI+LAYOUT+DATA+TEST
**Context packs consultados:** `UI_CONTEXT.md`, `DATA_CONTEXT.md`
**Ref visual:** `DASHBOARD_BASELINE_V1` → `IMPLEMENTED_REVIEW_PENDING` (ver `docs/design/VISUAL_INDEX.md`)

**Objetivo**

Reemplazar el placeholder `/dashboard` con el primer panel clínico real de SAMED: una estación de trabajo clínica con shell de aplicación reutilizable (sidebar + área de trabajo principal) que consume datos exclusivamente a través de `ClinicalDataAdapter` / `JsonServerAdapter` y hooks TanStack Query, siguiendo el sistema visual Graphite + Bone + Aubergine sin patrones decorativos de dashboard genérico.

**Decisiones clave y cambios**

- **Shell de aplicación reutilizable (`src/components/layout/AppShell.tsx`):** Sidebar con marca SAMED, navegación con `NavLink` (active states), aviso de datos sintéticos permanentemente visible, badges `EN DESARROLLO` en módulos no implementados.
- **Hooks TanStack Query (`src/services/api/useClinicalData.ts`):** `useScenarios`, `useScenario`, `usePatients`, `useScenarioEvaluation`, `useDashboardSummary`; todos leen exclusivamente a través de `ClinicalDataAdapter` — ningún componente de UI lee `db.json` directamente.
- **Singleton adaptador (`src/services/adapters/adapterInstance.ts`):** Una única instancia de `JsonServerAdapter` compartida por todos los hooks.
- **Componente Dashboard (`src/features/dashboard/Dashboard.tsx`):** Panel clínico con:
  - Barra KPI (hallazgos críticos, precauciones, evaluaciones bloqueadas, reglas activadas).
  - Panel de hallazgos deterministas ordenados por severidad con badges CRÍTICO / PRECAUCIÓN, metadatos ruleId/ruleVersion/DETERMINISTA, y tag DATOS PARCIALES cuando hay `missingDataKeys`.
  - Panel de evaluaciones bloqueadas con claves de datos faltantes como tags.
  - Panel de resultados por regla DEMO con estado ACTIVADA / NO ACTIVADA / BLOQUEADA / OMITIDA.
  - Resumen de escenarios sintéticos con focos de evaluación.
  - Etiqueta `DATOS SINTÉTICOS · SOLO DEMO` visible en header.
  - Estados de carga (shimmer), vacío y error en todos los paneles.
- **PlaceholderScreen (`src/components/layout/PlaceholderScreen.tsx`):** Pantalla reutilizable para rutas planificadas no implementadas.
- **Router actualizado (`src/app/router/AppRouter.tsx`):** `/` redirige a `/dashboard`; todas las rutas se renderizan dentro de `AppShell`; 5 rutas placeholder funcionales.
- **CSS de diseño (`src/styles/dashboard.css`):** Todos los estilos de layout y componentes usan exclusivamente tokens de diseño del sistema (`--graphite-*`, `--bone-*`, `--aubergine-*`, `--clinical-*`). Sin colores crudos ni estilos inline. Importado desde `src/index.css`.
- **tsconfig.app.json:** Se añadió `@testing-library/jest-dom/vitest` a `types` para resolver tipos de assertions en `tsc -b`.
- **Suite de pruebas de UI (`src/features/dashboard/Dashboard.test.tsx`):** 21 pruebas focalizadas cubriendo estados de carga, error y datos para `Dashboard`, `AppShell` y `PlaceholderScreen`. Mocks de hooks TanStack Query para aislamiento de capa HTTP/adaptador.

**Principios de diseño preservados**

- Densidad de información sobre tarjetas decorativas; jerarquía sobre ornamento.
- Colores clínicos semánticos (`--clinical-critical`, `--clinical-warning`, `--clinical-missing`) estrictamente separados de los colores de marca.
- Dato no disponible / bloqueado ≠ normal — siempre visualmente diferenciado.
- El profesional retiene la autoridad final de decisión; la UI solo presenta hallazgos deterministas del pipeline DEMO.

**Verification**

- npm run lint: PASS (0 errors, 5 false-positive class-name warnings de shadcn/no-raw-colors)
- npm run test: PASS (12 files, 203 tests passed)
- npm run build: PASS (tsc -b && vite build)
- DB direct reads from UI: NONE (todos los datos via ClinicalDataAdapter → TanStack Query)

**Resultado**

El panel clínico SAMED v1 queda implementado, verificado y listo para revisión visual. La arquitectura de shell + adaptador + hooks queda disponible para reutilización en módulos posteriores (Pacientes, Revisión Farmacoterapéutica, Alertas).

---

### 2026-09-25 — Repository-Review Locators for Targeted Fixes

**Phase:** Agent Infrastructure & Workflow Governance
**Status:** COMPLETE
**Commit:** pending (GIT: NONE)
**Agent/model:** Antigravity / Gemini 3.8 Flash

**Objective**

Integrar el sistema de localizadores de revisión externa (`LOCATOR`, `SOURCE_COMMIT`, `ISSUE`) al contrato de ejecución de prompts y al Prompt Gate, estableciendo una jerarquía determinística de eficiencia de tokens (`locator -> smallest relevant read -> incremental expansion`) para diagnósticos y correcciones focalizadas.

**Accepted prompt**

<details>
<summary>Prompt utilizado</summary>

```text
TASK: Integrate repository-review locators into the execution prompt system for targeted fixes.
RULESET: AGENT+REPO+DOCS
SCOPE:
PROMPT_CONTRACT.md
.agents/rules/01-prompt-gate.md
docs/agent-rules/
PROJECT_STATE.md
docs/PROJECT_JOURNAL.md
```
</details>

**Important decisions**

- **Campos opcionales en el Prompt Contract:** `LOCATOR`, `SOURCE_COMMIT` e `ISSUE` son campos opcionales; prompts existentes sin estos campos siguen funcionando sin cambios.
- **Sintaxis de localizadores soportada:** `LOCATOR: AUTO`, multilínea (`<path>[:start-end]\nsymbol=<name>`) o con barra vertical (`<path>[:start-end] | symbol=<name>`). La sintaxis inválida causa rechazo inmediato en el Prompt Gate en lugar de ser ignorada.
- **Semántica de líneas y símbolos:** Los números de línea son sugerencias vinculadas a `SOURCE_COMMIT`; si el árbol de trabajo se ha desplazado, `path + symbol` constituye el localizador durable.
- **Jerarquía de eficiencia de tokens:** Con un localizador concreto, se inspecciona primero el segmento o símbolo indicado; no se realizan lecturas completas de archivo ni escaneos amplios; la expansión de contexto es incremental y solo si la porción localizada resulta insuficiente. Con `LOCATOR: AUTO`, se busca primero el símbolo o rango relevante y se opera desde ese segmento.
- **Flujo de revisión documentado:** `cambios en repo -> commit/push -> revisión externa -> diagnóstico FILE+LINES+SYMBOL+CAUSE -> prompt Antigravity con LOCATOR -> corrección localizada -> verificación dirigida`.

**Changed/created**

- `PROMPT_CONTRACT.md`
- `.agents/rules/01-prompt-gate.md`
- `docs/agent-rules/workflows/diff-first.md`
- `docs/agent-rules/PROMPT_SHORTCUTS.md`
- `docs/agent-rules/core/context-budget.md`
- `PROJECT_STATE.md`
- `docs/PROJECT_JOURNAL.md`

**Verification**

- git diff --check: PASS
- npm run lint: PASS
- npm run test: PASS (13 files, 231 tests passed)
- npm run build: PASS

**Result**

El flujo de correcciones dirigidas basadas en revisiones de código queda formalizado, integrado en el Prompt Gate y documentado con plantillas canónicas y salvaguardas de tokens.

---

### 2026-09-25 — SAMED Dual AI Roles v1

**Phase:** Phase 1 / AI & Decision Support Architecture
**Status:** COMPLETE
**Commit:** pending (GIT: NONE)
**Agent/model:** Antigravity / Gemini 3.8 Flash

**Objective**

Implementar la arquitectura de doble rol de IA independiente para SAMED (Clinical Assistant y Pharmacy Assistant) con contratos Zod canónicos, aislamiento de contexto para evitar fugas del ClinicalContext hacia el Pharmacy Assistant, preservación explícita de datos no disponibles/faltantes, capa determinística de comparación de revisiones sin arbitraje de veracidad y ejecución mock desacoplada mediante interfaces de servicio agnósticas.

**Accepted prompt**

<details>
<summary>Prompt utilizado</summary>

```text
TASK: Implement SAMED Dual AI Roles v1.
RULESET: DOMAIN+DATA+RULES+TEST+DOCS
SCOPE:
src/domain/ai/
src/services/ai/
src/domain/prescription/
src/domain/clinical-context/
src/domain/findings/
docs/context/
docs/architecture/DECISIONS.md
PROJECT_STATE.md
```
</details>

**Important decisions**

- **Jerarquía de verdad inalterable:** Los datos determinísticos y los hallazgos de reglas clínicas son la única fuente de verdad; los modelos de IA son explicativos/sintéticos y nunca pueden sobreescribir hallazgos determinísticos. El profesional sanitario retiene en todo momento la autoridad decisoria final.
- **Aislamiento de contexto del Pharmacy Assistant:** El Pharmacy Assistant no recibe el `ClinicalContext` crudo, sino únicamente un `PharmacyReviewInput` estrictamente filtrado (propuesta de prescripción médica, diagnósticos relevantes, alergias, fármacos activos, observaciones seleccionadas, hallazgos deterministas y datos explícitamente no disponibles).
- **Invariante de prescripción médica:** La entidad `PrescriptionDraft` representa una prescripción propuesta autorada por un médico (`authorPhysicianId`). Los asistentes de IA no pueden crear ni aprobar prescripciones, y una prescripción nunca se fabrica si está ausente.
- **Estados de revisión farmacéutica:** `NO_ADDITIONAL_CONCERNS`, `REVIEW_RECOMMENDED` y `BLOCKED_BY_MISSING_DATA`.
- **Capa determinística ReviewComparison:** Compara de forma pura ambas revisiones exponiendo consideraciones compartidas, consideraciones exclusivas de cada asistente, discrepancias no resueltas y desacuerdos en datos faltantes. La capa de comparación nunca decide cuál IA tiene la razón.
- **Frontera de servicios agnóstica:** Las interfaces `ClinicalAssistantProvider` y `PharmacyAssistantProvider` residen en `src/services/ai/` con implementaciones deterministas mock para v1, sin conectar LLMs externos ni invocar IA dentro de componentes React.
- **DEC-011 registrado:** Se formalizó la decisión arquitectónica en `docs/architecture/DECISIONS.md`.

**Changed/created**

- `src/domain/prescription/schema.ts`, `src/domain/prescription/index.ts`
- `src/domain/ai/schema.ts`, `src/domain/ai/inputFilter.ts`, `src/domain/ai/comparison.ts`, `src/domain/ai/index.ts`
- `src/domain/index.ts`
- `src/services/ai/types.ts`, `src/services/ai/mockProviders.ts`, `src/services/ai/orchestrator.ts`, `src/services/ai/index.ts`
- `src/domain/ai/ai.test.ts`
- `docs/architecture/DECISIONS.md`
- `docs/context/DOMAIN_CONTEXT.md`
- `PROJECT_STATE.md`
- `docs/PROJECT_JOURNAL.md`

**Verification**

- git diff --check: PASS
- npm run lint: PASS
- npm run test: PASS (14 files, 239 tests passed)
- npm run build: PASS

**Result**

La arquitectura de doble rol de IA queda completamente implementada, tipada con esquemas Zod rigurosos, probada con 8 pruebas focalizadas de invariantes y documentada en los paquetes de contexto y registro de decisiones de SAMED.

---

## Próximos hitos importantes

Registrar aquí únicamente al completarse:

- Medication Review Visual Baseline integrado.
- Patients view integrada.
