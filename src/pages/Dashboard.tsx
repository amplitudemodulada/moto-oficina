import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { Bike, ClipboardList, CheckCircle, DollarSign, TrendingUp, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function Dashboard() {
  const { ordens, motos, clientes, vendasRapidas, getClienteById, getMotoById } = useApp()
  const navigate = useNavigate()

  const hoje = new Date().toDateString()

  const ativas = ordens.filter(o => o.status !== 'finalizada')
  const finalizadasHoje = ordens.filter(o =>
    o.status === 'finalizada' && o.finalizadaEm && new Date(o.finalizadaEm).toDateString() === hoje
  )
  const vendasHoje = vendasRapidas.filter(v => new Date(v.createdAt).toDateString() === hoje)

  const faturamentoHoje =
    finalizadasHoje.reduce((sum, o) => {
      const itens = o.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0)
      return sum + itens + o.valorMaoDeObra
    }, 0) + vendasHoje.reduce((s, v) => s + v.total, 0)

  const faturamentoTotal =
    ordens.filter(o => o.status === 'finalizada').reduce((sum, o) => {
      const itens = o.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0)
      return sum + itens + o.valorMaoDeObra
    }, 0) + vendasRapidas.reduce((s, v) => s + v.total, 0)

  const ultimas = [...ordens].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8)

  const metrics = [
    {
      label: 'Motos Cadastradas',
      value: motos.length,
      icon: Bike,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      sub: `${clientes.length} clientes`,
    },
    {
      label: 'O.S. Ativas',
      value: ativas.length,
      icon: ClipboardList,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      sub: `${ordens.filter(o => o.status === 'em_manutencao').length} em manutenção`,
    },
    {
      label: 'Concluídas Hoje',
      value: finalizadasHoje.length,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      sub: `de ${ordens.filter(o => o.status === 'finalizada').length} total`,
    },
    {
      label: 'Faturamento Hoje',
      value: fmt(faturamentoHoje),
      icon: DollarSign,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      sub: `Total: ${fmt(faturamentoTotal)}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-400/20">
          <TrendingUp size={16} />
          Operacional
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">{m.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
                <p className="text-xs text-gray-500 mt-1">{m.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${m.bg}`}>
                <m.icon size={22} className={m.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-orange-400" />
            <h2 className="font-semibold text-white">Últimas Movimentações</h2>
          </div>
          {ultimas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma ordem de serviço ainda.</p>
              <button onClick={() => navigate('/ordens')} className="text-orange-400 text-sm mt-2 hover:underline">
                Criar primeira O.S.
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimas.map(os => {
                const moto = getMotoById(os.motoId)
                const cliente = getClienteById(os.clienteId)
                const total = os.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0) + os.valorMaoDeObra
                return (
                  <div
                    key={os.id}
                    onClick={() => navigate('/ordens')}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <Bike size={16} className="text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">O.S. #{os.numero}</p>
                        <p className="text-xs text-gray-500">{cliente?.nome} · {moto?.placa}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={os.status} />
                      <span className="text-sm text-gray-400 hidden sm:block">{fmt(total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Status breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-orange-400" />
            <h2 className="font-semibold text-white">Status das O.S.</h2>
          </div>
          {[
            { status: 'na_fila' as const,          count: ordens.filter(o => o.status === 'na_fila').length },
            { status: 'em_analise' as const,        count: ordens.filter(o => o.status === 'em_analise').length },
            { status: 'aguardando_pecas' as const,  count: ordens.filter(o => o.status === 'aguardando_pecas').length },
            { status: 'em_manutencao' as const,     count: ordens.filter(o => o.status === 'em_manutencao').length },
            { status: 'pronta_entrega' as const,    count: ordens.filter(o => o.status === 'pronta_entrega').length },
            { status: 'finalizada' as const,        count: ordens.filter(o => o.status === 'finalizada').length },
          ].map(({ status, count }) => (
            <div key={status} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <StatusBadge status={status} />
              <span className="text-white font-semibold">{count}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
