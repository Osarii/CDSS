import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderScreen } from '@/components/layout/PlaceholderScreen'
import { Dashboard } from '@/features/dashboard/Dashboard'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard — implemented */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Placeholder routes — not yet implemented */}
          <Route
            path="/patients"
            element={
              <PlaceholderScreen
                title="Pacientes"
                detail="Vista de pacientes sintéticos. Planificado para implementación en el siguiente ciclo."
              />
            }
          />
          <Route
            path="/medication-review"
            element={
              <PlaceholderScreen
                title="Revisión Farmacoterapéutica"
                detail="Revisión detallada de medicación, interacciones y posología. Planificado para el siguiente ciclo."
              />
            }
          />
          <Route
            path="/alerts"
            element={
              <PlaceholderScreen
                title="Alertas Clínicas"
                detail="Centro de alertas deterministas. Planificado para implementación posterior."
              />
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <PlaceholderScreen
                title="Base de Conocimiento"
                detail="Consulta de guías, reglas y evidencia clínica estructurada. Planificado para implementación posterior."
              />
            }
          />
          <Route
            path="/audit"
            element={
              <PlaceholderScreen
                title="Auditoría y Trazabilidad"
                detail="Registro de evaluaciones, decisiones clínicas y trazabilidad de hallazgos. Planificado para implementación posterior."
              />
            }
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
