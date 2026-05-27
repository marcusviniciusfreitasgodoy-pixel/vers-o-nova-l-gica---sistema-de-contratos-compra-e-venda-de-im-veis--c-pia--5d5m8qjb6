import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface LegalKnowledge extends RecordModel {
  title: string
  content: string
  category:
    | 'legislacao'
    | 'jurisprudencia'
    | 'boas_praticas'
    | 'clausula_fixa'
    | 'clausula_condicional'
    | 'protecao_comercial'
  version?: number
  code?: string
  trigger_logic?: string
  priority?: number
  source_file?: string
}

export const getLegalKnowledgeList = () =>
  pb.collection('legal_knowledge').getFullList<LegalKnowledge>({ sort: '-created' })
export const getLegalKnowledge = (id: string) =>
  pb.collection('legal_knowledge').getOne<LegalKnowledge>(id)
export const createLegalKnowledge = (data: Partial<LegalKnowledge> | FormData) =>
  pb.collection('legal_knowledge').create<LegalKnowledge>(data)
export const updateLegalKnowledge = (id: string, data: Partial<LegalKnowledge> | FormData) =>
  pb.collection('legal_knowledge').update<LegalKnowledge>(id, data)
export const deleteLegalKnowledge = (id: string) => pb.collection('legal_knowledge').delete(id)
