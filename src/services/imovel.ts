import pb from '@/lib/pocketbase/client'

export const getImovelByCase = async (caseId: string) => {
  try {
    return await pb.collection('imovel').getFirstListItem(`case_id = "${caseId}"`)
  } catch (err) {
    return null
  }
}

export interface ImovelData {
  case_id: string
  tipo_imovel?: string
  finalidade?: string
  endereco_resumido?: string
  cidade?: string
  estado?: string
  matricula?: string
  inscricao_iptu?: string
  observacoes?: string
  gp_imovel_id?: string
}

export const createImovel = (data: ImovelData) => pb.collection('imovel').create(data)
export const updateImovel = (id: string, data: Partial<ImovelData>) =>
  pb.collection('imovel').update(id, data)
