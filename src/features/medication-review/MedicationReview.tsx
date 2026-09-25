import { useState, useMemo } from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CornerDownLeft,
  Droplets,
  FilePlus,
  FileText,
  FlaskConical,
  HelpCircle,
  Info,
  Minimize2,
  MoreVertical,
  Network,
  Pill,
  Plus,
  PlusCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react'
import {
  useDashboardSummary,
  useScenarios,
  useScenarioEvaluation,
} from '@/services/api/useClinicalData'
import type { NormalizedScenario } from '@/domain/scenarios/schema'
import type { ClinicalFinding } from '@/domain/findings/schema'
import type { Medication } from '@/domain/medication/schema'

// ------------------------------------------------------------------
// State feedback panels
// ------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="dashboard-container pt-space-lg" role="status" aria-label="Cargando revisión farmacoterapéutica">
      <div className="space-y-space-md">
        <div className="shimmer-block shimmer-block--wide h-14" />
        <div className="shimmer-block shimmer-block--wide h-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="shimmer-block shimmer-block--wide h-24" />
          <div className="shimmer-block shimmer-block--wide h-24" />
          <div className="shimmer-block shimmer-block--wide h-24" />
          <div className="shimmer-block shimmer-block--wide h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          <div className="lg:col-span-7 space-y-space-md">
            <div className="shimmer-block shimmer-block--wide h-80" />
            <div className="shimmer-block shimmer-block--wide h-56" />
          </div>
          <div className="lg:col-span-5 space-y-space-md">
            <div className="shimmer-block shimmer-block--wide h-[540px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : 'Error al cargar datos de revisión farmacoterapéutica.'
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
// Clinical Drug Metadata Dictionary (Consultative / Demo Reference)
// ------------------------------------------------------------------
interface DrugMetadata {
  family: string
  indication: string
  frequency: string
  elimination: string
  monitoring: string
  renalRisk: boolean
  cardioRisk: boolean
}

const DRUG_METADATA: Record<string, DrugMetadata> = {
  metformin: {
    family: 'Biguanida',
    indication: 'DM tipo 2',
    frequency: 'c/12 h',
    elimination: 'Excreción renal inalterada',
    monitoring: 'Creatinina / TFGe (anual)',
    renalRisk: true,
    cardioRisk: false,
  },
  enalapril: {
    family: 'IECA antihipertensivo',
    indication: 'Hipertensión',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático y excreción renal',
    monitoring: 'Creatinina / TFGe / Potasio sérico',
    renalRisk: true,
    cardioRisk: true,
  },
  lisinopril: {
    family: 'IECA antihipertensivo',
    indication: 'Hipertensión',
    frequency: 'c/24 h',
    elimination: 'Excreción renal inalterada',
    monitoring: 'Creatinina / TFGe / Potasio sérico',
    renalRisk: true,
    cardioRisk: true,
  },
  hydrochlorothiazide: {
    family: 'Diurético tiazídico',
    indication: 'Hipertensión',
    frequency: 'c/24 h',
    elimination: 'Excreción renal',
    monitoring: 'Electrolitos / Función renal',
    renalRisk: true,
    cardioRisk: true,
  },
  hidroclorotiazida: {
    family: 'Diurético tiazídico',
    indication: 'Hipertensión',
    frequency: 'c/24 h',
    elimination: 'Excreción renal',
    monitoring: 'Electrolitos / Función renal',
    renalRisk: true,
    cardioRisk: true,
  },
  atorvastatin: {
    family: 'Estatina hipolipemiante',
    indication: 'Dislipidemia',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático CYP3A4',
    monitoring: 'Perfil lipídico / Transaminasas',
    renalRisk: false,
    cardioRisk: true,
  },
  atorvastatina: {
    family: 'Estatina hipolipemiante',
    indication: 'Dislipidemia',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático CYP3A4',
    monitoring: 'Perfil lipídico / Transaminasas',
    renalRisk: false,
    cardioRisk: true,
  },
  ibuprofen: {
    family: 'AINE no selectivo',
    indication: 'Dolor articular',
    frequency: 'c/8 h',
    elimination: 'Metabolismo hepático y excreción renal',
    monitoring: 'Creatinina / TFGe / Presión arterial',
    renalRisk: true,
    cardioRisk: true,
  },
  ibuprofeno: {
    family: 'AINE no selectivo',
    indication: 'Dolor articular',
    frequency: 'c/8 h',
    elimination: 'Metabolismo hepático y excreción renal',
    monitoring: 'Creatinina / TFGe / Presión arterial',
    renalRisk: true,
    cardioRisk: true,
  },
  omeprazole: {
    family: 'IBP protector',
    indication: 'Gastroprotección',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático CYP2C19',
    monitoring: 'Magnesio / Uso prolongado (>8 sem)',
    renalRisk: false,
    cardioRisk: false,
  },
  omeprazol: {
    family: 'IBP protector',
    indication: 'Gastroprotección',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático CYP2C19',
    monitoring: 'Magnesio / Uso prolongado (>8 sem)',
    renalRisk: false,
    cardioRisk: false,
  },
  'amoxicillin-clavulanate': {
    family: 'Betalactámico + Inhibidor',
    indication: 'Infección bacteriana',
    frequency: 'c/8 h',
    elimination: 'Excreción renal',
    monitoring: 'Hipersensibilidad / Función renal',
    renalRisk: true,
    cardioRisk: false,
  },
  amiodarone: {
    family: 'Antiarrítmico clase III',
    indication: 'Fibrilación auricular',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático',
    monitoring: 'ECG / Potasio sérico / Función tiroidea',
    renalRisk: false,
    cardioRisk: true,
  },
  spironolactone: {
    family: 'Antagonista de aldosterona',
    indication: 'Insuficiencia cardíaca / HTA',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático y renal',
    monitoring: 'Potasio sérico / Creatinina',
    renalRisk: true,
    cardioRisk: true,
  },
  furosemide: {
    family: 'Diurético de asa',
    indication: 'Sobrecarga de volumen',
    frequency: 'c/12 h',
    elimination: 'Excreción renal (65%)',
    monitoring: 'Electrolitos / Presión arterial',
    renalRisk: true,
    cardioRisk: true,
  },
  bisoprolol: {
    family: 'Betabloqueador B1',
    indication: 'Cardiopatía / HTA',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático y excreción renal',
    monitoring: 'Frecuencia cardíaca / Presión arterial',
    renalRisk: false,
    cardioRisk: true,
  },
  amlodipine: {
    family: 'Antagonista de canales de calcio',
    indication: 'Hipertensión',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático CYP3A4',
    monitoring: 'Presión arterial / Edema periférico',
    renalRisk: false,
    cardioRisk: true,
  },
  allopurinol: {
    family: 'Inhibidor xantina oxidasa',
    indication: 'Hiperuricemia / Gota',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático y excreción renal',
    monitoring: 'Ácido úrico / Función renal basal',
    renalRisk: true,
    cardioRisk: false,
  },
  losartan: {
    family: 'ARA-II antihipertensivo',
    indication: 'Hipertensión',
    frequency: 'c/24 h',
    elimination: 'Metabolismo hepático y excreción renal',
    monitoring: 'Presión arterial / Potasio',
    renalRisk: true,
    cardioRisk: true,
  },
}

