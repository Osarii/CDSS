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

## Próximos hitos importantes

Registrar aquí únicamente al completarse:

- Prompt Gate + formato contractual de prompts.
- Alineación final del Design System.
- Domain Model v1.
- Synthetic Clinical Scenarios v1.
- Clinical Context Builder.
- Required Data Gate v1.
- Deterministic Findings v1.
- Primeras reglas DEMO.
- Dashboard Visual Baseline integrado.
- Medication Review Visual Baseline integrado.
