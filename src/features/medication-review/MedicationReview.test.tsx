import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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
          status: 'blocked' as const,
          reason: 'Faltan parámetros requeridos: serum_creatinine, egfr',
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
    expect(screen.getByText('Priorizado (Triple combinación)')).toBeInTheDocument()

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

  // ----------------------------------------------------------------
  // 7. Hemodynamic Mechanism Illustration Block
  // ----------------------------------------------------------------
  it('renders hemodynamic illustration block with 3 interactive nodes', () => {
    renderWithProviders(<MedicationReview />)

    expect(screen.getByRole('heading', { name: /relación considerada por la regla de demostración/i })).toBeInTheDocument()
    expect(screen.getByText(/contenido clínico ilustrativo · pendiente de validación experta/i)).toBeInTheDocument()
    expect(screen.getByText(/modelo farmacológico considerado por la regla/i)).toBeInTheDocument()

    // 3 nodes
    expect(screen.getByText('AINE (Ibuprofeno)')).toBeInTheDocument()
    expect(screen.getByText('Vasodilatación renal atenuada')).toBeInTheDocument()
    expect(screen.getByText('Modelo de arteriola aferente')).toBeInTheDocument()

    expect(screen.getByText('IECA (Enalapril)')).toBeInTheDocument()
    expect(screen.getByText('Resistencia eferente reducida')).toBeInTheDocument()
    expect(screen.getByText('Modelo de arteriola eferente')).toBeInTheDocument()

    expect(screen.getByText('Diurético (HCTZ)')).toBeInTheDocument()
    expect(screen.getByText('Volumen intravascular')).toBeInTheDocument()
    expect(screen.getByText('Flujo renal de referencia')).toBeInTheDocument()
  })

  // ----------------------------------------------------------------
  // 8. Right Detail Inspector
  // ----------------------------------------------------------------
  it('renders right inspector with pauta, findings, profile, recommendations, AI explanation, and actions', () => {
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
    expect(screen.getByText(/parámetro de regla: creatinina sérica no registrada en últimos 6 meses/i)).toBeInTheDocument()

    // Consultative Considerations
    expect(screen.getByText(/consideraciones de revisión profesional \(consultivo\)/i)).toBeInTheDocument()
    expect(screen.getByText(/opción de valoración analgésica/i)).toBeInTheDocument()

    // AI Explanation Box
    expect(screen.getByText('Explicación con IA')).toBeInTheDocument()
    expect(screen.getByText(/generado con ia/i)).toBeInTheDocument()
    expect(screen.getByText(/la explicación generada complementa la información del sistema y no sustituye el juicio clínico profesional/i)).toBeInTheDocument()

    // Action buttons
    expect(screen.getByRole('button', { name: /registrar decisión profesional/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marcar como revisado/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar nota clínica/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /posponer revisión para próxima consulta/i })).toBeInTheDocument()

    // Traceability Card
    expect(screen.getByText('Regla Clínica: DEMO-REN-001 (v0.1)')).toBeInTheDocument()
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
})
