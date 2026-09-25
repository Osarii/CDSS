import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function HomePlaceholder() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold text-graphite">SAMED — Sistema de Apoyo Médico para Evaluación y Decisión</h1>
      <p className="text-sm font-medium text-aubergine italic">"SAMED apoya la decisión. El profesional toma la decisión."</p>
      <p className="text-graphite-muted">Entorno de desarrollo preparado. Rutas de navegación base:</p>
      <nav className="flex flex-wrap gap-4 pt-4">
        <Link className="text-aubergine hover:underline font-medium" to="/dashboard">Dashboard</Link>
        <Link className="text-aubergine hover:underline font-medium" to="/patients">Pacientes</Link>
        <Link className="text-aubergine hover:underline font-medium" to="/medication-review">Revisión Farmacoterapéutica</Link>
        <Link className="text-aubergine hover:underline font-medium" to="/alerts">Alertas Clínicas</Link>
        <Link className="text-aubergine hover:underline font-medium" to="/knowledge-base">Base de Conocimiento</Link>
        <Link className="text-aubergine hover:underline font-medium" to="/audit">Auditoría</Link>
      </nav>
    </div>
  )
}

function DashboardPlaceholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-graphite">Dashboard Clínico</h1>
      <p className="text-graphite-muted">Ruta placeholder. Pantalla en desarrollo.</p>
    </div>
  )
}

function PatientsPlaceholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-graphite">Pacientes</h1>
      <p className="text-graphite-muted">Ruta placeholder. Pantalla en desarrollo.</p>
    </div>
  )
}

function MedicationReviewPlaceholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-graphite">Revisión Farmacoterapéutica</h1>
      <p className="text-graphite-muted">Ruta placeholder. Pantalla en desarrollo.</p>
    </div>
  )
}

function AlertsPlaceholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-graphite">Alertas Clínicas</h1>
      <p className="text-graphite-muted">Ruta placeholder. Pantalla en desarrollo.</p>
    </div>
  )
}

function KnowledgeBasePlaceholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-graphite">Base de Conocimiento</h1>
      <p className="text-graphite-muted">Ruta placeholder. Pantalla en desarrollo.</p>
    </div>
  )
}

function AuditPlaceholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-graphite">Auditoría y Trazabilidad</h1>
      <p className="text-graphite-muted">Ruta placeholder. Pantalla en desarrollo.</p>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePlaceholder />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        <Route path="/patients" element={<PatientsPlaceholder />} />
        <Route path="/medication-review" element={<MedicationReviewPlaceholder />} />
        <Route path="/alerts" element={<AlertsPlaceholder />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePlaceholder />} />
        <Route path="/audit" element={<AuditPlaceholder />} />
      </Routes>
    </BrowserRouter>
  )
}
