import pb from '@/lib/pocketbase/client'
import type { GpDocDistrato } from '@/types/gp_schema'

export const getDistratos = () => pb.collection<GpDocDistrato>('gp_doc_distrato').getFullList()

export const getDistrato = (id: string) =>
  pb.collection<GpDocDistrato>('gp_doc_distrato').getOne(id)

export const createDistrato = (data: Partial<GpDocDistrato>) =>
  pb.collection<GpDocDistrato>('gp_doc_distrato').create(data)

export const updateDistrato = (id: string, data: Partial<GpDocDistrato>) =>
  pb.collection<GpDocDistrato>('gp_doc_distrato').update(id, data)

export const deleteDistrato = (id: string) =>
  pb.collection<GpDocDistrato>('gp_doc_distrato').delete(id)
