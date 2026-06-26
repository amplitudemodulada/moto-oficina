import {
  LogIn, UserPlus, ClipboardList, ArrowRight, Truck,
  CreditCard, LogOut, Search, Package, AlertCircle,
  CheckCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '../components/ui/Card'

interface StepProps {
  num: number
  text: string
}

function Step({ num, text }: StepProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </span>
      <span className="text-sm text-gray-300">{text}</span>
    </li>
  )
}

interface SectionProps {
  icon: React.ElementType
  color: string
  bg: string
  title: string
  subtitle: string
  steps: string[]
  tip?: string
}

function Section({ icon: Icon, color, bg, title, subtitle, steps, tip }: SectionProps) {
  const [open, setOpen] = useState(true)
  return (
    <Card>
      <button
        className="w-full flex items-center gap-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
          <Icon size={20} className={color} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {open && (
        <div className="mt-4 pl-12 space-y-3">
          <ol className="space-y-2.5">
            {steps.map((s, i) => <Step key={i} num={i + 1} text={s} />)}
          </ol>
          {tip && (
            <div className="flex items-start gap-2 p-3 bg-orange-400/5 border border-orange-400/15 rounded-lg">
              <AlertCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-300">{tip}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

const SECTIONS: SectionProps[] = [
  {
    icon: LogIn,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    title: '1. Entrando no sistema',
    subtitle: 'Como fazer login',
    steps: [
      'Acesse o endereço do sistema no navegador.',
      'Digite seu usuário e senha nos campos indicados.',
      'Clique em Entrar.',
      'A tela de boas-vindas será exibida com um resumo do dia.',
      'Clique em Ir para o sistema para acessar o painel.',
    ],
    tip: 'Caso erre a senha, aguarde a mensagem de erro e tente novamente. Após várias tentativas, peça ao administrador para redefinir sua senha.',
  },
  {
    icon: UserPlus,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    title: '2. Cadastrando um cliente e moto',
    subtitle: 'Primeiro passo antes de abrir uma O.S.',
    steps: [
      'No menu lateral, clique em Clientes & Motos.',
      'Clique no botão Novo Cliente.',
      'Preencha nome, telefone e endereço do cliente e clique em Salvar.',
      'Na lista de clientes, clique no ícone de moto ao lado do cliente.',
      'Preencha placa, modelo, marca, ano e cor da moto.',
      'Clique em Salvar. A moto ficará vinculada ao cliente.',
    ],
    tip: 'Clientes e motos já cadastrados podem ser reutilizados em futuras ordens de serviço — não precisa recadastrar.',
  },
  {
    icon: ClipboardList,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    title: '3. Abrindo uma Ordem de Serviço (O.S.)',
    subtitle: 'Registrar o serviço que será realizado',
    steps: [
      'No menu lateral, clique em Ordens de Serviço.',
      'Clique em Nova O.S.',
      'Selecione o cliente e a moto na lista.',
      'Descreva o problema relatado pelo cliente.',
      'Adicione os itens de serviço ou peças utilizadas clicando em Adicionar item.',
      'Informe o valor da mão de obra.',
      'Clique em Criar O.S. A ordem será criada com status Na Fila.',
    ],
    tip: 'Os itens adicionados na O.S. são descontados automaticamente do estoque.',
  },
  {
    icon: ArrowRight,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    title: '4. Acompanhando o andamento da O.S.',
    subtitle: 'Avançar as etapas conforme o serviço progride',
    steps: [
      'Na tela de Ordens de Serviço, cada card mostra o status atual.',
      'Clique na seta (→) ao lado da O.S. para avançar para a próxima etapa.',
      'As etapas são: Na Fila → Em Análise → Aguardando Peças → Em Manutenção → Pronta p/ Entrega.',
      'Quando o serviço estiver concluído, avance até Pronta p/ Entrega.',
      'Para ver detalhes da O.S., clique sobre o card dela.',
    ],
    tip: 'O status ajuda a equipe a saber exatamente em que etapa está cada moto.',
  },
  {
    icon: Truck,
    color: 'text-teal-400',
    bg: 'bg-teal-400/10',
    title: '5. Entregando a moto e finalizando o pagamento',
    subtitle: 'Quando a moto estiver pronta para o cliente retirar',
    steps: [
      'Com a O.S. no status Pronta p/ Entrega, clique no botão verde Entregar.',
      'O sistema abrirá a tela de Checkout com a O.S. já selecionada.',
      'Confira os itens e o valor total na tela.',
      'Selecione a forma de pagamento: Pix, Cartão Crédito, Cartão Débito ou Dinheiro.',
      'Clique em Confirmar pagamento.',
      'O recibo será exibido na tela. Clique em Imprimir Recibo se necessário.',
      'A O.S. será marcada como Finalizada automaticamente.',
    ],
    tip: 'O recibo pode ser impresso ou fotografado pelo cliente como comprovante.',
  },
  {
    icon: Package,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    title: '6. Consultando o estoque',
    subtitle: 'Verificar peças e produtos disponíveis',
    steps: [
      'No menu lateral, clique em Estoque.',
      'Veja a lista de produtos com quantidade e preço.',
      'Use a barra de busca para encontrar um produto específico.',
      'Para adicionar um novo produto, clique em Novo Produto.',
      'Para ajustar a quantidade, edite o produto com o ícone de lápis.',
    ],
    tip: 'Produtos com estoque baixo aparecem destacados. Mantenha o estoque atualizado para evitar surpresas.',
  },
  {
    icon: Search,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    title: '7. Usando o Dashboard',
    subtitle: 'Visão geral do dia',
    steps: [
      'Ao clicar em Dashboard no menu, você vê um resumo geral.',
      'Motos na oficina: quantas estão em serviço neste momento.',
      'Faturamento do mês: total recebido no mês atual.',
      'Últimas O.S.: lista rápida das ordens mais recentes.',
    ],
  },
  {
    icon: CreditCard,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    title: '8. Consultando o Financeiro',
    subtitle: 'Entradas, saídas e saldo',
    steps: [
      'No menu lateral, clique em Financeiro.',
      'Veja o total de entradas (pagamentos recebidos) e saídas (despesas).',
      'O saldo é calculado automaticamente.',
      'Para registrar uma despesa, clique em Nova Despesa e preencha os dados.',
    ],
  },
  {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: '9. Alterando sua senha',
    subtitle: 'Para maior segurança',
    steps: [
      'Na parte inferior do menu lateral, clique em Alterar senha.',
      'Digite sua senha atual.',
      'Digite a nova senha (mínimo 6 caracteres) e confirme.',
      'Clique em Alterar. A nova senha será solicitada no próximo login.',
    ],
    tip: 'Nunca compartilhe sua senha com outras pessoas.',
  },
  {
    icon: LogOut,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    title: '10. Saindo do sistema',
    subtitle: 'Encerrar a sessão com segurança',
    steps: [
      'Na parte inferior do menu lateral, clique em Sair do sistema.',
      'A sessão será encerrada imediatamente.',
      'Você será redirecionado para a tela de login.',
    ],
    tip: 'Sempre saia do sistema ao terminar de usar, especialmente em computadores compartilhados. A sessão expira automaticamente ao fechar o navegador.',
  },
]

export function Ajuda() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Manual de Uso</h1>
        <p className="text-gray-400 text-sm mt-1">
          Passo a passo para usar o sistema Moto Pro do início ao fim
        </p>
      </div>

      <div className="flex items-center gap-2 p-3 bg-blue-400/5 border border-blue-400/15 rounded-xl text-xs text-blue-300">
        <AlertCircle size={14} className="shrink-0" />
        Clique no título de cada seção para expandir ou recolher os passos.
      </div>

      {SECTIONS.map(s => <Section key={s.title} {...s} />)}

      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Problemas ou dúvidas?</p>
            <p className="text-xs text-gray-400">
              Em caso de dificuldades, entre em contato com o administrador do sistema.
              Não tente adivinhar senhas ou acessar áreas que não conhece.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
