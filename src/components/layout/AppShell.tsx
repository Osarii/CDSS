import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Pill,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  Activity,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  implemented: boolean
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Panel clínico', icon: <LayoutDashboard size={18} />, implemented: true },
  { to: '/patients', label: 'Pacientes', icon: <Users size={18} />, implemented: false },
  { to: '/medication-review', label: 'Rev. farmacoterapéutica', icon: <Pill size={18} />, implemented: false },
  { to: '/alerts', label: 'Alertas clínicas', icon: <AlertTriangle size={18} />, implemented: false, badge: '3' },
  { to: '/knowledge-base', label: 'Base de conocimiento', icon: <BookOpen size={18} />, implemented: false },
  { to: '/audit', label: 'Auditoría', icon: <ClipboardList size={18} />, implemented: false },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()

  return (
    <div className="app-shell">
      {/* 220px Fixed Desktop Sidebar */}
      <aside className="app-sidebar" aria-label="Navegación principal SAMED">
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="px-space-md pt-space-lg pb-space-md border-b border-graphite-800">
            <div className="flex items-center gap-space-sm mb-space-xs">
              <div className="h-8 w-8 rounded-md bg-aubergine-700 flex items-center justify-center text-bone-white shrink-0 shadow-sm" aria-hidden="true">
                <Activity size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-card-title text-card-title text-text-inverse tracking-tight">SAMED</span>
                <span className="font-micro text-micro text-aubergine-300 uppercase tracking-wider">Seguridad farmacoterapéutica</span>
              </div>
            </div>
            <p className="font-micro text-micro text-text-muted leading-tight mt-space-xs">
              Decisiones más seguras. Mejor salud para Costa Rica.
            </p>
          </div>

          {/* Demo data notice */}
          <div className="sidebar-demo-notice" role="note" aria-label="Aviso: datos sintéticos de demostración">
            <span className="sidebar-demo-dot" aria-hidden="true" />
            DATOS SINTÉTICOS — DEMO
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-space-xs px-space-sm mt-space-sm" aria-label="Módulos clínicos">
            <ul role="list" className="flex flex-col gap-1 m-0 p-0 list-none">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={`flex items-center justify-between px-space-md py-2 rounded-lg transition-colors text-small ${
                        isActive
                          ? 'bg-graphite-800 text-text-inverse font-body-strong shadow-xs'
                          : 'font-body-regular text-bone-200 hover:bg-graphite-800 hover:text-text-inverse'
                      } ${!item.implemented ? 'opacity-75' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="shrink-0 text-inherit opacity-90">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full bg-clinical-critical-surface text-clinical-critical font-label text-micro font-body-strong">
                            {item.badge}
                          </span>
                        )}
                        {!item.implemented && (
                          <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 bg-graphite-950 text-text-muted border border-graphite-700 rounded" aria-label="Módulo en desarrollo">
                            EN DESARROLLO
                          </span>
                        )}
                      </div>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-graphite-950/70 border-t border-graphite-800">
          <p className="font-micro text-micro text-text-muted leading-relaxed">
            Uso seguro de medicamentos, comunidades más sanas.
          </p>
          <div className="mt-space-xs flex items-center justify-between text-text-muted">
            <span className="font-micro text-micro">Prototipo v2.4</span>
            <span className="w-1.5 h-1.5 rounded-full bg-aubergine-300" aria-hidden="true" />
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="app-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
