import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { StatusBadge } from '../components/ui/Badge'
import {
  ClipboardList, Plus, Search, Trash2, Edit2, ChevronRight,
  Bike, Package, Wrench, ArrowRight, X, DollarSign, Truck
} from 'lucide-react'
import type { OrdemServico, OSStatus, ItemOS } from '../types'

const STATUS_FLOW: OSStatus[] = ['na_fila', 'em_analise', 'aguardando_pecas', 'em_manutencao', 'pronta_entrega']

const STATUS_LABELS: Record<OSStatus, string> = {
  na_fila:          'Na Fila',
  em_analise:       'Em Análise',
  aguardando_pecas: 'Aguardando Peças',
  em_manutencao:    'Em Manutenção',
  pronta_entrega:   'Pronta p/ Entrega',
  finalizada:       'Finalizada',
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface OSFormData {
  motoId: string
  clienteId: string
  status: OSStatus
  descricaoProblema: string
  valorMaoDeObra: string
  observacoes: string
}

export function OrdemServico() {
  const navigate = useNavigate()
  const { ordens, motos, clientes, produtos, addOrdem, updateOrdem, deleteOrdem, updateStatus, getMotoById, getClienteById } = useApp()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<OSStatus | 'todas'>('todas')
  const [modal, setModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [editing, setEditing] = useState<OrdemServico | null>(null)
  const [viewing, setViewing] = useState<OrdemServico | null>(null)

  const [form, setForm] = useState<OSFormData>({
    motoId: '', clienteId: '', status: 'na_fila',
    descricaoProblema: '', valorMaoDeObra: '0', observacoes: ''
  })
  const [itens, setItens] = useState<ItemOS[]>([])
  const [addingItem, setAddingItem] = useState(false)
  const [itemProdutoId, setItemProdutoId] = useState('')
  const [itemQtd, setItemQtd] = useState('1')
  const [errors, setErrors] = useState<Partial<OSFormData>>({})

  const filtered = ordens
    .filter(o => filterStatus === 'todas' || o.status === filterStatus)
    .filter(o => {
      if (!search) return true
      const moto = getMotoById(o.motoId)
      const cliente = getClienteById(o.clienteId)
      return (
        o.numero.includes(search) ||
        moto?.placa.toLowerCase().includes(search.toLowerCase()) ||
        cliente?.nome.toLowerCase().includes(search.toLowerCase())
      )
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  function openNew() {
    setEditing(null)
    setForm({ motoId: '', clienteId: '', status: 'na_fila', descricaoProblema: '', valorMaoDeObra: '0', observacoes: '' })
    setItens([])
    setErrors({})
    setModal(true)
  }

  function openEdit(os: OrdemServico) {
    setEditing(os)
    setForm({
      motoId: os.motoId, clienteId: os.clienteId, status: os.status,
      descricaoProblema: os.descricaoProblema,
      valorMaoDeObra: String(os.valorMaoDeObra),
      observacoes: os.observacoes || ''
    })
    setItens([...os.itens])
    setErrors({})
    setModal(true)
  }

  function openDetail(os: OrdemServico) {
    setViewing(os)
    setDetailModal(true)
  }

  function onMotoChange(motoId: string) {
    const moto = motos.find(m => m.id === motoId)
    setForm(p => ({ ...p, motoId, clienteId: moto?.clienteId || '' }))
  }

  function addItem() {
    const prod = produtos.find(p => p.id === itemProdutoId)
    if (!prod) return
    const qty = Math.max(1, parseInt(itemQtd) || 1)
    const existing = itens.find(i => i.produtoId === prod.id)
    if (existing) {
      setItens(prev => prev.map(i => i.produtoId === prod.id ? { ...i, quantidade: i.quantidade + qty } : i))
    } else {
      setItens(prev => [...prev, { produtoId: prod.id, nome: prod.nome, quantidade: qty, valorUnitario: prod.valorVenda }])
    }
    setItemProdutoId('')
    setItemQtd('1')
    setAddingItem(false)
  }

  function removeItem(produtoId: string) {
    setItens(prev => prev.filter(i => i.produtoId !== produtoId))
  }

  function validate() {
    const errs: Partial<OSFormData> = {}
    if (!form.motoId) errs.motoId = 'Selecione uma moto'
    if (!form.descricaoProblema.trim()) errs.descricaoProblema = 'Descreva o problema'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function save() {
    if (!validate()) return
    const data = {
      motoId: form.motoId, clienteId: form.clienteId, status: form.status,
      descricaoProblema: form.descricaoProblema,
      valorMaoDeObra: parseFloat(form.valorMaoDeObra) || 0,
      observacoes: form.observacoes, itens,
    }
    if (editing) { updateOrdem(editing.id, data) } else { addOrdem(data) }
    setModal(false)
  }

  function nextStatus(os: OrdemServico) {
    const idx = STATUS_FLOW.indexOf(os.status as typeof STATUS_FLOW[number])
    if (idx < STATUS_FLOW.length - 1) updateStatus(os.id, STATUS_FLOW[idx + 1])
  }

  const viewingTotal = viewing ? viewing.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0) + viewing.valorMaoDeObra : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-gray-400 text-sm mt-1">{ordens.filter(o => o.status !== 'finalizada').length} ativas · {ordens.filter(o => o.status === 'finalizada').length} finalizadas</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Nova O.S.</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por N°, placa ou cliente..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value as OSStatus | 'todas')}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="todas">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as OSStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-gray-500">
              <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">{search || filterStatus !== 'todas' ? 'Nenhuma O.S. encontrada' : 'Nenhuma O.S. cadastrada'}</p>
              {!search && <button onClick={openNew} className="text-orange-400 text-sm mt-2 hover:underline">Criar primeira O.S.</button>}
            </div>
          </Card>
        ) : (
          filtered.map(os => {
            const moto = getMotoById(os.motoId)
            const cliente = getClienteById(os.clienteId)
            const total = os.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0) + os.valorMaoDeObra
            const canAdvance = os.status !== 'finalizada' && os.status !== 'pronta_entrega'
            return (
              <Card key={os.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => openDetail(os)}>
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardList size={18} className="text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">O.S. #{os.numero}</span>
                        <StatusBadge status={os.status} />
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5 truncate">{cliente?.nome} · {moto?.placa} {moto?.modelo}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{os.descricaoProblema}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{fmtDate(os.updatedAt)}</span>
                        <span className="text-orange-400 font-medium">{fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {os.status === 'pronta_entrega' && (
                      <Button size="sm" onClick={() => navigate('/checkout', { state: { osId: os.id } })}
                        className="gap-1.5 bg-green-600 hover:bg-green-500 text-white border-0">
                        <Truck size={14} /> Entregar
                      </Button>
                    )}
                    {canAdvance && (
                      <Button size="sm" variant="ghost" onClick={() => nextStatus(os)} title="Avançar status">
                        <ArrowRight size={15} />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(os)}>
                      <Edit2 size={15} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteOrdem(os.id)} className="hover:text-red-400">
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? `Editar O.S. #${editing.numero}` : 'Nova Ordem de Serviço'} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Veículo *" value={form.motoId} onChange={e => onMotoChange(e.target.value)} error={errors.motoId}>
              <option value="">Selecione a moto...</option>
              {motos.map(m => {
                const c = clientes.find(cl => cl.id === m.clienteId)
                return <option key={m.id} value={m.id}>{m.placa} · {m.modelo} ({c?.nome})</option>
              })}
            </Select>
            <Select label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as OSStatus }))}>
              {STATUS_FLOW.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </div>

          <Textarea label="Descrição do Problema *" value={form.descricaoProblema} onChange={e => setForm(p => ({ ...p, descricaoProblema: e.target.value }))} rows={3} placeholder="Descreva o problema relatado pelo cliente..." error={errors.descricaoProblema} />

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5"><Package size={15} /> Peças / Produtos</label>
              <Button size="sm" variant="ghost" onClick={() => setAddingItem(true)}><Plus size={14} /> Adicionar</Button>
            </div>
            {addingItem && (
              <div className="flex gap-2 mb-2 p-3 bg-gray-800 rounded-lg">
                <select
                  value={itemProdutoId} onChange={e => setItemProdutoId(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Selecionar produto...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} — {fmt(p.valorVenda)}</option>)}
                </select>
                <input
                  type="number" min="1" value={itemQtd} onChange={e => setItemQtd(e.target.value)}
                  className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-center text-gray-100 focus:outline-none"
                />
                <Button size="sm" onClick={addItem} disabled={!itemProdutoId}>OK</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingItem(false)}><X size={14} /></Button>
              </div>
            )}
            {itens.length > 0 ? (
              <div className="space-y-1">
                {itens.map(item => (
                  <div key={item.produtoId} className="flex items-center justify-between p-2.5 bg-gray-800/50 rounded-lg text-sm">
                    <span className="text-gray-300">{item.nome}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{item.quantidade}x {fmt(item.valorUnitario)}</span>
                      <span className="text-white font-medium">{fmt(item.quantidade * item.valorUnitario)}</span>
                      <button onClick={() => removeItem(item.produtoId)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-3 bg-gray-800/30 rounded-lg">Nenhuma peça adicionada</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mão de Obra (R$)" type="number" min="0" step="0.01"
              value={form.valorMaoDeObra}
              onChange={e => setForm(p => ({ ...p, valorMaoDeObra: e.target.value }))}
            />
            <Textarea label="Observações" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} placeholder="Informações adicionais..." />
          </div>

          {/* Total preview */}
          <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <span className="text-sm text-orange-300 font-medium flex items-center gap-1.5"><DollarSign size={15} /> Total estimado</span>
            <span className="text-lg font-bold text-orange-400">
              {fmt(itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0) + (parseFloat(form.valorMaoDeObra) || 0))}
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={save}>{editing ? 'Salvar' : 'Criar O.S.'}</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {viewing && (
        <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={`O.S. #${viewing.numero}`} size="md">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <StatusBadge status={viewing.status} />
              <span className="text-xs text-gray-500">{fmtDate(viewing.updatedAt)}</span>
            </div>

            {/* Flow */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STATUS_FLOW.map((s, i) => {
                const currentIdx = STATUS_FLOW.indexOf(viewing.status as typeof STATUS_FLOW[number])
                const done = i <= currentIdx
                return (
                  <div key={s} className="flex items-center gap-1 shrink-0">
                    <div className={`px-2 py-1 rounded text-xs font-medium transition-colors ${done ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                      {STATUS_LABELS[s].split(' ')[0]}
                    </div>
                    {i < STATUS_FLOW.length - 1 && <ChevronRight size={14} className="text-gray-600 shrink-0" />}
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Veículo</p>
                <p className="text-white">{getMotoById(viewing.motoId)?.placa} · {getMotoById(viewing.motoId)?.marca} {getMotoById(viewing.motoId)?.modelo}</p>
                <p className="text-gray-400">{getClienteById(viewing.clienteId)?.nome} · {getClienteById(viewing.clienteId)?.telefone}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Problema</p>
                <p className="text-gray-300">{viewing.descricaoProblema}</p>
              </div>
              {viewing.itens.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1"><Package size={12} /> Peças</p>
                  {viewing.itens.map(i => (
                    <div key={i.produtoId} className="flex justify-between text-gray-300 py-1 border-b border-gray-800 last:border-0">
                      <span>{i.nome} × {i.quantidade}</span>
                      <span>{fmt(i.quantidade * i.valorUnitario)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1"><Wrench size={13} /> Mão de Obra</span>
                <span className="text-white">{fmt(viewing.valorMaoDeObra)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-orange-400">{fmt(viewingTotal)}</span>
              </div>
            </div>

            {viewing.status === 'pronta_entrega' && (
              <Button className="w-full bg-green-600 hover:bg-green-500 border-0"
                onClick={() => { setDetailModal(false); navigate('/checkout', { state: { osId: viewing.id } }) }}>
                <Truck size={16} /> Entregar / Pagamento
              </Button>
            )}
            {viewing.status !== 'finalizada' && viewing.status !== 'pronta_entrega' && (
              <Button className="w-full" onClick={() => { nextStatus(viewing); setDetailModal(false) }}>
                <ArrowRight size={16} /> Avançar Status
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
