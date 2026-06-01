export const ESTADO_CIVIL_OPTIONS = [
  { label: 'Solteiro(a)', value: 'Solteiro' },
  { label: 'Casado', value: 'Casado' },
  { label: 'Divorciado(a)', value: 'Divorciado' },
  { label: 'Viúvo(a)', value: 'Viúvo' },
  { label: 'União Estável', value: 'União Estável' },
]

export const REGIME_BENS_OPTIONS = [
  { label: 'Comunhão Parcial', value: 'Comunhão Parcial' },
  { label: 'Comunhão Universal', value: 'Comunhão Universal' },
  { label: 'Separação Total', value: 'Separação Total' },
  { label: 'Participação Final', value: 'Participação Final' },
]

export const PLATAFORMA_OPTIONS = [
  { label: 'Clicksign', value: 'Clicksign' },
  { label: 'ZapSign', value: 'ZapSign' },
  { label: 'Docusign', value: 'Docusign' },
  { label: 'Autentique', value: 'Autentique' },
]

export const CASE_STATES: Record<string, string> = {
  rascunho: 'Rascunho',
  em_qualificacao: 'Em Qualificação',
  em_preenchimento: 'Em Preenchimento',
  aguardando_documentos: 'Aguardando Documentos',
  em_validacao: 'Em Validação',
  pendente_revisao_juridica: 'Pendente Rev. Jurídica',
  encaminhado_suporte_especializado: 'Suporte Especializado',
  aprovado: 'Aprovado',
  aprovado_ressalvas: 'Aprovado com Ressalvas',
  bloqueado: 'Bloqueado',
  minuta_gerada: 'Minuta Gerada',
  cancelado: 'Cancelado',
  arquivado: 'Arquivado',
}

export const OPERATION_TYPES: Record<string, string> = {
  compra_venda_padrao: 'Compra e Venda Padrão',
  compra_venda_sinal: 'Compra e Venda com Sinal',
  compra_venda_financiamento: 'C/V Financiamento',
  recibo_sinal_autonomo: 'Recibo de Sinal Autônomo',
  checklist_documental: 'Checklist Documental',
  promessa_compra_venda: 'Promessa C/V',
  distrato: 'Distrato',
  termo_posse_chaves: 'Termo Posse/Chaves',
  permuta: 'Permuta',
  autorizacao_venda: 'Autorização de Venda',
}

export const COMPLEXITY_LEVELS: Record<string, string> = {
  simples: 'Simples',
  moderado: 'Moderado',
  sensivel: 'Sensível',
  complexo: 'Complexo',
  bloqueado: 'Bloqueado',
}

export const PRIORITIES: Record<string, { label: string; bg: string }> = {
  baixa: { label: 'Baixa', bg: 'bg-slate-100 text-slate-800' },
  media: { label: 'Média', bg: 'bg-blue-100 text-blue-800' },
  alta: { label: 'Alta', bg: 'bg-red-100 text-red-800' },
}

export const TIPO_IMOVEL: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
  cobertura: 'Cobertura',
  sala_comercial: 'Sala Comercial',
  outro: 'Outro',
}

export const CASE_TRANSITIONS: Record<string, string[]> = {
  rascunho: ['em_qualificacao', 'cancelado'],
  em_qualificacao: ['em_preenchimento', 'cancelado'],
  em_preenchimento: ['aguardando_documentos', 'cancelado'],
  aguardando_documentos: ['em_validacao', 'cancelado'],
  em_validacao: ['pendente_revisao_juridica', 'cancelado'],
  pendente_revisao_juridica: ['aprovado', 'aprovado_ressalvas', 'bloqueado', 'cancelado'],
  encaminhado_suporte_especializado: [
    'em_validacao',
    'aprovado',
    'aprovado_ressalvas',
    'bloqueado',
    'cancelado',
  ],
  aprovado: ['minuta_gerada', 'arquivado', 'cancelado'],
  aprovado_ressalvas: ['minuta_gerada', 'cancelado'],
  bloqueado: ['arquivado', 'cancelado'],
  minuta_gerada: ['em_preenchimento', 'pendente_revisao_juridica', 'cancelado'],
  cancelado: [],
  arquivado: [],
}

export const STATE_COLORS: Record<string, string> = {
  rascunho:
    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30',
  em_qualificacao:
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  em_preenchimento:
    'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-500/30 dark:text-blue-200 dark:border-blue-500/40',
  aguardando_documentos:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  em_validacao:
    'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30',
  pendente_revisao_juridica:
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
  encaminhado_suporte_especializado:
    'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  aprovado:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30',
  aprovado_ressalvas:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  bloqueado:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
  minuta_gerada:
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
  cancelado:
    'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-500/20 dark:text-stone-300 dark:border-stone-500/30',
  arquivado:
    'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-500/20 dark:text-zinc-300 dark:border-zinc-500/30',
}

export const STATE_BANNER_COLORS: Record<string, string> = {
  rascunho: 'bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800',
  em_qualificacao: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
  em_preenchimento: 'bg-blue-100 border-blue-300 dark:bg-blue-900/40 dark:border-blue-700',
  aguardando_documentos: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
  em_validacao: 'bg-sky-50 border-sky-200 dark:bg-sky-900/30 dark:border-sky-800',
  pendente_revisao_juridica: 'bg-pink-50 border-pink-200 dark:bg-pink-900/30 dark:border-pink-800',
  encaminhado_suporte_especializado:
    'bg-violet-50 border-violet-200 dark:bg-violet-900/30 dark:border-violet-800',
  aprovado: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
  aprovado_ressalvas:
    'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800',
  bloqueado: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
  minuta_gerada: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800',
  cancelado: 'bg-stone-50 border-stone-200 dark:bg-stone-900/30 dark:border-stone-800',
  arquivado: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800',
}

export const TRANSITION_LABELS: Record<string, string> = {
  em_qualificacao: 'Avançar para Qualificação',
  em_preenchimento: 'Iniciar Preenchimento',
  aguardando_documentos: 'Aguardar Documentos',
  em_validacao: 'Enviar para Validação',
  pendente_revisao_juridica: 'Solicitar Revisão Jurídica',
  encaminhado_suporte_especializado: 'Acionar Suporte',
  aprovado: 'Aprovar Caso',
  aprovado_ressalvas: 'Aprovar com Ressalvas',
  bloqueado: 'Bloquear Caso',
  minuta_gerada: 'Gerar Minuta',
  cancelado: 'Cancelar Caso',
  arquivado: 'Arquivar Caso',
}
