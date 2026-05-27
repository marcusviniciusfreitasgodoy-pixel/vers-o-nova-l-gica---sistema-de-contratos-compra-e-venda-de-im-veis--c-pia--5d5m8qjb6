import pb from '@/lib/pocketbase/client'

export interface ContractTemplate {
  id: string
  name: string
  user: string
  template_data: any
  created: string
  updated: string
}

export async function getContractTemplates(): Promise<ContractTemplate[]> {
  return (await pb.collection('contract_templates').getFullList({
    sort: '-created',
  })) as unknown as ContractTemplate[]
}

export async function createContractTemplate(data: {
  name: string
  template_data: any
  user: string
}): Promise<ContractTemplate> {
  return (await pb.collection('contract_templates').create(data)) as unknown as ContractTemplate
}

export async function deleteContractTemplate(id: string): Promise<boolean> {
  return await pb.collection('contract_templates').delete(id)
}
