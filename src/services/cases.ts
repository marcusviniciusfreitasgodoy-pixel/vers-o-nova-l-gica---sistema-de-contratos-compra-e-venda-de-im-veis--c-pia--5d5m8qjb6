import pb from '@/lib/pocketbase/client'

export const getCases = (options?: { expand?: string; filter?: string; sort?: string }) => {
  return pb.collection('cases').getFullList(options)
}

export const getCase = (id: string, options?: { expand?: string }) => {
  return pb.collection('cases').getOne(id, options)
}

export const createCase = (data: any) => {
  return pb.collection('cases').create(data)
}

export const updateCase = (id: string, data: any) => {
  return pb.collection('cases').update(id, data)
}

export const deleteCase = (id: string) => {
  return pb.collection('cases').delete(id)
}
