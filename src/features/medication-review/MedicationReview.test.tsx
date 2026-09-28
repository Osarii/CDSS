import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { MedicationReview } from '@/features/medication-review/MedicationReview'
import type { Medication, MedicationExposure } from '@/domain/medication/schema'
import type { ClinicalFinding } from '@/domain/findings/schema'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient()
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}

// ------------------------------------------------------------------
// Mock TanStack Query hooks used by MedicationReview
// ------------------------------------------------------------------
vi.mock('@/services/api/useClinicalData', () => ({
  useScenarios: vi.fn(),
  useScenario: vi.fn(),
  usePatients: vi.fn(),
  useScenarioEvaluation: vi.fn(),
  useDashboardSummary: vi.fn(),
}))

import * as clinicalData from '@/services/api/useClinicalData'

const mockScenario1 = {
  id: 'scen-syn-001',
  scenarioId: 'SYN-001',
  title: 'Outpatient T2D & Hypertension',
  description: 'Synthetic baseline outpatient scenario',
  evaluationFocus: ['routine_outpatient_therapy_review'],
  patientId: 'pat-syn-001',
  medicationIds: ['med-001', 'med-002', 'med-003'],
  medicationExposureIds: ['exp-001', 'exp-002', 'exp-003'],
  allergyIds: ['all-001'],
  conditionIds: ['cond-001'],
  observationIds: [],
  clinicalDataPointIds: ['dp-001'],
  evaluationTimestamp: '2026-09-25T10:00:00.000Z',
}

const mockScenario2 = {
  id: 'scen-syn-002',
  scenarioId: 'SYN-002',
  title: 'Renal Function Concern',
  description: 'Synthetic scenario with renal considerations',
  evaluationFocus: ['renal_safety'],
  patientId: 'pat-syn-002',
  medicationIds: ['med-004'],
  medicationExposureIds: ['exp-004'],
  allergyIds: [],
  conditionIds: [],
  observationIds: [],
  clinicalDataPointIds: [],
  evaluationTimestamp: '2026-09-25T10:00:00.000Z',
}

const mockMedications: Medication[] = [
  {
    id: 'med-001',
    code: 'IBU-600',
    name: 'Ibuprofeno',
    dosage: '600 mg',
    route: 'oral',
  },
  {
    id: 'med-002',
    code: 'ENA-20',
    name: 'Enalapril',
    dosage: '20 mg',
    route: 'oral',
  },
  {
    id: 'med-003',
    code: 'HCTZ-25',
    name: 'Hidroclorotiazida',
    dosage: '25 mg',
    route: 'oral',
  },
]

const mockExposures: MedicationExposure[] = [
  {
    id: 'exp-001',
    patientId: 'pat-syn-001',
    medicationId: 'med-001',
    therapyContext: 'acute',
    status: 'active',
    startedAt: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 'exp-002',
    patientId: 'pat-syn-001',
    medicationId: 'med-002',
    therapyContext: 'chronic',
    status: 'active',
    startedAt: '2022-03-10T00:00:00.000Z',
  },
  {
    id: 'exp-003',
    patientId: 'pat-syn-001',
    medicationId: 'med-003',
    therapyContext: 'unknown',
    status: 'active',
  },
]

const mockFindingCritical: ClinicalFinding = {
  id: 'finding-001',
  patientId: 'pat-syn-001',
  ruleId: 'DEMO-REN-001',
  ruleVersion: '1.0.0',
  severity: 'critical',
  title: 'DEMO: Alerta Triple Combinación Nefrotóxica',
  detail: 'Co-prescripción concurrente de AINE, IECA y diurético sin registro de analítica renal.',
  supportingDataKeys: ['med-001', 'med-002', 'med-003'],
  missingDataKeys: ['serum_creatinine', 'egfr'],
  timestamp: '2026-09-25T10:00:00.000Z',
  isDeterministic: true,
}

const mockFindingWarning: ClinicalFinding = {
  id: 'finding-002',
  patientId: 'pat-syn-001',
  ruleId: 'DEMO-DDI-001',
  ruleVersion: '1.0.0',
  severity: 'warning',
  title: 'DEMO: Riesgo de monitorización electrolítica',
  detail: 'Requiere seguimiento periódico de función renal y potasio.',
  supportingDataKeys: ['med-002'],
  missingDataKeys: [],
  timestamp: '2026-09-25T10:00:00.000Z',
  isDeterministic: true,
}

