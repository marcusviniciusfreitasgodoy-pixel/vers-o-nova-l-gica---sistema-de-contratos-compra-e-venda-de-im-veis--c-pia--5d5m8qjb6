import { z } from 'zod'
import { parseCurrency } from './formatters'

export const parseCurrencySafe = (val: any): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    if (!val.trim()) return undefined
    return parseCurrency(val)
  }
  if (typeof val === 'object' && val?.target?.value !== undefined) {
    if (val.target.value === '') return undefined
    return parseCurrency(String(val.target.value))
  }
  return parseCurrency(String(val))
}

const currencyToNumber = z.preprocess((val: any) => {
  const parsed = parseCurrencySafe(val)
  return parsed === undefined ? undefined : parsed
}, z.number().optional())

export const contractSchema = z
  .object({
    status: z.string().default('em_elaboracao'),
    tipo_documento: z.string().optional(),
    user: z.string().optional(),

    id: z.string().optional(),
    // Parties - Comprador
    tipo_comprador: z.enum(['pf', 'pj']).default('pf'),
    nome_comprador: z.string().optional(),
    cpf_comprador: z.string().optional(),
    rg_comprador: z.string().optional(),
    orgao_emissor_comprador: z.string().optional(),
    data_nascimento_comprador: z.string().optional(),
    nacionalidade_comprador: z.string().optional(),
    profissao_comprador: z.string().optional(),
    estado_civil_comprador: z.string().optional(),
    regime_bens_comprador: z.string().optional(),
    email_comprador: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
    telefone_comprador: z.string().optional(),
    endereco_comprador: z.string().optional(),
    cep_comprador: z.string().optional(),
    nome_conjuge_comprador: z.string().optional(),
    cpf_conjuge_comprador: z.string().optional(),
    rg_conjuge_comprador: z.string().optional(),
    possui_procurador_comprador: z.boolean().default(false),
    nome_procurador_comprador: z.string().optional(),
    cpf_procurador_comprador: z.string().optional(),
    instrumento_procurador_comprador: z.string().optional(),
    financiamento_comprador: z.boolean().default(false),
    possui_financiamento: z.boolean().default(false),
    fgts_comprador: z.boolean().default(false),

    vendedor_uniao_estavel: z.boolean().default(false),
    comprador_uniao_estavel: z.boolean().default(false),

    // Parties - Vendedor
    vendedor_pj: z.boolean().default(false),
    nome_vendedor: z.string().optional(),
    cpf_vendedor: z.string().optional(),
    rg_vendedor: z.string().optional(),
    orgao_emissor_vendedor: z.string().optional(),
    data_nascimento_vendedor: z.string().optional(),
    nacionalidade_vendedor: z.string().optional(),
    profissao_vendedor: z.string().optional(),
    estado_civil_vendedor: z.string().optional(),
    regime_bens_vendedor: z.string().optional(),
    conjuge_vendedor: z.string().optional(),
    cpf_conjuge_vendedor: z.string().optional(),
    rg_conjuge_vendedor: z.string().optional(),
    procurador_vendedor: z.boolean().default(false),
    nome_procurador_vendedor: z.string().optional(),
    cpf_procurador_vendedor: z.string().optional(),
    instrumento_procurador_vendedor: z.string().optional(),
    endereco_vendedor: z.string().optional(),
    cep_vendedor: z.string().optional(),
    email_vendedor: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
    telefone_vendedor: z.string().optional(),
    cnpj_vendedor: z.string().optional(),
    cnpj_comprador: z.string().optional(),
    representante_vendedor: z.string().optional(),
    representante_comprador: z.string().optional(),

    havera_parcelas: z.boolean().default(false),
    numero_processo_inventario: z.string().optional(),
    inventariante: z.string().optional(),
    alvara_inventario: z.string().optional(),
    detalhes_locacao: z.string().optional(),
    prazo_locacao: z.string().optional(),
    preferencia_locatario: z.boolean().default(false),
    matricula_file: z.any().optional(),
    iptu_file: z.any().optional(),
    estado_conservacao: z.string().optional(),
    leitura_agua: z.string().optional(),
    leitura_luz: z.string().optional(),
    leitura_gas: z.string().optional(),

    // Property
    endereco_imovel: z.string().optional(),
    numero_imovel: z.string().optional(),
    complemento_imovel: z.string().optional(),
    bairro_imovel: z.string().optional(),
    cidade_imovel: z.string().optional(),
    estado_imovel: z.string().optional(),
    cep_imovel: z.string().optional(),
    matricula_imovel: z.string().optional(),
    data_matricula: z.string().optional(),
    cartorio_imovel: z.string().optional(),
    inscricao_iptu: z.string().optional(),
    rgi_imovel: z.string().optional(),
    inscricao_municipal: z.string().optional(),
    area_privativa: z.coerce.number().optional(),
    area_total: z.coerce.number().optional(),
    vagas_garagem: z.coerce.number().optional(),
    quartos: z.coerce.number().optional(),
    suites: z.coerce.number().optional(),
    possui_box: z.boolean().default(false),
    tipo_imovel: z.string().optional(),
    imovel_ocupado: z.boolean().default(false),
    imovel_desocupado: z.boolean().default(false),
    imovel_locado: z.boolean().default(false),
    imovel_financiado: z.boolean().default(false),
    imovel_inventario: z.boolean().default(false),
    possui_onus: z.boolean().default(false),
    possui_usufruto: z.boolean().default(false),
    acoes_judiciais: z.boolean().default(false),

    // Financial & Possession
    valor_total: currencyToNumber.optional(),
    valor_sinal: currencyToNumber.optional(),
    valor_financiamento: currencyToNumber.optional(),
    valor_financiado: currencyToNumber.optional(),
    instituicao_financeira: z.string().optional(),
    valor_fgts: currencyToNumber.optional(),
    valor_recursos_proprios: currencyToNumber.optional(),
    quantidade_parcelas: z.coerce.number().optional(),
    valor_parcela: currencyToNumber.optional(),
    data_pagamento_sinal: z.string().optional(),
    prazo_escritura: z.string().optional(),
    prazo_financiamento: z.coerce.number().optional(),
    prazo_aprovacao: z.coerce.number().optional(),
    renda_declarada_comprador: currencyToNumber.optional(),
    multa_inadimplencia: z.coerce.number().optional(),
    posse_imediata: z.boolean().default(false),
    responsabilidade_pro_rata: z.boolean().default(false),
    data_posse: z.string().optional(),
    prazo_desocupacao: z.coerce.number().optional(),
    multa_desocupacao: currencyToNumber.optional(),
    entrega_chaves: z.string().optional(),
    data_assinatura: z.string().optional(),
    data_quitacao: z.string().optional(),
    vistoria_obrigatoria: z.boolean().default(false),

    valor_condominio: currencyToNumber.optional(),
    valor_iptu_anual: currencyToNumber.optional(),
    valor_avaliacao: currencyToNumber.optional(),

    // Legal & Commission
    pep: z.boolean().default(false),
    percentual_comissao: z.coerce.number().optional(),
    valor_comissao: currencyToNumber.optional(),
    responsavel_comissao: z.string().optional(),
    data_pagamento_comissao: z.string().optional(),
    comissao_garantida: z.boolean().default(false),
    assinatura_eletronica: z.boolean().default(false),
    plataforma_assinatura: z.string().optional(),
    clausula_lgpd: z.boolean().default(false),
    foro_comarca: z.string().optional(),
    arbitragem: z.boolean().default(false),
    mediacao: z.boolean().default(false),

    gestao_exclusiva: z.enum(['com_exclusiva', 'sem_exclusiva']).optional(),

    tipo_negociacao: z
      .enum(['a_vista', 'financiamento', 'investidor', 'alto_padrao', 'permuta', 'dacao'])
      .optional(),

    tipo_arras: z.string().optional(),

    permuta_imovel_endereco: z.string().optional(),
    permuta_imovel_matricula: z.string().optional(),
    permuta_imovel_valor: currencyToNumber.optional(),
    permuta_imovel_detalhes: z.string().optional(),
    possui_torna: currencyToNumber.optional(),

    clausula_arrependimento: z.boolean().default(false),
    vendedor_banco: z.string().optional(),
    vendedor_agencia: z.string().optional(),
    vendedor_conta: z.string().optional(),
    vendedor_pix: z.string().optional(),

    contrato_origem: z.string().optional(),
    motivo_distrato: z.string().optional(),
    data_distrato: z.string().optional(),
    valor_reembolso: currencyToNumber.optional(),
    multa_distrato: currencyToNumber.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.tipo_documento === 'checklist_documental' ||
      data.tipo_documento === 'ficha_cadastral'
    ) {
      return // Skip strict validations to allow generation at any stage
    }

    const isAutorizacao = data.tipo_documento === 'autorizacao_intermediacao'
    const isReciboSinal = data.tipo_documento === 'recibo_sinal'
    const isTermos = ['termo_entrega_chaves', 'termo_posse'].includes(data.tipo_documento || '')
    const isDistrato = data.tipo_documento === 'distrato'

    if (isTermos) {
      if (data.tipo_documento === 'termo_posse') {
        if (!data.data_posse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['data_posse'],
            message: 'Data da imissão na posse é obrigatória',
          })
        }
        if (!data.estado_conservacao) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['estado_conservacao'],
            message: 'Estado de conservação é obrigatório para Termo de Posse',
          })
        }
      }
      if (data.tipo_documento === 'termo_entrega_chaves') {
        if (!data.entrega_chaves) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['entrega_chaves'],
            message: 'Data de entrega das chaves é obrigatória',
          })
        }
      }
    }

    if (isReciboSinal) {
      if (!data.valor_sinal || data.valor_sinal <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valor_sinal'],
          message: 'Valor do Sinal é obrigatório para Recibo de Sinal',
        })
      }
      if (!data.data_pagamento_sinal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data_pagamento_sinal'],
          message: 'Data de Pagamento do Sinal é obrigatória para Recibo de Sinal',
        })
      }
      if (!data.tipo_arras) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tipo_arras'],
          message: 'Tipo de Arras é obrigatório para Recibo de Sinal',
        })
      }
    }

    if (!data.nome_comprador && !isAutorizacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nome_comprador'],
        message: 'Obrigatório',
      })
    }
    if (!data.nome_vendedor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nome_vendedor'], message: 'Obrigatório' })
    }
    if (!data.endereco_imovel && !isDistrato) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endereco_imovel'],
        message: 'Obrigatório',
      })
    }
    if (
      !data.matricula_imovel &&
      !isAutorizacao &&
      !isDistrato &&
      !['checklist_documental', 'ficha_cadastral'].includes(data.tipo_documento || '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matricula_imovel'],
        message: 'Matrícula do imóvel é obrigatória',
      })
    }

    if (
      !data.clausula_lgpd &&
      !['ficha_cadastral', 'checklist_documental'].includes(data.tipo_documento || '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['clausula_lgpd'],
        message: 'O consentimento da LGPD é obrigatório.',
      })
    }

    if (data.tipo_documento === 'autorizacao_intermediacao' && !data.gestao_exclusiva) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gestao_exclusiva'],
        message: 'O tipo de gestão é obrigatório para Autorização',
      })
    }

    if (data.tipo_documento === 'distrato' && !data.contrato_origem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contrato_origem'],
        message: 'Obrigatório selecionar o contrato de origem',
      })
    }
    const isFinanciado =
      (data.financiamento_comprador === true ||
        data.possui_financiamento === true ||
        data.tipo_negociacao === 'financiamento') &&
      data.tipo_negociacao !== 'a_vista'

    if (isFinanciado) {
      const valorFin = data.valor_financiado ?? data.valor_financiamento

      if (valorFin !== undefined && valorFin !== null && valorFin < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valor_financiado'],
          message: 'O valor do financiamento não pode ser negativo',
        })
      } else if ((!valorFin || valorFin <= 0) && data.tipo_documento !== 'recibo_sinal') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valor_financiado'],
          message:
            'O valor do financiamento é obrigatório quando a negociação envolve financiamento',
        })
      }
    }

    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    const cepRegex = /^\d{5}-\d{3}$/

    // Comprador
    if (!isAutorizacao) {
      if (data.tipo_comprador === 'pf') {
        if (!data.cpf_comprador) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cpf_comprador'],
            message: 'Obrigatório para PF',
          })
        } else if (!cpfRegex.test(data.cpf_comprador)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cpf_comprador'],
            message: 'CPF inválido',
          })
        }
        if (
          data.estado_civil_comprador === 'Casado' ||
          data.estado_civil_comprador === 'Casada' ||
          data.comprador_uniao_estavel
        ) {
          if (!data.nome_conjuge_comprador) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['nome_conjuge_comprador'],
              message: 'Obrigatório',
            })
          }
          if (!data.cpf_conjuge_comprador) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['cpf_conjuge_comprador'],
              message: 'Obrigatório',
            })
          } else if (!cpfRegex.test(data.cpf_conjuge_comprador)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['cpf_conjuge_comprador'],
              message: 'CPF inválido',
            })
          }
        }
      } else if (data.tipo_comprador === 'pj') {
        if (!data.cnpj_comprador) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cnpj_comprador'],
            message: 'Obrigatório para PJ',
          })
        } else if (!cnpjRegex.test(data.cnpj_comprador)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cnpj_comprador'],
            message: 'CNPJ inválido',
          })
        }
        if (!data.representante_comprador) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['representante_comprador'],
            message: 'Obrigatório',
          })
        }
      }

      if (data.cep_comprador && !cepRegex.test(data.cep_comprador)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cep_comprador'],
          message: 'CEP inválido',
        })
      }
    }

    // Vendedor
    if (!data.vendedor_pj) {
      if (!data.cpf_vendedor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cpf_vendedor'],
          message: 'Obrigatório para PF',
        })
      } else if (!cpfRegex.test(data.cpf_vendedor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cpf_vendedor'],
          message: 'CPF inválido',
        })
      }
      if (
        data.estado_civil_vendedor === 'Casado' ||
        data.estado_civil_vendedor === 'Casada' ||
        data.vendedor_uniao_estavel
      ) {
        if (!data.conjuge_vendedor) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['conjuge_vendedor'],
            message: 'Obrigatório',
          })
        }
        if (!data.cpf_conjuge_vendedor) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cpf_conjuge_vendedor'],
            message: 'Obrigatório',
          })
        } else if (!cpfRegex.test(data.cpf_conjuge_vendedor)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cpf_conjuge_vendedor'],
            message: 'CPF inválido',
          })
        }
      }
    } else {
      if (!data.cnpj_vendedor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnpj_vendedor'],
          message: 'Obrigatório para PJ',
        })
      } else if (!cnpjRegex.test(data.cnpj_vendedor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnpj_vendedor'],
          message: 'CNPJ inválido',
        })
      }
      if (!data.representante_vendedor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['representante_vendedor'],
          message: 'Obrigatório',
        })
      }
    }

    if (data.cep_vendedor && !cepRegex.test(data.cep_vendedor)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cep_vendedor'], message: 'CEP inválido' })
    }

    if (data.cep_imovel && !cepRegex.test(data.cep_imovel)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cep_imovel'], message: 'CEP inválido' })
    }

    if (data.tipo_negociacao === 'permuta' || data.tipo_negociacao === 'dacao') {
      if (!data.permuta_imovel_endereco) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permuta_imovel_endereco'],
          message: 'Obrigatório',
        })
      }
      if (!data.permuta_imovel_matricula) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permuta_imovel_matricula'],
          message: 'Obrigatório',
        })
      }
      if (!data.permuta_imovel_valor || data.permuta_imovel_valor <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permuta_imovel_valor'],
          message: 'Obrigatório',
        })
      }
    }
  })

export type ContractFormValues = z.infer<typeof contractSchema>

export const profileSchema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  imobiliaria_nome: z.string().min(1, 'Obrigatório'),
  imobiliaria_documento: z.string().min(1, 'Obrigatório'),
  creci: z.string().min(1, 'Obrigatório'),
  banco_nome: z.string().min(1, 'Obrigatório'),
  agencia: z.string().min(1, 'Obrigatório'),
  conta: z.string().min(1, 'Obrigatório'),
  chave_pix: z.string().min(1, 'Obrigatório'),
  comissao_padrao_percentual: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0
      return Number(val)
    },
    z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  ),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
