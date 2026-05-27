import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface GPDocFichaCadastral extends RecordModel {
  negociacao_id: string
  origem_captacao?: 'indicacao' | 'portal' | 'prospeccao' | 'carteira'
  data_captacao?: string
  situacao_ocupacao?: 'vago' | 'ocupado_proprietario' | 'locado'
  status_ficha?: 'incompleta' | 'completa' | 'validada'
}

export const getFichasCadastrais = () =>
  pb.collection<GPDocFichaCadastral>('gp_doc_ficha_cadastral').getFullList()

export const getFichaCadastral = (id: string) =>
  pb.collection<GPDocFichaCadastral>('gp_doc_ficha_cadastral').getOne(id)

export const getFichaCadastralByNegociacao = (negociacaoId: string) =>
  pb
    .collection<GPDocFichaCadastral>('gp_doc_ficha_cadastral')
    .getFirstListItem(`negociacao_id="${negociacaoId}"`)

export const createFichaCadastral = (data: Partial<GPDocFichaCadastral>) =>
  pb.collection<GPDocFichaCadastral>('gp_doc_ficha_cadastral').create(data)

export const updateFichaCadastral = (id: string, data: Partial<GPDocFichaCadastral>) =>
  pb.collection<GPDocFichaCadastral>('gp_doc_ficha_cadastral').update(id, data)

export const deleteFichaCadastral = (id: string) =>
  pb.collection('gp_doc_ficha_cadastral').delete(id)
