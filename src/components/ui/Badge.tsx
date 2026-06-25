import type { OSStatus } from '../../types'

const STATUS_CONFIG: Record<OSStatus, { label: string; className: string }> = {
  na_fila:          { label: 'Na Fila',              className: 'bg-gray-700 text-gray-300' },
  em_analise:       { label: 'Em Análise',            className: 'bg-blue-900 text-blue-300' },
  aguardando_pecas: { label: 'Aguardando Peças',      className: 'bg-yellow-900 text-yellow-300' },
  em_manutencao:    { label: 'Em Manutenção',         className: 'bg-orange-900 text-orange-300' },
  pronta_entrega:   { label: 'Pronta p/ Entrega',     className: 'bg-green-900 text-green-300' },
  finalizada:       { label: 'Finalizada',             className: 'bg-purple-900 text-purple-300' },
}

export function StatusBadge({ status }: { status: OSStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' }) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-900 text-green-300',
    warning: 'bg-yellow-900 text-yellow-300',
    danger: 'bg-red-900 text-red-300',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
