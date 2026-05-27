import pb from '@/lib/pocketbase/client'

export const getImovelByCase = async (caseId: string) => {
  try {
    return await pb.collection('imovel').getFirstListItem(`case_id = "${caseId}"`)
  } catch (err) {
    return null
  }
}

export const createImovel = (data: any) => pb.collection('imovel').create(data)
export const updateImovel = (id: string, data: any) => pb.collection('imovel').update(id, data)
