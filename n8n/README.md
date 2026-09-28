# SAMED — n8n AI Workflows (Gemini Clinical Assistant & Qwen Pharmacy Assistant)

Este directorio contiene los flujos de trabajo importables de **n8n** diseñados para satisfacer los contratos de los proveedores remotos de IA de SAMED (`RemoteClinicalAssistantProvider` y `RemotePharmacyAssistantProvider`).

---

## 1. Principios de Seguridad Clínica & Invariantes

- **Hallazgos Determinísticos Autoritativos:** Los hallazgos determinísticos (`evaluation.findings` / `deterministicFindings`) son hallazgos determinísticos autoritativos dentro del prototipo SAMED. Ningún flujo de IA puede crear, modificar, sustituir o descartar hallazgos de regla.
- **Rechazo Controlado de Salidas Malformadas:** Si el proveedor remoto (Gemini o Qwen) retorna un error HTTP o una respuesta no estructurada/incompleta, el flujo de n8n devuelve una respuesta de error explícita y controlada (`error: true`). El límite remoto de SAMED rechaza el resultado mediante validación Zod sin fabricar resúmenes ficticios y preservando los hallazgos determinísticos intactos.
- **Aislamiento de Límites (Controlled Boundary):**
  - **Clinical Assistant (Gemini):** Recibe la instantánea permitida de `ClinicalContext` + hallazgos determinísticos + borrador de receta. No puede autorizar ni emitir prescripciones.
  - **Pharmacy Assistant (Qwen):** Recibe **únicamente** la entrada controlada `PharmacyReviewInput` (borrador propuesto, medicación activa, alergias, diagnósticos relevantes, observaciones analíticas, hallazgos y brechas). **Nunca recibe el `ClinicalContext` crudo**.
- **Autoridad Profesional:** Toda salida de IA es consultiva y de soporte; la autoridad de decisión recae exclusivamente en el profesional médico.
- **Dato Faltante ≠ Normal:** Si faltan datos clínicos (ej. creatinina/potasio), el estado farmacéutico es `BLOCKED_BY_MISSING_DATA`.
- **Sin Secretos en Frontend:** Ni React ni las variables `VITE_*` contienen claves API de proveedores LLM. Las credenciales residen exclusivamente en el entorno de n8n.

---

## 2. Flujos de Trabajo Incluidos

| Archivo | Rol | Modelo | Proveedor | Ruta Webhook por Defecto |
| :--- | :--- | :--- | :--- | :--- |
| `clinical-assistant-workflow.json` | Asistente Clínico | `gemini-3.5-flash-lite` | Google Gemini API | `POST /webhook/samed-clinical-assistant` |
| `pharmacy-assistant-workflow.json` | Asistente Farmacéutico | `qwen/qwen3.8-27b` | Groq API | `POST /webhook/samed-pharmacy-assistant` |

---

## 3. Guía de Configuración e Importación en n8n

### Paso 1: Importar en n8n
1. Abre tu instancia de n8n.
2. Ve a **Workflows** → **Add Workflow** → Menú de tres puntos (arriba a la derecha) → **Import from File...**.
3. Selecciona `clinical-assistant-workflow.json` y repite para `pharmacy-assistant-workflow.json`.

### Paso 2: Configurar Credenciales en n8n
Las credenciales se gestionan a través de variables de entorno de n8n o nodos de credencial:
- **Para Gemini:**
  - Variable de entorno en n8n: `GEMINI_API_KEY=<tu_clave_api_gemini>`
  - O edita el nodo HTTP Request y reemplaza `'REPLACE_WITH_GEMINI_API_KEY'` por tu credencial Header Auth `x-goog-api-key`.
- **Para Groq (Qwen):**
  - Variable de entorno en n8n: `GROQ_API_KEY=<tu_clave_api_groq>`
  - O edita el nodo HTTP Request y reemplaza `'REPLACE_WITH_GROQ_API_KEY'` por tu Header Auth `Authorization: Bearer <clave>`.

### Paso 3: Activar los Webhooks
- Haz clic en **Save** y cambia el interruptor a **Active** en ambos flujos.
- Copia las URLs de producción o test de los nodos Webhook:
  - Gemini: `http(s)://<tu-instancia-n8n>/webhook/samed-clinical-assistant`
  - Qwen: `http(s)://<tu-instancia-n8n>/webhook/samed-pharmacy-assistant`

### Paso 4: Configurar Frontend SAMED (.env.local)
En el frontend de SAMED, configura las URLs no secretas en tu archivo `.env.local`:
```bash
# Modo de proveedor AI: 'mock' (defecto) o 'remote'
VITE_AI_PROVIDER_MODE=remote

# Webhooks n8n (URLs no secretas)
VITE_N8N_GEMINI_WEBHOOK_URL=http://localhost:5678/webhook/samed-clinical-assistant
VITE_N8N_QWEN_WEBHOOK_URL=http://localhost:5678/webhook/samed-pharmacy-assistant
```

---

## 4. Contratos de Datos y Esquemas Zod

### Clinical Assistant (Gemini)
- **Entrada esperada:**
  ```json
  {
    "context": { "patient": { ... }, "conditions": [], "allergies": [], "medications": [], "observations": [], ... },
    "deterministicFindings": [ { "id": "...", "severity": "critical", ... } ],
    "proposedPrescription": { "id": "...", "items": [ ... ] }
  }
  ```
- **Salida retornada (valida contra `clinicalAssessmentSummarySchema`):**
  ```json
  {
    "id": "ca-summary-pat-syn-001-1727500000000",
    "patientId": "pat-syn-001",
    "summary": "Texto narrativo de evaluación clínica...",
    "clinicalConsiderations": [ "Consideración 1", "Consideración 2" ],
    "dataAvailabilityGaps": [
      { "key": "serum_creatinine", "status": "MISSING", "reason": "No registrado" }
    ],
    "deterministicFindingsReferenced": [ "finding-001" ],
    "generatedAt": "2026-09-28T10:00:00.000Z",
    "role": "clinical_assistant"
  }
  ```

### Pharmacy Assistant (Qwen)
- **Entrada esperada (Controlled Boundary):**
  ```json
  {
    "input": {
      "patientId": "pat-syn-001",
      "proposedPrescription": { "id": "...", "items": [ ... ] },
      "relevantDiagnoses": [ ... ],
      "allergies": [ ... ],
      "currentMedications": [ ... ],
      "relevantObservations": [ ... ],
      "deterministicFindings": [ ... ],
      "unavailableData": [ ... ]
    }
  }
  ```
- **Salida retornada (valida contra `pharmacyReviewSchema`):**
  ```json
  {
    "id": "pr-review-pat-syn-001-1727500000000",
    "patientId": "pat-syn-001",
    "prescriptionDraftId": "draft-001",
    "status": "BLOCKED_BY_MISSING_DATA",
    "summary": "Revisión farmacológica independiente...",
    "pharmacologicalConsiderations": [ "Observación farmacológica 1" ],
    "requiredDataGaps": [
      { "key": "serum_creatinine", "status": "MISSING" }
    ],
    "deterministicFindingsReferenced": [ "finding-001" ],
    "reviewedAt": "2026-09-28T10:00:00.000Z",
    "role": "pharmacy_assistant"
  }
  ```
