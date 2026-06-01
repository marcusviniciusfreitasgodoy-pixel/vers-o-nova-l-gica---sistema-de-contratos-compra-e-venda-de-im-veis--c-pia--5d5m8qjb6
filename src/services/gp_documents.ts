import pb from '@/lib/pocketbase/client'

export const generateGpDocument = async (payload: any) => {
  return pb.send('/backend/v1/gp/generate-document', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const getGpDocuments = async (negociacaoId: string) => {
  return pb.collection('gp_final_documents').getFullList({
    filter: `negociacao_id = "${negociacaoId}"`,
    sort: '-created',
  })
}

export const updateGpDocument = async (id: string, data: any) => {
  return pb.collection('gp_final_documents').update(id, data)
}
