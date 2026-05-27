import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface ChecklistItem {
  descricao: string
  obrigatorio: boolean
  status: 'pendente' | 'recebido' | 'recusado' | 'aprovado'
  data_recebimento?: string
  arquivo_url?: string
}

export interface GPDocChecklist extends RecordModel {
  negociacao_id: string
  momento_exigencia?: 'viabilidade_fase1' | 'diligencia_fase2'
  categoria_parte?: 'vendedor' | 'comprador' | 'imovel'
  itens?: ChecklistItem[]
  arquivos?: string[]
}

export const getChecklists = () => pb.collection<GPDocChecklist>('gp_doc_checklist').getFullList()

export const getChecklist = (id: string) =>
  pb.collection<GPDocChecklist>('gp_doc_checklist').getOne(id)

export const getChecklistsByNegociacao = (negociacaoId: string) =>
  pb
    .collection<GPDocChecklist>('gp_doc_checklist')
    .getFullList({ filter: `negociacao_id="${negociacaoId}"` })

export const createChecklist = (data: Partial<GPDocChecklist>) =>
  pb.collection<GPDocChecklist>('gp_doc_checklist').create(data)

export const updateChecklist = (id: string, data: Partial<GPDocChecklist>) =>
  pb.collection<GPDocChecklist>('gp_doc_checklist').update(id, data)

export const deleteChecklist = (id: string) => pb.collection('gp_doc_checklist').delete(id)
