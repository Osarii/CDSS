import { useState, useMemo } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  FlaskConical,
  HelpCircle,
  History,
  Info,
  MoreVertical,
  Pill,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import {
  useDashboardSummary,
  useScenarios,
  useScenarioEvaluation,
} from '@/services/api/useClinicalData'
import type { NormalizedScenario } from '@/domain/scenarios/schema'
import type { ClinicalFinding } from '@/domain/findings/schema'

// ------------------------------------------------------------------
// State feedback panels
// ------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="dashboard-container pt-space-lg" role="status" aria-label="Cargando panel clínico">
      <div className="space-y-space-md">
        <div className="shimmer-block shimmer-block--wide h-14" />
        <div className="shimmer-block shimmer-block--wide h-32" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
          <div className="xl:col-span-8 space-y-space-md">
            <div className="shimmer-block shimmer-block--wide h-64" />
            <div className="shimmer-block shimmer-block--wide h-64" />
          </div>
          <div className="xl:col-span-4 space-y-space-md">
            <div className="shimmer-block shimmer-block--wide h-96" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : 'Error al cargar datos clínicos.'
  return (
    <div className="dashboard-container pt-space-xl" role="alert">
      <div className="stitch-card p-space-xl max-w-xl mx-auto text-center space-y-space-md border-clinical-critical-border">
        <div className="w-12 h-12 rounded-full bg-clinical-critical-surface text-clinical-critical flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h2 className="font-card-title text-card-title text-clinical-critical">Error de carga</h2>
        <p className="font-body-regular text-small text-text-secondary">{msg}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-space-md py-2 bg-aubergine-600 hover:bg-aubergine-700 text-bone-white rounded-lg font-body-strong text-small transition-colors shadow-sm"
        >
          Reintentar conexión
        </button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Severity ordering for deterministic clinical findings sorting
// ------------------------------------------------------------------
const SEVERITY_ORDER: Record<ClinicalFinding['severity'], number> = {
  critical: 0,
  warning: 1,
  low: 2,
  info: 3,
}

// ------------------------------------------------------------------
// Main Dashboard Component
// ------------------------------------------------------------------

export function Dashboard() {
  const { data: allScenarios, isLoading: scenariosLoading, error: scenariosError } = useScenarios()
  const { scenarios: summaryScenarios, isLoading: summaryLoading } = useDashboardSummary()

  const availableScenarios: NormalizedScenario[] = allScenarios ?? summaryScenarios ?? []
  const defaultScenario =
    availableScenarios.find((s) => s.scenarioId === 'SYN-001') ?? availableScenarios[0]

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('')
  const [selectedFindingId, setSelectedFindingId] = useState<string>('')
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'resumen' | 'evidencia' | 'contexto' | 'guia'>('resumen')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const activeScenario =
    availableScenarios.find((s) => s.id === (selectedScenarioId || defaultScenario?.id)) ??
    defaultScenario

  const activeScenarioId = activeScenario?.id ?? ''

  const {
    data: evalData,
    isLoading: evalLoading,
    error: evalError,
  } = useScenarioEvaluation(activeScenarioId)

  const rawFindings = evalData?.evaluation?.findings ?? []

  // Canonical scenario-driven alert collection:
  // Derived strictly from actual deterministic evaluation output for the active scenario.
  // Sorted deterministically: severity-aware (critical > warning > low > info), then ID.
  const visibleAlerts: ClinicalFinding[] = useMemo(() => {
    return [...rawFindings].sort((a, b) => {
      const diff = (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
      if (diff !== 0) return diff
      return a.id.localeCompare(b.id)
    })
  }, [rawFindings])

  const isLoading =
    (scenariosLoading && availableScenarios.length === 0) ||
    (summaryLoading && !evalData) ||
    (evalLoading && !evalData)
  const error = scenariosError ?? evalError

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  const context = evalData?.context
  const evaluation = evalData?.evaluation
  const results = evaluation?.results ?? []
  const blockedResults = results.filter((r) => r.status === 'blocked')

  // Alert inspector is visible only when explicitly open AND real alerts exist
  const isDetailVisible = isDetailOpen && visibleAlerts.length > 0

  // Selected finding for the right inspector (defaults to first sorted finding)
  const activeFinding =
    visibleAlerts.find((f) => f.id === selectedFindingId) ??
    visibleAlerts[0]

  // Alert counts & severity metrics for animated inspector trigger - derived strictly from visibleAlerts
  const activeAlertsCount = visibleAlerts.length
  const hasCritical = visibleAlerts.some((f) => f.severity === 'critical')
  const hasOnlyWarnings = !hasCritical && visibleAlerts.some((f) => f.severity === 'warning')
  const hasActiveAlerts = activeAlertsCount > 0

  let triggerSeverityClass = 'bg-bone-100 border-bone-200 text-text-muted hover:bg-bone-200'
  let triggerIconAnimation = ''
  let badgeSeverityClass = 'bg-bone-200 text-text-secondary'

  if (hasActiveAlerts) {
    if (hasCritical) {
      triggerSeverityClass = 'bg-clinical-critical-surface border-clinical-critical-border text-clinical-critical hover:bg-clinical-critical-surface/80'
      badgeSeverityClass = 'bg-clinical-critical text-bone-white'
      if (!isDetailVisible) {
        triggerIconAnimation = 'alert-trigger-pulse--critical'
      }
    } else if (hasOnlyWarnings) {
      triggerSeverityClass = 'bg-clinical-warning-surface border-clinical-warning-border text-clinical-warning hover:bg-clinical-warning-surface/80'
      badgeSeverityClass = 'bg-clinical-warning text-bone-white'
      if (!isDetailVisible) {
        triggerIconAnimation = 'alert-trigger-pulse--warning'
      }
    }
  }

  const triggerActiveClass = isDetailVisible
    ? 'alert-trigger-active ring-2 ring-aubergine-600 border-aubergine-600 bg-aubergine-100/80 text-aubergine-800'
    : triggerSeverityClass

  const renderTriggerIcon = () => {
    if (hasActiveAlerts) {
      if (hasCritical) {
        return <AlertOctagon size={18} className="text-clinical-critical shrink-0" aria-hidden="true" />
      }
      if (hasOnlyWarnings) {
        return <AlertTriangle size={18} className="text-clinical-warning shrink-0" aria-hidden="true" />
      }
    }
    return <Bell size={18} className="text-text-muted shrink-0" aria-hidden="true" />
  }

  // Patient facts
  const patient = context?.patient
  const patientName =
    activeScenario?.scenarioId === 'SYN-001'
      ? 'María Rodríguez'
      : patient?.syntheticIdentifier
        ? `Paciente ${patient.syntheticIdentifier}`
        : 'María Rodríguez'

  const patientAge = patient?.age ?? 54
  const patientGender =
    patient?.gender === 'female' ? 'Femenino' : patient?.gender === 'male' ? 'Masculino' : 'Femenino'

  const conditions = context?.conditions ?? []
  const medications = context?.medications ?? []
  const allergies = context?.allergies ?? []

  // Fallback defaults matching Stitch reference for SYN-001 when partial mock is provided
  const displayConditions =
    conditions.length > 0
      ? conditions.map((c) => c.name || c.code)
      : ['Hipertensión arterial', 'Diabetes mellitus tipo 2', 'Enfermedad renal crónica']

  const displayAllergies =
    allergies.length > 0
      ? allergies.map((a) => a.substance)
      : activeScenario?.scenarioId === 'SYN-001' || activeScenario?.scenarioId === 'SYN-002'
        ? ['Penicilina']
        : []

  // Check if medication is involved in alerts
  const isMedicationFlagged = (medName: string) => {
    const lower = medName.toLowerCase()
    return visibleAlerts.some(
      (f) =>
        f.supportingDataKeys.some((k) => k.toLowerCase().includes(lower)) ||
        f.detail.toLowerCase().includes(lower) ||
        f.title.toLowerCase().includes(lower)
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-bone-100 text-text-primary" role="main" aria-label="Panel clínico SAMED">
      {/* 1. Top Clinical Search / Header (Fixed / Sticky 56px) */}
      <header className="clinical-top-header" role="banner">
        {/* Left: Search input */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center w-full">
            <Search size={16} className="absolute left-3 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente simulado por nombre, cédula o N.º de expediente…"
              className="w-full h-9 pl-9 pr-3 bg-bone-white rounded-lg font-body-regular text-small text-text-primary placeholder:text-text-muted border border-bone-200 focus:outline-none focus:border-aubergine-500 shadow-xs"
              aria-label="Buscar paciente simulado"
            />
          </div>
        </div>

        {/* Center / Scenario Selector Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-bone-white border border-bone-200 rounded-lg px-2.5 py-1 shadow-xs">
            <FlaskConical size={14} className="text-aubergine-600 shrink-0" aria-hidden="true" />
            <label htmlFor="scenario-selector-select" className="font-label text-micro text-text-secondary whitespace-nowrap">
              Escenario activo:
            </label>
            <select
              id="scenario-selector-select"
              value={activeScenario?.id ?? ''}
              onChange={(e) => {
                setSelectedScenarioId(e.target.value)
                setSelectedFindingId('')
                setIsDetailOpen(false)
              }}
              className="bg-transparent border-none text-small font-body-strong text-text-primary focus:outline-none cursor-pointer max-w-[260px] truncate"
              aria-label="Seleccionar escenario sintético activo"
            >
              {availableScenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.scenarioId} — {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Notifications & Clinician Profile */}
        <div className="flex items-center gap-space-md">
          <button
            type="button"
            className="relative flex items-center justify-center p-1.5 text-text-secondary hover:text-text-primary transition-colors rounded-md"
            aria-label="Notificaciones clínicas (3 pendientes)"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-clinical-critical ring-2 ring-bone-50" aria-hidden="true" />
          </button>

          <div className="h-6 w-[1px] bg-bone-200" aria-hidden="true" />

          <div className="flex items-center gap-space-sm">
            <div className="text-right hidden sm:block">
              <div className="font-body-strong text-small text-text-primary leading-tight">Dra. Ana Vargas</div>
              <div className="font-micro text-micro text-text-muted leading-tight">Medicina Interna | Centro clínico simulado</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-aubergine-100 border border-bone-200 flex items-center justify-center text-aubergine-700 font-body-strong text-micro">
              AV
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="dashboard-container pt-space-sm">
        {/* 2. Explicit Synthetic / Prototype Disclaimer Banner */}
        <div className="flex items-center justify-between gap-space-sm px-space-md py-1.5 mt-space-xs mb-space-xs rounded-lg bg-surface-container border border-outline-variant/40 text-text-secondary shadow-xs">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-aubergine-600 shrink-0" aria-hidden="true" />
            <span className="font-label text-label uppercase tracking-wider text-aubergine-700 font-body-strong">
              Entorno de exploración clínica
            </span>
            <span className="w-1 h-1 rounded-full bg-bone-200" aria-hidden="true" />
            <span className="font-small text-small text-text-secondary">
              DATOS SINTÉTICOS · Datos sintéticos con fines ilustrativos · No constituye sistema en producción clínica
            </span>
          </div>
          <span className="font-micro text-micro text-text-muted hidden md:inline">
            Ambiente controlado CDSS-CR
          </span>
        </div>

        {/* 3. Top Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md pt-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="font-label text-label text-aubergine-600 uppercase tracking-widest bg-aubergine-100 px-2 py-0.5 rounded font-body-strong">
              Registro de demostración (sintético)
            </span>
            <span className="w-1 h-1 rounded-full bg-bone-200" aria-hidden="true" />
            <span className="font-small text-small text-text-muted">
              Servicio de Farmacoterapia · Módulo de Simulación de Decisiones
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <span className="font-micro text-micro text-text-muted">
              Estado del expediente: <strong className="text-text-primary font-body-strong">Simulado (Sesión activa)</strong>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 font-label text-label text-aubergine-700 hover:text-graphite-900 transition-colors font-body-strong"
            >
              <History size={16} aria-hidden="true" /> Registro auditoría
            </button>
          </div>
        </div>

        {/* 4. Main Tri-Pane / Split Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* LEFT & CENTER COCKPIT CANVAS (12 cols if detail closed or no active finding, 8 cols if open) */}
          <div className={`${isDetailVisible && activeFinding ? 'xl:col-span-8' : 'xl:col-span-12'} flex flex-col gap-space-lg min-w-0 transition-all duration-150`}>
            {/* 4.1. Patient Context Card */}
            <section className="stitch-card p-space-lg relative overflow-hidden" aria-label="Contexto del paciente">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div className="flex items-start sm:items-center gap-space-md">
                  <div className="w-14 h-14 rounded-xl bg-aubergine-100 flex items-center justify-center text-aubergine-700 shadow-xs shrink-0" aria-hidden="true">
                    <User size={30} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-space-sm gap-y-0.5">
                      <h1 className="font-page-title text-page-title text-text-primary tracking-tight m-0">
                        {patientName}
                      </h1>
                      <span className="font-small text-small text-text-muted font-normal">
                        {patientAge} años · {patientGender}
                      </span>
                      <span className="font-micro text-micro px-2 py-0.5 rounded bg-bone-100 text-text-muted border border-bone-200">
                        Sintético
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 mt-1 font-small text-small text-text-secondary">
                      <span>
                        Cédula ficticia: <strong className="font-body-strong text-text-primary tabular-nums">1-0756-0890</strong>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-bone-200" aria-hidden="true" />
                      <span>
                        Expediente simulado: <strong className="font-body-strong text-text-primary tabular-nums">#234567</strong>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-bone-200" aria-hidden="true" />
                      <span>
                        Área de salud: <strong className="font-body-strong text-text-primary">Curridabat Centro (Caso modelo)</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm self-end md:self-center shrink-0">
                  <button
                    type="button"
                    className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-bone-50 hover:bg-surface-container text-aubergine-700 font-body-strong text-small shadow-xs border border-bone-200 transition-all duration-150"
                  >
                    <span>Ver más detalles</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Clinical Tags Row */}
              <div className="flex flex-wrap items-center gap-space-xs pt-space-md mt-space-md bg-gradient-to-r from-bone-50 to-transparent p-2 rounded-lg border border-bone-200/50">
                {/* Allergy Tag */}
                {displayAllergies.length > 0 ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clinical-critical-surface text-clinical-critical font-body-strong text-small shadow-xs border border-clinical-critical-border">
                    <AlertOctagon size={16} aria-hidden="true" />
                    <span>Alergia: {displayAllergies.join(', ')}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bone-50 text-text-muted font-body-regular text-small border border-bone-200">
                    <span>Sin alergias documentadas</span>
                  </div>
                )}

                {/* Diagnostic Chips */}
                <div className="inline-flex items-center gap-1 px-2.5 py-1 text-text-muted font-label text-label uppercase tracking-wider">
                  <FileText size={15} aria-hidden="true" />
                  <span>Diagnósticos:</span>
                </div>

                {displayConditions.map((condName) => (
                  <button
                    key={condName}
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-bone-100 hover:bg-bone-200 text-text-primary font-body-regular text-small shadow-xs transition-colors border border-bone-200"
                  >
                    <span>{condName}</span>
                    <ChevronRight size={14} className="text-text-muted" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>

            {/* 4.2. Mandatory Missing Information Banner */}
            <section
              className="bg-clinical-missing-surface rounded-xl p-space-md shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-clinical-missing-border"
              role="region"
              aria-label="Aviso de información clínica incompleta"
            >
              <div className="flex items-start gap-space-md">
                <div className="w-10 h-10 rounded-lg bg-clinical-warning/20 flex items-center justify-center text-clinical-missing shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">
                  <HelpCircle size={22} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-section-title text-card-title text-clinical-missing leading-tight">
                      Información clínica incompleta
                    </span>
                    <span className="px-2 py-0.5 rounded font-label text-micro uppercase bg-clinical-warning/20 text-clinical-missing font-body-strong">
                      Atención requerida
                    </span>
                  </div>
                  <p className="font-body-regular text-small text-text-primary mt-1 leading-snug">
                    {blockedResults.length > 0 ? (
                      <>
                        No se encuentra registro de función renal (
                        <strong className="text-text-primary">
                          {blockedResults[0].gateResult.failedRequirements.map((r) => r.key).join(' o ') || 'creatinina sérica o TFGe'}
                        </strong>
                        ) en los últimos 6 meses (parámetro de demostración de la regla {blockedResults[0].ruleId}) en el historial disponible.
                      </>
                    ) : (
                      <>
                        No se encuentra registro de función renal (<strong className="text-text-primary">creatinina sérica o TFGe</strong>) en los últimos 6 meses (parámetro de demostración de la regla CR-REN-001) en el historial disponible.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-space-sm bg-bone-white px-space-md py-2 rounded-lg shrink-0 self-stretch sm:self-auto justify-between sm:justify-start border border-clinical-missing-border/50 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-clinical-warning shrink-0" aria-hidden="true" />
                  <span className="font-body-strong text-small text-clinical-missing tracking-tight whitespace-nowrap">
                    Dato no disponible ≠ normal
                  </span>
                </div>
                <button
                  type="button"
                  className="text-clinical-missing hover:text-text-primary transition-colors ml-1 p-0.5"
                  title="Protocolo de datos no disponibles"
                  aria-label="Más información sobre el protocolo de datos no disponibles"
                >
                  <Info size={16} />
                </button>
              </div>
            </section>

            {/* 4.3. Core Medication & Alerts Dual Module (7 cols table + 5 cols alerts) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* Active Medications Table (7 Cols) */}
              <div className="lg:col-span-7 stitch-card p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-space-sm pb-space-sm mb-space-sm border-b border-bone-100">
                    <div className="flex items-center gap-2">
                      <Pill size={18} className="text-aubergine-600" aria-hidden="true" />
                      <h2 className="font-section-title text-card-title text-text-primary m-0">
                        Medicamentos activos <span className="font-body-regular text-text-muted text-small">({medications.length || 6})</span>
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-aubergine-600 hover:bg-aubergine-700 text-bone-white rounded-lg font-body-strong text-small shadow-xs transition-colors"
                    >
                      <Plus size={15} aria-hidden="true" />
                      <span>Agregar medicamento</span>
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-bone-50 text-text-muted font-label text-label uppercase tracking-wider">
                          <th className="py-2.5 px-3 rounded-l-lg">Medicamento</th>
                          <th className="py-2.5 px-2">Dosis</th>
                          <th className="py-2.5 px-2">Frecuencia</th>
                          <th className="py-2.5 px-2">Indicación</th>
                          <th className="py-2.5 px-3 text-right rounded-r-lg">Inicio</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-regular text-small text-text-primary divide-y divide-bone-100/60">
                        {medications.length > 0 ? (
                          medications.map((med) => {
                            const flagged = isMedicationFlagged(med.name)
                            return (
                              <tr key={med.id} className="hover:bg-bone-50/70 transition-colors group">
                                <td className="py-3 px-3 relative">
                                  {flagged && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-clinical-critical rounded-r" aria-hidden="true" />
                                  )}
                                  <div className="flex flex-col">
                                    <span className={`font-body-strong flex items-center gap-1 ${flagged ? 'text-clinical-critical' : 'text-text-primary'}`}>
                                      {med.name}
                                      {flagged && <AlertTriangle size={14} className="text-clinical-critical shrink-0" aria-label="Alerta activa" />}
                                    </span>
                                    <span className="font-micro text-micro text-text-muted">{med.route || 'Oral'}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 tabular-nums">{med.dosage || '—'}</td>
                                <td className="py-3 px-2 tabular-nums">c/12 h</td>
                                <td className="py-3 px-2 text-text-secondary truncate max-w-[120px]">{displayConditions[0] || 'Terapéutica'}</td>
                                <td className="py-3 px-3 text-right tabular-nums text-text-muted">12/01/2023</td>
                              </tr>
                            )
                          })
                        ) : (
                          // Mock default list from Stitch reference when medications list is empty
                          <>
                            <tr className="hover:bg-bone-50/70 transition-colors">
                              <td className="py-3 px-3 relative">
                                <span className="absolute left-0 top-2 bottom-2 w-1 bg-clinical-critical rounded-r" aria-hidden="true" />
                                <div className="flex flex-col">
                                  <span className="font-body-strong text-text-primary flex items-center gap-1">
                                    Metformina <AlertTriangle size={14} className="text-clinical-critical" />
                                  </span>
                                  <span className="font-micro text-micro text-text-muted">Tableta oral</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 tabular-nums">850 mg</td>
                              <td className="py-3 px-2 tabular-nums">c/12 h</td>
                              <td className="py-3 px-2 text-text-secondary truncate max-w-[120px]">Diabetes tipo 2</td>
                              <td className="py-3 px-3 text-right tabular-nums text-text-muted">12/01/2023</td>
                            </tr>
                            <tr className="hover:bg-bone-50/70 transition-colors">
                              <td className="py-3 px-3 relative">
                                <span className="absolute left-0 top-2 bottom-2 w-1 bg-clinical-warning rounded-r" aria-hidden="true" />
                                <div className="flex flex-col">
                                  <span className="font-body-strong text-text-primary flex items-center gap-1">
                                    Enalapril <AlertTriangle size={14} className="text-clinical-warning" />
                                  </span>
                                  <span className="font-micro text-micro text-text-muted">Comprimido</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 tabular-nums">20 mg</td>
                              <td className="py-3 px-2 tabular-nums">c/24 h</td>
                              <td className="py-3 px-2 text-text-secondary truncate max-w-[120px]">Hipertensión</td>
                              <td className="py-3 px-3 text-right tabular-nums text-text-muted">10/03/2022</td>
                            </tr>
                            <tr className="hover:bg-bone-50/70 transition-colors">
                              <td className="py-3 px-3 relative">
                                <span className="absolute left-0 top-2 bottom-2 w-1 bg-clinical-warning rounded-r" aria-hidden="true" />
                                <div className="flex flex-col">
                                  <span className="font-body-strong text-text-primary flex items-center gap-1">
                                    Hidroclorotiazida <AlertTriangle size={14} className="text-clinical-warning" />
                                  </span>
                                  <span className="font-micro text-micro text-text-muted">Tableta</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 tabular-nums">25 mg</td>
                              <td className="py-3 px-2 tabular-nums">c/24 h</td>
                              <td className="py-3 px-2 text-text-secondary truncate max-w-[120px]">Hipertensión</td>
                              <td className="py-3 px-3 text-right tabular-nums text-text-muted">10/03/2022</td>
                            </tr>
                            <tr className="hover:bg-bone-50/70 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex flex-col">
                                  <span className="font-body-strong text-text-primary">Atorvastatina</span>
                                  <span className="font-micro text-micro text-text-muted">Tableta recubierta</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 tabular-nums">40 mg</td>
                              <td className="py-3 px-2 tabular-nums">c/24 h</td>
                              <td className="py-3 px-2 text-text-secondary">Dislipidemia</td>
                              <td className="py-3 px-3 text-right tabular-nums text-text-muted">15/06/2023</td>
                            </tr>
                            <tr className="hover:bg-bone-50/70 transition-colors">
                              <td className="py-3 px-3 relative">
                                <span className="absolute left-0 top-2 bottom-2 w-1 bg-clinical-critical rounded-r" aria-hidden="true" />
                                <div className="flex flex-col">
                                  <span className="font-body-strong text-clinical-critical flex items-center gap-1">
                                    Ibuprofeno <AlertOctagon size={14} className="text-clinical-critical" />
                                  </span>
                                  <span className="font-micro text-micro text-text-muted">Cápsula blanda</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 tabular-nums font-body-strong">600 mg</td>
                              <td className="py-3 px-2 tabular-nums">c/8 h</td>
                              <td className="py-3 px-2 text-clinical-critical font-body-strong">Según dolor</td>
                              <td className="py-3 px-3 text-right tabular-nums text-text-muted">01/02/2024</td>
                            </tr>
                            <tr className="hover:bg-bone-50/70 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex flex-col">
                                  <span className="font-body-strong text-text-primary">Omeprazol</span>
                                  <span className="font-micro text-micro text-text-muted">Cápsula con gránulos</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 tabular-nums">20 mg</td>
                              <td className="py-3 px-2 tabular-nums">c/24 h</td>
                              <td className="py-3 px-2 text-text-secondary">Protección gástrica</td>
                              <td className="py-3 px-3 text-right tabular-nums text-text-muted">01/02/2024</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-space-md pt-space-xs flex items-center justify-between font-micro text-micro text-text-muted border-t border-bone-100">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-clinical-critical" aria-hidden="true" /> Alerta de seguridad directa
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-clinical-warning" aria-hidden="true" /> Monitorizar en conjunto
                  </span>
                </div>
              </div>

              {/* Prioritized Alerts Triage (5 Cols) */}
              <div className="lg:col-span-5 stitch-card p-space-md flex flex-col justify-between" role="region" aria-label="Alertas priorizadas">
                <div>
                  <div className="flex items-center justify-between gap-space-sm pb-space-sm mb-space-sm border-b border-bone-100">
                    <div className="flex items-center gap-2">
                      {/* Animated Alert Inspector Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          if (visibleAlerts.length === 0) return
                          if (!isDetailVisible) {
                            if (!selectedFindingId && visibleAlerts.length > 0) {
                              setSelectedFindingId(visibleAlerts[0].id)
                            }
                            setIsDetailOpen(true)
                          } else {
                            setIsDetailOpen(false)
                          }
                        }}
                        disabled={visibleAlerts.length === 0}
                        className={`alert-inspector-trigger relative inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-150 shadow-xs ${
                          visibleAlerts.length === 0 ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${triggerActiveClass}`}
                        aria-label="Abrir detalle de alertas"
                        title={visibleAlerts.length === 0 ? 'Sin alertas clínicas activas' : 'Abrir detalle de alertas'}
                        aria-expanded={isDetailVisible}
                        data-active={isDetailVisible ? 'true' : 'false'}
                        data-testid="alert-inspector-trigger"
                      >
                        <span
                          className={`inline-flex items-center justify-center ${triggerIconAnimation}`}
                          data-testid="alert-trigger-icon"
                        >
                          {renderTriggerIcon()}
                        </span>
                        <span
                          className={`alert-count-badge inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-label text-micro font-body-strong leading-none shadow-xs ${badgeSeverityClass}`}
                          data-testid="alert-count-badge"
                        >
                          {activeAlertsCount}
                        </span>
                      </button>

                      <h2 className="font-section-title text-card-title text-text-primary m-0">
                        Alertas priorizadas
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (visibleAlerts.length === 0) return
                        if (!isDetailVisible) {
                          if (!selectedFindingId && visibleAlerts.length > 0) {
                            setSelectedFindingId(visibleAlerts[0].id)
                          }
                          setIsDetailOpen(true)
                        } else {
                          setIsDetailOpen(false)
                        }
                      }}
                      disabled={visibleAlerts.length === 0}
                      className={`font-label text-label flex items-center gap-1 ${
                        visibleAlerts.length === 0
                          ? 'text-text-muted opacity-50 cursor-not-allowed'
                          : 'text-aubergine-600 hover:text-aubergine-700 cursor-pointer'
                      }`}
                      aria-label={isDetailVisible ? 'Ocultar panel de alertas' : 'Ver panel de alertas'}
                    >
                      <span>{isDetailVisible ? 'Cerrar detalle' : 'Ver detalle'}</span>
                      <ChevronRight size={14} className={`transform transition-transform ${isDetailVisible ? 'rotate-90' : ''}`} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Stacked Alert Cards */}
                  <div className="flex flex-col gap-space-sm" data-testid="prioritized-alerts-list">
                    {visibleAlerts.length > 0 ? (
                      visibleAlerts.map((f) => {
                        const isCritical = f.severity === 'critical'
                        const isWarning = f.severity === 'warning'
                        const isLow = f.severity === 'low'
                        const isSelected = activeFinding?.id === f.id
                        const cardBg = isCritical
                          ? 'bg-clinical-critical-surface'
                          : isWarning
                            ? 'bg-clinical-warning-surface'
                            : 'bg-clinical-low-surface'
                        const borderCls = isCritical
                          ? 'border-clinical-critical'
                          : isWarning
                            ? 'border-clinical-warning'
                            : 'border-clinical-low'
                        const badgeColor = isCritical
                          ? 'text-clinical-critical border-clinical-critical/30'
                          : isWarning
                            ? 'text-clinical-warning border-clinical-warning/30'
                            : 'text-clinical-low border-clinical-low-border'
                        const priorityText = isCritical ? 'ALTA' : isWarning ? 'MEDIA' : isLow ? 'BAJA' : 'INFO'
                        const prioritySubtitle = isCritical
                          ? 'Hallazgo de alta prioridad'
                          : isWarning
                            ? 'Precaución farmacoterapéutica'
                            : isLow
                              ? 'Optimización de tratamiento'
                              : 'Información clínica'

                        return (
                          <div
                            key={f.id}
                            onClick={() => {
                              setSelectedFindingId(f.id)
                              setIsDetailOpen(true)
                            }}
                            className={`${cardBg} border-l-4 ${borderCls} rounded-xl p-space-sm shadow-xs transition-all duration-150 cursor-pointer ${
                              isSelected && isDetailVisible ? 'ring-2 ring-aubergine-600/30' : 'hover:shadow-sm'
                            }`}
                            role="button"
                            tabIndex={0}
                            aria-label={`Seleccionar alerta: ${f.title}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-space-xs">
                                {isCritical ? (
                                  <AlertOctagon size={18} className="text-clinical-critical shrink-0 mt-0.5" aria-hidden="true" />
                                ) : isWarning ? (
                                  <AlertTriangle size={18} className="text-clinical-warning shrink-0 mt-0.5" aria-hidden="true" />
                                ) : (
                                  <Info size={18} className="text-clinical-low shrink-0 mt-0.5" aria-hidden="true" />
                                )}
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-label text-micro bg-bone-white ${badgeColor} font-body-strong border`}>
                                      {priorityText}
                                    </span>
                                    <span className="font-micro text-micro text-text-muted">
                                      {prioritySubtitle}
                                    </span>
                                  </div>
                                  <h3 className="font-body-strong text-body-strong text-text-primary leading-snug m-0">
                                    {f.title}
                                  </h3>
                                  <p className="font-small text-small text-text-secondary mt-1 leading-snug">
                                    {f.detail}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight size={18} className={`${isCritical ? 'text-clinical-critical' : 'text-text-muted'} shrink-0 mt-1`} aria-hidden="true" />
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-bone-200/50 font-micro text-micro text-text-muted">
                              <span>
                                {isSelected && isDetailVisible ? 'Detalle abierto en inspector' : 'Clic para inspeccionar hallazgo'}
                              </span>
                              <span className="text-aubergine-700 font-body-strong inline-flex items-center gap-0.5">
                                {isSelected && isDetailVisible ? 'Inspeccionando' : 'Abrir'} <ChevronRight size={13} aria-hidden="true" />
                              </span>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div
                        className="p-space-md text-center text-text-muted bg-bone-50 rounded-xl border border-bone-200 font-small"
                        data-testid="no-active-alerts-message"
                      >
                        Sin alertas clínicas activas
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-space-md pt-space-xs bg-bone-50 p-2.5 rounded-lg flex items-center justify-between text-text-muted font-micro text-micro border border-bone-200">
                  <span className="flex items-center gap-1">
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    Criterio de priorización: Reglas DEMO CDSS-CR
                  </span>
                  <span className="font-body-strong text-aubergine-600" data-testid="panel-footer-alert-count">
                    {visibleAlerts.length} {visibleAlerts.length === 1 ? 'alerta activa' : 'alertas activas'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4.4. Module '¿Por qué se generó esta alerta?' (Analytical Tri-Card Group) */}
            <section className="stitch-card p-space-lg" aria-label="Justificación clínica de la alerta">
              <div className="flex items-center justify-between mb-space-md pb-space-xs border-b border-bone-100">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-aubergine-600" aria-hidden="true" />
                  <h2 className="font-page-title text-section-title text-text-primary m-0">
                    ¿Por qué se generó esta alerta?
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label text-micro px-2 py-0.5 rounded bg-aubergine-100 text-aubergine-700 font-body-strong">
                    Regla prototipo: {activeFinding?.ruleId ?? 'CR-REN-001'}
                  </span>
                  <span className="font-micro text-micro text-text-muted">
                    v{activeFinding?.ruleVersion ?? '0.1'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                {/* Card A: Evidencia */}
                <div className="bg-bone-50 rounded-xl p-space-md flex flex-col justify-between border border-bone-200 shadow-xs">
                  <div>
                    <div className="flex items-center gap-space-xs mb-space-sm text-aubergine-700">
                      <BookOpen size={18} aria-hidden="true" />
                      <h3 className="font-body-strong text-body-strong text-text-primary m-0">Evidencia clínica</h3>
                    </div>
                    <p className="font-body-regular text-small text-text-secondary leading-relaxed m-0">
                      La combinación concurrente de un <strong className="text-text-primary">AINE + IECA + diurético</strong> se asocia con un aumento sinérgico del riesgo de lesión renal aguda secundaria a vasoconstricción arteriolar aferente y disminución de la perfusión glomerular (<em className="font-body-strong">"triple whammy"</em>).
                    </p>
                  </div>
                  <div className="mt-space-md pt-space-xs border-t border-bone-200">
                    <button type="button" className="inline-flex items-center gap-1 font-body-strong text-small text-aubergine-600 hover:text-aubergine-700 transition-colors p-0">
                      <span>Ver referencias bibliográficas (3)</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                    <p className="font-micro text-micro text-text-muted italic mt-1.5 mb-0">
                      Contenido clínico ilustrativo · pendiente de validación experta
                    </p>
                  </div>
                </div>

                {/* Card B: Datos Faltantes */}
                <div className="bg-bone-50 rounded-xl p-space-md flex flex-col justify-between border border-bone-200 shadow-xs">
                  <div>
                    <div className="flex items-center gap-space-xs mb-space-sm text-clinical-missing">
                      <HelpCircle size={18} aria-hidden="true" />
                      <h3 className="font-body-strong text-body-strong text-text-primary m-0">Datos faltantes</h3>
                    </div>
                    <p className="font-body-regular text-small text-text-secondary leading-relaxed m-0">
                      No existe registro en el expediente simulado de <strong className="text-text-primary">creatinina sérica, TFGe ni potasio</strong> en los últimos 6 meses (ventana definida como parámetro de demostración para CR-REN-001).
                    </p>
                    <div className="mt-space-sm p-space-xs bg-clinical-missing-surface rounded-lg border border-clinical-missing-border/50">
                      <span className="font-body-strong text-micro text-clinical-missing block leading-tight">
                        Dato no disponible ≠ normal
                      </span>
                      <span className="font-small text-micro text-text-secondary leading-tight mt-0.5 block">
                        La ausencia de valores analíticos puede encubrir un deterioro renal no diagnosticado.
                      </span>
                    </div>
                  </div>
                  <div className="mt-space-md pt-space-xs border-t border-bone-200">
                    <span className="font-label text-micro text-text-muted uppercase">
                      Requiere considerar perfil renal
                    </span>
                  </div>
                </div>

                {/* Card C: Trazabilidad de Regla */}
                <div className="bg-bone-50 rounded-xl p-space-md flex flex-col justify-between border border-bone-200 shadow-xs">
                  <div>
                    <div className="flex items-center gap-space-xs mb-space-sm text-aubergine-700">
                      <ShieldCheck size={18} aria-hidden="true" />
                      <h3 className="font-body-strong text-body-strong text-text-primary m-0">Trazabilidad de regla</h3>
                    </div>
                    <ul className="space-y-1.5 font-small text-small text-text-secondary m-0 p-0 list-none">
                      <li className="flex items-center justify-between">
                        <span className="text-text-muted">Identificador:</span>
                        <strong className="text-text-primary font-body-strong font-mono text-micro">
                          {activeFinding?.ruleId ?? 'CR-REN-001'}
                        </strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-text-muted">Versión:</span>
                        <span className="font-body-strong text-text-primary">
                          {activeFinding?.ruleVersion ?? '0.1'}
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-text-muted">Estado:</span>
                        <span className="px-1.5 py-0.5 rounded bg-bone-200 font-body-strong text-text-primary text-micro">
                          DEMOSTRACIÓN
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-text-muted">Validación clínica:</span>
                        <span className="px-1.5 py-0.5 rounded bg-clinical-warning/20 font-body-strong text-clinical-warning text-micro">
                          PENDIENTE
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-text-muted">Base conocimiento:</span>
                        <span className="text-text-primary text-right text-micro">CDSS-CR Demo</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-text-muted">Última revisión:</span>
                        <span className="text-text-primary tabular-nums text-micro">15/02/2024</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-text-muted">Nivel validación:</span>
                        <span className="text-text-secondary italic text-micro">Demostración</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-space-md pt-space-xs border-t border-bone-200">
                    <button type="button" className="inline-flex items-center gap-1 font-body-strong text-small text-aubergine-600 hover:text-aubergine-700 transition-colors p-0">
                      <span>Ver ficha en base de conocimiento</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT CONTEXTUAL INTELLIGENCE PANEL (4 cols, rendered only on demand when isDetailVisible is true and a real alert exists) */}
          {isDetailVisible && activeFinding && (
            <div className="xl:col-span-4 flex flex-col gap-space-lg animate-in fade-in duration-150">
              {/* 4.5. Detalle de Alerta Panel */}
              <section className="stitch-card p-space-md relative overflow-hidden" aria-label="Detalle de alerta clínica">
                {/* Header */}
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-bone-50 -mx-space-md -mt-space-md px-space-md pt-space-sm border-b border-bone-200">
                  <div className="flex items-center gap-space-xs text-aubergine-700">
                    <AlertOctagon size={18} aria-hidden="true" />
                    <span className="font-card-title text-card-title text-text-primary">Detalle de alerta</span>
                  </div>
                  <div className="flex items-center gap-1 text-text-muted">
                    <button type="button" className="p-1 hover:text-text-primary rounded transition-colors" title="Imprimir informe" aria-label="Imprimir informe">
                      <Printer size={16} />
                    </button>
                    <button type="button" className="p-1 hover:text-text-primary rounded transition-colors" title="Opciones adicionales" aria-label="Opciones adicionales">
                      <MoreVertical size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen(false)}
                      className="p-1 hover:text-text-primary hover:bg-bone-200/60 rounded-md transition-colors text-text-secondary ml-1"
                      title="Cerrar detalle"
                      aria-label="Cerrar detalle de alerta"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Title & Badge */}
                <div className="mt-space-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded font-label text-micro font-body-strong border ${
                      activeFinding.severity === 'critical'
                        ? 'bg-clinical-critical-surface text-clinical-critical border-clinical-critical-border'
                        : activeFinding.severity === 'warning'
                          ? 'bg-clinical-warning-surface text-clinical-warning border-clinical-warning-border'
                          : 'bg-clinical-low-surface text-clinical-low border-clinical-low-border'
                    }`}>
                      {activeFinding.severity === 'critical'
                        ? 'ALTA'
                        : activeFinding.severity === 'warning'
                          ? 'MEDIA'
                          : activeFinding.severity === 'low'
                            ? 'BAJA'
                            : 'INFO'}
                    </span>
                    <span className="font-mono text-micro text-text-muted">
                      Regla: {activeFinding.ruleId} (v{activeFinding.ruleVersion} · Demostración)
                    </span>
                  </div>
                  <h2 className="font-card-title text-card-title text-text-primary leading-tight m-0">
                    {activeFinding.title}
                  </h2>
                  <p className="font-small text-small text-text-secondary mt-1 m-0">
                    {activeFinding.detail}
                  </p>
                </div>

                {/* Navigation Tabs Strip */}
                <div className="flex items-center gap-space-xs my-space-sm bg-bone-50 p-1 rounded-lg border border-bone-200">
                  {(['resumen', 'evidencia', 'contexto', 'guia'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1 px-2 rounded-md font-body-strong text-micro text-center transition-all capitalize ${
                        activeTab === tab
                          ? 'bg-bone-white text-aubergine-700 shadow-xs'
                          : 'text-text-muted hover:text-text-primary font-body-regular'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Deterministic Finding Banner */}
                <div className="bg-clinical-critical-surface border border-clinical-critical-border/50 rounded-xl p-space-sm my-space-sm flex items-start gap-space-sm">
                  <AlertOctagon size={18} className="text-clinical-critical shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="font-small text-small text-text-primary leading-snug m-0">
                    <strong className="text-clinical-critical font-body-strong">Hallazgo determinístico:</strong>{' '}
                    {activeFinding.detail}
                  </p>
                </div>

                {/* Related Missing Data Chips if applicable */}
                {((activeFinding?.missingDataKeys && activeFinding.missingDataKeys.length > 0) || (blockedResults.length > 0 && blockedResults[0].gateResult.failedRequirements.length > 0)) && (
                  <div className="my-space-sm p-space-xs bg-clinical-missing-surface rounded-lg border border-clinical-missing-border/50">
                    <span className="font-label text-micro text-clinical-missing uppercase tracking-wider block mb-1 font-body-strong">
                      Datos faltantes relacionados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeFinding?.missingDataKeys && activeFinding.missingDataKeys.length > 0
                        ? activeFinding.missingDataKeys
                        : blockedResults[0].gateResult.failedRequirements.map((r) => r.key)
                      ).map((key) => (
                        <span key={key} className="px-2 py-0.5 rounded bg-bone-white text-clinical-missing font-mono text-micro border border-clinical-missing-border shadow-xs">
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consultative Recommendations Block */}
                <div className="bg-bone-50 rounded-xl p-space-md border border-bone-200 mt-space-sm">
                  <div className="flex items-center gap-1.5 mb-space-xs text-aubergine-700">
                    <ClipboardCheck size={16} aria-hidden="true" />
                    <span className="font-body-strong text-small text-text-primary">Opciones de manejo sugeridas (Consultivo)</span>
                  </div>
                  <ul className="space-y-1.5 font-body-regular text-small text-text-secondary pl-1 m-0 list-none">
                    <li className="flex items-start gap-2 leading-snug">
                      <span className="font-body-strong text-aubergine-700">1.</span>
                      <span><strong className="text-text-primary">Opción de revisión analgésica:</strong> Valorar clínicamente la pertinencia de mantener o suspender AINE (ibuprofeno), explorando posibles alternativas analgésicas según perfil hemodinámico.</span>
                    </li>
                    <li className="flex items-start gap-2 leading-snug">
                      <span className="font-body-strong text-aubergine-700">2.</span>
                      <span><strong className="text-text-primary">Consideración de pruebas diagnósticas:</strong> Revisar conveniencia de solicitar perfil de función renal (creatinina sérica, TFGe y electrolitos) si el criterio facultativo lo estima necesario.</span>
                    </li>
                    <li className="flex items-start gap-2 leading-snug">
                      <span className="font-body-strong text-aubergine-700">3.</span>
                      <span><strong className="text-text-primary">Evaluación hemodinámica general:</strong> Monitorizar el estado volumétrico y cifras tensionales en el contexto del esquema antihipertensivo y diurético concurrente.</span>
                    </li>
                    <li className="flex items-start gap-2 leading-snug">
                      <span className="font-body-strong text-aubergine-700">4.</span>
                      <span>Planificar seguimiento clínico y analítico a criterio del profesional a cargo.</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons & Responsibility Notice */}
                <div className="mt-space-md flex flex-col gap-2">
                  <div className="flex gap-space-sm">
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 bg-aubergine-600 hover:bg-aubergine-700 text-bone-white rounded-lg font-body-strong text-small shadow-xs transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <ClipboardCheck size={16} aria-hidden="true" />
                      <span>Registrar decisión profesional</span>
                    </button>
                    <button
                      type="button"
                      className="py-2 px-3 bg-bone-100 hover:bg-bone-200 text-text-secondary rounded-lg font-body-strong text-small transition-colors flex items-center gap-1 border border-bone-200"
                    >
                      <span>Posponer revisión</span>
                    </button>
                  </div>
                  <p className="font-micro text-micro text-text-muted text-center leading-tight mt-0.5 m-0">
                    El profesional de salud mantiene la responsabilidad sobre la decisión clínica final.
                  </p>
                </div>
              </section>

              {/* 4.6. Explicación con IA y Auditoría Panel */}
              <section className="stitch-card p-space-md" aria-label="Explicación con IA y auditoría">
                {/* Header */}
                <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-bone-100">
                  <div className="flex items-center gap-space-xs text-aubergine-700">
                    <Sparkles size={18} aria-hidden="true" />
                    <span className="font-card-title text-card-title text-text-primary">Explicación con IA y auditoría</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-label text-micro text-text-muted hover:text-aubergine-700 transition-colors p-1"
                    aria-label="Copiar explicación de IA"
                  >
                    <Copy size={14} aria-hidden="true" />
                    <span>Copiar</span>
                  </button>
                </div>

                {/* AI Explanation Box */}
                <div className="bg-aubergine-100 rounded-xl p-space-md shadow-xs border border-aubergine-300/40 relative">
                  <div className="flex items-center justify-between mb-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-aubergine-600 text-bone-white flex items-center justify-center font-bold text-[11px]" aria-hidden="true">
                        IA
                      </span>
                      <span className="font-body-strong text-small text-aubergine-700">Explicación en lenguaje claro</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bone-white font-label text-micro text-aubergine-600 shadow-xs border border-aubergine-300 font-body-strong">
                      <Sparkles size={12} aria-hidden="true" />
                      Generado con IA
                    </span>
                  </div>
                  <p className="font-body-regular text-small text-text-primary leading-relaxed m-0">
                    Esta alerta se genera porque la paciente tiene prescritos concomitantemente <strong>ibuprofeno, enalapril e hidroclorotiazida</strong>. Dicha combinación puede reducir la filtración glomerular y el flujo renal, con especial relevancia si coexiste deshidratación o enfermedad renal de base. Al no constar registros de creatinina ni TFGe en los últimos seis meses, no es posible descartar una insuficiencia renal encubierta. La explicación resume el hallazgo de la regla CR-REN-001 y la información clínica disponible. Las posibles acciones deben ser evaluadas por el profesional según el contexto del caso.
                  </p>
                  <div className="mt-space-sm pt-space-xs border-t border-aubergine-300/40 flex items-start gap-1.5 text-text-muted font-micro text-micro leading-snug">
                    <Info size={14} className="text-aubergine-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      La explicación generada complementa la información del sistema y no sustituye el juicio clínico profesional individualizado.
                    </span>
                  </div>
                </div>

                {/* Audit Trail / Timeline */}
                <div className="mt-space-md">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label text-label uppercase text-text-muted tracking-wider">
                      Línea de tiempo / Auditoría
                    </span>
                    <button type="button" className="font-label text-micro text-aubergine-600 hover:text-aubergine-700 p-0">
                      Ver auditoría completa →
                    </button>
                  </div>
                  <div className="space-y-space-xs font-small text-micro">
                    <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-bone-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-clinical-critical" aria-hidden="true" />
                        <span className="font-body-strong tabular-nums text-text-secondary">15/03/2024 10:24</span>
                        <span className="text-text-primary">Generación de alerta (regla {activeFinding.ruleId})</span>
                      </div>
                      <span className="text-text-muted font-micro">CDSS-CR</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-bone-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-aubergine-500" aria-hidden="true" />
                        <span className="font-body-strong tabular-nums text-text-secondary">15/03/2024 10:26</span>
                        <span className="text-text-primary">Visualizada por Dra. Ana Vargas</span>
                      </div>
                      <span className="text-text-muted font-micro">Usuario</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-bone-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-aubergine-300" aria-hidden="true" />
                        <span className="font-body-strong tabular-nums text-text-secondary">15/03/2024 10:28</span>
                        <span className="text-text-primary">Consulta de síntesis explicativa IA</span>
                      </div>
                      <span className="text-text-muted font-micro">Usuario</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-bone-50/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-bone-200" aria-hidden="true" />
                        <span className="font-body-strong tabular-nums text-text-secondary">15/03/2024 10:30</span>
                        <span className="text-text-secondary">Pendiente registro de decisión profesional</span>
                      </div>
                      <span className="text-clinical-warning font-body-strong font-micro">En curso</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* 5. Editorial Sub-Footer Credo Banner */}
        <footer className="mt-space-xl pt-space-md border-t border-bone-200 flex flex-col md:flex-row items-center justify-between gap-space-md text-text-muted">
          <div className="flex items-center gap-space-md">
            <div className="font-page-title text-card-title text-text-primary italic">
              "La decisión correcta, en el momento correcto, para cada persona."
            </div>
          </div>
          <div className="flex items-center gap-space-lg font-micro text-micro">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-aubergine-600" aria-hidden="true" />
              <span>PACIENTES MÁS SEGUROS</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-aubergine-600" aria-hidden="true" />
              <span>PROFESIONALES MÁS INFORMADOS</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-aubergine-600" aria-hidden="true" />
              <span>SISTEMA DE SALUD MÁS FUERTE</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
