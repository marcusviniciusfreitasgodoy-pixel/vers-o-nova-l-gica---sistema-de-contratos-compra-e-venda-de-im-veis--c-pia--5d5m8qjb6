import pb from '@/lib/pocketbase/client'

export const getCompanies = (options?: { filter?: string; sort?: string }) => {
  return pb.collection('companies').getFullList(options)
}

export const getCompany = (id: string) => {
  return pb.collection('companies').getOne(id)
}

export const createCompany = (data: any) => {
  return pb.collection('companies').create(data)
}

export const updateCompany = (id: string, data: any) => {
  return pb.collection('companies').update(id, data)
}
