import pb from '@/lib/pocketbase/client'
import type { ContractFormValues } from '@/lib/schemas'
import { parseCurrency } from '@/lib/formatters'
import { parseCurrencySafe } from '@/lib/schemas'

const toPbDate = (dateStr?: string | null) => {
  if (!dateStr) return null
  try {
    // If it's a simple YYYY-MM-DD string, force a midday time to avoid timezone shift issues
    if (dateStr.length === 10 && dateStr.includes('-')) {
      return new Date(`${dateStr}T12:00:00.000Z`).toISOString()
    }
    return new Date(dateStr).toISOString()
  } catch (e) {
    return null
  }
}

export const generateContractDocx = async (data: any) => {
  return await pb.send('/backend/v1/gerar-contrato-docx', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const deleteContract = async (id: string) => {
  return await pb.collection('contracts').delete(id)
}

export const getContract = async (id: string) => {
  return await pb.collection('contracts').getOne(id)
}

export const getAllMyContracts = async () => {
  return await pb.collection('contracts').getFullList({
    sort: '-created',
  })
}

export const regenerateContract = async (id: string, data: any) => {
  return await pb.send('/backend/v1/assemble-contract', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const getMyContracts = async (page: number = 1, perPage: number = 50) => {
  return await pb.collection('contracts').getList(page, perPage, {
    sort: '-created',
  })
}

export const updateContractData = async (id: string, data: any) => {
  return await pb.collection('contracts').update(id, data)
}

export const saveContractDraft = async (
  data: Partial<ContractFormValues>,
  id?: string,
  minutaTexto?: string,
) => {
  const formData = new FormData()

  const safeDate = (val: string | undefined | null) => {
    if (!val) return ''
    return toPbDate(val) || ''
  }

  if (data.tipo_negociacao === 'a_vista') {
    data.financiamento_comprador = false
    data.possui_financiamento = false
    data.valor_financiado = 0
    data.valor_financiamento = 0
  }

  const valFin = data.valor_financiado || data.valor_financiamento || 0

  const payload: Record<string, any> = {
    ...data,
    minuta_texto: minutaTexto,
    user: pb.authStore.record?.id,
    area_total: Number(data.area_total) || 0,
    area_privativa: Number(data.area_privativa) || 0,
    vagas_garagem: Number(data.vagas_garagem) || 0,
    valor_condominio: parseCurrencySafe(data.valor_condominio),
    valor_iptu_anual: parseCurrencySafe(data.valor_iptu_anual),
    valor_avaliacao: parseCurrencySafe(data.valor_avaliacao),
    valor_total: parseCurrencySafe(data.valor_total),
    valor_sinal: parseCurrencySafe(data.valor_sinal),
    valor_financiamento: parseCurrencySafe(valFin),
    valor_financiado: parseCurrencySafe(valFin),
    valor_fgts: parseCurrencySafe(data.valor_fgts),
    valor_recursos_proprios: parseCurrencySafe(data.valor_recursos_proprios),
    valor_parcela: parseCurrencySafe(data.valor_parcela),
    valor_comissao: parseCurrencySafe(data.valor_comissao),
    multa_desocupacao: parseCurrencySafe(data.multa_desocupacao),
    quantidade_parcelas: Number(data.quantidade_parcelas) || 0,
    prazo_financiamento: Number(data.prazo_financiamento) || 0,
    multa_inadimplencia: Number(data.multa_inadimplencia) || 0,
    prazo_desocupacao: Number(data.prazo_desocupacao) || 0,
    percentual_comissao: Number(data.percentual_comissao) || 0,
    data_pagamento_sinal: safeDate(data.data_pagamento_sinal),
    prazo_escritura: safeDate(data.prazo_escritura),
    data_posse: safeDate(data.data_posse),
    entrega_chaves: safeDate(data.entrega_chaves),
    data_pagamento_comissao: safeDate(data.data_pagamento_comissao),
    data_nascimento_comprador: safeDate(data.data_nascimento_comprador),
    data_nascimento_vendedor: safeDate(data.data_nascimento_vendedor),
    data_assinatura: safeDate(data.data_assinatura),
    data_quitacao: safeDate(data.data_quitacao),
    vendedor_uniao_estavel: data.vendedor_uniao_estavel ?? false,
    comprador_uniao_estavel: data.comprador_uniao_estavel ?? false,

    contrato_origem: data.contrato_origem,
    motivo_distrato: data.motivo_distrato,
    data_distrato: safeDate(data.data_distrato),
    valor_reembolso: parseCurrencySafe(data.valor_reembolso),
    multa_distrato: parseCurrencySafe(data.multa_distrato),

    permuta_imovel_endereco: data.permuta_imovel_endereco,
    permuta_imovel_matricula: data.permuta_imovel_matricula,
    permuta_imovel_valor: parseCurrencySafe(data.permuta_imovel_valor),
    permuta_imovel_detalhes: data.permuta_imovel_detalhes,
  }

  if (data.imovel_desocupado) {
    payload.imovel_ocupado = false
    payload.ocupacao_imovel = 'Imóvel desocupado'
  }
  delete payload.imovel_desocupado

  // Add files
  const appendFile = (field: string, fileData: any) => {
    if (!fileData) return
    if (fileData instanceof File) {
      formData.append(field, fileData)
    } else if (
      typeof FileList !== 'undefined' &&
      fileData instanceof FileList &&
      fileData.length > 0
    ) {
      formData.append(field, fileData[0])
    } else if (Array.isArray(fileData) && fileData.length > 0 && fileData[0] instanceof File) {
      formData.append(field, fileData[0])
    }
  }

  appendFile('matricula_file', data.matricula_file)
  appendFile('iptu_file', data.iptu_file)

  // Omit file fields from payload before iterating
  delete payload.matricula_file
  delete payload.iptu_file

  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (typeof v === 'boolean') {
      formData.append(k, String(v))
    } else if (
      typeof v === 'object' &&
      !(v instanceof File) &&
      !(typeof FileList !== 'undefined' && v instanceof FileList)
    ) {
      try {
        formData.append(k, JSON.stringify(v))
      } catch (e) {
        // Skip on circular or non-serializable objects
      }
    } else if (typeof v !== 'object') {
      formData.append(k, String(v))
    }
  })

  if (id) {
    return await pb.collection('contracts').update(id, formData)
  }
  return await pb.collection('contracts').create(formData)
}
