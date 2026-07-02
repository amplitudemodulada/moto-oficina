import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Cliente, Moto, OrdemServico, Produto, OSStatus, Despesa, VendaRapida } from '../types'
import { storage, gerarId, gerarNumeroOS } from '../utils/storage'

interface AppContextType {
  clientes: Cliente[]
  motos: Moto[]
  ordens: OrdemServico[]
  produtos: Produto[]
  despesas: Despesa[]
  vendasRapidas: VendaRapida[]

  addCliente: (c: Omit<Cliente, 'id' | 'createdAt'>) => Cliente
  updateCliente: (id: string, c: Partial<Cliente>) => void
  deleteCliente: (id: string) => void

  addMoto: (m: Omit<Moto, 'id' | 'createdAt'>) => Moto
  updateMoto: (id: string, m: Partial<Moto>) => void
  deleteMoto: (id: string) => void

  addOrdem: (o: Omit<OrdemServico, 'id' | 'numero' | 'createdAt' | 'updatedAt'>) => OrdemServico
  updateOrdem: (id: string, o: Partial<OrdemServico>) => void
  deleteOrdem: (id: string) => void
  updateStatus: (id: string, status: OSStatus) => void

  addProduto: (p: Omit<Produto, 'id' | 'createdAt'>) => Produto
  updateProduto: (id: string, p: Partial<Produto>) => void
  deleteProduto: (id: string) => void

  addDespesa: (d: Omit<Despesa, 'id' | 'createdAt'>) => Despesa
  updateDespesa: (id: string, d: Partial<Despesa>) => void
  deleteDespesa: (id: string) => void

  addVendaRapida: (v: Omit<VendaRapida, 'id' | 'createdAt'>) => VendaRapida
  deleteVendaRapida: (id: string) => void

  getClienteById: (id: string) => Cliente | undefined
  getMotoById: (id: string) => Moto | undefined
  getMotosByCliente: (clienteId: string) => Moto[]
  getOrdensByMoto: (motoId: string) => OrdemServico[]
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(() => storage.clientes.getAll())
  const [motos, setMotos] = useState<Moto[]>(() => storage.motos.getAll())
  const [ordens, setOrdens] = useState<OrdemServico[]>(() => storage.ordens.getAll())
  const [produtos, setProdutos] = useState<Produto[]>(() => storage.produtos.getAll())
  const [despesas, setDespesas] = useState<Despesa[]>(() => storage.despesas.getAll())
  const [vendasRapidas, setVendasRapidas] = useState<VendaRapida[]>(() => storage.vendas.getAll())

  useEffect(() => { storage.clientes.save(clientes) }, [clientes])
  useEffect(() => { storage.motos.save(motos) }, [motos])
  useEffect(() => { storage.ordens.save(ordens) }, [ordens])
  useEffect(() => { storage.produtos.save(produtos) }, [produtos])
  useEffect(() => { storage.despesas.save(despesas) }, [despesas])
  useEffect(() => { storage.vendas.save(vendasRapidas) }, [vendasRapidas])

  const addCliente = useCallback((data: Omit<Cliente, 'id' | 'createdAt'>): Cliente => {
    const novo: Cliente = { ...data, id: gerarId(), createdAt: new Date().toISOString() }
    setClientes(prev => [...prev, novo])
    return novo
  }, [])

  const updateCliente = useCallback((id: string, data: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }, [])

  const deleteCliente = useCallback((id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id))
  }, [])

  const addMoto = useCallback((data: Omit<Moto, 'id' | 'createdAt'>): Moto => {
    const nova: Moto = { ...data, id: gerarId(), createdAt: new Date().toISOString() }
    setMotos(prev => [...prev, nova])
    return nova
  }, [])

  const updateMoto = useCallback((id: string, data: Partial<Moto>) => {
    setMotos(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  }, [])

  const deleteMoto = useCallback((id: string) => {
    setMotos(prev => prev.filter(m => m.id !== id))
  }, [])

  const addOrdem = useCallback((data: Omit<OrdemServico, 'id' | 'numero' | 'createdAt' | 'updatedAt'>): OrdemServico => {
    const now = new Date().toISOString()
    const nova: OrdemServico = {
      ...data,
      id: gerarId(),
      numero: gerarNumeroOS(ordens),
      createdAt: now,
      updatedAt: now,
    }
    setOrdens(prev => [...prev, nova])
    return nova
  }, [ordens])

  const updateOrdem = useCallback((id: string, data: Partial<OrdemServico>) => {
    setOrdens(prev => prev.map(o =>
      o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
    ))
  }, [])

  const deleteOrdem = useCallback((id: string) => {
    setOrdens(prev => prev.filter(o => o.id !== id))
  }, [])

  const updateStatus = useCallback((id: string, status: OSStatus) => {
    const extra = status === 'finalizada' ? { finalizadaEm: new Date().toISOString() } : {}
    setOrdens(prev => prev.map(o =>
      o.id === id ? { ...o, status, ...extra, updatedAt: new Date().toISOString() } : o
    ))
  }, [])

  const addProduto = useCallback((data: Omit<Produto, 'id' | 'createdAt'>): Produto => {
    const novo: Produto = { ...data, id: gerarId(), createdAt: new Date().toISOString() }
    setProdutos(prev => [...prev, novo])
    return novo
  }, [])

  const updateProduto = useCallback((id: string, data: Partial<Produto>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }, [])

  const deleteProduto = useCallback((id: string) => {
    setProdutos(prev => prev.filter(p => p.id !== id))
  }, [])

  const addDespesa = useCallback((data: Omit<Despesa, 'id' | 'createdAt'>): Despesa => {
    const nova: Despesa = { ...data, id: gerarId(), createdAt: new Date().toISOString() }
    setDespesas(prev => [...prev, nova])
    return nova
  }, [])

  const updateDespesa = useCallback((id: string, data: Partial<Despesa>) => {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
  }, [])

  const deleteDespesa = useCallback((id: string) => {
    setDespesas(prev => prev.filter(d => d.id !== id))
  }, [])

  const getClienteById = useCallback((id: string) => clientes.find(c => c.id === id), [clientes])
  const getMotoById = useCallback((id: string) => motos.find(m => m.id === id), [motos])
  const getMotosByCliente = useCallback((clienteId: string) => motos.filter(m => m.clienteId === clienteId), [motos])
  const getOrdensByMoto = useCallback((motoId: string) => ordens.filter(o => o.motoId === motoId), [ordens])

  const addVendaRapida = useCallback((data: Omit<VendaRapida, 'id' | 'createdAt'>): VendaRapida => {
    const nova: VendaRapida = { ...data, id: gerarId(), createdAt: new Date().toISOString() }
    setVendasRapidas(prev => [...prev, nova])
    setProdutos(prev => prev.map(p => {
      const item = data.itens.find(i => i.produtoId === p.id)
      return item ? { ...p, estoque: Math.max(0, p.estoque - item.quantidade) } : p
    }))
    return nova
  }, [])

  const deleteVendaRapida = useCallback((id: string) => {
    setVendasRapidas(prev => prev.filter(v => v.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{
      clientes, motos, ordens, produtos, despesas, vendasRapidas,
      addCliente, updateCliente, deleteCliente,
      addMoto, updateMoto, deleteMoto,
      addOrdem, updateOrdem, deleteOrdem, updateStatus,
      addProduto, updateProduto, deleteProduto,
      addDespesa, updateDespesa, deleteDespesa,
      addVendaRapida, deleteVendaRapida,
      getClienteById, getMotoById, getMotosByCliente, getOrdensByMoto,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
