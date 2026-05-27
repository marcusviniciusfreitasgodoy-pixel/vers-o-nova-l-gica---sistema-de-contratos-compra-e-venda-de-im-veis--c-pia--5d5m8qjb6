import pb from '@/lib/pocketbase/client'
import type { GpDocContratoForcaEscritura } from '@/types/gp_schema'

export const getForcaEscrituras = () =>
  pb.collection<GpDocContratoForcaEscritura>('gp_doc_contrato_forca_escritura').getFullList()

export const getForcaEscritura = (id: string) =>
  pb.collection<GpDocContratoForcaEscritura>('gp_doc_contrato_forca_escritura').getOne(id)

export const createForcaEscritura = (data: Partial<GpDocContratoForcaEscritura>) =>
  pb.collection<GpDocContratoForcaEscritura>('gp_doc_contrato_forca_escritura').create(data)

export const updateForcaEscritura = (id: string, data: Partial<GpDocContratoForcaEscritura>) =>
  pb.collection<GpDocContratoForcaEscritura>('gp_doc_contrato_forca_escritura').update(id, data)

export const deleteForcaEscritura = (id: string) =>
  pb.collection<GpDocContratoForcaEscritura>('gp_doc_contrato_forca_escritura').delete(id)
