import pb from '@/lib/pocketbase/client'
import type { GpDocMinutaEscritura } from '@/types/gp_schema'

export const getMinutasEscritura = (negociacaoId?: string) =>
  pb
    .collection<GpDocMinutaEscritura>('gp_doc_minuta_escritura')
    .getFullList(
      negociacaoId
        ? { filter: `negociacao_id = "${negociacaoId}"`, sort: '-created' }
        : { sort: '-created' },
    )

export const getMinutaEscritura = (id: string) =>
  pb.collection<GpDocMinutaEscritura>('gp_doc_minuta_escritura').getOne(id)

export const createMinutaEscritura = (data: Partial<GpDocMinutaEscritura>) =>
  pb.collection<GpDocMinutaEscritura>('gp_doc_minuta_escritura').create(data)

export const updateMinutaEscritura = (id: string, data: Partial<GpDocMinutaEscritura>) =>
  pb.collection<GpDocMinutaEscritura>('gp_doc_minuta_escritura').update(id, data)

export const deleteMinutaEscritura = (id: string) =>
  pb.collection<GpDocMinutaEscritura>('gp_doc_minuta_escritura').delete(id)
