import pb from '@/lib/pocketbase/client'
import type { GpDocTermoChaves } from '@/types/gp_schema'

export const getTermosChaves = () =>
  pb.collection<GpDocTermoChaves>('gp_doc_termo_chaves').getFullList()

export const getTermoChaves = (id: string) =>
  pb.collection<GpDocTermoChaves>('gp_doc_termo_chaves').getOne(id)

export const createTermoChaves = (data: Partial<GpDocTermoChaves>) =>
  pb.collection<GpDocTermoChaves>('gp_doc_termo_chaves').create(data)

export const updateTermoChaves = (id: string, data: Partial<GpDocTermoChaves>) =>
  pb.collection<GpDocTermoChaves>('gp_doc_termo_chaves').update(id, data)

export const deleteTermoChaves = (id: string) =>
  pb.collection<GpDocTermoChaves>('gp_doc_termo_chaves').delete(id)
