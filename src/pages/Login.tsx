import { useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { Wrench, Eye, EyeOff, LogIn, Lock, User, ShieldCheck, Headset } from 'lucide-react'
import { Button } from '../components/ui/Button'

const HINTS = [
  { username: 'admin',   password: 'admin123',   label: 'Administrador', icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { username: 'suporte', password: 'suporte123', label: 'Suporte',       icon: Headset,     color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20'   },
]

export function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [attempts, setAttempts] = useState(0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) { setError('Preencha usuário e senha'); return }
    setLoading(true)
    setError('')
    const result = await login(username.trim(), password)
    if (result === 'invalid') {
      setAttempts(a => a + 1)
      setError('Usuário ou senha incorretos')
      setPassword('')
    }
    setLoading(false)
  }

  function fillHint(h: typeof HINTS[0]) {
    setUsername(h.username)
    setPassword(h.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">

      {/* Branding */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
          <Wrench size={30} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">MotoGest</h1>
        <p className="text-gray-500 text-sm mt-1">Gestão de Oficina de Motos</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header strip */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <Lock size={15} className="text-orange-400" />
          <span className="text-sm font-medium text-white">Acesso ao sistema</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Usuário</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="admin ou suporte"
                autoComplete="username"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Senha</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg pl-9 pr-10 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <Lock size={12} />
              {error}
              {attempts >= 2 && <span className="text-red-500/60 ml-auto">({attempts}x)</span>}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <LogIn size={16} /> Entrar
          </Button>
        </form>

        {/* Quick access hints */}
        <div className="px-6 pb-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">acesso rápido (demo)</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HINTS.map(h => (
              <button
                key={h.username}
                type="button"
                onClick={() => fillHint(h)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-100 ${h.bg} ${username === h.username ? 'ring-1 ring-orange-500/50' : ''}`}
              >
                <div className={`p-1.5 rounded-lg bg-gray-900/50`}>
                  <h.icon size={14} className={h.color} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-200">{h.username}</p>
                  <p className="text-[10px] text-gray-500">{h.label}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-700">
            Clique para preencher · Altere as senhas após o primeiro acesso
          </p>
        </div>
      </div>
    </div>
  )
}
