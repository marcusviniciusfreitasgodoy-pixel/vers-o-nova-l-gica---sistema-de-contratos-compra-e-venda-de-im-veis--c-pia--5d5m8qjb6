import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface GPNegociacaoParte extends RecordModel {
  negociacao_id?: string
  pessoa_id?: string
  papel?:
    | 'vendedor'
    | 'comprador'
    | 'conjuge_vendedor'
    | 'conjuge_comprador'
    | 'anuente'
    | 'credor_fiduciario'
    | 'fiador'
    | 'procurador'
}

export const getGPNegociacaoPartes = () =>
  pb.collection<GPNegociacaoParte>('gp_negociacao_partes').getFullList()
export const getGPNegociacaoParte = (id: string) =>
  pb.collection<GPNegociacaoParte>('gp_negociacao_partes').getOne(id)
export const createGPNegociacaoParte = (data: Partial<GPNegociacaoParte>) =>
  pb.collection<GPNegociacaoParte>('gp_negociacao_partes').create(data)
export const updateGPNegociacaoParte = (id: string, data: Partial<GPNegociacaoParte>) =>
  pb.collection<GPNegociacaoParte>('gp_negociacao_partes').update(id, data)
export const deleteGPNegociacaoParte = (id: string) =>
  pb.collection('gp_negociacao_partes').delete(id)
