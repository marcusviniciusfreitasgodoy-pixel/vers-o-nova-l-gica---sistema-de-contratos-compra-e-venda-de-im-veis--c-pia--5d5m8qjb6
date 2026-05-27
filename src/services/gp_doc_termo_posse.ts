import pb from '@/lib/pocketbase/client'
import type { GpDocTermoPosse } from '@/types/gp_schema'

export const getTermosPosse = () =>
  pb.collection<GpDocTermoPosse>('gp_doc_termo_posse').getFullList()

export const getTermoPosse = (id: string) =>
  pb.collection<GpDocTermoPosse>('gp_doc_termo_posse').getOne(id)

export const createTermoPosse = (data: Partial<GpDocTermoPosse>) =>
  pb.collection<GpDocTermoPosse>('gp_doc_termo_posse').create(data)

export const updateTermoPosse = (id: string, data: Partial<GpDocTermoPosse>) =>
  pb.collection<GpDocTermoPosse>('gp_doc_termo_posse').update(id, data)

export const deleteTermoPosse = (id: string) =>
  pb.collection<GpDocTermoPosse>('gp_doc_termo_posse').delete(id)
