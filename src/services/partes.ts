import pb from '@/lib/pocketbase/client'

export const getPartesByCase = (caseId: string) => {
  return pb.collection('partes').getFullList({
    filter: `case_id = "${caseId}"`,
  })
}

export const createParte = (data: any) => pb.collection('partes').create(data)
export const updateParte = (id: string, data: any) => pb.collection('partes').update(id, data)
export const deleteParte = (id: string) => pb.collection('partes').delete(id)
