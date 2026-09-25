/**
 * Dashboard Visual Baseline — UI Integration Tests
 *
 * Verifies that the Dashboard component renders correctly with the SAMED
 * design system tokens and behaves correctly with loading, error, and data states.
 * Uses a JsonServerAdapter with in-memory db to avoid HTTP calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderScreen } from '@/components/layout/PlaceholderScreen'
import type { RuleEvaluationResult } from '@/domain/rules/evaluator'

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
// Mock the TanStack Query hooks used by Dashboard.
// This isolates UI rendering from network / adapter layer.
// ------------------------------------------------------------------
vi.mock('@/services/api/useClinicalData', () => ({
  useScenarios: vi.fn(),
  useScenario: vi.fn(),
  usePatients: vi.fn(),
  useScenarioEvaluation: vi.fn(),
  useDashboardSummary: vi.fn(),
}))

import * as clinicalData from '@/services/api/useClinicalData'

const mockScenario = {
  id: 'scen-syn-001',
  scenarioId: 'SYN-001',
  title: 'Escenario DEMO Beta-Lactam Allergy',
  description: 'Paciente sintético con alergia a penicilina',
  evaluationFocus: ['beta_lactam_allergy', 'polypharmacy'],
  patientId: 'PAT-001',
  medicationIds: ['med-001'],
  medicationExposureIds: ['exp-001'],
  allergyIds: ['allergy-001'],
  conditionIds: ['cond-001'],
  observationIds: [],
  clinicalDataPointIds: ['dp-001'],
  evaluationTimestamp: '2026-09-25T10:00:00.000Z',
}

const mockFindingCritical = {
  id: 'finding-001',
  patientId: 'PAT-001',
  ruleId: 'DEMO-ALG-001',
  ruleVersion: '1.0.0',
  severity: 'critical' as const,
  title: 'DEMO: Beta-Lactam / Penicillin Allergy Warning',
  detail: 'Synthetic alert: patient has penicillin allergy and amoxicillin prescription.',
  supportingDataKeys: ['allergy-001', 'med-001'],
  missingDataKeys: [],
  timestamp: '2026-09-25T10:00:00.000Z',
  isDeterministic: true as const,
}

const mockFindingWarning = {
  id: 'finding-002',
  patientId: 'PAT-001',
  ruleId: 'DEMO-DDI-001',
  ruleVersion: '1.0.0',
  severity: 'warning' as const,
  title: 'DEMO: Amiodarone and Spironolactone Interaction',
  detail: 'Synthetic alert: co-administration of amiodarone and spironolactone.',
  supportingDataKeys: ['med-002', 'med-003', 'potassium'],
  missingDataKeys: [],
  timestamp: '2026-09-25T10:00:00.000Z',
  isDeterministic: true as const,
}

const mockFindingLow = {
  id: 'finding-003',
  patientId: 'PAT-001',
  ruleId: 'DEMO-REN-001',
  ruleVersion: '1.0.0',
  severity: 'low' as const,
  title: 'DEMO: Renal Monitoring Recommendation',
  detail: 'Synthetic alert: routine follow-up recommended.',
  supportingDataKeys: ['dp-001'],
  missingDataKeys: [],
  timestamp: '2026-09-25T10:00:00.000Z',
  isDeterministic: true as const,
}

const mockMultipleFindings = [mockFindingCritical, mockFindingWarning, mockFindingLow]

const mockScenario2 = {
  id: 'scen-syn-002',
  scenarioId: 'SYN-002',
  title: 'Escenario DEMO Penicillin Allergy High Risk',
  description: 'Paciente sintético con alergia a penicilina y amoxicilina',
  evaluationFocus: ['beta_lactam_allergy'],
  patientId: 'PAT-002',
  medicationIds: ['med-002'],
  medicationExposureIds: ['exp-002'],
  allergyIds: ['allergy-002'],
  conditionIds: ['cond-002'],
  observationIds: [],
  clinicalDataPointIds: ['dp-002'],
  evaluationTimestamp: '2026-09-25T10:00:00.000Z',
}

const mockBlockedResult: RuleEvaluationResult = {
  ruleId: 'DEMO-REN-001',
  ruleVersion: '1.0.0',
  status: 'blocked' as const,
  gateResult: {
    canProceed: false,
    blockedReasons: ['MISSING' as const, 'MISSING' as const],
    failedRequirements: [
      { key: 'serum_creatinine', status: 'MISSING' as const, reason: 'NOT_PRESENT' as const },
      { key: 'egfr', status: 'MISSING' as const, reason: 'NOT_PRESENT' as const },
    ],
  },
}

const mockTriggeredResult = {
  ruleId: 'DEMO-ALG-001',
  ruleVersion: '1.0.0',
  status: 'triggered' as const,
  gateResult: { canProceed: true, blockedReasons: [], failedRequirements: [] },
  finding: mockFindingCritical,
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

describe('Dashboard Visual Baseline — 1:1 Stitch Converged', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Loading state ---
  describe('Loading state', () => {
    it('shows loading indicators when data is loading', () => {
      vi.mocked(clinicalData.useDashboardSummary).mockReturnValue({
        scenarios: [],
        evaluation: undefined,
        criticalCount: 0,
        warningCount: 0,
        blockedCount: 0,
        triggeredCount: 0,
        isLoading: true,
        error: null,
      })
      vi.mocked(clinicalData.useScenarios).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as never)
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as never)

      renderWithProviders(<Dashboard />)

      expect(screen.getByRole('status', { name: /cargando panel clínico/i })).toBeInTheDocument()
    })
  })

  // --- Error state ---
  describe('Error state', () => {
    it('shows error panel when data fails to load', () => {
      const error = new Error('Red clínica no disponible')
      vi.mocked(clinicalData.useDashboardSummary).mockReturnValue({
        scenarios: [],
        evaluation: undefined,
        criticalCount: 0,
        warningCount: 0,
        blockedCount: 0,
        triggeredCount: 0,
        isLoading: false,
        error,
      })
      vi.mocked(clinicalData.useScenarios).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as never)
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as never)

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Error de carga')).toBeInTheDocument()
      expect(screen.getByText('Red clínica no disponible')).toBeInTheDocument()
    })
  })

  // --- Data state ---
  describe('Data state', () => {
    beforeEach(() => {
      vi.mocked(clinicalData.useDashboardSummary).mockReturnValue({
        scenarios: [mockScenario],
        evaluation: {
          context: {} as never,
          evaluation: {
            findings: [mockFindingCritical, mockFindingWarning],
            results: [mockTriggeredResult, mockBlockedResult],
          },
        },
        criticalCount: 1,
        warningCount: 1,
        blockedCount: 1,
        triggeredCount: 1,
        isLoading: false,
        error: null,
      })
      vi.mocked(clinicalData.useScenarios).mockReturnValue({
        data: [mockScenario],
        isLoading: false,
        error: null,
      } as never)
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: {
          context: {} as never,
          evaluation: {
            findings: [mockFindingCritical, mockFindingWarning],
            results: [mockTriggeredResult, mockBlockedResult],
          },
        },
        isLoading: false,
        error: null,
      } as never)
    })

    it('renders the dashboard main workspace with search and clinician profile', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByRole('main', { name: 'Panel clínico SAMED' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Buscar paciente simulado por nombre/i)).toBeInTheDocument()
      expect(screen.getByText('Dra. Ana Vargas')).toBeInTheDocument()
    })

    it('renders the patient context card with patient name and clinical tags', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByRole('heading', { level: 1, name: /María Rodríguez/i })).toBeInTheDocument()
      expect(screen.getByText(/1-0756-0890/i)).toBeInTheDocument()
      expect(screen.getByText(/#234567/i)).toBeInTheDocument()
      expect(screen.getByText(/Curridabat Centro/i)).toBeInTheDocument()
    })

    it('shows the synthetic data tag prominently in disclaimer banner', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByText(/Entorno de exploración clínica/i)).toBeInTheDocument()
      expect(screen.getByText(/DATOS SINTÉTICOS/i)).toBeInTheDocument()
    })

    it('renders missing data warning banner and safety axiom', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByRole('region', { name: /aviso de información clínica incompleta/i })).toBeInTheDocument()
      expect(screen.getByText('Información clínica incompleta')).toBeInTheDocument()
      expect(screen.getAllByText(/Dato no disponible ≠ normal/i).length).toBeGreaterThanOrEqual(1)
    })

    it('exposes required-data failure state for blocked rules in missing data banner', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByText(/serum_creatinine/i)).toBeInTheDocument()
    })

    it('renders active medications table', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByRole('heading', { name: /medicamentos activos/i })).toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Medicamento')).toBeInTheDocument()
      expect(screen.getByText('Dosis')).toBeInTheDocument()
      expect(screen.getByText('Frecuencia')).toBeInTheDocument()
      expect(screen.getByText('Indicación')).toBeInTheDocument()
    })

    it('renders prioritized alerts panel with ALTA and MEDIA badges', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByRole('region', { name: /alertas priorizadas/i })).toBeInTheDocument()
      expect(screen.getAllByText('ALTA').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('MEDIA').length).toBeGreaterThanOrEqual(1)
    })

    it('shows the finding title for critical finding', () => {
      renderWithProviders(<Dashboard />)
      expect(
        screen.getAllByText('DEMO: Beta-Lactam / Penicillin Allergy Warning').length
      ).toBeGreaterThanOrEqual(1)
    })

    it('renders why alert was generated section with evidence, missing data and rule traceability', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.getByRole('region', { name: /justificación clínica de la alerta/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '¿Por qué se generó esta alerta?' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Evidencia clínica' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Datos faltantes' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Trazabilidad de regla' })).toBeInTheDocument()
      expect(screen.getAllByText('DEMO-ALG-001').length).toBeGreaterThanOrEqual(1)
    })

    it('has the alert detail inspector hidden by default', () => {
      renderWithProviders(<Dashboard />)
      expect(screen.queryByRole('region', { name: /detalle de alerta clínica/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('region', { name: /explicación con ia y auditoría/i })).not.toBeInTheDocument()
    })

    it('renders the alert inspector trigger with icon, alert count, and subtle pulsing state', () => {
      renderWithProviders(<Dashboard />)
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('data-active', 'false')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      // Icon renders
      const iconWrapper = screen.getByTestId('alert-trigger-icon')
      expect(iconWrapper).toBeInTheDocument()
      expect(iconWrapper).toHaveClass('alert-trigger-pulse--critical')

      // Alert count renders (2 findings in mock)
      const badge = screen.getByTestId('alert-count-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('2')
    })

    it('opens the alert detail inspector on clicking the animated alert trigger', () => {
      renderWithProviders(<Dashboard />)
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      fireEvent.click(trigger)

      // Inspector opens
      expect(screen.getByRole('region', { name: /detalle de alerta clínica/i })).toBeInTheDocument()
      expect(screen.getByText(/Hallazgo determinístico:/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /registrar decisión profesional/i })).toBeInTheDocument()

      // Trigger transitions to active/open state with animation stopped
      expect(trigger).toHaveAttribute('data-active', 'true')
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(trigger).toHaveClass('alert-trigger-active')
      const iconWrapper = screen.getByTestId('alert-trigger-icon')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse--critical')
    })

    it('opens the alert detail inspector by clicking a prioritized alert card as secondary affordance', () => {
      renderWithProviders(<Dashboard />)
      const alertCards = screen.getAllByRole('button', { name: /seleccionar alerta/i })
      expect(alertCards.length).toBeGreaterThanOrEqual(1)
      fireEvent.click(alertCards[0])

      expect(screen.getByRole('region', { name: /detalle de alerta clínica/i })).toBeInTheDocument()
    })

    it('closes the alert detail inspector correctly when dismissed', () => {
      renderWithProviders(<Dashboard />)
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      fireEvent.click(trigger)
      expect(screen.getByRole('region', { name: /detalle de alerta clínica/i })).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: /cerrar detalle de alerta/i })
      fireEvent.click(closeButton)

      expect(screen.queryByRole('region', { name: /detalle de alerta clínica/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('region', { name: /explicación con ia y auditoría/i })).not.toBeInTheDocument()
      expect(trigger).toHaveAttribute('data-active', 'false')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('shows no blinking state when there are no active alerts', () => {
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: {
          context: {} as never,
          evaluation: {
            findings: [],
            results: [],
          },
        },
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<Dashboard />)
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      expect(trigger).toBeInTheDocument()

      const badge = screen.getByTestId('alert-count-badge')
      expect(badge).toHaveTextContent('0')

      // Assert that 0 cards are rendered and footer is consistent
      expect(screen.queryAllByRole('button', { name: /seleccionar alerta/i })).toHaveLength(0)
      expect(screen.getByTestId('no-active-alerts-message')).toHaveTextContent('Sin alertas clínicas activas')
      expect(screen.getByTestId('panel-footer-alert-count')).toHaveTextContent('0 alertas activas')

      const iconWrapper = screen.getByTestId('alert-trigger-icon')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse--critical')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse--warning')
    })

    it('applies clinical warning styling and warning pulse when only warnings are present', () => {
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: {
          context: {} as never,
          evaluation: {
            findings: [mockFindingWarning],
            results: [mockTriggeredResult],
          },
        },
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<Dashboard />)
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      expect(trigger).toHaveClass('bg-clinical-warning-surface')

      const badge = screen.getByTestId('alert-count-badge')
      expect(badge).toHaveTextContent('1')
      expect(badge).toHaveClass('bg-clinical-warning')

      const iconWrapper = screen.getByTestId('alert-trigger-icon')
      expect(iconWrapper).toHaveClass('alert-trigger-pulse--warning')
    })

    it('does not render removed redundant context fields inside the alert detail panel', () => {
      renderWithProviders(<Dashboard />)
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      fireEvent.click(trigger)
      const detailRegion = screen.getByRole('region', { name: /detalle de alerta clínica/i })

      expect(detailRegion).not.toHaveTextContent(/Fármacos implicados:/i)
      expect(detailRegion).not.toHaveTextContent(/Comorbilidades:/i)
      expect(detailRegion).not.toHaveTextContent(/Función renal: Sin registro en últimos 6 meses/i)
      expect(detailRegion).not.toHaveTextContent(/Paciente: María Rodríguez/i)
    })

    it('renders AI explanation with ethical disclaimer and audit timeline when detail is open', () => {
      renderWithProviders(<Dashboard />)
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      fireEvent.click(trigger)

      expect(screen.getByRole('region', { name: /explicación con ia y auditoría/i })).toBeInTheDocument()
      expect(screen.getByText(/Generado con IA/i)).toBeInTheDocument()
      expect(screen.getByText(/Línea de tiempo \/ Auditoría/i)).toBeInTheDocument()
      expect(screen.getByText(/no sustituye el juicio clínico profesional/i)).toBeInTheDocument()
    })

    it('renders the synthetic scenario selector with SYN-001 selected by default', () => {
      renderWithProviders(<Dashboard />)
      const select = screen.getByRole('combobox', {
        name: /seleccionar escenario sintético activo/i,
      }) as HTMLSelectElement
      expect(select).toBeInTheDocument()
      expect(select.value).toBe(mockScenario.id)
    })

    it('renders the editorial sub-footer credo banner', () => {
      renderWithProviders(<Dashboard />)
      expect(
        screen.getByText(/"La decisión correcta, en el momento correcto, para cada persona."/i)
      ).toBeInTheDocument()
    })
  })

  // ------------------------------------------------------------------
  // Scenario-Driven Alert Rendering Regression Suite
  // ------------------------------------------------------------------
  describe('Scenario-Driven Alert Rendering & Consistency (Regression)', () => {
    it('ensures SYN-001 with 0 findings produces 0 visible alerts, badge 0, footer 0, and no pulse', () => {
      vi.mocked(clinicalData.useScenarios).mockReturnValue({
        data: [mockScenario],
        isLoading: false,
        error: null,
      } as never)

      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: {
          context: {} as never,
          evaluation: {
            findings: [],
            results: [mockBlockedResult],
          },
        },
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<Dashboard />)

      // 1. Rendered alert cards (0 cards, clean empty state displayed)
      expect(screen.queryAllByRole('button', { name: /seleccionar alerta/i })).toHaveLength(0)
      expect(screen.getByTestId('no-active-alerts-message')).toHaveTextContent('Sin alertas clínicas activas')

      // 2. Badge count shows 0
      const badge = screen.getByTestId('alert-count-badge')
      expect(badge).toHaveTextContent('0')

      // 3. Panel footer count shows 0
      const footerCount = screen.getByTestId('panel-footer-alert-count')
      expect(footerCount).toHaveTextContent('0 alertas activas')

      // 4. Trigger does not pulse
      const iconWrapper = screen.getByTestId('alert-trigger-icon')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse--critical')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse--warning')

      // 5. Alert inspector remains closed and trigger is disabled
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      expect(trigger).toBeDisabled()
      expect(screen.queryByRole('region', { name: /detalle de alerta clínica/i })).not.toBeInTheDocument()
      fireEvent.click(trigger)
      expect(screen.queryByRole('region', { name: /detalle de alerta clínica/i })).not.toBeInTheDocument()
    })

    it('ensures a scenario with 1+ real findings renders matching card count, badge count, footer count, and pulse', () => {
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: {
          context: {} as never,
          evaluation: {
            findings: mockMultipleFindings,
            results: [mockTriggeredResult],
          },
        },
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<Dashboard />)

      // 1. Rendered alert cards (exactly 3)
      const alertCards = screen.getAllByRole('button', { name: /seleccionar alerta/i })
      expect(alertCards).toHaveLength(3)

      // 2. Badge count matches rendered cards
      const badge = screen.getByTestId('alert-count-badge')
      expect(badge).toHaveTextContent('3')

      // 3. Panel footer count matches rendered cards
      const footerCount = screen.getByTestId('panel-footer-alert-count')
      expect(footerCount).toHaveTextContent('3 alertas activas')

      // 4. Trigger pulse state is active according to highest severity (critical)
      const iconWrapper = screen.getByTestId('alert-trigger-icon')
      expect(iconWrapper).toHaveClass('alert-trigger-pulse--critical')

      // 5. Inspector can be opened and derives from the evaluated collection
      const trigger = screen.getByRole('button', { name: /abrir detalle de alertas/i })
      expect(trigger).not.toBeDisabled()
      fireEvent.click(trigger)
      const detailRegion = screen.getByRole('region', { name: /detalle de alerta clínica/i })
      expect(detailRegion).toBeInTheDocument()
      expect(detailRegion).toHaveTextContent(mockFindingCritical.title)
    })

    it('ensures a scenario with 1 warning alert renders 1 card, badge 1, footer 1, and warning pulse', () => {
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: {
          context: {} as never,
          evaluation: {
            findings: [mockFindingWarning],
            results: [mockTriggeredResult],
          },
        },
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<Dashboard />)

      // 1. Rendered alert cards (exactly 1)
      const alertCards = screen.getAllByRole('button', { name: /seleccionar alerta/i })
      expect(alertCards).toHaveLength(1)

      // 2. Badge count matches rendered cards
      const badge = screen.getByTestId('alert-count-badge')
      expect(badge).toHaveTextContent('1')

      // 3. Panel footer count matches rendered cards
      const footerCount = screen.getByTestId('panel-footer-alert-count')
      expect(footerCount).toHaveTextContent('1 alerta activa')

      // 4. Trigger pulse state matches warning severity
      const iconWrapper = screen.getByTestId('alert-trigger-icon')
      expect(iconWrapper).toHaveClass('alert-trigger-pulse--warning')
      expect(iconWrapper).not.toHaveClass('alert-trigger-pulse--critical')
    })

    it('ensures changing scenarios updates the alert collection consistently', () => {
      vi.mocked(clinicalData.useScenarios).mockReturnValue({
        data: [mockScenario, mockScenario2],
        isLoading: false,
        error: null,
      } as never)

      vi.mocked(clinicalData.useScenarioEvaluation).mockImplementation(((scenarioId: string) => {
        if (scenarioId === mockScenario2.id) {
          return {
            data: {
              context: {} as never,
              evaluation: {
                findings: [mockFindingCritical],
                results: [mockTriggeredResult],
              },
            },
            isLoading: false,
            error: null,
          } as never
        }
        return {
          data: {
            context: {} as never,
            evaluation: {
              findings: [],
              results: [mockBlockedResult],
            },
          },
          isLoading: false,
          error: null,
        } as never
      }) as never)

      renderWithProviders(<Dashboard />)

      // Initial scenario (SYN-001): 0 findings
      expect(screen.queryAllByRole('button', { name: /seleccionar alerta/i })).toHaveLength(0)
      expect(screen.getByTestId('alert-count-badge')).toHaveTextContent('0')
      expect(screen.getByTestId('panel-footer-alert-count')).toHaveTextContent('0 alertas activas')
      expect(screen.getByTestId('alert-trigger-icon')).not.toHaveClass('alert-trigger-pulse--critical')

      // Switch to SYN-002
      const selector = screen.getByRole('combobox', {
        name: /seleccionar escenario sintético activo/i,
      })
      fireEvent.change(selector, { target: { value: mockScenario2.id } })

      // Updated scenario (SYN-002): 1 critical finding
      expect(screen.getAllByRole('button', { name: /seleccionar alerta/i })).toHaveLength(1)
      expect(screen.getByTestId('alert-count-badge')).toHaveTextContent('1')
      expect(screen.getByTestId('panel-footer-alert-count')).toHaveTextContent('1 alerta activa')
      expect(screen.getByTestId('alert-trigger-icon')).toHaveClass('alert-trigger-pulse--critical')

      // Switch back to SYN-001: 0 findings
      fireEvent.change(selector, { target: { value: mockScenario.id } })
      expect(screen.queryAllByRole('button', { name: /seleccionar alerta/i })).toHaveLength(0)
      expect(screen.getByTestId('alert-count-badge')).toHaveTextContent('0')
      expect(screen.getByTestId('panel-footer-alert-count')).toHaveTextContent('0 alertas activas')
      expect(screen.getByTestId('alert-trigger-icon')).not.toHaveClass('alert-trigger-pulse--critical')
    })

    it('proves no static fallback alerts are rendered when findings array is empty', () => {
      vi.mocked(clinicalData.useScenarioEvaluation).mockReturnValue({
        data: {
          context: {} as never,
          evaluation: {
            findings: [],
            results: [mockBlockedResult],
          },
        },
        isLoading: false,
        error: null,
      } as never)

      renderWithProviders(<Dashboard />)

      // No demo-finding titles or former prototype alerts
      expect(screen.queryByText(/Riesgo renal por AINE \+ IECA \+ diurético/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Uso de AINE en ERC/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Omeprazol: uso prolongado/i)).not.toBeInTheDocument()
      expect(screen.getByTestId('no-active-alerts-message')).toHaveTextContent('Sin alertas clínicas activas')
      expect(screen.queryAllByRole('button', { name: /seleccionar alerta/i })).toHaveLength(0)
    })
  })
})

// ------------------------------------------------------------------
// AppShell tests
// ------------------------------------------------------------------
describe('AppShell', () => {
  it('renders the SAMED brand name in the sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )
    expect(screen.getByText('SAMED')).toBeInTheDocument()
  })

  it('shows the DATOS SINTÉTICOS demo notice', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )
    expect(screen.getByText(/DATOS SINTÉTICOS/i)).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )
    expect(screen.getByText('Panel clínico')).toBeInTheDocument()
    expect(screen.getByText('Pacientes')).toBeInTheDocument()
    expect(screen.getByText('Rev. farmacoterapéutica')).toBeInTheDocument()
    expect(screen.getByText('Alertas clínicas')).toBeInTheDocument()
    expect(screen.getByText('Base de conocimiento')).toBeInTheDocument()
    expect(screen.getByText('Auditoría')).toBeInTheDocument()
  })

  it('marks non-implemented routes with EN DESARROLLO badge', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )
    const pendingBadges = screen.getAllByText('EN DESARROLLO')
    // 5 routes are pending (all except dashboard)
    expect(pendingBadges).toHaveLength(5)
  })

  it('renders children in the main workspace area', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell>
          <div data-testid="workspace-content">Workspace</div>
        </AppShell>
      </MemoryRouter>
    )
    expect(screen.getByTestId('workspace-content')).toBeInTheDocument()
  })
})

// ------------------------------------------------------------------
// PlaceholderScreen tests
// ------------------------------------------------------------------
describe('PlaceholderScreen', () => {
  it('renders the module title', () => {
    renderWithProviders(<PlaceholderScreen title="Pacientes" />)
    expect(screen.getByRole('heading', { name: 'Pacientes' })).toBeInTheDocument()
  })

  it('shows default detail text when no detail provided', () => {
    renderWithProviders(<PlaceholderScreen title="Módulo X" />)
    expect(screen.getByText(/versión posterior/i)).toBeInTheDocument()
  })

  it('shows custom detail text when provided', () => {
    renderWithProviders(
      <PlaceholderScreen title="Módulo X" detail="Disponible en sprint 4." />
    )
    expect(screen.getByText('Disponible en sprint 4.')).toBeInTheDocument()
  })

  it('shows the Módulo en desarrollo badge', () => {
    renderWithProviders(<PlaceholderScreen title="Test" />)
    expect(screen.getByText('Módulo en desarrollo')).toBeInTheDocument()
  })
})
