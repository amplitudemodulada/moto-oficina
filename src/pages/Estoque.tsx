import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Package, Plus, Search, Trash2, Edit2, AlertTriangle, TrendingUp } from 'lucide-react'
import type { Produto } from '../types'

const CATEGORIAS = ['Peça', 'Fluido/Óleo', 'Filtro', 'Pneu', 'Elétrica', 'Serviço', 'Acessório', 'Outro']

interface ProdutoForm {
  nome: string; descricao: string; valorVenda: string; estoque: string; categoria: string
}
const empty = (): ProdutoForm => ({ nome: '', descricao: '', valorVenda: '', estoque: '0', categoria: 'Peça' })

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

export function Estoque() {
  const { produtos, addProduto, updateProduto, deleteProduto } = useApp()

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('todas')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)
  const [form, setForm] = useState<ProdutoForm>(empty())
  const [errors, setErrors] = useState<Partial<ProdutoForm>>({})

  const filtered = produtos
    .filter(p => filterCat === 'todas' || p.categoria === filterCat)
    .filter(p =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const baixoEstoque = produtos.filter(p => p.estoque <= 2)
  const valorTotalEstoque = produtos.reduce((s, p) => s + p.valorVenda * p.estoque, 0)

  function openNew() {
    setEditing(null)
    setForm(empty())
    setErrors({})
    setModal(true)
  }

  function openEdit(p: Produto) {
    setEditing(p)
    setForm({ nome: p.nome, descricao: p.descricao || '', valorVenda: String(p.valorVenda), estoque: String(p.estoque), categoria: p.categoria || 'Peça' })
    setErrors({})
    setModal(true)
  }

  function validate(): boolean {
    const errs: Partial<ProdutoForm> = {}
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório'
    if (!form.valorVenda || isNaN(parseFloat(form.valorVenda))) errs.valorVenda = 'Valor inválido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function save() {
    if (!validate()) return
    const data = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      valorVenda: parseFloat(form.valorVenda),
      estoque: parseInt(form.estoque) || 0,
      categoria: form.categoria,
    }
    if (editing) { updateProduto(editing.id, data) } else { addProduto(data) }
    setModal(false)
  }

  function ajustarEstoque(id: string, delta: number) {
    const p = produtos.find(x => x.id === id)
    if (p) updateProduto(id, { estoque: Math.max(0, p.estoque + delta) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Estoque</h1>
          <p className="text-gray-400 text-sm mt-1">{produtos.length} produtos · {fmt(valorTotalEstoque)} em estoque</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Novo Produto</Button>
      </div>

      {/* Alerta de baixo estoque */}
      {baixoEstoque.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Baixo estoque</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              {baixoEstoque.map(p => p.nome).join(', ')} {baixoEstoque.length === 1 ? 'está' : 'estão'} com estoque ≤ 2
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIAS.slice(0, 4).map(cat => {
          const count = produtos.filter(p => p.categoria === cat).length
          return (
            <Card key={cat} onClick={() => setFilterCat(filterCat === cat ? 'todas' : cat)} className={filterCat === cat ? 'border-orange-500/40' : ''}>
              <p className="text-xs text-gray-500">{cat}</p>
              <p className="text-xl font-bold text-white mt-1">{count}</p>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="todas">Todas categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table/Cards */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-500">
            <Package size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
            {!search && <button onClick={openNew} className="text-orange-400 text-sm mt-2 hover:underline">Cadastrar primeiro produto</button>}
          </div>
        </Card>
      ) : (
        <div className="hidden sm:block">
          <Card className="overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Produto</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Categoria</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Valor Venda</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Estoque</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{p.nome}</p>
                      {p.descricao && <p className="text-xs text-gray-500 mt-0.5">{p.descricao}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{p.categoria}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-orange-400">{fmt(p.valorVenda)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => ajustarEstoque(p.id, -1)} className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center text-sm transition-colors">−</button>
                        <span className={`text-sm font-medium w-8 text-center ${p.estoque <= 2 ? 'text-yellow-400' : 'text-white'}`}>{p.estoque}</span>
                        <button onClick={() => ajustarEstoque(p.id, 1)} className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center text-sm transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteProduto(p.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filtered.map(p => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-white text-sm">{p.nome}</p>
                  <Badge>{p.categoria}</Badge>
                </div>
                {p.descricao && <p className="text-xs text-gray-500 mb-2">{p.descricao}</p>}
                <div className="flex items-center gap-4">
                  <span className="text-orange-400 font-semibold text-sm">{fmt(p.valorVenda)}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => ajustarEstoque(p.id, -1)} className="w-6 h-6 rounded bg-gray-700 text-gray-300 flex items-center justify-center text-sm">−</button>
                    <span className={`text-sm font-medium ${p.estoque <= 2 ? 'text-yellow-400' : 'text-white'}`}>{p.estoque}</span>
                    <button onClick={() => ajustarEstoque(p.id, 1)} className="w-6 h-6 rounded bg-gray-700 text-gray-300 flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-white rounded"><Edit2 size={14} /></button>
                <button onClick={() => deleteProduto(p.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Produto' : 'Novo Produto/Serviço'}>
        <div className="space-y-4">
          <Input label="Nome *" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} error={errors.nome} placeholder="Ex: Óleo Motor 10W40, Pastilha de Freio..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Categoria" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Estoque (unidades)" type="number" min="0" value={form.estoque} onChange={e => setForm(p => ({ ...p, estoque: e.target.value }))} />
          </div>
          <Input label="Valor de Venda (R$) *" type="number" min="0" step="0.01" value={form.valorVenda} onChange={e => setForm(p => ({ ...p, valorVenda: e.target.value }))} error={errors.valorVenda} placeholder="0,00" />
          <Textarea label="Descrição" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} placeholder="Informações adicionais..." />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={save}>{editing ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
