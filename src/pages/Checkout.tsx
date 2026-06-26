import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import {
  CreditCard, CheckCircle, Printer, Search, DollarSign,
  Smartphone, Banknote, Bike, Wrench, Package, Receipt
} from 'lucide-react'
import type { OrdemServico, PaymentMethod } from '../types'

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'pix',     label: 'Pix',              icon: Smartphone, color: 'text-green-400' },
  { value: 'credito', label: 'Cartão Crédito',   icon: CreditCard, color: 'text-blue-400' },
  { value: 'debito',  label: 'Cartão Débito',    icon: CreditCard, color: 'text-purple-400' },
  { value: 'dinheiro',label: 'Dinheiro',          icon: Banknote,   color: 'text-yellow-400' },
]

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function calcTotal(os: OrdemServico) {
  return os.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0) + os.valorMaoDeObra
}

export function Checkout() {
  const location = useLocation()
  const { ordens, updateOrdem, updateStatus, getMotoById, getClienteById } = useApp()

  const [search, setSearch] = useState('')
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null)
  const [payment, setPayment] = useState<PaymentMethod>('pix')
  const [reciboModal, setReciboModal] = useState(false)
  const [finalizadaOS, setFinalizadaOS] = useState<OrdemServico | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const osId = (location.state as { osId?: string } | null)?.osId
    if (osId) {
      const os = ordens.find(o => o.id === osId && o.status === 'pronta_entrega')
      if (os) setSelectedOS(os)
    }
  }, [])

  const prontas = ordens
    .filter(o => o.status === 'pronta_entrega')
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

  function finalizar() {
    if (!selectedOS) return
    updateOrdem(selectedOS.id, { formaPagamento: payment })
    updateStatus(selectedOS.id, 'finalizada')
    setFinalizadaOS({ ...selectedOS, formaPagamento: payment })
    setSelectedOS(null)
    setConfirming(false)
    setReciboModal(true)
  }

  function imprimirRecibo() {
    window.print()
  }

  const total = selectedOS ? calcTotal(selectedOS) : 0
  const finalizadaTotal = finalizadaOS ? calcTotal(finalizadaOS) : 0
  const selectedMoto = selectedOS ? getMotoById(selectedOS.motoId) : null
  const selectedCliente = selectedOS ? getClienteById(selectedOS.clienteId) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Checkout</h1>
        <p className="text-gray-400 text-sm mt-1">Finalização de O.S. e recebimento de pagamentos</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Painel esquerdo: Seleção da OS */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">O.S. Prontas para Entrega</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por N°, placa ou cliente..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {prontas.length === 0 ? (
            <Card>
              <div className="text-center py-10 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhuma O.S. pronta para entrega</p>
                <p className="text-xs mt-1">Avance o status das O.S. até "Pronta para Entrega"</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {prontas.map(os => {
                const moto = getMotoById(os.motoId)
                const cliente = getClienteById(os.clienteId)
                const selected = selectedOS?.id === os.id
                return (
                  <Card
                    key={os.id}
                    onClick={() => setSelectedOS(selected ? null : os)}
                    className={`transition-all ${selected ? 'border-orange-500 bg-orange-500/5' : 'hover:border-gray-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${selected ? 'bg-orange-500' : 'bg-gray-800'}`}>
                          <Bike size={16} className={selected ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">O.S. #{os.numero}</p>
                          <p className="text-xs text-gray-400">{cliente?.nome} · {moto?.placa}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-400">{fmt(calcTotal(os))}</p>
                        <StatusBadge status={os.status} />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Painel direito: Detalhes e pagamento */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Detalhes do Pagamento</h2>

          {!selectedOS ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <Receipt size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Selecione uma O.S.</p>
                <p className="text-xs mt-1">Clique em uma O.S. ao lado para visualizar</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Resumo da OS */}
              <Card>
                <h3 className="text-sm font-semibold text-white mb-3">O.S. #{selectedOS.numero}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Bike size={14} />
                    <span>{selectedMoto?.marca} {selectedMoto?.modelo} · {selectedMoto?.placa}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{selectedCliente?.nome} · {selectedCliente?.telefone}</p>

                  {selectedOS.itens.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Package size={11} /> Peças</p>
                      {selectedOS.itens.map(i => (
                        <div key={i.produtoId} className="flex justify-between text-gray-300 py-1">
                          <span className="text-xs">{i.nome} × {i.quantidade}</span>
                          <span className="text-xs">{fmt(i.quantidade * i.valorUnitario)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-800">
                    <div className="flex justify-between text-gray-400 text-xs">
                      <span className="flex items-center gap-1"><Wrench size={11} /> Mão de Obra</span>
                      <span>{fmt(selectedOS.valorMaoDeObra)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold text-orange-400">{fmt(total)}</span>
                  </div>
                </div>
              </Card>

              {/* Forma de pagamento */}
              <Card>
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><DollarSign size={16} className="text-orange-400" /> Forma de Pagamento</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPayment(opt.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                        payment === opt.value
                          ? 'border-orange-500 bg-orange-500/10 text-orange-300'
                          : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                      }`}
                    >
                      <opt.icon size={16} className={payment === opt.value ? 'text-orange-400' : opt.color} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Confirmar */}
              {!confirming ? (
                <Button className="w-full" size="lg" onClick={() => setConfirming(true)}>
                  <CheckCircle size={18} /> Confirmar Pagamento
                </Button>
              ) : (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <p className="text-center text-white font-medium mb-1">Confirmar recebimento?</p>
                  <p className="text-center text-gray-400 text-sm mb-4">
                    {fmt(total)} via {PAYMENT_OPTIONS.find(o => o.value === payment)?.label}
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>Cancelar</Button>
                    <Button variant="success" className="flex-1" onClick={finalizar}><CheckCircle size={16} /> Finalizar</Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recibo Modal */}
      {finalizadaOS && (
        <Modal isOpen={reciboModal} onClose={() => setReciboModal(false)} title="Pagamento Confirmado!" size="md">
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <p className="text-lg font-bold text-white">Pagamento Recebido</p>
              <p className="text-gray-400 text-sm">{fmtDate(new Date().toISOString())}</p>
            </div>

            {/* Recibo */}
            <div id="recibo" className="bg-gray-800 rounded-xl p-5 space-y-3 text-sm print:bg-white print:text-black">
              <div className="text-center border-b border-gray-700 pb-3 print:border-gray-300">
                <p className="font-bold text-white print:text-black text-base">🏍️ MotoGest Oficina</p>
                <p className="text-xs text-gray-500 print:text-gray-700">RECIBO DE SERVIÇO</p>
                <p className="text-xs text-gray-500 print:text-gray-700">O.S. Nº {finalizadaOS.numero}</p>
              </div>

              <div className="space-y-1 text-gray-300 print:text-gray-800">
                <p><span className="text-gray-500">Cliente:</span> {getClienteById(finalizadaOS.clienteId)?.nome}</p>
                <p><span className="text-gray-500">Telefone:</span> {getClienteById(finalizadaOS.clienteId)?.telefone}</p>
                {(() => { const m = getMotoById(finalizadaOS.motoId); return m ? <p><span className="text-gray-500">Veículo:</span> {m.marca} {m.modelo} · {m.placa}</p> : null })()}
              </div>

              <div className="border-t border-gray-700 pt-3 print:border-gray-300">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Serviços & Peças</p>
                {finalizadaOS.itens.map(i => (
                  <div key={i.produtoId} className="flex justify-between text-gray-300 print:text-gray-800">
                    <span>{i.nome} × {i.quantidade}</span>
                    <span>{fmt(i.quantidade * i.valorUnitario)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-gray-300 print:text-gray-800 mt-1">
                  <span>Mão de Obra</span>
                  <span>{fmt(finalizadaOS.valorMaoDeObra)}</span>
                </div>
              </div>

              <div className="border-t-2 border-gray-600 pt-3 print:border-gray-400">
                <div className="flex justify-between font-bold text-white print:text-black text-base">
                  <span>TOTAL</span>
                  <span>{fmt(finalizadaTotal)}</span>
                </div>
                <p className="text-xs text-gray-500 print:text-gray-700 mt-1">
                  Pagamento: {PAYMENT_OPTIONS.find(o => o.value === finalizadaOS.formaPagamento)?.label}
                </p>
              </div>

              <p className="text-center text-xs text-gray-600 print:text-gray-400 border-t border-gray-700 pt-3 print:border-gray-300">
                Obrigado pela preferência! · {fmtDate(new Date().toISOString())}
              </p>
            </div>

            <Button className="w-full" onClick={imprimirRecibo}>
              <Printer size={16} /> Imprimir / Salvar PDF
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setReciboModal(false)}>
              Fechar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
