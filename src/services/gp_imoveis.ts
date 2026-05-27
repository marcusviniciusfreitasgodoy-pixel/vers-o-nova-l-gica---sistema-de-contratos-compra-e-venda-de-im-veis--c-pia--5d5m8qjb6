import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'
import { Endereco } from './gp_pessoas'

export interface VagaGaragem {
  quantidade?: number
  numeracao?: string
  autonoma?: boolean
}

export interface OnusGravame {
  tipo?: string
  descricao?: string
  ativo?: boolean
}

export interface GPImovel extends RecordModel {
  tipo_imovel?: 'apartamento' | 'casa' | 'lote' | 'sala_comercial' | 'galpao' | 'terreno' | 'outro'
  matricula_numero?: string
  cartorio_ri?: string
  inscricao_iptu?: string
  inscricao_municipal?: string
  endereco?: Endereco
  condominio_nome?: string
  area_privativa?: number
  area_total?: number
  vaga_garagem?: VagaGaragem
  fracao_ideal?: number
  onus_gravames?: OnusGravame[]
  valor_venal?: number
  descricao_registral?: string
}

export const getGPImoveis = () => pb.collection<GPImovel>('gp_imoveis').getFullList()
export const getGPImovel = (id: string) => pb.collection<GPImovel>('gp_imoveis').getOne(id)
export const createGPImovel = (data: Partial<GPImovel>) =>
  pb.collection<GPImovel>('gp_imoveis').create(data)
export const updateGPImovel = (id: string, data: Partial<GPImovel>) =>
  pb.collection<GPImovel>('gp_imoveis').update(id, data)
export const deleteGPImovel = (id: string) => pb.collection('gp_imoveis').delete(id)
