import pb from '@/lib/pocketbase/client'

export interface GPDocPromessa {
  id: string
  negociacao_id: string
  subtipo: 'preliminar_condicional' | 'promessa_plena'
  valor_total: number
  sinal_valor?: number
  arras_tipo?: 'confirmatorias' | 'penitenciais'
  arras_base_legal?: string
  direito_arrependimento?: boolean
  forma_pagamento_detalhe?: Record<string, any>
  condicoes_suspensivas?: Record<string, any>
  prazo_implemento_condicao?: number
  prazo_escritura_dias?: number
  prazo_cura_mora_dias?: number
  multa_inadimplemento?: Record<string, any>
  posse_data_entrega?: string
  posse_condicao?: 'na_assinatura' | 'na_escritura' | 'no_registro'
  iptu_responsabilidade?: Record<string, any>
  condominio_responsabilidade?: Record<string, any>
  despesas_cartorio?: 'comprador' | 'vendedor' | 'divididas'
  despesas_itbi?: 'comprador' | 'vendedor' | 'divididas'
  irretratavel?: boolean
  clausula_registro?: boolean
  foro_eleicao?: string
  testemunhas?: Record<string, any>
  created: string
  updated: string
  expand?: Record<string, any>
}

export const getPromessas = (negociacaoId: string) =>
  pb.collection('gp_doc_promessa').getFullList<GPDocPromessa>({
    filter: `negociacao_id = "${negociacaoId}"`,
    sort: '-created',
  })

export const getPromessa = (id: string) =>
  pb.collection('gp_doc_promessa').getOne<GPDocPromessa>(id)

export const createPromessa = (data: Partial<GPDocPromessa>) => {
  // Add base legal string based on the selected type of 'arras' if not provided
  if (data.arras_tipo && !data.arras_base_legal) {
    data.arras_base_legal =
      data.arras_tipo === 'confirmatorias' ? 'CC arts. 417 e 418' : 'CC arts. 419 e 420'
  }
  return pb.collection('gp_doc_promessa').create<GPDocPromessa>(data)
}

export const updatePromessa = (id: string, data: Partial<GPDocPromessa>) => {
  // Add base legal string based on the selected type of 'arras' if not provided
  if (data.arras_tipo && !data.arras_base_legal) {
    data.arras_base_legal =
      data.arras_tipo === 'confirmatorias' ? 'CC arts. 417 e 418' : 'CC arts. 419 e 420'
  }
  return pb.collection('gp_doc_promessa').update<GPDocPromessa>(id, data)
}

export const deletePromessa = (id: string) => pb.collection('gp_doc_promessa').delete(id)
