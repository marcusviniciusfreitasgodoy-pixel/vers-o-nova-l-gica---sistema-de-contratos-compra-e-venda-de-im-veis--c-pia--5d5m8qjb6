export type DocumentStatusType = 'optional' | 'mandatory'

export interface DocumentInfo {
  id: string
  title: string
  subtitle: string
  description: string
  tip: string
  status: string
  statusType: DocumentStatusType
  typeId: string
  goldenRule?: boolean
}

export interface PhaseInfo {
  id: string
  title: string
  description: string
  docs: DocumentInfo[]
}

export interface ScenarioInfo {
  title: string
  description: string
  steps: string[]
}

export const documentPhases: PhaseInfo[] = [
  {
    id: 'fase-1',
    title: 'Fase 1: Captação e Cadastro',
    description: 'A base sólida da transação começa aqui.',
    docs: [
      {
        id: 'ficha_cadastral',
        title: 'Ficha Cadastral',
        subtitle: 'Todas as informações do imóvel e das partes, reunidas antes de qualquer coisa.',
        description:
          'Formulário para coleta estruturada de dados das partes e do imóvel. Serve de base para a elaboração de todos os outros documentos.',
        tip: 'Peça todos os dados logo no primeiro contato. Corretor que volta pra pedir documento passa impressão de desorganização.',
        status: 'Obrigatório',
        statusType: 'mandatory',
        typeId: 'ficha_cadastral',
      },
      {
        id: 'checklist_documental',
        title: 'Checklist Documental',
        subtitle: 'Tudo o que precisa ser apresentado antes de fechar negócio.',
        description:
          'Relação das certidões e documentos exigidos do vendedor, comprador e imóvel para garantir a segurança jurídica da transação.',
        tip: 'Mande o checklist pro cliente logo cedo. Quanto antes ele começar a juntar, menos atraso na hora do contrato.',
        status: 'Obrigatório',
        statusType: 'mandatory',
        typeId: 'checklist_documental',
      },
      {
        id: 'autorizacao_intermediacao',
        title: 'Autorização de Intermediação',
        subtitle: 'O documento que garante o seu direito de trabalhar a venda.',
        description:
          'Formaliza a prestação de serviços do corretor, estabelecendo exclusividade (ou não), valor da comissão e regras de pagamento.',
        tip: 'Nunca comece a divulgar um imóvel sem essa autorização assinada. Ela é a sua segurança, não a do proprietário.',
        status: 'Obrigatório',
        statusType: 'mandatory',
        typeId: 'autorizacao_intermediacao',
      },
    ],
  },
  {
    id: 'fase-2',
    title: 'Fase 2: Negociação e Preliminares',
    description: 'Instrumentos iniciais e amarração do negócio.',
    docs: [
      {
        id: 'recibo_sinal',
        title: 'Recibo de Sinal',
        subtitle: 'A formalização do sinal e do compromisso inicial entre as partes.',
        description:
          'Documento simples que formaliza o recebimento de um valor inicial e fixa o princípio de pagamento.',
        tip: 'O ideal é que o sinal esteja dentro do compromisso de compra e venda. Use o recibo avulso apenas quando precisar travar o negócio com urgência.',
        status: 'Opcional',
        statusType: 'optional',
        typeId: 'recibo_sinal',
      },
      {
        id: 'contrato_preliminar',
        title: 'Contrato Particular Preliminar',
        subtitle: 'Quando as partes precisam se comprometer antes de fechar todas as condições.',
        description:
          'Utilizado principalmente para fixar condições suspensivas, como a aprovação de um financiamento ou a regularização de uma averbação na matrícula.',
        tip: 'Use quando o negócio tem uma pendência concreta que impede a assinatura da promessa definitiva.',
        status: 'Opcional',
        statusType: 'optional',
        typeId: 'contrato_preliminar',
      },
      {
        id: 'promessa_cv',
        title: 'Promessa de Compra e Venda',
        subtitle: 'O contrato que trava o negócio e define todas as regras da transação.',
        description:
          'O principal instrumento da transação. Gera o "direito real de aquisição" e detalha todas as obrigações, prazos, multas e condições do negócio.',
        tip: 'Dedique tempo a esse documento. É ele que resolve ou cria 90% dos problemas de uma transação.',
        status: 'Obrigatório',
        statusType: 'mandatory',
        typeId: 'promessa_compra_venda',
        goldenRule: true,
      },
    ],
  },
  {
    id: 'fase-3',
    title: 'Fase 3: Contratual Definitiva',
    description: 'A essência jurídica e financeira consolidada.',
    docs: [
      {
        id: 'contrato_particular',
        title: 'Contrato Particular de Compra e Venda',
        subtitle:
          'O instrumento definitivo entre as partes, quando a escritura pública ainda não é possível.',
        description:
          'Instrumento com força de escritura, aplicável apenas quando o imóvel é financiado pelo SFH ou quando o valor é inferior ao limite legal.',
        tip: 'Use quando houver financiamento ou quando a lei expressamente permitir.',
        status: 'Opcional',
        statusType: 'optional',
        typeId: 'contrato_particular',
      },
      {
        id: 'contrato_definitivo',
        title: 'Contrato Definitivo de Compra e Venda',
        subtitle: 'O fechamento do negócio, pronto para virar escritura e registro.',
        description:
          'Ato final da transação, lavrado em cartório (ou pelo banco), essencial para o registro na matrícula e transferência da titularidade.',
        tip: 'Não assine o definitivo sem que todas as pendências do checklist documental estejam resolvidas.',
        status: 'Obrigatório',
        statusType: 'mandatory',
        typeId: 'contrato_definitivo',
      },
    ],
  },
  {
    id: 'fase-4',
    title: 'Fase 4: Finalização e Entrega',
    description: 'Encerramento formal, posse e garantias.',
    docs: [
      {
        id: 'termo_chaves',
        title: 'Termo de Entrega de Chaves',
        subtitle: 'O registro formal de que o imóvel foi entregue ao comprador.',
        description:
          'Documento que atesta o recebimento das chaves, o estado de conservação do imóvel e a transferência da responsabilidade pelo pagamento de taxas e impostos.',
        tip: 'Faça a entrega com um checklist de vistoria na mão. Registre tudo por escrito e por foto.',
        status: 'Obrigatório',
        statusType: 'mandatory',
        typeId: 'termo_entrega_chaves',
      },
      {
        id: 'termo_posse',
        title: 'Termo de Posse',
        subtitle: 'A transferência formal da posse do imóvel, com todos os seus efeitos legais.',
        description:
          'Formaliza a imissão na posse. Se o imóvel estiver locado, a posse transfere o direito de receber aluguéis.',
        tip: "Se chaves e posse acontecem no mesmo dia, unifique num documento só e chame de 'Termo de Entrega de Chaves e Transferência de Posse'.",
        status: 'Opcional',
        statusType: 'optional',
        typeId: 'termo_posse',
      },
      {
        id: 'distrato',
        title: 'Distrato',
        subtitle: 'O encerramento formal do negócio, quando a transação não vai mais seguir.',
        description:
          'Rescisão amigável do contrato anterior, prevendo a devolução (ou retenção) de valores e estabelecendo quitação mútua plena.',
        tip: 'Mesmo que a saída seja amigável, formalize por escrito. Inclua sempre uma cláusula de quitação mútua.',
        status: 'Opcional',
        statusType: 'optional',
        typeId: 'distrato',
      },
    ],
  },
]

export const scenarios: ScenarioInfo[] = [
  {
    title: 'À vista, sem pendências',
    description: 'Para transações limpas, sem pendências e com pagamento com recursos próprios.',
    steps: ['Recibo de Sinal', 'Promessa de Compra e Venda', 'Contrato Definitivo'],
  },
  {
    title: 'Com financiamento bancário',
    description: 'Quando parte do valor será pago via instituição financeira.',
    steps: [
      'Recibo de Sinal',
      'Contrato Preliminar',
      'Promessa de Compra e Venda',
      'Contrato Particular',
      'Contrato Definitivo',
    ],
  },
  {
    title: 'Imóvel com pendência documental',
    description:
      'Quando o negócio depende da regularização prévia (ex: averbação de obra, inventário em curso).',
    steps: [
      'Recibo de Sinal',
      'Contrato Preliminar',
      'Promessa de Compra e Venda',
      'Contrato Definitivo',
    ],
  },
  {
    title: 'Urgência de travamento',
    description:
      'Quando é necessário segurar o negócio rapidamente enquanto se elabora a promessa completa.',
    steps: ['Recibo de Sinal', 'Promessa de Compra e Venda', 'Contrato Definitivo'],
  },
]
