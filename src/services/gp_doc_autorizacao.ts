import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface GPDocAutorizacao extends RecordModel {
  negociacao_id: string
  corretor_creci_pf?: string
  corretor_creci_pj?: string
  tipo_autorizacao?: 'com_exclusividade' | 'sem_exclusividade'
  prazo_vigencia_dias?: number
  comissao_percentual?: number
  comissao_valor_fixo?: number
  responsavel_comissao?: 'comprador' | 'vendedor' | 'divididas'
  momento_pagamento?: 'na_promessa' | 'na_escritura' | 'no_registro'
  exclusividade_multa?: Record<string, any>
  valor_pretendido_imovel?: number
  autoriza_publicidade?: boolean
}

export const getAutorizacoes = () =>
  pb.collection<GPDocAutorizacao>('gp_doc_autorizacao').getFullList()

export const getAutorizacao = (id: string) =>
  pb.collection<GPDocAutorizacao>('gp_doc_autorizacao').getOne(id)

export const getAutorizacaoByNegociacao = (negociacaoId: string) =>
  pb
    .collection<GPDocAutorizacao>('gp_doc_autorizacao')
    .getFirstListItem(`negociacao_id="${negociacaoId}"`)

export const createAutorizacao = (data: Partial<GPDocAutorizacao>) =>
  pb.collection<GPDocAutorizacao>('gp_doc_autorizacao').create(data)

export const updateAutorizacao = (id: string, data: Partial<GPDocAutorizacao>) =>
  pb.collection<GPDocAutorizacao>('gp_doc_autorizacao').update(id, data)

export const deleteAutorizacao = (id: string) => pb.collection('gp_doc_autorizacao').delete(id)
