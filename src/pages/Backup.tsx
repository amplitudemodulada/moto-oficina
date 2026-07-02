import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { storage } from '../utils/storage'
import { getAllDataForExport, restoreFromBackup } from '../utils/seed'
import { getUsers, resetPasswordAdmin } from '../utils/auth'
import type { StoredUser } from '../utils/auth'
import { getTelegramConfig, saveTelegramConfig, sendTelegram, testTelegram, msgLogin } from '../utils/telegram'
import type { TelegramConfig } from '../utils/telegram'
import {
  Download, Upload, Database, CheckCircle,
  AlertTriangle, Users, Bike, ClipboardList, Package,
  TrendingDown, HardDrive, RefreshCw, Info,   ShieldCheck, Headset, KeyRound, Eye, EyeOff,
  Send, BellRing, BellOff, ExternalLink,
} from 'lucide-react'

const BACKUP_KEY = 'motogest_last_backup'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function dataSize(): string {
  let bytes = 0
  const keys = ['motogest_clientes', 'motogest_motos', 'motogest_ordens', 'motogest_produtos', 'motogest_despesas']
  keys.forEach(k => { bytes += (localStorage.getItem(k) ?? '').length * 2 })
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ROLE_INFO = {
  admin:   { label: 'Administrador', icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  suporte: { label: 'Suporte',       icon: Headset,     color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
}

type ModalType = 'import_confirm' | 'success' | 'error' | 'reset_pw' | null

export function Backup() {
  const { role } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [modalType,     setModalType]     = useState<ModalType>(null)
  const [message,       setMessage]       = useState('')
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof getAllDataForExport> | null>(null)
  const [lastBackup,    setLastBackup]    = useState<string>(() => localStorage.getItem(BACKUP_KEY) ?? '')

  // Telegram config
  const [tgConfig,     setTgConfig]     = useState<TelegramConfig>(() => getTelegramConfig())
  const [tgSaving,     setTgSaving]     = useState(false)
  const [tgTesting,    setTgTesting]    = useState(false)
  const [tgTestResult, setTgTestResult] = useState<{ ok: boolean; desc: string } | null>(null)
  const [showToken,    setShowToken]    = useState(false)

  async function handleTgTest() {
    setTgTesting(true)
    setTgTestResult(null)
    saveTelegramConfig(tgConfig)
    const r = await testTelegram(tgConfig, msgLogin('teste', 'suporte'))
    setTgTestResult(r)
    setTgTesting(false)
  }

  function handleTgSave() {
    setTgSaving(true)
    saveTelegramConfig(tgConfig)
    setTimeout(() => setTgSaving(false), 600)
  }

  // User management
  const [systemUsers,   setSystemUsers]   = useState<StoredUser[]>(() => getUsers())
  const [resetTarget,   setResetTarget]   = useState<StoredUser | null>(null)
  const [newPw,         setNewPw]         = useState('')
  const [confirmPw,     setConfirmPw]     = useState('')
  const [showNewPw,     setShowNewPw]     = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwError,       setPwError]       = useState('')
  const [pwSaving,      setPwSaving]      = useState(false)
  const [pwSuccess,     setPwSuccess]     = useState(false)

  const stats = {
    clientes: storage.clientes.getAll().length,
    motos:    storage.motos.getAll().length,
    ordens:   storage.ordens.getAll().length,
    produtos: storage.produtos.getAll().length,
    despesas: storage.despesas.getAll().length,
  }

  const hasData = stats.clientes > 0 || stats.ordens > 0

  // ── Export ──────────────────────────────────────────────────────────────
  function handleExport() {
    const data = getAllDataForExport()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `motogest-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    const now = new Date().toISOString()
    localStorage.setItem(BACKUP_KEY, now)
    setLastBackup(now)
    setMessage('Backup exportado com sucesso!')
    setModalType('success')
  }

  // ── Import ───────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target!.result as string)
        const valid = parsed.clientes && parsed.motos && parsed.ordens && parsed.produtos && parsed.despesas
        if (!valid) throw new Error('Estrutura inválida')
        setPendingImport(parsed)
        setModalType('import_confirm')
      } catch {
        setMessage('Arquivo inválido. Certifique-se de usar um backup gerado por este sistema.')
        setModalType('error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function confirmImport() {
    if (!pendingImport) return
    restoreFromBackup(pendingImport)
    setPendingImport(null)
    setModalType(null)
    window.location.reload()
  }

  // ── Reset password (admin) ────────────────────────────────────────────────
  function openResetPw(user: StoredUser) {
    setResetTarget(user)
    setNewPw('')
    setConfirmPw('')
    setPwError('')
    setPwSuccess(false)
    setShowNewPw(false)
    setShowConfirmPw(false)
    setModalType('reset_pw')
  }

  async function confirmResetPw() {
    if (!resetTarget) return
    if (newPw.length < 6)     { setPwError('Mínimo 6 caracteres'); return }
    if (newPw !== confirmPw)  { setPwError('As senhas não coincidem'); return }
    setPwSaving(true)
    setPwError('')
    await resetPasswordAdmin(resetTarget.username, newPw)
    setSystemUsers(getUsers())
    setPwSaving(false)
    setPwSuccess(true)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Backup & Restauração</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie seus dados, exporte backups e restaure o sistema</p>
      </div>

      {/* Status overview */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Database size={17} className="text-orange-400" />
          <h2 className="font-semibold text-white text-sm">Estado Atual dos Dados</h2>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-lg flex items-center gap-1">
            <HardDrive size={11} /> {dataSize()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {[
            { icon: Users,         label: 'Clientes',  count: stats.clientes, color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
            { icon: Bike,          label: 'Motos',     count: stats.motos,    color: 'text-orange-400', bg: 'bg-orange-400/10' },
            { icon: ClipboardList, label: 'O.S.',      count: stats.ordens,   color: 'text-green-400',  bg: 'bg-green-400/10'  },
            { icon: Package,       label: 'Produtos',  count: stats.produtos, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { icon: TrendingDown,  label: 'Despesas',  count: stats.despesas, color: 'text-red-400',    bg: 'bg-red-400/10'    },
          ].map(({ icon: Icon, label, count, color, bg }) => (
            <div key={label} className="flex flex-col items-center p-3 bg-gray-800/50 rounded-xl gap-1.5">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon size={16} className={color} />
              </div>
              <span className="text-xl font-bold text-white">{count}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {lastBackup ? (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/15 rounded-lg px-3 py-2">
            <CheckCircle size={13} />
            Último backup: {fmtDate(lastBackup)}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/5 border border-yellow-400/15 rounded-lg px-3 py-2">
            <AlertTriangle size={13} />
            Nenhum backup exportado ainda. Recomendamos exportar regularmente.
          </div>
        )}
      </Card>

      {/* Export */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-400/10 rounded-xl shrink-0">
            <Download size={22} className="text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Exportar Backup</h3>
            <p className="text-sm text-gray-400 mt-1">
              Salva todos os dados (clientes, motos, O.S., estoque e despesas) em um arquivo{' '}
              <span className="text-gray-300 font-medium">.json</span> no seu computador.
            </p>
            <div className="flex items-center gap-2 mt-3 p-2.5 bg-gray-800/50 rounded-lg text-xs text-gray-500">
              <Info size={12} />
              O arquivo pode ser reimportado para restaurar ou migrar para outro dispositivo.
            </div>
            <Button variant="success" className="mt-4" onClick={handleExport} disabled={!hasData}>
              <Download size={16} /> Exportar backup agora
            </Button>
            {!hasData && <p className="text-xs text-gray-600 mt-2">Nenhum dado para exportar ainda.</p>}
          </div>
        </div>
      </Card>

      {/* Import */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-400/10 rounded-xl shrink-0">
            <Upload size={22} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Restaurar Backup</h3>
            <p className="text-sm text-gray-400 mt-1">
              Importa um arquivo de backup previamente exportado. Os dados atuais serão{' '}
              <span className="text-yellow-400 font-medium">substituídos</span>.
            </p>
            <div className="flex items-center gap-2 mt-3 p-2.5 bg-yellow-400/5 border border-yellow-400/15 rounded-lg text-xs text-yellow-400">
              <AlertTriangle size={12} />
              Faça um backup antes de restaurar para não perder dados.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button className="mt-4" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Selecionar arquivo de backup
            </Button>
          </div>
        </div>
      </Card>

      {/* User management */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-400/10 rounded-xl shrink-0">
            <KeyRound size={22} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Gerenciar Usuários</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Redefina a senha de qualquer usuário do sistema sem precisar da senha atual.
            </p>
            <div className="space-y-2">
              {systemUsers.map(user => {
                const info = ROLE_INFO[user.role]
                return (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${info.bg}`}>
                        <info.icon size={16} className={info.color} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{user.username}</p>
                        <p className={`text-xs ${info.color}`}>{info.label}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openResetPw(user)}>
                      <KeyRound size={14} /> Redefinir senha
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Telegram notifications — suporte only */}
      {role === 'suporte' && <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-400/10 rounded-xl shrink-0">
            <BellRing size={22} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-white">Notificações Telegram</h3>
              <button
                type="button"
                onClick={() => setTgConfig(c => ({ ...c, enabled: !c.enabled }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${tgConfig.enabled ? 'bg-blue-500' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${tgConfig.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Receba uma mensagem no Telegram sempre que alguém fizer login ou logout no sistema.
            </p>

            <div className="space-y-3">
              {/* Bot Token */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Bot Token</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tgConfig.botToken}
                    onChange={e => setTgConfig(c => ({ ...c, botToken: e.target.value }))}
                    placeholder="123456789:ABCdef..."
                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg pl-3 pr-10 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowToken(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Chat ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Chat ID</label>
                <input
                  type="text"
                  value={tgConfig.chatId}
                  onChange={e => setTgConfig(c => ({ ...c, chatId: e.target.value }))}
                  placeholder="-100123456789 ou @seuchat"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Test result */}
              {tgTestResult && (
                <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${tgTestResult.ok ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
                  {tgTestResult.ok
                    ? <CheckCircle size={12} className="mt-0.5 shrink-0" />
                    : <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  }
                  <span>{tgTestResult.desc}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={handleTgTest} loading={tgTesting}
                  disabled={!tgConfig.botToken || !tgConfig.chatId}>
                  <Send size={14} /> Testar
                </Button>
                <Button size="sm" onClick={handleTgSave} loading={tgSaving}>
                  {tgConfig.enabled ? <BellRing size={14} /> : <BellOff size={14} />}
                  {tgSaving ? 'Salvo!' : 'Salvar configuração'}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors select-none">
                Como configurar o bot Telegram
              </summary>
              <div className="mt-3 space-y-2 text-xs text-gray-500 bg-gray-800/50 rounded-xl p-3">
                <p className="font-semibold text-gray-400">Passo a passo:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Abra o Telegram e busque por <span className="text-gray-300">@BotFather</span></li>
                  <li>Envie <span className="font-mono text-gray-300">/newbot</span> e siga as instruções para criar seu bot</li>
                  <li>Copie o <span className="text-gray-300">Token</span> fornecido pelo BotFather e cole acima</li>
                  <li>Envie qualquer mensagem para o seu bot para iniciar o chat</li>
                  <li>Busque por <span className="text-gray-300">@userinfobot</span> e envie <span className="font-mono text-gray-300">/start</span> para descobrir seu Chat ID</li>
                  <li>Cole o Chat ID acima, clique em <span className="text-gray-300">Testar</span> e depois <span className="text-gray-300">Salvar</span></li>
                </ol>
                <a
                  href="https://core.telegram.org/bots#botfather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 mt-2"
                >
                  <ExternalLink size={11} /> Documentação oficial
                </a>
              </div>
            </details>
          </div>
        </div>
      </Card>}


      {/* ── Modals ── */}

      {/* Import confirm */}
      <Modal isOpen={modalType === 'import_confirm'} onClose={() => setModalType(null)} title="Restaurar Backup">
        <div className="space-y-4">
          {pendingImport && (
            <div className="p-4 bg-gray-800 rounded-xl space-y-2 text-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Arquivo detectado</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300">
                <span className="text-gray-500">Exportado em</span>
                <span>{pendingImport.exportedAt ? fmtDate(pendingImport.exportedAt) : '—'}</span>
                <span className="text-gray-500">Clientes</span>
                <span>{pendingImport.clientes.length}</span>
                <span className="text-gray-500">Motos</span>
                <span>{pendingImport.motos.length}</span>
                <span className="text-gray-500">Ordens</span>
                <span>{pendingImport.ordens.length}</span>
                <span className="text-gray-500">Produtos</span>
                <span>{pendingImport.produtos.length}</span>
                <span className="text-gray-500">Despesas</span>
                <span>{pendingImport.despesas.length}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl">
            <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">Os dados atuais serão substituídos pelos do arquivo.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={confirmImport}>
              <RefreshCw size={16} /> Restaurar agora
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success */}
      <Modal isOpen={modalType === 'success'} onClose={() => setModalType(null)} title="Sucesso" size="sm">
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 bg-green-400/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <p className="text-gray-300 text-sm">{message}</p>
          <Button className="w-full" onClick={() => setModalType(null)}>OK</Button>
        </div>
      </Modal>

      {/* Error */}
      <Modal isOpen={modalType === 'error'} onClose={() => setModalType(null)} title="Erro na importação" size="sm">
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 bg-red-400/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <p className="text-gray-300 text-sm">{message}</p>
          <Button variant="secondary" className="w-full" onClick={() => setModalType(null)}>Fechar</Button>
        </div>
      </Modal>

      {/* Reset password (admin) */}
      <Modal
        isOpen={modalType === 'reset_pw'}
        onClose={() => setModalType(null)}
        title={`Redefinir senha — ${resetTarget?.username ?? ''}`}
        size="sm"
      >
        {pwSuccess ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-green-400/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Senha redefinida!</p>
              <p className="text-gray-400 text-sm mt-1">
                O usuário <span className="text-white font-medium">{resetTarget?.username}</span> já pode usar a nova senha.
              </p>
            </div>
            <Button className="w-full" onClick={() => setModalType(null)}>Fechar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {resetTarget && (
              <div className={`flex items-center gap-3 p-3 rounded-xl ${ROLE_INFO[resetTarget.role].bg}`}>
                {(() => { const I = ROLE_INFO[resetTarget.role].icon; return <I size={16} className={ROLE_INFO[resetTarget.role].color} /> })()}
                <div>
                  <p className="text-sm font-semibold text-white">{resetTarget.username}</p>
                  <p className={`text-xs ${ROLE_INFO[resetTarget.role].color}`}>{ROLE_INFO[resetTarget.role].label}</p>
                </div>
              </div>
            )}

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Nova senha</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwError('') }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg pl-3 pr-10 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button type="button" onClick={() => setShowNewPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirmar nova senha</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setPwError('') }}
                  placeholder="Repita a nova senha"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg pl-3 pr-10 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
                  {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Match indicator */}
            {confirmPw.length > 0 && (
              <div className={`flex items-center gap-1.5 text-xs ${newPw === confirmPw ? 'text-green-400' : 'text-red-400'}`}>
                {newPw === confirmPw
                  ? <><CheckCircle size={12} /> Senhas coincidem</>
                  : <><AlertTriangle size={12} /> Senhas diferentes</>
                }
              </div>
            )}

            {pwError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                <AlertTriangle size={12} /> {pwError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setModalType(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={confirmResetPw} loading={pwSaving}>
                <KeyRound size={15} /> Redefinir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
