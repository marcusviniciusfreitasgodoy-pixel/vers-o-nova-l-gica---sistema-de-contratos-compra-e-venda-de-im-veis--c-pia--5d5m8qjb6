import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface GPNegociacao extends RecordModel {
  imovel_id?: string
  corretor_id?: string
  company_id?: string
  case_id?: string
  estagio?:
    | 'captacao'
    | 'proposta'
    | 'preliminar'
    | 'promessa'
    | 'definitivo'
    | 'finalizacao'
    | 'concluido'
    | 'distratado'
  valor_total?: number
  forma_pagamento?: 'a_vista' | 'parcelado_direto' | 'financiado_sfh' | 'financiado_fiduciario'
}

export const getGPNegociacoes = () => pb.collection<GPNegociacao>('gp_negociacoes').getFullList()
export const getGPNegociacao = (id: string) =>
  pb.collection<GPNegociacao>('gp_negociacoes').getOne(id)
export const createGPNegociacao = (data: Partial<GPNegociacao>) =>
  pb.collection<GPNegociacao>('gp_negociacoes').create(data)
export const updateGPNegociacao = (id: string, data: Partial<GPNegociacao>) =>
  pb.collection<GPNegociacao>('gp_negociacoes').update(id, data)
export const deleteGPNegociacao = (id: string) => pb.collection('gp_negociacoes').delete(id)
