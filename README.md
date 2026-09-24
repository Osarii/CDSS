# CDSS-CR — Clinical Decision Support System (Costa Rica)

> **Aviso de Seguridad Clínica:**  
> Este repositorio se encuentra actualmente en **fase de preparación técnica y arquitectura inicial**.  
> **Todos los datos son sintéticos.** No existe conexión ni integración real con sistemas hospitalarios ni con el EDUS de la CCSS. Las reglas clínicas definitivas y las pantallas operativas no han sido implementadas todavía.

---

## 1. ¿Qué es CDSS-CR?
CDSS-CR es un prototipo de Sistema de Soporte a Decisiones Clínicas (CDSS) diseñado para apoyar a profesionales de la salud en la revisión farmacoterapéutica, detección determinística de interacciones medicamentosas y evaluación de riesgos en contextos clínicos complejos.

### Principios Fundamentales
- **Datos 100% sintéticos:** Cumplimiento de privacidad y ética clínica.
- **Dato no disponible ≠ normal:** En CDSS-CR, `UNKNOWN !== NORMAL`, `MISSING !== NORMAL`, `UNAVAILABLE !== NORMAL` y `STALE !== NORMAL`. La falta de información se maneja explícitamente mediante el *Required Data Gate*.
- **Lógica determinística como fuente de verdad:** Las alertas e interacciones clínicas se originan en motores determinísticos (`json-rules-engine`), garantizando trazabilidad y reproducibilidad.
- **La IA es explicativa:** La IA futura nunca será la fuente de verdad clínica; el profesional de salud mantiene siempre la decisión final.
- **Sistema Visual Graphite + Bone + Aubergine:** UI sobria de alto contraste clínico, separando estrictamente los colores de marca de los tokens semánticos clínicos (`critical`, `warning`, `safe`, `low`, `missing`).

---

## 2. Stack Tecnológico
- **Frontend Core:** React 19, TypeScript, Vite.
- **Estilos:** Tailwind CSS v4, shadcn/ui (Radix UI), sistema de tokens Graphite + Bone + Aubergine.
- **Routing:** React Router v7.
- **Server/Data State:** TanStack Query, TanStack Table.
- **Validación y Formularios:** Zod, React Hook Form con resolvers.
- **Motor de Reglas Determinístico:** `json-rules-engine`.
- **Paneles:** `react-resizable-panels`.
- **Iconografía:** Lucide React.
- **Testing Unitario / Componentes:** Vitest, jsdom, React Testing Library.
- **Testing E2E:** Playwright (Chromium).
- **Design System / Componentes aislados:** Storybook 10 para React + Vite.
- **Mock API:** JSON Server (`db.json`).
- **Herramientas de Agente:** Serena MCP, RTK (Rust Token Killer), Reglas Ponytail (YAGNI).

---

## 3. Guía de Ejecución

### 3.1 Instalar dependencias
```bash
npm install
```

### 3.2 Iniciar Frontend en desarrollo (Vite)
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 3.3 Iniciar JSON Server (Mock API)
```bash
npm run api
```
El servidor de datos sintéticos estará disponible en `http://localhost:3001` con los endpoints de `patients`, `medications`, `allergies`, `conditions`, `observations`, `rules`, `findings` y `auditEvents`.

### 3.4 Ejecutar Tests Unitarios y de Integración (Vitest)
```bash
npm run test
# O en modo observador:
npm run test:watch
```

### 3.5 Ejecutar Tests E2E (Playwright)
```bash
npm run test:e2e
```

### 3.6 Ejecutar Storybook
```bash
npm run storybook
```
Storybook se abrirá en `http://localhost:6006`.

### 3.7 Compilación de producción y Linter
```bash
npm run lint
npm run build
```

---

## 4. Herramientas para Agentes de Desarrollo

### 4.1 Uso de RTK (Rust Token Killer)
RTK está configurado para optimizar el consumo de tokens en ejecuciones de terminal. Las reglas residen en `.agents/rules/antigravity-rtk-rules.md`.
```bash
rtk git status
rtk git diff
rtk npm test
rtk npm run build
```

### 4.2 Conexión con Serena MCP
Para habilitar Serena en Antigravity:
1. Asegurarse de tener Serena instalado (`command -v serena`).
2. Configurar el bloque en `~/.gemini/config/mcp_config.json` o `.agents/mcp_config.json`:
   ```json
   {
     "mcpServers": {
       "serena": {
         "command": "serena",
         "args": [
           "start-mcp-server",
           "--context=antigravity"
         ]
       }
     }
   }
   ```
3. Consultar las instrucciones detalladas en [docs/setup/SERENA_ANTIGRAVITY.md](file:///Users/osariii/Documents/proyecto_final/docs/setup/SERENA_ANTIGRAVITY.md).
4. Primera instrucción tras iniciar sesión con el agente:
   > *"Activate the current project using Serena's activation tool."*

### 4.3 Principios Ponytail
Consultar `.agents/rules/ponytail.md` y `AGENTS.md` antes de implementar cualquier nueva abstracción o agregar dependencias.
