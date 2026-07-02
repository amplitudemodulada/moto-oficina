import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, Package, CreditCard,
  Wrench, Menu, X, BarChart3, HardDrive, LogOut, ShieldCheck,
  Headset, KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle,
  Sun, Moon, BookOpen, Download, ShoppingCart,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { changePasswordSelf } from '../utils/auth'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',         adminOnly: false },
  { to: '/clientes',   icon: Users,           label: 'Clientes & Motos',  adminOnly: false },
  { to: '/ordens',     icon: ClipboardList,   label: 'Ordens de Serviço', adminOnly: false },
  { to: '/estoque',    icon: Package,         label: 'Estoque',           adminOnly: false },
  { to: '/checkout',     icon: CreditCard,      label: 'Checkout',           adminOnly: false },
  { to: '/venda-rapida', icon: ShoppingCart,    label: 'Venda Rápida',       adminOnly: false },
  { to: '/financeiro', icon: BarChart3,       label: 'Financeiro',        adminOnly: false },
  { to: '/backup',     icon: HardDrive,       label: 'Backup & Restore',  adminOnly: false },
  { to: '/ajuda',      icon: BookOpen,        label: 'Manual de Uso',     adminOnly: false },
]

const ROLE_CONFIG = {
  admin:   { label: 'Administrador', icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  suporte: { label: 'Suporte',       icon: Headset,     color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
}

interface PwForm { current: string; next: string; confirm: string }
const emptyPw = (): PwForm => ({ current: '', next: '', confirm: '' })

const BACKUP_KEY = 'motogest_last_backup'

function fmtBackupDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function Sidebar() {
  const [open,         setOpen]         = useState(false)
  const [pwModal,      setPwModal]      = useState(false)
  const [logoutModal,  setLogoutModal]  = useState(false)
  const [form,         setForm]         = useState<PwForm>(emptyPw())
  const [shows,        setShows]        = useState({ current: false, next: false, confirm: false })
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)
  const [saving,       setSaving]       = useState(false)

  const lastBackup = localStorage.getItem(BACKUP_KEY)

  const { session, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  function handleLogoutClick() {
    setLogoutModal(true)
  }

  function confirmLogout() {
    setLogoutModal(false)
    logout()
  }
  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin)
  const roleInfo   = session ? ROLE_CONFIG[session.role] : null

  function openPwModal() {
    setForm(emptyPw())
    setError('')
    setSuccess(false)
    setPwModal(true)
  }

  function closePwModal() {
    setPwModal(false)
    setError('')
    setSuccess(false)
  }

  async function handleChangePw() {
    if (!session) return
    if (!form.current)          { setError('Informe a senha atual');              return }
    if (form.next.length < 6)   { setError('Nova senha precisa ter 6+ caracteres'); return }
    if (form.next !== form.confirm) { setError('As senhas novas não coincidem');   return }
    setSaving(true)
    setError('')
    const result = await changePasswordSelf(session.username, form.current, form.next)
    setSaving(false)
    if (result === 'wrong_current') { setError('Senha atual incorreta'); return }
    setSuccess(true)
    setForm(emptyPw())
  }

  function toggle(field: keyof typeof shows) {
    setShows(s => ({ ...s, [field]: !s[field] }))
  }

  function pwInput(
    field: keyof PwForm,
    label: string,
    placeholder: string,
    showKey: keyof typeof shows,
  ) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
        <div className="relative">
          <input
            type={shows[showKey] ? 'text' : 'password'}
            value={form[field]}
            onChange={e => { setForm(p => ({ ...p, [field]: e.target.value })); setError('') }}
            placeholder={placeholder}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg pl-3 pr-10 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
          />
          <button
            type="button"
            onClick={() => toggle(showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {shows[showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

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
              <p className="font-bold text-white text-sm leading-tight">Moto Pro</p>
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
          <div className="px-3 py-3 border-t border-gray-800 space-y-1.5">
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

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            </button>

            {/* Change password */}
            <button
              onClick={openPwModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <KeyRound size={15} />
              Alterar senha
            </button>

            {/* Logout */}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut size={15} />
              Sair do sistema
            </button>
          </div>
        )}
      </aside>

      {/* Change password modal */}
      <Modal isOpen={pwModal} onClose={closePwModal} title="Alterar Minha Senha" size="sm">
        {success ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-green-400/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Senha alterada!</p>
              <p className="text-gray-400 text-sm mt-1">Sua nova senha já está ativa.</p>
            </div>
            <Button className="w-full" onClick={closePwModal}>Fechar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Usuário: <span className="text-gray-300 font-medium">{session?.username}</span>
            </p>

            {pwInput('current', 'Senha atual',        '••••••••', 'current')}
            {pwInput('next',    'Nova senha',          'Mínimo 6 caracteres', 'next')}
            {pwInput('confirm', 'Confirmar nova senha','••••••••', 'confirm')}

            {/* Strength hint */}
            {form.next.length > 0 && (
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      form.next.length >= i * 3
                        ? i <= 1 ? 'bg-red-500' : i === 2 ? 'bg-yellow-500' : i === 3 ? 'bg-blue-500' : 'bg-green-500'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
                <span className="text-[10px] text-gray-500 ml-1 self-center">
                  {form.next.length < 6 ? 'fraca' : form.next.length < 9 ? 'média' : form.next.length < 12 ? 'boa' : 'forte'}
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                <AlertTriangle size={12} />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={closePwModal}>Cancelar</Button>
              <Button className="flex-1" onClick={handleChangePw} loading={saving}>
                <KeyRound size={15} /> Salvar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Logout confirmation + backup reminder */}
      <Modal isOpen={logoutModal} onClose={() => setLogoutModal(false)} title="Sair do sistema" size="sm">
        <div className="space-y-4">
          {lastBackup ? (
            <div className="flex items-start gap-3 p-3 bg-green-400/5 border border-green-400/15 rounded-xl">
              <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300 font-medium">Backup realizado</p>
                <p className="text-xs text-gray-500 mt-0.5">Último: {fmtBackupDate(lastBackup)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-yellow-400/5 border border-yellow-400/15 rounded-xl">
              <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-300 font-medium">Nenhum backup registrado</p>
                <p className="text-xs text-yellow-400/70 mt-0.5">
                  Recomendamos exportar um backup antes de sair para não perder dados.
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-400">Deseja realmente encerrar a sessão?</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setLogoutModal(false)}>
              Cancelar
            </Button>
            {!lastBackup && (
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setLogoutModal(false); window.location.href = '/backup' }}>
                <Download size={14} /> Fazer backup
              </Button>
            )}
            <Button variant="danger" size="sm" className="flex-1" onClick={confirmLogout}>
              <LogOut size={14} /> Sair
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