function buildEvaluationPayload(findings: ClinicalFinding[] = [mockFindingCritical, mockFindingWarning]) {
  return {
    context: {
      patient: {
        id: 'pat-syn-001',
        syntheticIdentifier: 'SYN-CR-001',
        age: 54,
        gender: 'female' as const,
      },
      medications: mockMedications,
      medicationExposures: mockExposures,
      allergies: [
        {
          id: 'all-001',
          patientId: 'pat-syn-001',
          substance: 'Penicilina',
          criticality: 'high' as const,
        },
      ],
      conditions: [
        {
          id: 'cond-001',
          patientId: 'pat-syn-001',
          code: 'I10',
          name: 'Hipertensión esencial',
        },
      ],
      observations: [],
      dataPoints: {
        serum_creatinine: {
          key: 'serum_creatinine',
          value: null,
          status: 'UNAVAILABLE' as const,
        },
        egfr: {
          key: 'egfr',
          value: null,
          status: 'UNAVAILABLE' as const,
        },
      },
      timestamp: '2026-09-25T10:00:00.000Z',
    },
    evaluation: {
      findings,
      results: [
        {
          ruleId: 'DEMO-REN-001',
          ruleVersion: '1.0.0',
          status: 'blocked' as const,
          gateResult: {
            canProceed: false,
            blockedReasons: ['MISSING'],
            failedRequirements: [
              { key: 'serum_creatinine', status: 'MISSING', reason: 'NOT_PRESENT' },
              { key: 'egfr', status: 'MISSING', reason: 'NOT_PRESENT' },
            ],
          },
        },
      ],
    },
  }
}

