import pb from '@/lib/pocketbase/client'

export const getPartesByCase = (caseId: string) => {
  return pb.collection('partes').getFullList({
    filter: `case_id = "${caseId}"`,
  })
}

export interface ParteData {
  case_id: string
  tipo_da_parte?: string
  nome: string
  documento?: string
  papel_na_operacao?: string
  e_mail?: string
  telefone?: string
  observacoes?: string
  possui_representacao?: boolean
  gp_pessoa_id?: string
}

export const createParte = (data: ParteData) => pb.collection('partes').create(data)
export const updateParte = (id: string, data: Partial<ParteData>) =>
  pb.collection('partes').update(id, data)
export const deleteParte = (id: string) => pb.collection('partes').delete(id)
