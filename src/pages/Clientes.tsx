import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Users, Bike, Plus, Search, Trash2, Edit2, ChevronDown, ChevronUp, Phone } from 'lucide-react'
import type { Cliente, Moto } from '../types'

const MARCAS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'BMW', 'Ducati', 'Harley-Davidson', 'Royal Enfield', 'KTM', 'Triumph', 'Outra']

interface ClienteFormData { nome: string; telefone: string; email: string }
interface MotoFormData { clienteId: string; placa: string; modelo: string; marca: string; cor: string; ano: string; km: string }

const emptyCliente = (): ClienteFormData => ({ nome: '', telefone: '', email: '' })
const emptyMoto = (clienteId = ''): MotoFormData => ({ clienteId, placa: '', modelo: '', marca: 'Honda', cor: '', ano: '', km: '' })

export function Clientes() {
  const { clientes, motos, addCliente, updateCliente, deleteCliente, addMoto, updateMoto, deleteMoto } = useApp()

  const [search, setSearch] = useState('')
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null)

  const [clienteModal, setClienteModal] = useState(false)
  const [motoModal, setMotoModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [editingMoto, setEditingMoto] = useState<Moto | null>(null)
  const [preselectedClienteId, setPreselectedClienteId] = useState('')

  const [cForm, setCForm] = useState<ClienteFormData>(emptyCliente())
  const [mForm, setMForm] = useState<MotoFormData>(emptyMoto())
  const [cErrors, setCErrors] = useState<Partial<ClienteFormData>>({})
  const [mErrors, setMErrors] = useState<Partial<MotoFormData>>({})

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search) ||
    motos.filter(m => m.clienteId === c.id).some(m =>
      m.placa.toLowerCase().includes(search.toLowerCase()) ||
      m.modelo.toLowerCase().includes(search.toLowerCase())
    )
  )

  function openNewCliente() {
    setEditingCliente(null)
    setCForm(emptyCliente())
    setCErrors({})
    setClienteModal(true)
  }

  function openEditCliente(c: Cliente) {
    setEditingCliente(c)
    setCForm({ nome: c.nome, telefone: c.telefone, email: c.email || '' })
    setCErrors({})
    setClienteModal(true)
  }

  function openNewMoto(clienteId: string) {
    setEditingMoto(null)
    setPreselectedClienteId(clienteId)
    setMForm(emptyMoto(clienteId))
    setMErrors({})
    setMotoModal(true)
  }

  function openEditMoto(m: Moto) {
    setEditingMoto(m)
    setMForm({ clienteId: m.clienteId, placa: m.placa, modelo: m.modelo, marca: m.marca, cor: m.cor, ano: m.ano || '', km: m.km || '' })
    setMErrors({})
    setMotoModal(true)
  }

  function validateCliente(): boolean {
    const errs: Partial<ClienteFormData> = {}
    if (!cForm.nome.trim()) errs.nome = 'Nome obrigatório'
    if (!cForm.telefone.trim()) errs.telefone = 'Telefone obrigatório'
    setCErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateMoto(): boolean {
    const errs: Partial<MotoFormData> = {}
    if (!mForm.placa.trim()) errs.placa = 'Placa obrigatória'
    if (!mForm.modelo.trim()) errs.modelo = 'Modelo obrigatório'
    if (!mForm.cor.trim()) errs.cor = 'Cor obrigatória'
    setMErrors(errs)
    return Object.keys(errs).length === 0
  }

  function saveCliente() {
    if (!validateCliente()) return
    if (editingCliente) {
      updateCliente(editingCliente.id, cForm)
    } else {
      addCliente(cForm)
    }
    setClienteModal(false)
  }

  function saveMoto() {
    if (!validateMoto()) return
    const data = { ...mForm, placa: mForm.placa.toUpperCase() }
    if (editingMoto) {
      updateMoto(editingMoto.id, data)
    } else {
      addMoto(data)
    }
    setMotoModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes & Motos</h1>
          <p className="text-gray-400 text-sm mt-1">{clientes.length} clientes · {motos.length} veículos</p>
        </div>
        <Button onClick={openNewCliente}>
          <Plus size={16} /> Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone, placa ou modelo..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-gray-500">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">{search ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'}</p>
              {!search && (
                <button onClick={openNewCliente} className="text-orange-400 text-sm mt-2 hover:underline">
                  Cadastrar primeiro cliente
                </button>
              )}
            </div>
          </Card>
        ) : (
          filtered.map(cliente => {
            const clienteMotos = motos.filter(m => m.clienteId === cliente.id)
            const expanded = expandedCliente === cliente.id
            return (
              <Card key={cliente.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedCliente(expanded ? null : cliente.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <Users size={18} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{cliente.nome}</p>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Phone size={11} />
                        {cliente.telefone}
                        {cliente.email && <span>· {cliente.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {clienteMotos.length} moto{clienteMotos.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); openEditCliente(cliente) }}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCliente(cliente.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-300">Veículos</h4>
                      <Button size="sm" variant="secondary" onClick={() => openNewMoto(cliente.id)}>
                        <Plus size={14} /> Adicionar Moto
                      </Button>
                    </div>
                    {clienteMotos.length === 0 ? (
                      <p className="text-sm text-gray-500 py-3 text-center">Nenhuma moto cadastrada</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {clienteMotos.map(moto => (
                          <div key={moto.id} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Bike size={16} className="text-orange-400" />
                              <div>
                                <p className="text-sm font-medium text-white">{moto.placa}</p>
                                <p className="text-xs text-gray-400">{moto.marca} {moto.modelo} · {moto.cor}</p>
                                {moto.ano && <p className="text-xs text-gray-500">{moto.ano}{moto.km ? ` · ${moto.km} km` : ''}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openEditMoto(moto)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => deleteMoto(moto.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Cliente */}
      <Modal isOpen={clienteModal} onClose={() => setClienteModal(false)} title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}>
        <div className="space-y-4">
          <Input label="Nome completo *" value={cForm.nome} onChange={e => setCForm(p => ({ ...p, nome: e.target.value }))} error={cErrors.nome} placeholder="Ex: João Silva" />
          <Input label="Telefone / WhatsApp *" value={cForm.telefone} onChange={e => setCForm(p => ({ ...p, telefone: e.target.value }))} error={cErrors.telefone} placeholder="(11) 99999-9999" />
          <Input label="E-mail" value={cForm.email} onChange={e => setCForm(p => ({ ...p, email: e.target.value }))} placeholder="opcional" type="email" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setClienteModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={saveCliente}>{editingCliente ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Moto */}
      <Modal isOpen={motoModal} onClose={() => setMotoModal(false)} title={editingMoto ? 'Editar Moto' : 'Nova Moto'}>
        <div className="space-y-4">
          {!preselectedClienteId && (
            <Select label="Cliente *" value={mForm.clienteId} onChange={e => setMForm(p => ({ ...p, clienteId: e.target.value }))}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Placa *" value={mForm.placa} onChange={e => setMForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))} error={mErrors.placa} placeholder="ABC1D23" maxLength={8} />
            <Select label="Marca *" value={mForm.marca} onChange={e => setMForm(p => ({ ...p, marca: e.target.value }))}>
              {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <Input label="Modelo *" value={mForm.modelo} onChange={e => setMForm(p => ({ ...p, modelo: e.target.value }))} error={mErrors.modelo} placeholder="Ex: CB 300, Fazer 250" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Cor *" value={mForm.cor} onChange={e => setMForm(p => ({ ...p, cor: e.target.value }))} error={mErrors.cor} placeholder="Preta" />
            <Input label="Ano" value={mForm.ano} onChange={e => setMForm(p => ({ ...p, ano: e.target.value }))} placeholder="2022" maxLength={4} />
            <Input label="KM" value={mForm.km} onChange={e => setMForm(p => ({ ...p, km: e.target.value }))} placeholder="15000" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setMotoModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={saveMoto}>{editingMoto ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