function getDrugMetadata(name: string): DrugMetadata {
  const lower = name.toLowerCase().trim()
  if (DRUG_METADATA[lower]) return DRUG_METADATA[lower]
  const matchedKey = Object.keys(DRUG_METADATA).find((k) => lower.includes(k) || k.includes(lower))
  if (matchedKey) return DRUG_METADATA[matchedKey]
  return {
    family: 'Fármaco prescrito',
    indication: 'Terapia farmacológica',
    frequency: 'c/24 h',
    elimination: 'Metabolismo sistémico y excreción',
    monitoring: 'Monitoreo clínico periódico',
    renalRisk: false,
    cardioRisk: false,
  }
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

type FilterMode = 'all' | 'prioritized' | 'renal' | 'cardiovascular' | 'chronic' | 'history'

// ------------------------------------------------------------------
// Main MedicationReview Component
// ------------------------------------------------------------------

export function MedicationReview() {
  const { data: allScenarios, isLoading: scenariosLoading, error: scenariosError } = useScenarios()
  const { scenarios: summaryScenarios, isLoading: summaryLoading } = useDashboardSummary()

  const availableScenarios: NormalizedScenario[] = allScenarios ?? summaryScenarios ?? []
  const defaultScenario =
    availableScenarios.find((s) => s.scenarioId === 'SYN-001') ?? availableScenarios[0]

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('')
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
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

  // Canonical scenario-driven alert collection
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

  const context = evalData?.context
  const evaluation = evalData?.evaluation
  const results = evaluation?.results ?? []
  const blockedResults = results.filter((r) => r.status === 'blocked')

  const patient = context?.patient
  const rawMedications = context?.medications ?? []
  const exposures = context?.medicationExposures ?? []
  const allergies = context?.allergies ?? []
  const dataPoints = context?.dataPoints ?? {}

  // Check data availability for renal parameters
  const creatininePoint = dataPoints['serum_creatinine'] || dataPoints['creatinine']
  const egfrPoint = dataPoints['egfr']
  const isRenalDataMissing =
    !creatininePoint ||
    !egfrPoint ||
    creatininePoint.status !== 'AVAILABLE' ||
    egfrPoint.status !== 'AVAILABLE' ||
    blockedResults.some((r) => r.ruleId === 'DEMO-REN-001')

  // Patient metadata formatted facts
  const patientName =
    activeScenario?.scenarioId === 'SYN-001'
      ? 'María Rodríguez'
      : patient?.syntheticIdentifier
        ? `Paciente ${patient.syntheticIdentifier}`
        : 'María Rodríguez'

  const patientAge = patient?.age ?? 54
  const patientGender =
    patient?.gender === 'female' ? 'Femenino' : patient?.gender === 'male' ? 'Masculino' : 'Femenino'

  const patientCedula = patient?.syntheticIdentifier ?? 'SYN-CR-001'
  const patientExpediente = `DEMO-${String(patient?.id || '0001').slice(-4).padStart(4, '0')}`

  const displayAllergies =
    allergies.length > 0
      ? allergies.map((a) => a.substance)
      : activeScenario?.scenarioId === 'SYN-001' || activeScenario?.scenarioId === 'SYN-002'
        ? ['Penicilina']
        : []

  // Helper to link findings to a specific medication
  const getMedicationFindings = (med: Medication) => {
    const lowerName = med.name.toLowerCase()
    const lowerCode = med.code.toLowerCase()
    return visibleAlerts.filter(
      (f) =>
        f.supportingDataKeys.some(
          (k) => k.toLowerCase().includes(lowerName) || k.toLowerCase().includes(lowerCode) || k === med.id
        ) ||
        f.detail.toLowerCase().includes(lowerName) ||
        f.title.toLowerCase().includes(lowerName)
    )
  }

  // Determine active medication list:
  // If scenario has medications, use them.
  const activeMedications: Medication[] = useMemo(() => {
    return rawMedications
  }, [rawMedications])

  // Select default medication on scenario change or initial load:
  // Prefer medication involved in critical findings, otherwise first in list
  const activeSelectedMed = useMemo(() => {
    if (activeMedications.length === 0) return null
    if (selectedMedicationId) {
      const found = activeMedications.find((m) => m.id === selectedMedicationId)
      if (found) return found
    }
    // Find first critical
    const criticalMed = activeMedications.find((m) => {
      const f = getMedicationFindings(m)
      return f.some((item) => item.severity === 'critical')
    })
    return criticalMed ?? activeMedications[0]
  }, [activeMedications, selectedMedicationId, visibleAlerts])

  // Helper to get exposure for a medication
  const getExposureForMed = (medId: string) => exposures.find((e) => e.medicationId === medId)

  // Filtered medications based on filterMode
  const filteredMedications = useMemo(() => {
    return activeMedications.filter((med) => {
      const meta = getDrugMetadata(med.name)
      const medFindings = getMedicationFindings(med)
      const exp = getExposureForMed(med.id)

      if (filterMode === 'prioritized') {
        return medFindings.length > 0
      }
      if (filterMode === 'renal') {
        return meta.renalRisk || medFindings.some((f) => f.ruleId === 'DEMO-REN-001')
      }
      if (filterMode === 'cardiovascular') {
        return meta.cardioRisk
      }
      if (filterMode === 'chronic') {
        return exp?.therapyContext === 'chronic'
      }
      return true
    })
  }, [activeMedications, filterMode, visibleAlerts, exposures])

  // Counts for KPIs and filter chips
  const totalMedsCount = activeMedications.length
  const prioritizedMedsCount = activeMedications.filter((m) => getMedicationFindings(m).length > 0).length
  const renalMedsCount = activeMedications.filter(
    (m) => getDrugMetadata(m.name).renalRisk || getMedicationFindings(m).some((f) => f.ruleId === 'DEMO-REN-001')
  ).length
  const cardioMedsCount = activeMedications.filter((m) => getDrugMetadata(m.name).cardioRisk).length
  const chronicMedsCount = activeMedications.filter((m) => getExposureForMed(m.id)?.therapyContext === 'chronic').length

  const criticalFindings = visibleAlerts.filter((f) => f.severity === 'critical')
  const criticalFindingsCount = criticalFindings.length

  const pendingLabCount = isRenalDataMissing ? (blockedResults.length > 0 ? blockedResults.length : 1) : 0
  const temporalSurveillanceCount = exposures.filter(
    (e) => e.therapyContext === 'acute' || e.therapyContext === 'unknown' || (e.startedAt && !e.endedAt)
  ).length || 1

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  // Format date helper
  const formatMedDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Selected med findings
  const selectedMedFindings = activeSelectedMed ? getMedicationFindings(activeSelectedMed) : []
  const selectedMedExposure = activeSelectedMed ? getExposureForMed(activeSelectedMed.id) : null
  const selectedMedMeta = activeSelectedMed ? getDrugMetadata(activeSelectedMed.name) : getDrugMetadata('')

  const selectedMedHasCritical = selectedMedFindings.some((f) => f.severity === 'critical')
  const selectedMedHasWarning = selectedMedFindings.some((f) => f.severity === 'warning')

  return (
    <div className="flex flex-col w-full min-h-screen bg-bone-100 text-text-primary" role="main" aria-label="Revisión Farmacoterapéutica SAMED">
      {/* 1. Top Clinical Header (Fixed / Sticky 56px) */}
      <header className="clinical-top-header" role="banner">
        {/* Left: Search input */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center w-full">
            <Search size={16} className="absolute left-3 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente por nombre, cédula o N.º de expediente…"
              className="w-full h-9 pl-9 pr-3 bg-bone-white rounded-lg font-body-regular text-small text-text-primary placeholder:text-text-muted border border-bone-200 focus:outline-none focus:border-aubergine-500 shadow-xs"
              aria-label="Buscar paciente simulado"
            />
          </div>
        </div>

        {/* Center: Scenario Selector Toolbar */}
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
                setSelectedMedicationId('')
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

      {/* Main Content Workspace Container */}
      <div className="dashboard-container pt-space-sm">
        {/* 2. Top Banner / Clinical Context Notification */}
        <div className="mb-space-sm py-1 px-space-md rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-between text-micro font-label text-text-secondary shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-aubergine-500 shrink-0" aria-hidden="true" />
            <span>
              ENTORNO DE EXPLORACIÓN CLÍNICA · Datos sintéticos con fines ilustrativos · No constituye sistema en producción clínica · Ambiente controlado CDSS-CR
            </span>
          </div>
          <span className="text-aubergine-600 font-semibold shrink-0">MODO SIMULADO</span>
        </div>

        {/* 3. Missing Data Alert Banner */}
        <section className="mb-space-md" aria-label="Aviso de integridad de datos analíticos">
          <div className="bg-clinical-missing-surface p-space-md rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm shadow-sm border border-clinical-missing-border/40">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-clinical-missing text-bone-white flex items-center justify-center shrink-0">
                <Info size={20} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body-strong text-body-strong text-text-primary">
                    Información clínica incompleta
                  </span>
                  <span className="px-2 py-0.5 rounded bg-clinical-missing-surface text-clinical-missing font-label text-micro font-semibold border border-clinical-missing/30">
                    Parámetro regla DEMO-REN-001
                  </span>
                </div>
                <p className="font-small text-small text-text-secondary mt-0.5">
                  {isRenalDataMissing
                    ? 'No se registra analítica de creatinina sérica ni TFGe en los últimos 6 meses en este expediente simulado.'
                    : 'Parámetros analíticos basales verificados para las reglas de demostración activas.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
              <span className="px-space-sm py-1 rounded-full bg-bone-white text-clinical-missing font-label text-label tracking-wide shadow-xs border border-clinical-missing-border">
                Dato no disponible ≠ normal
              </span>
              <button
                type="button"
                className="bg-bone-white hover:bg-clinical-warning-surface text-clinical-missing px-space-md py-1.5 rounded-lg font-body-strong text-small border border-clinical-missing transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Search size={16} aria-hidden="true" />
                <span>Revisar datos faltantes</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4. Workspace Header */}
        <header className="bg-bone-white p-space-lg rounded-xl shadow-sm mb-space-md flex flex-col lg:flex-row lg:items-center justify-between gap-space-md border border-bone-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-space-md">
            <div className="w-14 h-14 rounded-xl bg-aubergine-100 flex items-center justify-center text-aubergine-600 shrink-0">
              <Pill size={32} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-space-sm flex-wrap">
                <h1 className="font-page-title text-page-title text-text-primary">
                  Revisión Farmacoterapéutica
                </h1>
                <span className="px-space-sm py-0.5 rounded-full bg-bone-200 text-text-secondary font-label text-micro tracking-wider uppercase">
                  REGISTRO DE DEMOSTRACIÓN (SINTÉTICO)
                </span>
              </div>
              <div className="flex items-center gap-space-sm mt-1 text-text-secondary font-body-regular text-small flex-wrap">
                <span className="font-body-strong text-text-primary">{patientName}</span>
                <span className="text-bone-200">•</span>
                <span>{patientAge} años ({patientGender}) · Sintético</span>
                <span className="text-bone-200">•</span>
                <span>
                  Cédula ficticia: <strong className="text-text-primary font-body-strong">{patientCedula}</strong>
                </span>
                <span className="text-bone-200">•</span>
                <span>
                  Expediente simulado: <strong className="text-text-primary font-body-strong">{patientExpediente}</strong>
                </span>
                <span className="text-bone-200">•</span>
                <span>Área de salud: Curridabat Centro (Caso modelo)</span>
                {displayAllergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="px-2 py-0.5 rounded-full bg-clinical-critical-surface text-clinical-critical font-label text-micro flex items-center gap-1 border border-clinical-critical-border/50"
                  >
                    <ShieldAlert size={12} aria-hidden="true" /> Alergia: {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              type="button"
              className="bg-bone-50 hover:bg-bone-200 text-text-secondary hover:text-text-primary px-space-md py-2 rounded-lg font-body-strong text-small transition-colors flex items-center gap-1.5 shadow-xs border border-bone-200"
            >
              <FileText size={18} aria-hidden="true" />
              <span>Descargar informe (Simulado)</span>
            </button>
            <button
              type="button"
              className="bg-aubergine-600 hover:bg-aubergine-700 text-bone-white px-space-md py-2 rounded-lg font-body-strong text-small transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle size={18} aria-hidden="true" />
              <span>+ Agregar medicamento (Simulado)</span>
            </button>
          </div>
        </header>

        {/* 5. Summary Risk Metrics Bar (4 Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-md" aria-label="Métricas de riesgo farmacoterapéutico">
          {/* Card 1: Carga Farmacológica */}
          <div className="bg-bone-white p-space-md rounded-xl shadow-sm flex items-center justify-between border border-bone-200/60">
            <div>
              <span className="font-label text-micro text-text-muted uppercase tracking-wider block mb-1">
                Carga Farmacológica
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display-brand text-display-brand text-text-primary leading-none">
                  {totalMedsCount}
                </span>
                <span className="font-body-regular text-small text-text-secondary">
                  fármacos concurrentes (Simulados)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-text-secondary">
              <Pill size={22} aria-hidden="true" />
            </div>
          </div>

          {/* Card 2: Hallazgo de alta prioridad */}
          <div className="bg-bone-white p-space-md rounded-xl shadow-sm flex items-center justify-between border border-bone-200/60">
            <div>
              <span className="font-label text-micro text-clinical-critical uppercase tracking-wider block mb-1">
                Hallazgo de alta prioridad
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display-brand text-display-brand text-clinical-critical leading-none">
                  {criticalFindingsCount}
                </span>
                <span className="font-body-strong text-small text-clinical-critical">
                  {criticalFindingsCount > 0 ? 'Priorizado (Triple combinación)' : 'Sin alertas críticas activas'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-clinical-critical-surface flex items-center justify-center text-clinical-critical">
              <AlertOctagon size={22} aria-hidden="true" />
            </div>
          </div>

          {/* Card 3: Revisión Analítica Pendiente */}
          <div className="bg-bone-white p-space-md rounded-xl shadow-sm flex items-center justify-between border border-bone-200/60">
            <div>
              <span className="font-label text-micro text-clinical-warning uppercase tracking-wider block mb-1">
                Revisión Analítica Pendiente
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display-brand text-display-brand text-clinical-warning leading-none">
                  {pendingLabCount}
                </span>
                <span className="font-body-regular text-small text-text-secondary">
                  {isRenalDataMissing ? 'Parámetro de regla: TFGe ausente' : 'Sin analíticas bloqueantes'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-clinical-warning-surface flex items-center justify-center text-clinical-warning">
              <Droplets size={22} aria-hidden="true" />
            </div>
          </div>

          {/* Card 4: Vigilancia Temporal */}
          <div className="bg-bone-white p-space-md rounded-xl shadow-sm flex items-center justify-between border border-bone-200/60">
            <div>
              <span className="font-label text-micro text-text-muted uppercase tracking-wider block mb-1">
                Vigilancia Temporal
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display-brand text-display-brand text-text-primary leading-none">
                  {temporalSurveillanceCount}
                </span>
                <span className="font-body-regular text-small text-text-secondary">
                  &gt; 8 semanas de registro (Parámetro demo)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-aubergine-100 flex items-center justify-center text-aubergine-600">
              <Clock size={22} aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* 6. Filter Chips Bar */}
        <section className="bg-bone-white p-space-sm px-space-md rounded-xl shadow-sm mb-space-md flex items-center justify-between overflow-x-auto gap-space-sm border border-bone-200/60" aria-label="Filtros de medicamentos">
          <div className="flex items-center gap-space-xs flex-nowrap">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-space-md py-1.5 rounded-lg text-small flex-shrink-0 transition-colors ${
                filterMode === 'all'
                  ? 'bg-graphite-900 text-text-inverse font-body-strong shadow-xs'
                  : 'bg-bone-50 hover:bg-bone-200 text-text-secondary font-body-regular'
              }`}
            >
              Todos ({totalMedsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('prioritized')}
              className={`px-space-md py-1.5 rounded-lg text-small transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                filterMode === 'prioritized'
                  ? 'bg-clinical-critical text-bone-white font-body-strong shadow-xs'
                  : 'bg-bone-50 hover:bg-clinical-critical-surface text-clinical-critical font-body-strong'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-clinical-critical" aria-hidden="true" />
              Con hallazgos priorizados ({prioritizedMedsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('renal')}
              className={`px-space-md py-1.5 rounded-lg text-small transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                filterMode === 'renal'
                  ? 'bg-clinical-warning text-bone-white font-body-strong shadow-xs'
                  : 'bg-bone-50 hover:bg-clinical-warning-surface text-clinical-warning font-body-strong'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-clinical-warning" aria-hidden="true" />
              Riesgo renal / nefrotóxico ({renalMedsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('cardiovascular')}
              className={`px-space-md py-1.5 rounded-lg text-small transition-colors flex-shrink-0 ${
                filterMode === 'cardiovascular'
                  ? 'bg-graphite-800 text-text-inverse font-body-strong shadow-xs'
                  : 'bg-bone-50 hover:bg-bone-200 text-text-secondary hover:text-text-primary font-body-regular'
              }`}
            >
              Cardiovascular ({cardioMedsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('chronic')}
              className={`px-space-md py-1.5 rounded-lg text-small transition-colors flex-shrink-0 ${
                filterMode === 'chronic'
                  ? 'bg-graphite-800 text-text-inverse font-body-strong shadow-xs'
                  : 'bg-bone-50 hover:bg-bone-200 text-text-secondary hover:text-text-primary font-body-regular'
              }`}
            >
              Crónicos habituales ({chronicMedsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('history')}
              className={`px-space-md py-1.5 rounded-lg text-small transition-colors flex-shrink-0 ${
                filterMode === 'history'
                  ? 'bg-graphite-800 text-text-inverse font-body-strong shadow-xs'
                  : 'bg-bone-50 hover:bg-bone-200 text-text-muted hover:text-text-secondary font-body-regular'
              }`}
            >
              Historial de demostración
            </button>
          </div>

          <div className="text-text-muted font-micro text-micro whitespace-nowrap pl-space-sm hidden md:block">
            Reglas de demostración CDSS-CR
          </div>
        </section>

        {/* 7. Split View: Left Column (7 cols) + Right Column (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
          {/* LEFT SIDE: Medication Table (7 cols ~58%) */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="bg-bone-white rounded-xl shadow-sm overflow-hidden border border-bone-200/60">
              <div className="px-space-lg py-space-md bg-bone-50 flex items-center justify-between border-b border-bone-200/60">
                <div className="flex items-center gap-space-sm">
                  <TableIcon size={20} className="text-aubergine-600" aria-hidden="true" />
                  <h2 className="font-section-title text-card-title text-text-primary">
                    Prescripciones Activas Concurrentes
                  </h2>
                </div>
                <span className="font-small text-small text-text-muted">
                  {filteredMedications.length} registros ordenados por severidad
                </span>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" aria-label="Tabla de prescripciones activas">
                  <thead>
                    <tr className="bg-surface-container-low text-text-muted font-label text-label uppercase tracking-wider border-b border-bone-200/40">
                      <th className="py-3 px-space-md font-semibold">Medicamento</th>
                      <th className="py-3 px-space-sm font-semibold">Dosis</th>
                      <th className="py-3 px-space-sm font-semibold">Frec.</th>
                      <th className="py-3 px-space-sm font-semibold">Vía</th>
                      <th className="py-3 px-space-sm font-semibold">Indicación</th>
                      <th className="py-3 px-space-sm font-semibold">Inicio</th>
                      <th className="py-3 px-space-md font-semibold">Riesgo / Estado</th>
                      <th className="py-3 px-space-sm font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bone-100 font-body-regular text-small text-text-primary">
                    {filteredMedications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-text-secondary">
                          <p className="font-body-regular text-small">
                            No se encontraron medicamentos para el filtro activo.
                          </p>
                          <button
                            type="button"
                            onClick={() => setFilterMode('all')}
                            className="mt-2 text-aubergine-600 font-body-strong text-small hover:underline"
                          >
                            Ver todos los medicamentos
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredMedications.map((med) => {
                        const meta = getDrugMetadata(med.name)
                        const findings = getMedicationFindings(med)
                        const exp = getExposureForMed(med.id)
                        const isSelected = activeSelectedMed?.id === med.id

                        const hasCrit = findings.some((f) => f.severity === 'critical')
                        const hasWarn = findings.some((f) => f.severity === 'warning')

                        // Row background and border highlights
                        let rowClass = 'hover:bg-bone-50/60 transition-colors group cursor-pointer'
                        if (isSelected) {
                          if (hasCrit) {
                            rowClass =
                              'bg-clinical-critical-surface/40 hover:bg-clinical-critical-surface/60 transition-colors cursor-pointer relative shadow-xs border-l-4 border-clinical-critical'
                          } else {
                            rowClass =
                              'bg-bone-50/90 hover:bg-bone-100/80 transition-colors cursor-pointer relative shadow-xs border-l-4 border-aubergine-600'
                          }
                        }

                        // Formatted startedAt date or temporal status
                        const formattedDate = formatMedDate(exp?.startedAt)
                        const therapyContextLabel =
                          exp?.therapyContext === 'chronic'
                            ? 'Crónico'
                            : exp?.therapyContext === 'acute'
                              ? 'Agudo'
                              : 'Dato no inferido'

                        return (
                          <tr
                            key={med.id}
                            onClick={() => setSelectedMedicationId(med.id)}
                            className={rowClass}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setSelectedMedicationId(med.id)
                              }
                            }}
                            aria-label={`Seleccionar medicamento ${med.name}`}
                          >
                            {/* Medicamento */}
                            <td className="py-3.5 px-space-md">
                              <div className="flex items-center gap-2">
                                {hasCrit && isSelected && (
                                  <span className="w-1.5 h-5 bg-clinical-critical rounded-full shrink-0" aria-hidden="true" />
                                )}
                                <div>
                                  <div className={`font-body-strong ${hasCrit ? 'text-clinical-critical' : 'text-text-primary'}`}>
                                    {med.name}
                                  </div>
                                  <span className="font-micro text-micro text-text-muted block">
                                    {meta.family}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Dosis */}
                            <td className={`py-3.5 px-space-sm font-mono text-text-primary ${hasCrit && isSelected ? 'font-bold' : ''}`}>
                              {med.dosage}
                            </td>

                            {/* Frecuencia */}
                            <td className="py-3.5 px-space-sm text-text-secondary">
                              {meta.frequency}
                            </td>

                            {/* Vía */}
                            <td className="py-3.5 px-space-sm text-text-secondary capitalize">
                              {med.route}
                            </td>

                            {/* Indicación */}
                            <td className="py-3.5 px-space-sm text-text-secondary">
                              {meta.indication}
                            </td>

                            {/* Inicio (Preserving temporal metadata) */}
                            <td className="py-3.5 px-space-sm font-mono">
                              {formattedDate ? (
                                <span className="text-text-muted">{formattedDate}</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-clinical-missing-surface text-clinical-missing text-micro font-label" title="Fecha no registrada">
                                  No registrada
                                </span>
                              )}
                              <span className="block text-[9px] text-text-muted font-sans mt-0.5" title="Contexto temporal no inferido">
                                {therapyContextLabel}
                              </span>
                            </td>

                            {/* Riesgo / Estado */}
                            <td className="py-3.5 px-space-md">
                              {hasCrit ? (
                                <span className="px-2 py-0.5 rounded-full bg-clinical-critical text-bone-white font-label text-micro inline-flex items-center gap-1 shadow-xs">
                                  <AlertOctagon size={12} aria-hidden="true" />
                                  ALTA PRIORIDAD · AINE (Caso de estudio)
                                </span>
                              ) : hasWarn ? (
                                <span className="px-2 py-0.5 rounded-full bg-clinical-warning-surface text-clinical-warning font-label text-micro inline-flex items-center gap-1 border border-clinical-warning-border">
                                  <span className="w-1.5 h-1.5 rounded-full bg-clinical-warning" aria-hidden="true" />
                                  {findings[0]?.title.replace(/^DEMO:\s*/, '') || 'Riesgo si TFGe < 45*'}
                                </span>
                              ) : meta.family.includes('IECA') && isRenalDataMissing ? (
                                <span className="px-2 py-0.5 rounded-full bg-clinical-critical-surface text-clinical-critical font-label text-micro inline-flex items-center gap-1 border border-clinical-critical-border">
                                  <span className="w-1.5 h-1.5 rounded-full bg-clinical-critical" aria-hidden="true" />
                                  IECA · Considerado en regla DEMO-REN-001
                                </span>
                              ) : meta.family.includes('Diurético') && isRenalDataMissing ? (
                                <span className="px-2 py-0.5 rounded-full bg-clinical-critical-surface text-clinical-critical font-label text-micro inline-flex items-center gap-1 border border-clinical-critical-border">
                                  <span className="w-1.5 h-1.5 rounded-full bg-clinical-critical" aria-hidden="true" />
                                  Diurético · Considerado en regla DEMO-REN-001
                                </span>
                              ) : meta.family.includes('IBP') ? (
                                <span className="px-2 py-0.5 rounded-full bg-clinical-warning-surface text-clinical-warning font-label text-micro inline-flex items-center gap-1 border border-clinical-warning-border">
                                  <span className="w-1.5 h-1.5 rounded-full bg-clinical-warning" aria-hidden="true" />
                                  Uso &gt;8 sem (Parámetro demo)*
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-clinical-safe-surface text-clinical-safe font-label text-micro inline-flex items-center gap-1 border border-clinical-safe-border">
                                  <span className="w-1.5 h-1.5 rounded-full bg-clinical-safe" aria-hidden="true" />
                                  Sin hallazgos activos en esta revisión
                                </span>
                              )}
                            </td>

                            {/* Acción */}
                            <td className="py-3.5 px-space-sm text-right">
                              {isSelected ? (
                                <span className="px-2 py-1 rounded bg-aubergine-600 text-bone-white font-micro text-micro font-medium uppercase tracking-wider">
                                  Seleccionado
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="p-1 rounded text-text-muted hover:text-aubergine-600 hover:bg-bone-200 transition-colors"
                                  title={`Opciones para ${med.name}`}
                                  aria-label={`Opciones para ${med.name}`}
                                >
                                  <MoreVertical size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-space-lg py-space-sm bg-bone-50 flex items-center justify-between text-text-muted font-micro text-micro border-t border-bone-200/60">
                <span>* Parámetro de demostración de regla, no estándar universal</span>
                <span>CDSS-CR • Regla DEMO-REN-001 (Demostración)</span>
              </div>
            </div>

            {/* Hemodynamic / Mechanism Illustration Card */}
            <div className="bg-bone-white p-space-lg rounded-xl shadow-sm border border-bone-200/60" aria-label="Modelo de mecanismo hemodinámico de demostración">
              <div className="flex items-center justify-between mb-space-sm flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Network size={20} className="text-aubergine-600 shrink-0" aria-hidden="true" />
                  <h3 className="font-body-strong text-body-strong text-text-primary">
                    Relación considerada por la regla de demostración
                  </h3>
                </div>
                <span className="text-aubergine-700 font-label text-micro uppercase bg-aubergine-100 px-2 py-0.5 rounded-full border border-aubergine-300/40">
                  Contenido clínico ilustrativo · pendiente de validación experta
                </span>
              </div>

              <p className="font-small text-small text-text-secondary mb-space-md leading-relaxed">
                Modelo farmacológico considerado por la regla <strong className="text-text-primary font-body-strong">DEMO-REN-001</strong> ante la prescripción concurrente de <strong className="text-text-primary font-body-strong">Ibuprofeno</strong> (AINE) + <strong className="text-text-primary font-body-strong">Enalapril</strong> (IECA) + <strong className="text-text-primary font-body-strong">Hidroclorotiazida</strong> (Tiazida), caracterizado como combinación con potencial alteración de perfusión intraglomerular cuando no existe monitoreo analítico reciente.
              </p>

              {/* 3 Interactive Nodes with + Separators */}
              <div className="bg-bone-50 p-space-md rounded-lg flex flex-col md:flex-row items-center justify-around gap-space-md border border-bone-200/60">
                {/* Node 1: AINE */}
                <div className="flex flex-col items-center text-center max-w-[160px]">
                  <div className="w-10 h-10 rounded-full bg-clinical-critical-surface text-clinical-critical flex items-center justify-center mb-1">
                    <CornerDownLeft size={20} aria-hidden="true" />
                  </div>
                  <span className="font-body-strong text-small text-text-primary">AINE (Ibuprofeno)</span>
                  <span className="font-micro text-micro text-clinical-critical">Vasodilatación renal atenuada</span>
                  <span className="font-micro text-micro text-text-muted">Modelo de arteriola aferente</span>
                </div>

                <div className="text-text-muted hidden md:block" aria-hidden="true">
                  <Plus size={22} />
                </div>

                {/* Node 2: IECA */}
                <div className="flex flex-col items-center text-center max-w-[160px]">
                  <div className="w-10 h-10 rounded-full bg-clinical-critical-surface text-clinical-critical flex items-center justify-center mb-1">
                    <Minimize2 size={20} aria-hidden="true" />
                  </div>
                  <span className="font-body-strong text-small text-text-primary">IECA (Enalapril)</span>
                  <span className="font-micro text-micro text-clinical-critical">Resistencia eferente reducida</span>
                  <span className="font-micro text-micro text-text-muted">Modelo de arteriola eferente</span>
                </div>

                <div className="text-text-muted hidden md:block" aria-hidden="true">
                  <Plus size={22} />
                </div>

                {/* Node 3: Diurético */}
                <div className="flex flex-col items-center text-center max-w-[160px]">
                  <div className="w-10 h-10 rounded-full bg-clinical-warning-surface text-clinical-warning flex items-center justify-center mb-1">
                    <Droplets size={20} aria-hidden="true" />
                  </div>
                  <span className="font-body-strong text-small text-text-primary">Diurético (HCTZ)</span>
                  <span className="font-micro text-micro text-clinical-warning">Volumen intravascular</span>
                  <span className="font-micro text-micro text-text-muted">Flujo renal de referencia</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Detail Inspector Panel (5 cols ~42%) */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <section className="bg-bone-white rounded-xl shadow-sm overflow-hidden border border-bone-200/60" aria-label="Detalle del fármaco seleccionado">
              {/* Dark Header */}
              <div className="bg-graphite-900 text-bone-white p-space-md flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-bone-white ${
                      selectedMedHasCritical
                        ? 'bg-clinical-critical'
                        : selectedMedHasWarning
                          ? 'bg-clinical-warning'
                          : 'bg-aubergine-600'
                    }`}
                  >
                    <AlertOctagon size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <span className="font-label text-micro text-clinical-critical-border uppercase tracking-wider block">
                      Fármaco Seleccionado: Demostración
                    </span>
                    <h3 className="font-card-title text-card-title leading-tight">
                      Análisis del medicamento seleccionado: {activeSelectedMed?.name || 'Ninguno'}
                    </h3>
                  </div>
                </div>
                <span
                  className={`px-space-sm py-0.5 rounded-full text-bone-white font-label text-micro font-bold tracking-wider ${
                    selectedMedHasCritical
                      ? 'bg-clinical-critical'
                      : selectedMedHasWarning
                        ? 'bg-clinical-warning'
                        : 'bg-clinical-safe'
                  }`}
                >
                  {selectedMedHasCritical
                    ? 'ALTA PRIORIDAD'
                    : selectedMedHasWarning
                      ? 'PRIORIDAD MEDIA'
                      : 'SIN RIESGO ACTIVO'}
                </span>
              </div>

              {/* Inspector Body */}
              <div className="p-space-lg flex flex-col gap-space-md">
                {/* Registered Regimen Box */}
                <div className="bg-bone-50 p-space-sm rounded-lg flex items-center justify-between text-text-secondary font-body-regular text-small border border-bone-200/60 flex-wrap gap-2">
                  <div>
                    <span className="font-micro text-micro text-text-muted uppercase block">
                      Pauta registrada
                    </span>
                    <span className="font-body-strong text-text-primary">
                      {activeSelectedMed?.dosage} por vía {activeSelectedMed?.route} cada {selectedMedMeta.frequency.replace(/^c\//, '')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-micro text-micro bg-bone-200 text-text-primary px-2 py-1 rounded inline-block">
                      Prescrito: {formatMedDate(selectedMedExposure?.startedAt) || '01/02/2024'} (Simulado)
                    </span>
                    <span className="block text-[9px] text-text-muted mt-0.5">
                      Contexto: {selectedMedExposure?.therapyContext === 'chronic' ? 'Crónico' : selectedMedExposure?.therapyContext === 'acute' ? 'Agudo' : 'Desconocido (Dato no inferido)'}
                    </span>
                  </div>
                </div>

                {/* Prioritized Findings by Rule */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-clinical-critical font-body-strong text-small">
                      <AlertTriangle size={18} aria-hidden="true" />
                      <span>Hallazgos priorizados por regla DEMO-REN-001</span>
                    </div>
                    <span className="font-micro text-micro text-text-muted">
                      Contenido clínico ilustrativo
                    </span>
                  </div>

                  <div className="space-y-space-sm">
                    {selectedMedFindings.length > 0 ? (
                      selectedMedFindings.map((finding) => (
                        <div
                          key={finding.id}
                          className={`p-space-sm rounded-lg font-body-regular text-small leading-relaxed border ${
                            finding.severity === 'critical'
                              ? 'bg-clinical-critical-surface text-text-primary border-clinical-critical-border'
                              : 'bg-clinical-warning-surface text-text-primary border-clinical-warning-border'
                          }`}
                        >
                          <strong
                            className={`font-body-strong block mb-0.5 ${
                              finding.severity === 'critical' ? 'text-clinical-critical' : 'text-clinical-warning'
                            }`}
                          >
                            {finding.title}:
                          </strong>
                          {finding.detail}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-space-sm rounded-lg bg-clinical-critical-surface text-text-primary font-body-regular text-small leading-relaxed border border-clinical-critical-border">
                          <strong className="font-body-strong text-clinical-critical">Co-prescripción identificada:</strong> Concurrencia de AINE ({activeSelectedMed?.name.toLowerCase()}), IECA (enalapril) y diurético (hidroclorotiazida) en paciente sin registro reciente de analítica renal.
                        </div>
                        <div className="p-space-sm rounded-lg bg-clinical-warning-surface text-text-primary font-body-regular text-small leading-relaxed border border-clinical-warning-border">
                          <strong className="font-body-strong text-clinical-warning">Contexto de riesgo mucoso digestivo:</strong> Posible consideración de susceptibilidad gastrolesiva en caso de antecedentes o tratamientos prolongados.
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reference Pharmacotherapeutic Profile */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-text-primary font-body-strong text-small">
                    <FlaskConical size={18} className="text-aubergine-600" aria-hidden="true" />
                    <span>Perfil farmacoterapéutico de referencia (Datos demostrativos)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-space-sm mb-space-sm">
                    <div className="p-space-sm bg-bone-50 rounded-lg border border-bone-200/60">
                      <span className="font-micro text-micro text-text-muted uppercase block">
                        Vía de eliminación
                      </span>
                      <span className="font-body-strong text-text-primary">
                        {selectedMedMeta.elimination}
                      </span>
                    </div>

                    <div className="p-space-sm bg-bone-50 rounded-lg border border-bone-200/60">
                      <span className="font-micro text-micro text-text-muted uppercase block">
                        Monitoreo sugerido
                      </span>
                      <span className="font-body-strong text-text-primary">
                        {selectedMedMeta.monitoring}
                      </span>
                    </div>
                  </div>

                  {/* Missing Data Warning Box */}
                  <div className="bg-clinical-missing-surface p-space-sm rounded-lg flex items-start gap-space-sm border border-clinical-missing-border">
                    <HelpCircle size={20} className="text-clinical-missing shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1">
                      <span className="font-body-strong text-small text-text-primary">
                        Parámetro de regla: Creatinina sérica no registrada en últimos 6 meses
                      </span>
                      <p className="font-micro text-micro text-text-secondary mt-0.5">
                        La ausencia de datos de función renal reciente en el expediente simulado impide la estimación de TFGe para la evaluación de seguridad.
                      </p>
                      <span className="inline-block mt-1 font-label text-micro text-clinical-missing font-bold">
                        Dato no disponible ≠ normal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Review Considerations */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-clinical-safe font-body-strong text-small">
                    <ShieldCheck size={18} aria-hidden="true" />
                    <span>Consideraciones de revisión profesional (Consultivo)</span>
                  </div>
                  <ul className="space-y-space-xs font-body-regular text-small text-text-primary list-none p-0 m-0">
                    <li className="flex items-start gap-2 p-space-sm bg-clinical-safe-surface rounded-lg border border-clinical-safe-border/50">
                      <CheckCircle2 size={18} className="text-clinical-safe shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        <strong>Opción de valoración analgésica:</strong> Evaluar clínicamente pertinencia de tratamiento alternativo no nefrotóxico según intensidad y etiología del dolor.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 p-space-sm bg-bone-50 rounded-lg border border-bone-200/60">
                      <FileText size={18} className="text-text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        <strong>Evaluación de función renal:</strong> Considerar solicitud de analítica sanguínea (creatinina, TFGe y electrolitos) para caracterizar función basal.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 p-space-sm bg-bone-50 rounded-lg border border-bone-200/60">
                      <Network size={18} className="text-text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        <strong>Revisión de co-prescripción:</strong> Valorar balance beneficio-riesgo de la terapia antihipertensiva y diurética concurrente.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* AI Explanation Box */}
                <div className="bg-aubergine-100 p-space-md rounded-xl shadow-inner border border-aubergine-300/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={18} className="text-aubergine-600" aria-hidden="true" />
                      <span className="font-body-strong text-small text-aubergine-700">
                        Explicación con IA
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-aubergine-600 text-bone-white font-label text-micro font-semibold uppercase tracking-wider">
                        Generado con IA
                      </span>
                      <span className="font-micro text-micro text-text-muted">
                        Síntesis explicativa asistida
                      </span>
                    </div>
                  </div>
                  <p className="font-small text-small text-text-primary leading-relaxed">
                    Esta síntesis generada explica que la regla DEMO-REN-001 detectó la administración concurrente de un AINE ({activeSelectedMed?.name.toLowerCase()}), un IECA (enalapril) y un diurético (hidroclorotiazida), junto con la ausencia de registro reciente de función renal en el expediente simulado. La explicación resume el hallazgo de la regla y la información clínica disponible. Las posibles acciones deben ser evaluadas por el profesional según el contexto del caso.
                  </p>
                  <div className="mt-space-sm pt-space-xs border-t border-aubergine-300/40 text-text-muted font-micro text-micro">
                    La explicación generada complementa la información del sistema y no sustituye el juicio clínico profesional.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-space-xs flex flex-col gap-space-xs">
                  <button
                    type="button"
                    className="w-full bg-aubergine-600 hover:bg-aubergine-700 text-bone-white py-2.5 px-space-md rounded-lg font-body-strong text-small transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>Registrar decisión profesional</span>
                  </button>

                  <div className="grid grid-cols-2 gap-space-xs">
                    <button
                      type="button"
                      className="bg-bone-white hover:bg-bone-50 text-text-primary py-2 px-space-sm rounded-lg font-body-strong text-small border border-bone-200 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCheck size={16} aria-hidden="true" />
                      <span>Marcar como revisado</span>
                    </button>
                    <button
                      type="button"
                      className="bg-bone-white hover:bg-bone-50 text-text-primary py-2 px-space-sm rounded-lg font-body-strong text-small border border-bone-200 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FilePlus size={16} aria-hidden="true" />
                      <span>Agregar nota clínica</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="bg-bone-50 hover:bg-bone-200 text-text-secondary py-1.5 px-space-sm rounded-lg font-body-regular text-micro transition-colors flex items-center justify-center gap-1"
                  >
                    <Clock size={14} aria-hidden="true" />
                    <span>Posponer revisión para próxima consulta</span>
                  </button>

                  <div className="text-center text-text-muted font-micro text-micro mt-1">
                    El profesional de salud mantiene la responsabilidad sobre la decisión clínica final.
                  </div>
                </div>
              </div>
            </section>

            {/* Clinical Rule Traceability Card */}
            <section className="bg-bone-white p-space-md rounded-xl shadow-sm border border-bone-200/60" aria-label="Trazabilidad de regla clínica">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-bone-50 flex items-center justify-center text-text-secondary border border-bone-200/60">
                    <ShieldCheck size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-body-strong text-small text-text-primary">
                      Regla Clínica: DEMO-REN-001 (v0.1)
                    </div>
                    <div className="font-micro text-micro text-text-muted">
                      CDSS-CR · Base de conocimiento de demostración
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-clinical-warning-surface text-clinical-warning font-label text-micro font-semibold border border-clinical-warning-border">
                  DEMOSTRACIÓN
                </span>
              </div>

              <div className="pt-2 border-t border-bone-100 flex items-center justify-between text-micro text-text-muted">
                <span>
                  Validación clínica: <strong className="text-clinical-warning font-medium">PENDIENTE</strong>
                </span>
                <button
                  type="button"
                  className="text-aubergine-600 hover:text-aubergine-700 font-body-strong text-small flex items-center gap-0.5"
                >
                  <span>Trazabilidad</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
