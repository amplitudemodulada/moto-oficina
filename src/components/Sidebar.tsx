import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, Package, CreditCard,
  Wrench, Menu, X, BarChart3, HardDrive, LogOut, ShieldCheck, Headset
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',         adminOnly: false },
  { to: '/clientes',   icon: Users,           label: 'Clientes & Motos',  adminOnly: false },
  { to: '/ordens',     icon: ClipboardList,   label: 'Ordens de Serviço', adminOnly: false },
  { to: '/estoque',    icon: Package,         label: 'Estoque',           adminOnly: false },
  { to: '/checkout',   icon: CreditCard,      label: 'Checkout',          adminOnly: false },
  { to: '/financeiro', icon: BarChart3,       label: 'Financeiro',        adminOnly: false },
  { to: '/backup',     icon: HardDrive,       label: 'Backup & Restore',  adminOnly: true  },
]

const ROLE_CONFIG = {
  admin:   { label: 'Administrador', icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  suporte: { label: 'Suporte',       icon: Headset,     color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
}

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const { session, isAdmin, logout } = useAuth()

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin)
  const roleInfo = session ? ROLE_CONFIG[session.role] : null

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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map(({ to, icon: Icon, label, adminOnly }) => (
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
              <span className="flex-1">{label}</span>
              {adminOnly && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-500 font-semibold tracking-wide">
                  ADMIN
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        {session && roleInfo && (
          <div className="px-3 py-3 border-t border-gray-800 space-y-2">
            {/* User card */}
            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${roleInfo.bg}`}>
              <div className="p-1.5 bg-gray-900/50 rounded-lg">
                <roleInfo.icon size={15} className={roleInfo.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{session.username}</p>
                <p className={`text-[10px] ${roleInfo.color}`}>{roleInfo.label}</p>
              </div>
            </div>
            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut size={16} />
              <span className="text-xs font-medium">Sair do sistema</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
