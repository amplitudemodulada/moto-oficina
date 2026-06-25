import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import {
  TrendingUp, TrendingDown, Wallet, DollarSign, Plus,
  Trash2, Edit2, ArrowUpRight, ArrowDownLeft, Receipt,
  CalendarDays, BarChart3, Filter
} from 'lucide-react'
import type { Despesa, DespesaCategoria } from '../types'

const CATEGORIAS: DespesaCategoria[] = [
  'Aluguel', 'Ferramentas', 'Peças/Insumos', 'Salários', 'Impostos', 'Utilidades', 'Marketing', 'Outros'
]

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro'
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'todos'

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'hoje',   label: 'Hoje' },
  { value: 'semana', label: 'Esta Semana' },
  { value: 'mes',    label: 'Este Mês' },
  { value: 'ano',    label: 'Este Ano' },
  { value: 'todos',  label: 'Todos' },
]

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function inPeriod(dateIso: string, period: Periodo): boolean {
  const d = new Date(dateIso)
  const now = new Date()
  if (period === 'todos') return true
  if (period === 'hoje') return d.toDateString() === now.toDateString()
  if (period === 'semana') {
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
    return d >= weekAgo
  }
  if (period === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  if (period === 'ano') return d.getFullYear() === now.getFullYear()
  return true
}

interface DespesaForm {
  descricao: string; valor: string; categoria: DespesaCategoria; data: string
}
const emptyForm = (): DespesaForm => ({
  descricao: '', valor: '', categoria: 'Outros', data: new Date().toISOString().slice(0, 10)
})

// Simple bar chart using CSS
function MiniBarChart({ data }: { data: { label: string; entradas: number; saidas: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.entradas, d.saidas]), 1)
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex gap-0.5 items-end" style={{ height: '100px' }}>
            <div
              className="flex-1 bg-green-500/70 rounded-t transition-all"
              style={{ height: `${(d.entradas / maxVal) * 100}%`, minHeight: d.entradas > 0 ? 2 : 0 }}
              title={`Entradas: ${fmt(d.entradas)}`}
            />
            <div
              className="flex-1 bg-red-500/70 rounded-t transition-all"
              style={{ height: `${(d.saidas / maxVal) * 100}%`, minHeight: d.saidas > 0 ? 2 : 0 }}
              title={`Saídas: ${fmt(d.saidas)}`}
            />
          </div>
          <span className="text-[9px] text-gray-600 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Financeiro() {
  const { ordens, despesas, addDespesa, updateDespesa, deleteDespesa, getClienteById, getMotoById } = useApp()

  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Despesa | null>(null)
  const [form, setForm] = useState<DespesaForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<DespesaForm>>({})
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'entradas' | 'saidas'>('todos')

  // Entradas = O.S. finalizadas no período
  const entradas = useMemo(() =>
    ordens
      .filter(o => o.status === 'finalizada' && o.finalizadaEm && inPeriod(o.finalizadaEm, periodo))
      .map(o => ({
        id: o.id,
        tipo: 'entrada' as const,
        descricao: `O.S. #${o.numero} · ${getMotoById(o.motoId)?.placa ?? ''} (${getClienteById(o.clienteId)?.nome ?? ''})`,
        valor: o.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0) + o.valorMaoDeObra,
        data: o.finalizadaEm!,
        extra: o.formaPagamento ? PAYMENT_LABELS[o.formaPagamento] : '',
      })),
    [ordens, periodo, getMotoById, getClienteById]
  )

  const saidas = useMemo(() =>
    despesas
      .filter(d => inPeriod(d.data, periodo))
      .map(d => ({
        id: d.id,
        tipo: 'saida' as const,
        descricao: d.descricao,
        valor: d.valor,
        data: d.data,
        extra: d.categoria,
        raw: d,
      })),
    [despesas, periodo]
  )

  const totalEntradas = entradas.reduce((s, e) => s + e.valor, 0)
  const totalSaidas = saidas.reduce((s, e) => s + e.valor, 0)
  const saldo = totalEntradas - totalSaidas
  const ticketMedio = entradas.length > 0 ? totalEntradas / entradas.length : 0

  // Combine & sort for list
  const transacoes = useMemo(() => {
    const all = [
      ...entradas.map(e => ({ ...e, tipo: 'entrada' as const })),
      ...saidas.map(s => ({ ...s, tipo: 'saida' as const })),
    ].sort((a, b) => b.data.localeCompare(a.data))
    if (tipoFiltro === 'entradas') return all.filter(t => t.tipo === 'entrada')
    if (tipoFiltro === 'saidas')   return all.filter(t => t.tipo === 'saida')
    return all
  }, [entradas, saidas, tipoFiltro])

  // Chart: últimos 6 meses (ou dias se período for hoje/semana)
  const chartData = useMemo(() => {
    if (periodo === 'hoje') {
      // Hourly breakdown (0h-23h)
      return Array.from({ length: 8 }, (_, i) => {
        const h = i * 3
        const label = `${String(h).padStart(2,'0')}h`
        const ent = ordens
          .filter(o => o.status === 'finalizada' && o.finalizadaEm)
          .filter(o => { const d = new Date(o.finalizadaEm!); return d.toDateString() === new Date().toDateString() && d.getHours() >= h && d.getHours() < h + 3 })
          .reduce((s, o) => s + o.itens.reduce((ss, i) => ss + i.valorUnitario * i.quantidade, 0) + o.valorMaoDeObra, 0)
        const sai = despesas
          .filter(d => { const dd = new Date(d.data); return dd.toDateString() === new Date().toDateString() })
          .reduce((s, d) => s + d.valor, 0)
        return { label, entradas: ent, saidas: i === 0 ? sai : 0 }
      })
    }
    // Monthly for last 6 months
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
      const m = d.getMonth(); const y = d.getFullYear()
      const label = d.toLocaleDateString('pt-BR', { month: 'short' })
      const ent = ordens
        .filter(o => o.status === 'finalizada' && o.finalizadaEm)
        .filter(o => { const dd = new Date(o.finalizadaEm!); return dd.getMonth() === m && dd.getFullYear() === y })
        .reduce((s, o) => s + o.itens.reduce((ss, i) => ss + i.valorUnitario * i.quantidade, 0) + o.valorMaoDeObra, 0)
      const sai = despesas
        .filter(d => { const dd = new Date(d.data); return dd.getMonth() === m && dd.getFullYear() === y })
        .reduce((s, d) => s + d.valor, 0)
      return { label, entradas: ent, saidas: sai }
    })
  }, [ordens, despesas, periodo])

  // By payment method
  const porPagamento = useMemo(() => {
    const map: Record<string, number> = {}
    ordens
      .filter(o => o.status === 'finalizada' && o.finalizadaEm && inPeriod(o.finalizadaEm, periodo))
      .forEach(o => {
        const k = o.formaPagamento ?? 'outros'
        const v = o.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0) + o.valorMaoDeObra
        map[k] = (map[k] ?? 0) + v
      })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [ordens, periodo])

  // By expense category
  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {}
    despesas.filter(d => inPeriod(d.data, periodo)).forEach(d => {
      map[d.categoria] = (map[d.categoria] ?? 0) + d.valor
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [despesas, periodo])

  function openNew() {
    setEditing(null); setForm(emptyForm()); setErrors({}); setModal(true)
  }

  function openEdit(d: Despesa) {
    setEditing(d)
    setForm({ descricao: d.descricao, valor: String(d.valor), categoria: d.categoria, data: d.data.slice(0, 10) })
    setErrors({}); setModal(true)
  }

  function validate(): boolean {
    const errs: Partial<DespesaForm> = {}
    if (!form.descricao.trim()) errs.descricao = 'Descrição obrigatória'
    if (!form.valor || isNaN(parseFloat(form.valor)) || parseFloat(form.valor) <= 0) errs.valor = 'Valor inválido'
    if (!form.data) errs.data = 'Data obrigatória'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function save() {
    if (!validate()) return
    const data = { descricao: form.descricao.trim(), valor: parseFloat(form.valor), categoria: form.categoria, data: form.data }
    if (editing) { updateDespesa(editing.id, data) } else { addDespesa(data) }
    setModal(false)
  }

  const saldoPositivo = saldo >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Financeiro</h1>
          <p className="text-gray-400 text-sm mt-1">Entradas, saídas e saldo da oficina</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            {PERIODOS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  periodo === p.value
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button onClick={openNew} size="sm">
            <Plus size={15} /> Nova Despesa
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Entradas</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{fmt(totalEntradas)}</p>
              <p className="text-xs text-gray-500 mt-1">{entradas.length} O.S. finalizadas</p>
            </div>
            <div className="p-2.5 bg-green-400/10 rounded-xl">
              <TrendingUp size={20} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Saídas</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{fmt(totalSaidas)}</p>
              <p className="text-xs text-gray-500 mt-1">{saidas.length} despesas</p>
            </div>
            <div className="p-2.5 bg-red-400/10 rounded-xl">
              <TrendingDown size={20} className="text-red-400" />
            </div>
          </div>
        </Card>

        <Card className={saldoPositivo ? 'border-green-500/30' : 'border-red-500/30'}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Saldo Líquido</p>
              <p className={`text-2xl font-bold mt-1 ${saldoPositivo ? 'text-white' : 'text-red-400'}`}>
                {fmt(saldo)}
              </p>
              <p className={`text-xs mt-1 ${saldoPositivo ? 'text-green-500' : 'text-red-500'}`}>
                {saldoPositivo ? '▲ Positivo' : '▼ Negativo'}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${saldoPositivo ? 'bg-orange-400/10' : 'bg-red-400/10'}`}>
              <Wallet size={20} className={saldoPositivo ? 'text-orange-400' : 'text-red-400'} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ticket Médio</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{fmt(ticketMedio)}</p>
              <p className="text-xs text-gray-500 mt-1">por O.S. finalizada</p>
            </div>
            <div className="p-2.5 bg-blue-400/10 rounded-xl">
              <DollarSign size={20} className="text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={17} className="text-orange-400" />
              <h2 className="font-semibold text-white text-sm">Evolução Financeira</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/70 inline-block" /> Entradas</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block" /> Saídas</span>
            </div>
          </div>
          {chartData.every(d => d.entradas === 0 && d.saidas === 0) ? (
            <div className="h-32 flex items-center justify-center text-gray-600 text-sm">
              Sem dados para exibir
            </div>
          ) : (
            <MiniBarChart data={chartData} />
          )}
        </Card>

        {/* Breakdown */}
        <div className="space-y-4">
          {/* Por forma de pagamento */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={16} className="text-orange-400" />
              <h3 className="text-sm font-semibold text-white">Formas de Pagamento</h3>
            </div>
            {porPagamento.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-2">Sem dados</p>
            ) : (
              porPagamento.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-xs text-gray-400">{PAYMENT_LABELS[key] ?? key}</span>
                  <div className="text-right">
                    <span className="text-xs font-medium text-green-400">{fmt(val)}</span>
                    <span className="text-xs text-gray-600 ml-1">({totalEntradas > 0 ? Math.round((val / totalEntradas) * 100) : 0}%)</span>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Por categoria de despesa */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-orange-400" />
              <h3 className="text-sm font-semibold text-white">Despesas por Categoria</h3>
            </div>
            {porCategoria.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-2">Sem despesas</p>
            ) : (
              porCategoria.map(([cat, val]) => (
                <div key={cat} className="py-1.5 border-b border-gray-800 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{cat}</span>
                    <span className="text-xs font-medium text-red-400">{fmt(val)}</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500/50 rounded-full transition-all"
                      style={{ width: `${totalSaidas > 0 ? (val / totalSaidas) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Transactions */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-orange-400" />
            <h2 className="font-semibold text-white text-sm">Extrato de Transações</h2>
            <span className="text-xs text-gray-500">({transacoes.length})</span>
          </div>
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            {(['todos', 'entradas', 'saidas'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTipoFiltro(t)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize ${
                  tipoFiltro === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {t === 'todos' ? 'Todos' : t === 'entradas' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
          </div>
        </div>

        {transacoes.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma transação neste período</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transacoes.map(t => (
              <div key={`${t.tipo}-${t.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    t.tipo === 'entrada' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {t.tipo === 'entrada'
                      ? <ArrowUpRight size={16} className="text-green-400" />
                      : <ArrowDownLeft size={16} className="text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm text-white leading-tight">{t.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{fmtDate(t.data)}</span>
                      {t.extra && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          t.tipo === 'entrada'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-red-900/50 text-red-400'
                        }`}>
                          {t.extra}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${t.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.tipo === 'entrada' ? '+' : '−'}{fmt(t.valor)}
                  </span>
                  {t.tipo === 'saida' && 'raw' in t && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => openEdit((t as { raw: Despesa }).raw)}
                        className="p-1 text-gray-500 hover:text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteDespesa(t.id)}
                        className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Running balance footer */}
        {transacoes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-400">Saldo no período</span>
            <span className={`text-lg font-bold ${saldoPositivo ? 'text-white' : 'text-red-400'}`}>{fmt(saldo)}</span>
          </div>
        )}
      </Card>

      {/* Modal nova despesa */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Despesa' : 'Nova Despesa'}>
        <div className="space-y-4">
          <Input
            label="Descrição *"
            value={form.descricao}
            onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
            error={errors.descricao}
            placeholder="Ex: Aluguel do espaço, compra de ferramentas..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor (R$) *"
              type="number" min="0.01" step="0.01"
              value={form.valor}
              onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
              error={errors.valor}
              placeholder="0,00"
            />
            <Input
              label="Data *"
              type="date"
              value={form.data}
              onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
              error={errors.data}
            />
          </div>
          <Select
            label="Categoria"
            value={form.categoria}
            onChange={e => setForm(p => ({ ...p, categoria: e.target.value as DespesaCategoria }))}
          >
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={save}>{editing ? 'Salvar' : 'Registrar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
