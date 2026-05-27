import pb from '@/lib/pocketbase/client'

export interface GPDocReciboSinal {
  id: string
  negociacao_id: string
  valor_sinal: number
  forma_recebimento?: 'pix' | 'ted' | 'dinheiro' | 'cheque'
  data_recebimento: string
  natureza_valor?: 'principio_pagamento' | 'arras'
  imputa_preco?: boolean
  condicao_devolucao?: string
  created: string
  updated: string
  expand?: Record<string, any>
}

export const getRecibosSinal = (negociacaoId: string) =>
  pb.collection('gp_doc_recibo_sinal').getFullList<GPDocReciboSinal>({
    filter: `negociacao_id = "${negociacaoId}"`,
    sort: '-created',
  })

export const getReciboSinal = (id: string) =>
  pb.collection('gp_doc_recibo_sinal').getOne<GPDocReciboSinal>(id)

export const createReciboSinal = (data: Partial<GPDocReciboSinal>) =>
  pb.collection('gp_doc_recibo_sinal').create<GPDocReciboSinal>(data)

export const updateReciboSinal = (id: string, data: Partial<GPDocReciboSinal>) =>
  pb.collection('gp_doc_recibo_sinal').update<GPDocReciboSinal>(id, data)

export const deleteReciboSinal = (id: string) => pb.collection('gp_doc_recibo_sinal').delete(id)
