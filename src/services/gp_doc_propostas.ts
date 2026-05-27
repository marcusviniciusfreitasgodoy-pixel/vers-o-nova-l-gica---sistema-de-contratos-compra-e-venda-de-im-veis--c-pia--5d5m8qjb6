import pb from '@/lib/pocketbase/client'

export interface GPDocProposta {
  id: string
  negociacao_id: string
  rodada_negociacao?: number
  proposta_anterior_id?: string
  contraproposta_de?: 'vendedor' | 'comprador'
  valor_ofertado: number
  forma_pagamento_proposta?: Record<string, any>
  prazo_validade_dias?: number
  condicoes_oferta?: string
  previsao_sinal?: Record<string, any>
  prazo_resposta?: string
  status?: 'enviada' | 'aceita' | 'recusada' | 'expirada' | 'contraproposta'
  data_aceite?: string
  aceite_por?: string
  observacoes?: string
  created: string
  updated: string
  expand?: Record<string, any>
}

export const getPropostas = (negociacaoId: string) =>
  pb.collection('gp_doc_propostas').getFullList<GPDocProposta>({
    filter: `negociacao_id = "${negociacaoId}"`,
    sort: 'rodada_negociacao,-created',
    expand: 'proposta_anterior_id,aceite_por',
  })

export const getProposta = (id: string) =>
  pb.collection('gp_doc_propostas').getOne<GPDocProposta>(id, {
    expand: 'proposta_anterior_id,aceite_por',
  })

export const createProposta = (data: Partial<GPDocProposta>) =>
  pb.collection('gp_doc_propostas').create<GPDocProposta>(data)

export const updateProposta = (id: string, data: Partial<GPDocProposta>) =>
  pb.collection('gp_doc_propostas').update<GPDocProposta>(id, data)

export const deleteProposta = (id: string) => pb.collection('gp_doc_propostas').delete(id)
