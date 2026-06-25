import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, Package, CreditCard, Wrench, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes', icon: Users,           label: 'Clientes & Motos' },
  { to: '/ordens',   icon: ClipboardList,   label: 'Ordens de Serviço' },
  { to: '/estoque',  icon: Package,         label: 'Estoque' },
  { to: '/checkout', icon: CreditCard,      label: 'Checkout' },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64 bg-gray-950 border-r border-gray-800
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">MotoGest</p>
              <p className="text-xs text-gray-500">Gestão de Oficina</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">v1.0.0 · LocalStorage</p>
        </div>
      </aside>
    </>
  )
}
