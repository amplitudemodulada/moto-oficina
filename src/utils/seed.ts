import type { Cliente, Moto, OrdemServico, Produto, Despesa } from '../types'
import { storage } from './storage'

function ago(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function agoDate(days: number): string {
  return ago(days).slice(0, 10)
}

export function hasSeedData(): boolean {
  return storage.clientes.getAll().some(c => c.id.startsWith('CL0'))
}

export function clearAllData(): void {
  const keys = ['motogest_clientes', 'motogest_motos', 'motogest_ordens', 'motogest_produtos', 'motogest_despesas']
  keys.forEach(k => localStorage.removeItem(k))
  localStorage.removeItem('motogest_last_backup')
}

export function getAllDataForExport() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    clientes:  storage.clientes.getAll(),
    motos:     storage.motos.getAll(),
    ordens:    storage.ordens.getAll(),
    produtos:  storage.produtos.getAll(),
    despesas:  storage.despesas.getAll(),
  }
}

export function restoreFromBackup(data: ReturnType<typeof getAllDataForExport>): void {
  storage.clientes.save(data.clientes)
  storage.motos.save(data.motos)
  storage.ordens.save(data.ordens)
  storage.produtos.save(data.produtos)
  storage.despesas.save(data.despesas)
}

export function seedDemoData(): void {
  const clientes: Cliente[] = [
    { id: 'CL01', nome: 'João Silva',        telefone: '(11) 99234-5678', email: 'joao.silva@email.com',      createdAt: ago(90) },
    { id: 'CL02', nome: 'Maria Oliveira',    telefone: '(11) 98765-4321', email: 'maria.oliveira@email.com',  createdAt: ago(85) },
    { id: 'CL03', nome: 'Carlos Santos',     telefone: '(21) 97654-3210', email: '',                          createdAt: ago(80) },
    { id: 'CL04', nome: 'Ana Costa',         telefone: '(11) 91234-5678', email: 'ana.costa@email.com',       createdAt: ago(70) },
    { id: 'CL05', nome: 'Pedro Almeida',     telefone: '(31) 99876-5432', email: '',                          createdAt: ago(65) },
    { id: 'CL06', nome: 'Fernanda Lima',     telefone: '(11) 98123-4567', email: 'ferlima@email.com',         createdAt: ago(50) },
    { id: 'CL07', nome: 'Roberto Souza',     telefone: '(21) 97123-4568', email: '',                          createdAt: ago(40) },
    { id: 'CL08', nome: 'Juliana Pereira',   telefone: '(11) 96543-2109', email: 'ju.pereira@email.com',      createdAt: ago(30) },
  ]

  const motos: Moto[] = [
    { id: 'MT01', clienteId: 'CL01', placa: 'ABC1D23', modelo: 'CB 300R',      marca: 'Honda',    cor: 'Preta',    ano: '2021', km: '18500', createdAt: ago(88) },
    { id: 'MT02', clienteId: 'CL02', placa: 'DEF2E34', modelo: 'Fazer 250',    marca: 'Yamaha',   cor: 'Azul',     ano: '2020', km: '32000', createdAt: ago(83) },
    { id: 'MT03', clienteId: 'CL03', placa: 'GHI3F45', modelo: 'CG 160',       marca: 'Honda',    cor: 'Vermelha', ano: '2019', km: '45000', createdAt: ago(78) },
    { id: 'MT04', clienteId: 'CL04', placa: 'JKL4G56', modelo: 'Ninja 400',    marca: 'Kawasaki', cor: 'Verde',    ano: '2022', km: '9800',  createdAt: ago(68) },
    { id: 'MT05', clienteId: 'CL05', placa: 'MNO5H67', modelo: 'MT-03',        marca: 'Yamaha',   cor: 'Cinza',    ano: '2023', km: '5200',  createdAt: ago(63) },
    { id: 'MT06', clienteId: 'CL06', placa: 'PQR6I78', modelo: 'Biz 110i',     marca: 'Honda',    cor: 'Branca',   ano: '2018', km: '62000', createdAt: ago(48) },
    { id: 'MT07', clienteId: 'CL07', placa: 'STU7J89', modelo: 'GSX-S750',     marca: 'Suzuki',   cor: 'Preta',    ano: '2021', km: '22000', createdAt: ago(38) },
    { id: 'MT08', clienteId: 'CL08', placa: 'VWX8K90', modelo: 'PCX 150',      marca: 'Honda',    cor: 'Branca',   ano: '2022', km: '14000', createdAt: ago(28) },
    { id: 'MT09', clienteId: 'CL01', placa: 'YZA9L01', modelo: 'Crosser 150',  marca: 'Yamaha',   cor: 'Vermelha', ano: '2020', km: '28000', createdAt: ago(60) },
    { id: 'MT10', clienteId: 'CL03', placa: 'BCD0M12', modelo: 'XRE 300',      marca: 'Honda',    cor: 'Laranja',  ano: '2022', km: '11000', createdAt: ago(40) },
  ]

  const produtos: Produto[] = [
    { id: 'P001', nome: 'Óleo Motor 10W40 Shell',       descricao: 'Litro — semissintético',          valorVenda: 45.00,  estoque: 20, categoria: 'Fluido/Óleo', createdAt: ago(90) },
    { id: 'P002', nome: 'Filtro de Óleo Honda CG/CB',   descricao: 'Compatível CG 160 e CB 300',      valorVenda: 28.00,  estoque: 15, categoria: 'Filtro',      createdAt: ago(90) },
    { id: 'P003', nome: 'Pastilha de Freio Dianteiro',  descricao: 'Par, universal sport',             valorVenda: 65.00,  estoque: 10, categoria: 'Peça',        createdAt: ago(90) },
    { id: 'P004', nome: 'Correia de Transmissão CVT',   descricao: 'Scooter 125–150cc',               valorVenda: 120.00, estoque:  5, categoria: 'Peça',        createdAt: ago(90) },
    { id: 'P005', nome: 'Pneu Dianteiro 100/80-17',     descricao: 'Pirelli Sport Demon',              valorVenda: 185.00, estoque:  8, categoria: 'Pneu',        createdAt: ago(90) },
    { id: 'P006', nome: 'Pneu Traseiro 130/70-17',      descricao: 'Pirelli Sport Demon',              valorVenda: 210.00, estoque:  6, categoria: 'Pneu',        createdAt: ago(90) },
    { id: 'P007', nome: 'Filtro de Ar Universal',       descricao: 'Espuma lavável reutilizável',      valorVenda: 35.00,  estoque: 12, categoria: 'Filtro',      createdAt: ago(90) },
    { id: 'P008', nome: 'Vela de Ignição NGK CR8E',     descricao: 'Original NGK — DR8EA compatível', valorVenda: 22.00,  estoque: 25, categoria: 'Peça',        createdAt: ago(90) },
    { id: 'P009', nome: 'Cabo de Freio Dianteiro',      descricao: 'Aço inox universal',               valorVenda: 18.00,  estoque:  8, categoria: 'Peça',        createdAt: ago(90) },
    { id: 'P010', nome: 'Lâmpada Farol H4 35/35W',      descricao: 'Tungstênio',                       valorVenda: 32.00,  estoque: 10, categoria: 'Elétrica',    createdAt: ago(90) },
    { id: 'P011', nome: 'Kit Corrente 520 RX 110L',     descricao: 'Corrente + pinhão + coroa',        valorVenda: 95.00,  estoque:  4, categoria: 'Peça',        createdAt: ago(90) },
    { id: 'P012', nome: 'Fluido de Freio DOT4 500ml',   descricao: 'Bosch — freia em disco/tambor',   valorVenda: 25.00,  estoque:  8, categoria: 'Fluido/Óleo', createdAt: ago(90) },
    { id: 'P013', nome: 'Rolamento de Roda 6301-2RS',   descricao: 'Dianteiro universal',              valorVenda: 55.00,  estoque:  6, categoria: 'Peça',        createdAt: ago(90) },
    { id: 'P014', nome: 'Regulagem de Carburador',      descricao: 'Serviço — inclui diagnóstico',     valorVenda: 80.00,  estoque: 99, categoria: 'Serviço',     createdAt: ago(90) },
    { id: 'P015', nome: 'Alinhamento e Balanceamento',  descricao: 'Serviço completo dois eixos',      valorVenda: 120.00, estoque: 99, categoria: 'Serviço',     createdAt: ago(90) },
  ]

  const ordens: OrdemServico[] = [
    {
      id: 'OS01', numero: '00001', motoId: 'MT01', clienteId: 'CL01',
      status: 'finalizada',
      descricaoProblema: 'Troca de óleo e filtro. Revisão dos 5.000 km.',
      itens: [
        { produtoId: 'P001', nome: 'Óleo Motor 10W40 Shell',     quantidade: 3, valorUnitario: 45.00 },
        { produtoId: 'P002', nome: 'Filtro de Óleo Honda CG/CB', quantidade: 1, valorUnitario: 28.00 },
        { produtoId: 'P008', nome: 'Vela de Ignição NGK CR8E',   quantidade: 1, valorUnitario: 22.00 },
      ],
      valorMaoDeObra: 80.00, formaPagamento: 'pix',
      observacoes: 'Cliente solicitou verificação da corrente. OK.',
      createdAt: ago(30), updatedAt: ago(28), finalizadaEm: ago(28),
    },
    {
      id: 'OS02', numero: '00002', motoId: 'MT02', clienteId: 'CL02',
      status: 'finalizada',
      descricaoProblema: 'Revisão geral: pastilhas de freio, troca de óleo, filtros e fluido.',
      itens: [
        { produtoId: 'P001', nome: 'Óleo Motor 10W40 Shell',      quantidade: 4, valorUnitario: 45.00 },
        { produtoId: 'P002', nome: 'Filtro de Óleo Honda CG/CB',  quantidade: 1, valorUnitario: 28.00 },
        { produtoId: 'P003', nome: 'Pastilha de Freio Dianteiro', quantidade: 1, valorUnitario: 65.00 },
        { produtoId: 'P007', nome: 'Filtro de Ar Universal',      quantidade: 1, valorUnitario: 35.00 },
        { produtoId: 'P012', nome: 'Fluido de Freio DOT4 500ml',  quantidade: 1, valorUnitario: 25.00 },
      ],
      valorMaoDeObra: 150.00, formaPagamento: 'credito',
      observacoes: 'Revisão completa realizada.',
      createdAt: ago(25), updatedAt: ago(22), finalizadaEm: ago(22),
    },
    {
      id: 'OS03', numero: '00003', motoId: 'MT09', clienteId: 'CL01',
      status: 'finalizada',
      descricaoProblema: 'Troca de pneu dianteiro e traseiro. Desgaste excessivo relatado.',
      itens: [
        { produtoId: 'P005', nome: 'Pneu Dianteiro 100/80-17',     quantidade: 1, valorUnitario: 185.00 },
        { produtoId: 'P006', nome: 'Pneu Traseiro 130/70-17',      quantidade: 1, valorUnitario: 210.00 },
        { produtoId: 'P015', nome: 'Alinhamento e Balanceamento',  quantidade: 1, valorUnitario: 120.00 },
      ],
      valorMaoDeObra: 60.00, formaPagamento: 'dinheiro',
      observacoes: 'Pneus trocados e alinhamento realizado.',
      createdAt: ago(18), updatedAt: ago(15), finalizadaEm: ago(15),
    },
    {
      id: 'OS04', numero: '00004', motoId: 'MT03', clienteId: 'CL03',
      status: 'finalizada',
      descricaoProblema: 'Regulagem do carburador, troca de velas e cabo de freio.',
      itens: [
        { produtoId: 'P008', nome: 'Vela de Ignição NGK CR8E',  quantidade: 2, valorUnitario: 22.00 },
        { produtoId: 'P009', nome: 'Cabo de Freio Dianteiro',   quantidade: 1, valorUnitario: 18.00 },
        { produtoId: 'P014', nome: 'Regulagem de Carburador',   quantidade: 1, valorUnitario: 80.00 },
      ],
      valorMaoDeObra: 120.00, formaPagamento: 'debito',
      observacoes: 'Carburador regulado, velas e cabo trocados.',
      createdAt: ago(12), updatedAt: ago(10), finalizadaEm: ago(10),
    },
    {
      id: 'OS05', numero: '00005', motoId: 'MT04', clienteId: 'CL04',
      status: 'finalizada',
      descricaoProblema: 'Troca de correia CVT e rolamentos de roda.',
      itens: [
        { produtoId: 'P004', nome: 'Correia de Transmissão CVT',    quantidade: 1, valorUnitario: 120.00 },
        { produtoId: 'P013', nome: 'Rolamento de Roda 6301-2RS',    quantidade: 2, valorUnitario: 55.00 },
      ],
      valorMaoDeObra: 200.00, formaPagamento: 'pix',
      observacoes: 'Rolamento substituído nos dois lados.',
      createdAt: ago(7), updatedAt: ago(5), finalizadaEm: ago(5),
    },
    {
      id: 'OS06', numero: '00006', motoId: 'MT10', clienteId: 'CL03',
      status: 'finalizada',
      descricaoProblema: 'Troca de kit corrente completo.',
      itens: [
        { produtoId: 'P011', nome: 'Kit Corrente 520 RX 110L', quantidade: 1, valorUnitario: 95.00 },
      ],
      valorMaoDeObra: 90.00, formaPagamento: 'dinheiro',
      observacoes: '',
      createdAt: ago(5), updatedAt: ago(3), finalizadaEm: ago(3),
    },
    {
      id: 'OS07', numero: '00007', motoId: 'MT05', clienteId: 'CL05',
      status: 'pronta_entrega',
      descricaoProblema: 'Troca de óleo, filtro e pastilha de freio traseiro.',
      itens: [
        { produtoId: 'P001', nome: 'Óleo Motor 10W40 Shell',      quantidade: 3, valorUnitario: 45.00 },
        { produtoId: 'P002', nome: 'Filtro de Óleo Honda CG/CB',  quantidade: 1, valorUnitario: 28.00 },
        { produtoId: 'P003', nome: 'Pastilha de Freio Dianteiro', quantidade: 1, valorUnitario: 65.00 },
      ],
      valorMaoDeObra: 100.00,
      observacoes: 'Pronto para retirada. Cliente avisado via WhatsApp.',
      createdAt: ago(3), updatedAt: ago(1),
    },
    {
      id: 'OS08', numero: '00008', motoId: 'MT06', clienteId: 'CL06',
      status: 'em_manutencao',
      descricaoProblema: 'Barulho na transmissão. Suspeita de correia desgastada.',
      itens: [
        { produtoId: 'P004', nome: 'Correia de Transmissão CVT', quantidade: 1, valorUnitario: 120.00 },
      ],
      valorMaoDeObra: 130.00,
      observacoes: 'Desmontada, aguardando confirmação da troca da correia.',
      createdAt: ago(2), updatedAt: ago(1),
    },
    {
      id: 'OS09', numero: '00009', motoId: 'MT07', clienteId: 'CL07',
      status: 'aguardando_pecas',
      descricaoProblema: 'Troca de lâmpada do farol queimada.',
      itens: [
        { produtoId: 'P010', nome: 'Lâmpada Farol H4 35/35W', quantidade: 2, valorUnitario: 32.00 },
      ],
      valorMaoDeObra: 50.00,
      observacoes: 'Aguardando par de lâmpadas H4 do fornecedor.',
      createdAt: ago(2), updatedAt: ago(1),
    },
    {
      id: 'OS10', numero: '00010', motoId: 'MT08', clienteId: 'CL08',
      status: 'em_analise',
      descricaoProblema: 'Moto não liga após chuva. Possível problema elétrico.',
      itens: [],
      valorMaoDeObra: 0,
      observacoes: 'Em diagnóstico elétrico.',
      createdAt: ago(1), updatedAt: ago(0),
    },
    {
      id: 'OS11', numero: '00011', motoId: 'MT09', clienteId: 'CL01',
      status: 'na_fila',
      descricaoProblema: 'Revisão dos 30.000 km. Completa.',
      itens: [],
      valorMaoDeObra: 0,
      observacoes: '',
      createdAt: ago(0), updatedAt: ago(0),
    },
  ]

  const despesas: Despesa[] = [
    { id: 'DE01', descricao: 'Aluguel do espaço — Mês anterior', valor: 2500.00, categoria: 'Aluguel',       data: agoDate(35), createdAt: ago(35) },
    { id: 'DE02', descricao: 'Compra de ferramentas e equipamentos', valor: 850.00, categoria: 'Ferramentas', data: agoDate(28), createdAt: ago(28) },
    { id: 'DE03', descricao: 'Conta de energia elétrica',       valor: 420.00,  categoria: 'Utilidades',    data: agoDate(20), createdAt: ago(20) },
    { id: 'DE04', descricao: 'Reposição de estoque (peças)',    valor: 1800.00, categoria: 'Peças/Insumos', data: agoDate(15), createdAt: ago(15) },
    { id: 'DE05', descricao: 'Aluguel do espaço — Mês atual',   valor: 2500.00, categoria: 'Aluguel',       data: agoDate(5),  createdAt: ago(5)  },
    { id: 'DE06', descricao: 'Marketing e redes sociais',       valor: 300.00,  categoria: 'Marketing',     data: agoDate(4),  createdAt: ago(4)  },
    { id: 'DE07', descricao: 'Material de limpeza',             valor: 180.00,  categoria: 'Utilidades',    data: agoDate(2),  createdAt: ago(2)  },
    { id: 'DE08', descricao: 'Salário assistente mecânico',     valor: 1800.00, categoria: 'Salários',      data: agoDate(1),  createdAt: ago(1)  },
  ]

  storage.clientes.save(clientes)
  storage.motos.save(motos)
  storage.ordens.save(ordens)
  storage.produtos.save(produtos)
  storage.despesas.save(despesas)
}
