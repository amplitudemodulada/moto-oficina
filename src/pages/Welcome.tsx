import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import {
  Wrench, Bike, ClipboardList, CheckCircle, DollarSign,
  ArrowRight, ShieldCheck, Headset, LayoutDashboard,
  Package, CreditCard,
} from 'lucide-react'

function greeting(): { text: string; emoji: string } {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return { text: 'Bom dia',   emoji: '☀️' }
  if (h >= 12 && h < 18) return { text: 'Boa tarde',  emoji: '🌤️' }
  return                         { text: 'Boa noite',  emoji: '🌙' }
}

function fmtDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const ROLE_CONFIG = {
  admin:   { label: 'Administrador', Icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  suporte: { label: 'Suporte',       Icon: Headset,     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
}

const SHORTCUTS = [
  { to: '/',           Icon: LayoutDashboard, label: 'Dashboard',        color: 'hover:border-gray-500'    },
  { to: '/ordens',     Icon: ClipboardList,   label: 'Ordens de Serviço',color: 'hover:border-orange-500/50' },
  { to: '/checkout',   Icon: CreditCard,      label: 'Checkout',         color: 'hover:border-green-500/50'  },
  { to: '/estoque',    Icon: Package,         label: 'Estoque',          color: 'hover:border-purple-500/50' },
]

export function Welcome() {
  const { session } = useAuth()
  const { ordens, motos } = useApp()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60)
    return () => clearTimeout(t)
  }, [])

  const hoje = new Date().toDateString()
  const g    = greeting()
  const role = session?.role ?? 'suporte'
  const rc   = ROLE_CONFIG[role]

  const ativas       = ordens.filter(o => o.status !== 'finalizada')
  const motosAtivas  = new Set(ativas.map(o => o.motoId)).size
  const concluidasHj = ordens.filter(o =>
    o.status === 'finalizada' && o.finalizadaEm &&
    new Date(o.finalizadaEm).toDateString() === hoje
  )
  const faturamentoMes = (() => {
    const now = new Date()
    return ordens
      .filter(o => o.status === 'finalizada' && o.finalizadaEm &&
        new Date(o.finalizadaEm).getMonth()    === now.getMonth() &&
        new Date(o.finalizadaEm).getFullYear() === now.getFullYear()
      )
      .reduce((s, o) => s + o.itens.reduce((ss, i) => ss + i.valorUnitario * i.quantidade, 0) + o.valorMaoDeObra, 0)
  })()

  const stats = [
    { label: 'Motos na Oficina',  value: motosAtivas,            sub: `de ${motos.length} cadastradas`,         icon: Bike,          color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
    { label: 'O.S. Ativas',       value: ativas.length,          sub: `${ativas.filter(o=>o.status==='em_manutencao').length} em manutenção`, icon: ClipboardList, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Concluídas Hoje',   value: concluidasHj.length,    sub: `de ${ordens.filter(o=>o.status==='finalizada').length} total`, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Faturamento Mês',   value: fmt(faturamentoMes),    sub: 'ordens finalizadas',                     icon: DollarSign,    color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]

  // Stagger helper
  function s(delay: string) {
    return `transition-all duration-700 ${delay} ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 overflow-hidden relative">

      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl space-y-8 relative z-10">

        {/* Logo + brand */}
        <div className={`flex flex-col items-center gap-3 ${s('delay-0')}`}>
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
            <Wrench size={36} className="text-white" />
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">Moto Pro</p>
        </div>

        {/* Greeting */}
        <div className={`text-center space-y-3 ${s('delay-150')}`}>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            {g.emoji} {g.text},
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl font-bold text-orange-400">
              {session?.username}!
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${rc.bg} ${rc.color}`}>
              <rc.Icon size={14} />
              {rc.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm capitalize">{fmtDate()}</p>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${s('delay-300')}`}>
          {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center space-y-2 hover:border-gray-700 transition-colors">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-xl font-bold text-white leading-none">{value}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
              <p className="text-[10px] text-gray-700 leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        {/* Shortcuts */}
        <div className={`space-y-3 ${s('delay-500')}`}>
          <p className="text-xs text-gray-600 text-center uppercase tracking-widest">Acesso rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SHORTCUTS.map(({ to, Icon, label, color }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`flex flex-col items-center gap-2 p-3 bg-gray-900 border border-gray-800 rounded-xl transition-all hover:scale-[1.03] active:scale-100 ${color}`}
              >
                <Icon size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-medium text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`${s('delay-700')}`}>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-base rounded-2xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-100"
          >
            <LayoutDashboard size={20} />
            Acessar o Dashboard
            <ArrowRight size={20} />
          </button>
          <p className="text-center text-xs text-gray-700 mt-3">
            Sessão ativa · expira ao fechar o navegador
          </p>
        </div>

      </div>
    </div>
  )
}