describe('MedicationReview — SAMED Visual Baseline v1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(clinicalData.useScenarios).mockReturnValue({
      data: [mockScenario1, mockScenario2],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof clinicalData.useScenarios>)

    vi.mocked(clinicalData.useDashboardSummary).mockReturnValue({
      scenarios: [mockScenario1, mockScenario2],
      evaluation: undefined,
      criticalCount: 1,
      warningCount: 1,
      blockedCount: 1,
      triggeredCount: 0,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof clinicalData.useDashboardSummary>)

    vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
      data: buildEvaluationPayload(),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof clinicalData.useScenarioEvaluation>)
  })

  // ----------------------------------------------------------------
  // 1. Loading & Error States
  // ----------------------------------------------------------------
  it('renders loading shimmer state when query is loading', () => {
    vi.mocked(clinicalData.useScenarios).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof clinicalData.useScenarios>)

    vi.mocked(clinicalData.useDashboardSummary).mockReturnValue({
      scenarios: [],
      evaluation: undefined,
      criticalCount: 0,
      warningCount: 0,
      blockedCount: 0,
      triggeredCount: 0,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof clinicalData.useDashboardSummary>)

    vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof clinicalData.useScenarioEvaluation>)

    renderWithProviders(<MedicationReview />)
    expect(screen.getByRole('status', { name: /cargando revisión farmacoterapéutica/i })).toBeInTheDocument()
  })

  it('renders error state when query encounters an error', () => {
    vi.mocked(clinicalData.useScenarios).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Fallo de conexión con servicio clínico'),
    } as unknown as ReturnType<typeof clinicalData.useScenarios>)

    renderWithProviders(<MedicationReview />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/error de carga/i)).toBeInTheDocument()
    expect(screen.getByText(/fallo de conexión con servicio clínico/i)).toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 2. Sticky Header & Simulation Disclaimers
  // ----------------------------------------------------------------
  it('renders top clinical header with search, active scenario selector and Dra. Ana Vargas profile', () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByPlaceholderText(/buscar paciente por nombre, cédula o n.º de expediente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/seleccionar escenario sintético activo/i)).toBeInTheDocument()
    expect(screen.getByText('Dra. Ana Vargas')).toBeInTheDocument()
    expect(screen.getByText(/medicina interna \| centro clínico simulado/i)).toBeInTheDocument()
  })

  it('renders explicit simulation notice and missing analytical data alert banner', () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByText(/entorno de exploración clínica · datos sintéticos con fines ilustrativos/i)).toBeInTheDocument()
    expect(screen.getByText('MODO SIMULADO')).toBeInTheDocument()
    expect(screen.getByText('Información clínica incompleta')).toBeInTheDocument()
    expect(screen.getByText('Parámetro regla DEMO-REN-001')).toBeInTheDocument()
    expect(screen.getAllByText('Dato no disponible ≠ normal').length).toBeGreaterThanOrEqual(1)
  })

  // ----------------------------------------------------------------
  // 3. Workspace Header & Patient Facts
  // ----------------------------------------------------------------
  it('renders workspace header with patient details and synthetic badge', () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByRole('heading', { name: 'Revisión Farmacoterapéutica' })).toBeInTheDocument()
    expect(screen.getByText('REGISTRO DE DEMOSTRACIÓN (SINTÉTICO)')).toBeInTheDocument()
    expect(screen.getByText('María Rodríguez')).toBeInTheDocument()
    expect(screen.getByText(/54 años \(Femenino\) · Sintético/i)).toBeInTheDocument()
    expect(screen.getByText('SYN-CR-001')).toBeInTheDocument()
    expect(screen.getByText(/alergia: penicilina/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar informe \(simulado\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ agregar medicamento \(simulado\)/i })).toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 4. Summary Risk Metrics Bar
  // ----------------------------------------------------------------
  it('renders 4 summary risk metric cards with correct metrics', () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByText('Carga Farmacológica')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1) // 3 mock medications
    expect(screen.getByText('fármacos concurrentes (Simulados)')).toBeInTheDocument()

    expect(screen.getByText('Hallazgo de alta prioridad')).toBeInTheDocument()
    expect(screen.getAllByText('Alerta Triple Combinación Nefrotóxica').length).toBeGreaterThanOrEqual(1)

    expect(screen.getByText('Revisión Analítica Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Vigilancia Temporal')).toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 5. Filter Chips Bar
  // ----------------------------------------------------------------
  it('renders filter chips and filters medication table accordingly', () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByRole('button', { name: /todos \(3\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /con hallazgos priorizados \(3\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /riesgo renal \/ nefrotóxico/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cardiovascular/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crónicos habituales/i })).toBeInTheDocument()

    // Click crónicos habituales filter
    fireEvent.click(screen.getByRole('button', { name: /crónicos habituales/i }))
    // Enalapril is chronic; Ibuprofen is acute and should be filtered out
    const table = screen.getByRole('table', { name: /tabla de prescripciones activas/i })
    expect(within(table).getByText('Enalapril')).toBeInTheDocument()
    expect(within(table).queryByText('Ibuprofeno')).not.toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 6. Medication Table & Row Selection
  // ----------------------------------------------------------------
  it('renders medication table with accurate columns and preserves temporal metadata', () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByRole('heading', { name: /prescripciones activas concurrentes/i })).toBeInTheDocument()
    expect(screen.getByText('Medicamento')).toBeInTheDocument()
    expect(screen.getByText('Dosis')).toBeInTheDocument()
    expect(screen.getByText('Frec.')).toBeInTheDocument()
    expect(screen.getByText('Vía')).toBeInTheDocument()
    expect(screen.getByText('Indicación')).toBeInTheDocument()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Riesgo / Estado')).toBeInTheDocument()

    // Table rows scoped to table
    const table = screen.getByRole('table', { name: /tabla de prescripciones activas/i })
    expect(within(table).getByText('Ibuprofeno')).toBeInTheDocument()
    expect(within(table).getByText('Enalapril')).toBeInTheDocument()
    expect(within(table).getByText('Hidroclorotiazida')).toBeInTheDocument()

    // Preserved temporal metadata without inferring unknown
    expect(within(table).getByText('Crónico')).toBeInTheDocument() // Enalapril
    expect(within(table).getByText('Agudo')).toBeInTheDocument() // Ibuprofen
    expect(within(table).getByText('Dato no inferido')).toBeInTheDocument() // HCTZ
  })

  it('updates selected medication when clicking a table row', () => {
    renderWithProviders(<MedicationReview />)

    // Initially Ibuprofen is selected due to critical finding
    expect(screen.getByText(/análisis del medicamento seleccionado: ibuprofeno/i)).toBeInTheDocument()

    // Click Enalapril row
    const enalaprilRow = screen.getByRole('button', { name: /seleccionar medicamento enalapril/i })
    fireEvent.click(enalaprilRow)

    // Inspector title should update to Enalapril
    expect(screen.getByText(/análisis del medicamento seleccionado: enalapril/i)).toBeInTheDocument()
  })


  // 8. Right Detail Inspector
  // ----------------------------------------------------------------
  // 8. Right Detail Inspector with Dual AI Roles v1 Progressive Workspace
  // ----------------------------------------------------------------
  it('renders right inspector with pauta, findings, profile, recommendations, Dual AI workspace, and actions', () => {
    renderWithProviders(<MedicationReview />)

    // Header & Regimen
    expect(screen.getByText(/fármaco seleccionado: demostración/i)).toBeInTheDocument()
    expect(screen.getByText(/análisis del medicamento seleccionado: ibuprofeno/i)).toBeInTheDocument()
    expect(screen.getByText('ALTA PRIORIDAD')).toBeInTheDocument()
    expect(screen.getByText('Pauta registrada')).toBeInTheDocument()
    expect(screen.getByText(/600 mg por vía oral cada 8 h/i)).toBeInTheDocument()

    // Profile & Missing Data
    expect(screen.getByText(/perfil farmacoterapéutico de referencia \(datos demostrativos\)/i)).toBeInTheDocument()
    expect(screen.getByText('Vía de eliminación')).toBeInTheDocument()
    expect(screen.getByText('Monitoreo sugerido')).toBeInTheDocument()
    expect(screen.getByText(/parámetro de regla:.*serum_creatinine/i)).toBeInTheDocument()

    // Consultative Considerations
    expect(screen.getByText(/consideraciones de revisión profesional \(consultivo\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/alerta triple combinación nefrotóxica/i).length).toBeGreaterThan(0)

    // Dual AI Roles v1 Progressive Workspace
    expect(screen.getByText('Revisión Dual con IA SAMED')).toBeInTheDocument()
    expect(screen.getByText('Roles Asistidos v1')).toBeInTheDocument()
    expect(screen.getByText('SAMED apoya la decisión. El profesional toma la decisión.')).toBeInTheDocument()
    expect(screen.getByText('Propuesta de Prescripción (Médico Tratante)')).toBeInTheDocument()
    expect(screen.getByText(/autor: dr-medico-tratante-demo/i)).toBeInTheDocument()
    expect(screen.getByText(/borrador de autoría médica exclusiva\. la ia no genera ni aprueba recetas\./i)).toBeInTheDocument()
    expect(screen.getByText(/análisis con ia pendiente/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ejecutar revisión dual con ia/i })).toBeInTheDocument()

    // Action buttons
    expect(screen.getByRole('button', { name: /registrar decisión profesional/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marcar como revisado/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar nota clínica/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /posponer revisión para próxima consulta/i })).toBeInTheDocument()

    // Traceability Card
    expect(screen.getByText('Regla Clínica: DEMO-REN-001 (v1.0.0)')).toBeInTheDocument()
    expect(screen.getByText('DEMOSTRACIÓN')).toBeInTheDocument()
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 9. Scenario Switching Interaction
  // ----------------------------------------------------------------
  it('allows switching synthetic scenarios via the select dropdown', () => {
    renderWithProviders(<MedicationReview />)

    const select = screen.getByLabelText(/seleccionar escenario sintético activo/i)
    fireEvent.change(select, { target: { value: 'scen-syn-002' } })

    expect(clinicalData.useScenarioEvaluation).toHaveBeenCalledWith('scen-syn-002')
  })

  // ----------------------------------------------------------------
  // 10. PrescriptionDraft Physician Authorship & Editing
  // ----------------------------------------------------------------
  it('supports editing and saving the physician-authored PrescriptionDraft', async () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByText('Propuesta de Prescripción (Médico Tratante)')).toBeInTheDocument()
    expect(screen.getByText(/autor: dr-medico-tratante-demo/i)).toBeInTheDocument()
    expect(screen.getAllByText('Ibuprofeno').length).toBeGreaterThan(0)

    // Enter edit mode
    const editBtn = screen.getByRole('button', { name: /editar propuesta/i })
    fireEvent.click(editBtn)

    // Form inputs should now be visible
    expect(screen.getByPlaceholderText('Nombre del medicamento')).toBeInTheDocument()
    const dosageInput = screen.getByPlaceholderText('Ej: 400 mg')
    expect(dosageInput).toBeInTheDocument()

    // Change dosage
    fireEvent.change(dosageInput, { target: { value: '400 mg' } })

    // Save changes
    const saveBtn = screen.getByRole('button', { name: /guardar cambios/i })
    fireEvent.click(saveBtn)

    // Verified updated draft is displayed
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Ej: 400 mg')).not.toBeInTheDocument()
      expect(screen.getByText(/400 mg/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/autor: dr-medico-tratante-demo/i)).toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 11. Dual AI Review Blocked When PrescriptionDraft Is Absent
  // ----------------------------------------------------------------
  it('prevents Dual AI review execution when PrescriptionDraft is deleted/absent', async () => {
    renderWithProviders(<MedicationReview />)

    // Clear draft
    const deleteBtn = screen.getByRole('button', { name: /eliminar propuesta/i })
    fireEvent.click(deleteBtn)

    // Draft is gone, blocked notice shown
    expect(screen.getByText(/sin propuesta médica activa/i)).toBeInTheDocument()

    // Dual review button is disabled
    const runBtn = screen.getByRole('button', { name: /ejecutar revisión dual con ia/i })
    expect(runBtn).toBeDisabled()

    // Restore draft
    const createBtn = screen.getByRole('button', { name: /crear propuesta médica inicial/i })
    fireEvent.click(createBtn)

    expect(screen.getByText('Propuesta de Prescripción (Médico Tratante)')).toBeInTheDocument()
    expect(runBtn).toBeEnabled()
  })

  // ----------------------------------------------------------------
  // 12. Dual AI Review Execution: Clinical Assistant, Pharmacy Assistant, & Neutral Comparison
  // ----------------------------------------------------------------
  it('executes Dual AI review and progressively displays Clinical Assistant, Pharmacy Assistant, and neutral Comparison without declaring a winner', async () => {
    renderWithProviders(<MedicationReview />)

    // Initially downstream review is pending
    expect(screen.getByText(/análisis con ia pendiente/i)).toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: /secciones de revisión dual/i })).not.toBeInTheDocument()

    // Click run button
    const runBtn = screen.getByRole('button', { name: /ejecutar revisión dual con ia/i })
    fireEvent.click(runBtn)

    // Clinical Assistant tab panel is active by default
    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: /asistente clínico samed/i })).toBeInTheDocument()
    })

    expect(screen.getByText('Síntesis Clínica')).toBeInTheDocument()
    expect(screen.getByText(/brechas de datos identificadas \(dato faltante ≠ normal\):/i)).toBeInTheDocument()
    expect(screen.getAllByText('UNAVAILABLE').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/serum_creatinine/i).length).toBeGreaterThan(0)
    expect(screen.getByText('finding-001')).toBeInTheDocument()

    // Switch to Pharmacy Assistant tab
    const pharmacyTab = screen.getByRole('tab', { name: /revisión farmacéutica/i })
    fireEvent.click(pharmacyTab)

    expect(screen.getByRole('tabpanel', { name: /revisión farmacéutica samed/i })).toBeInTheDocument()
    expect(screen.getByText('BLOQUEADO POR DATOS FALTANTES')).toBeInTheDocument()
    expect(screen.getByText(/entrada farmacoterapéutica controlada \(sin acceso directo al contexto clínico crudo\)\./i)).toBeInTheDocument()
    expect(screen.getByText(/datos requeridos ausentes para validación:/i)).toBeInTheDocument()

    // Switch to Comparison tab
    const comparisonTab = screen.getByRole('tab', { name: /comparación/i })
    fireEvent.click(comparisonTab)

    expect(screen.getByRole('tabpanel', { name: /comparación de revisiones/i })).toBeInTheDocument()
    expect(screen.getByText('Sin Ganador')).toBeInTheDocument()
    expect(screen.getByText(/evaluación comparativa sin selección de ganador: el profesional médico evalúa las diferencias y retiene la autoridad decisoria\./i)).toBeInTheDocument()

    // Prohibited words check
    expect(screen.queryByText(/receta segura/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/aprobado por ia/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/la ia médica tiene razón/i)).not.toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 13. Scenario Switch Clears Stale AI Review Results
  // ----------------------------------------------------------------
  it('clears stale Dual AI review results and resets draft when switching scenario', async () => {
    renderWithProviders(<MedicationReview />)

    // Run AI review
    const runBtn = screen.getByRole('button', { name: /ejecutar revisión dual con ia/i })
    fireEvent.click(runBtn)

    await waitFor(() => {
      expect(screen.getByRole('tabpanel', { name: /asistente clínico samed/i })).toBeInTheDocument()
    })

    // Switch scenario
    const select = screen.getByLabelText(/seleccionar escenario sintético activo/i)
    fireEvent.change(select, { target: { value: 'scen-syn-002' } })

    // Stale review results should be cleared immediately
    await waitFor(() => {
      expect(screen.queryByRole('tabpanel', { name: /asistente clínico samed/i })).not.toBeInTheDocument()
      expect(screen.getByText(/análisis con ia pendiente/i)).toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // 14. Controlled Pharmacy Input & Deterministic Finding Immutability
  // ----------------------------------------------------------------
  it('preserves controlled boundary for pharmacy review and keeps deterministic findings immutable', async () => {
    const payload = buildEvaluationPayload()
    const draft = {
      id: 'draft-test-01',
      patientId: 'pat-syn-001',
      authorPhysicianId: 'dr-medico-tratante-demo',
      status: 'draft' as const,
      createdAt: '2026-09-25T10:00:00.000Z',
      items: [
        {
          id: 'item-01',
          medicationCode: 'IBU-600',
          medicationName: 'Ibuprofeno',
          dosage: '600 mg',
          route: 'oral',
          frequency: 'cada 8 horas',
        },
      ],
    }

    const { executeDualAIRoles } = await import('@/services/ai')
    const originalFindings = [mockFindingCritical]

    const result = await executeDualAIRoles({
      context: payload.context,
      proposedPrescription: draft,
      deterministicFindings: originalFindings,
    })

    // Deterministic findings remain identical and untouched
    expect(result.deterministicFindings).toHaveLength(1)
    expect(result.deterministicFindings[0].id).toBe('finding-001')
    expect(result.deterministicFindings[0].severity).toBe('critical')

    // Clinical and Pharmacy reviews are independent
    expect(result.clinicalSummary.role).toBe('clinical_assistant')
    expect(result.pharmacyReview.role).toBe('pharmacy_assistant')
    expect(result.comparison.unresolvedDiscrepancies).toBeDefined()
  })

  // ----------------------------------------------------------------
  // 15. Regression: Clinical Consistency & Deterministic Findings as Single Source of Truth
  // ----------------------------------------------------------------
  describe('Clinical Consistency & Deterministic Findings as Single Source of Truth', () => {
    it('handles zero findings cleanly: no false critical badges, no hemodynamic diagram, neutral state', () => {
      const payload = buildEvaluationPayload([])
      payload.evaluation.results = [
        {
          ruleId: 'RULE-OK',
          status: 'passed' as const,
        } as never,
      ]
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: payload,
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<MedicationReview />)

      // 1. Metric card 2 shows neutral state
      expect(screen.getByText('Sin alertas críticas activas')).toBeInTheDocument()

      // 2. Hemodynamic illustration card is NOT rendered
      expect(screen.queryByText(/fisiopatología de la triple combinación/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/vasodilatación arteriola aferente/i)).not.toBeInTheDocument()

      // 3. Medication table shows neutral finding state
      expect(screen.getAllByText('Sin hallazgos activos en esta revisión').length).toBe(3)
      expect(screen.getByText('Sin hallazgos clínicos directos')).toBeInTheDocument()
      expect(screen.queryByText('Alerta Triple Combinación Nefrotóxica')).not.toBeInTheDocument()

      // 4. Traceability card is NOT rendered without active findings
      expect(screen.queryByText(/regla clínica: demo-ren-001/i)).not.toBeInTheDocument()
    })

    it('renders missing analytical data notice only when evaluation has blocked rules', () => {
      // With blocked rules
      const blockedPayload = buildEvaluationPayload([])
      blockedPayload.evaluation.results = [
        {
          ruleId: 'DEMO-REN-001',
          ruleVersion: '1.0.0',
          status: 'blocked' as const,
          gateResult: {
            canProceed: false,
            blockedReasons: ['MISSING'],
            failedRequirements: [
              { key: 'serum_creatinine', status: 'MISSING', reason: 'NOT_PRESENT' },
            ],
          },
        },
      ]
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: blockedPayload,
        isLoading: false,
        error: null,
      } as never)

      const { unmount } = renderWithProviders(<MedicationReview />)

      expect(screen.getByText(/información clínica incompleta/i)).toBeInTheDocument()
      expect(screen.getByText(/parámetro de regla:.*serum_creatinine/i)).toBeInTheDocument()
      unmount()

      // Without blocked rules
      const cleanPayload = buildEvaluationPayload([])
      cleanPayload.evaluation.results = [
        {
          ruleId: 'DEMO-REN-001',
          status: 'not_triggered' as const,
        } as never,
      ]
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: cleanPayload,
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<MedicationReview />)

      expect(screen.queryByText(/información clínica incompleta/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/parámetro de regla:/i)).not.toBeInTheDocument()
    })

    it('renders only real context.allergies and does not inject scenario-based fallbacks', () => {
      // When allergies array is empty
      const noAllergyPayload = buildEvaluationPayload([])
      noAllergyPayload.context.allergies = []
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: noAllergyPayload,
        isLoading: false,
        error: null,
      } as never)

      const { unmount } = renderWithProviders(<MedicationReview />)

      expect(screen.queryByText(/penicilina/i)).not.toBeInTheDocument()
      unmount()

      // When allergies has a specific drug
      const customAllergyPayload = buildEvaluationPayload([])
      customAllergyPayload.context.allergies = [
        {
          id: 'all-sulfa',
          patientId: 'pat-syn-001',
          substance: 'Sulfamidas',
          criticality: 'high' as const,
        },
      ]
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: customAllergyPayload,
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<MedicationReview />)

      expect(screen.getByText(/alergia:\s*sulfamidas/i)).toBeInTheDocument()
      expect(screen.queryByText(/penicilina/i)).not.toBeInTheDocument()
    })

    it('ensures medication risk badges in table derive solely from actual findings', () => {
      // Only 1 finding targeting med-002 (Enalapril)
      const singleMedFinding: ClinicalFinding = {
        id: 'finding-ena',
        patientId: 'pat-syn-001',
        ruleId: 'DEMO-DDI-001',
        ruleVersion: '1.0.0',
        severity: 'warning',
        title: 'Precaución con Enalapril',
        detail: 'Monitorizar potasio.',
        supportingDataKeys: ['med-002'],
        missingDataKeys: [],
        timestamp: '2026-09-25T10:00:00.000Z',
        isDeterministic: true,
      }

      const payload = buildEvaluationPayload([singleMedFinding])
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: payload,
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<MedicationReview />)

      // med-002 has Precaución con Enalapril
      expect(screen.getByText('Precaución con Enalapril')).toBeInTheDocument()

      // med-001 (Ibuprofeno) and med-003 (HCTZ) have neutral safe status in table
      expect(screen.getAllByText('Sin hallazgos activos en esta revisión').length).toBe(2)
    })

    it('never renders the removed unsupported triple-whammy hemodynamic diagram even when DEMO-REN-001 finding is active', () => {
      renderWithProviders(<MedicationReview />)

      // Confirm default render has DEMO-REN-001 finding active in inspector/table
      expect(screen.getAllByText(/alerta triple combinación nefrotóxica/i).length).toBeGreaterThan(0)

      // Confirm unsupported triple-whammy diagram elements are not in the DOM
      expect(screen.queryByRole('heading', { name: /relación considerada por la regla de demostración/i })).not.toBeInTheDocument()
      expect(screen.queryByText(/contenido clínico ilustrativo · pendiente de validación experta/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/modelo de arteriola aferente/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/modelo de arteriola eferente/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/vasodilatación renal atenuada/i)).not.toBeInTheDocument()
    })
  })
})
