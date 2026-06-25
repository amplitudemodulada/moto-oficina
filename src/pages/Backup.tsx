import { useState, useRef } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { storage } from '../utils/storage'
import { seedDemoData, clearAllData, getAllDataForExport, restoreFromBackup, hasSeedData } from '../utils/seed'
import {
  Download, Upload, Trash2, Database, CheckCircle,
  AlertTriangle, Users, Bike, ClipboardList, Package,
  TrendingDown, HardDrive, RefreshCw, Info, Sparkles
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

type ModalType = 'seed_confirm' | 'clear_confirm' | 'import_confirm' | 'success' | 'error' | null

export function Backup() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [message, setMessage] = useState('')
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof getAllDataForExport> | null>(null)
  const [lastBackup, setLastBackup] = useState<string>(() => localStorage.getItem(BACKUP_KEY) ?? '')

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

  // ── Seed ──────────────────────────────────────────────────────────────────
  function confirmSeed() {
    clearAllData()
    seedDemoData()
    setModalType(null)
    window.location.reload()
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  function confirmClear() {
    clearAllData()
    setModalType(null)
    window.location.reload()
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

      {/* Demo data */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-400/10 rounded-xl shrink-0">
            <Sparkles size={22} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Dados de Demonstração</h3>
            <p className="text-sm text-gray-400 mt-1">
              Popula o sistema com dados fictícios para explorar todas as funcionalidades.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs text-gray-400">
              {[
                ['8 clientes', 'João, Maria, Carlos...'],
                ['10 motos',   'Honda, Yamaha, Kawasaki...'],
                ['11 O.S.',    '6 finalizadas + em andamento'],
                ['15 produtos','Peças, pneus, óleos, serviços'],
              ].map(([title, sub]) => (
                <div key={title} className="bg-gray-800/50 rounded-lg p-2.5">
                  <p className="text-gray-300 font-medium">{title}</p>
                  <p className="text-gray-600 mt-0.5 leading-tight">{sub}</p>
                </div>
              ))}
            </div>

            {hasSeedData() && (
              <div className="flex items-center gap-2 mt-3 text-xs text-orange-400 bg-orange-400/5 border border-orange-400/15 rounded-lg px-3 py-2">
                <AlertTriangle size={12} />
                Dados de demonstração já carregados. Carregar novamente irá substituir tudo.
              </div>
            )}

            <Button variant="secondary" className="mt-4" onClick={() => setModalType('seed_confirm')}>
              <Sparkles size={16} /> Carregar dados de demonstração
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-400/10 rounded-xl shrink-0">
            <Trash2 size={22} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-400">Zona de Perigo</h3>
            <p className="text-sm text-gray-400 mt-1">
              Remove <span className="text-red-400 font-medium">permanentemente</span> todos os dados do sistema.
              Esta ação não pode ser desfeita.
            </p>
            <Button variant="danger" className="mt-4" onClick={() => setModalType('clear_confirm')} disabled={!hasData}>
              <Trash2 size={16} /> Apagar todos os dados
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Modals ── */}

      {/* Seed confirm */}
      <Modal isOpen={modalType === 'seed_confirm'} onClose={() => setModalType(null)} title="Carregar Dados de Demonstração">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl">
            <AlertTriangle size={20} className="text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              {hasData
                ? 'Os dados atuais serão apagados e substituídos pelos dados de demonstração.'
                : 'O sistema será preenchido com dados fictícios de demonstração.'}
            </p>
          </div>
          <p className="text-sm text-gray-400">
            Serão criados 8 clientes, 10 motos, 11 ordens de serviço, 15 produtos em estoque e 8 despesas de demonstração.
          </p>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={confirmSeed}>
              <Sparkles size={16} /> Confirmar e Carregar
            </Button>
          </div>
        </div>
      </Modal>

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

      {/* Clear confirm */}
      <Modal isOpen={modalType === 'clear_confirm'} onClose={() => setModalType(null)} title="Apagar Todos os Dados">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-400/5 border border-red-400/20 rounded-xl">
            <Trash2 size={20} className="text-red-400 shrink-0" />
            <div>
              <p className="text-sm text-red-300 font-medium">Atenção: ação irreversível</p>
              <p className="text-xs text-red-400/70 mt-1">Todos os dados serão apagados permanentemente.</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Serão removidos <span className="text-white font-medium">{stats.clientes} clientes</span>,{' '}
            <span className="text-white font-medium">{stats.motos} motos</span>,{' '}
            <span className="text-white font-medium">{stats.ordens} ordens</span>,{' '}
            <span className="text-white font-medium">{stats.produtos} produtos</span> e{' '}
            <span className="text-white font-medium">{stats.despesas} despesas</span>.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={confirmClear}>
              <Trash2 size={16} /> Apagar tudo
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
    </div>
  )
}
