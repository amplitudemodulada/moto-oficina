export interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string
  createdAt: string
}

export interface Moto {
  id: string
  clienteId: string
  placa: string
  modelo: string
  marca: string
  cor: string
  ano?: string
  km?: string
  createdAt: string
}

export type OSStatus =
  | 'na_fila'
  | 'em_analise'
  | 'aguardando_pecas'
  | 'em_manutencao'
  | 'pronta_entrega'
  | 'finalizada'

export interface ItemOS {
  produtoId: string
  nome: string
  quantidade: number
  valorUnitario: number
}

export interface OrdemServico {
  id: string
  numero: string
  motoId: string
  clienteId: string
  status: OSStatus
  descricaoProblema: string
  itens: ItemOS[]
  valorMaoDeObra: number
  formaPagamento?: 'pix' | 'credito' | 'debito' | 'dinheiro'
  observacoes?: string
  createdAt: string
  updatedAt: string
  finalizadaEm?: string
}

export interface Produto {
  id: string
  nome: string
  descricao?: string
  valorVenda: number
  estoque: number
  categoria?: string
  createdAt: string
}

export type PaymentMethod = 'pix' | 'credito' | 'debito' | 'dinheiro'

export type DespesaCategoria =
  | 'Aluguel'
  | 'Ferramentas'
  | 'Peças/Insumos'
  | 'Salários'
  | 'Impostos'
  | 'Utilidades'
  | 'Marketing'
  | 'Outros'

export interface Despesa {
  id: string
  descricao: string
  valor: number
  categoria: DespesaCategoria
  data: string
  createdAt: string
}
