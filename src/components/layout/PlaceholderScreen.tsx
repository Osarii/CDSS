import { Construction } from 'lucide-react'

interface PlaceholderScreenProps {
  title: string
  detail?: string
}

export function PlaceholderScreen({ title, detail }: PlaceholderScreenProps) {
  return (
    <div className="placeholder-screen" role="main" aria-label={`Módulo: ${title}`}>
      <Construction size={28} className="placeholder-icon" aria-hidden="true" />
      <h1 className="placeholder-title">{title}</h1>
      <p className="placeholder-detail">
        {detail ?? 'Este módulo está planificado y será implementado en una versión posterior de SAMED.'}
      </p>
      <span className="placeholder-badge">Módulo en desarrollo</span>
    </div>
  )
}
