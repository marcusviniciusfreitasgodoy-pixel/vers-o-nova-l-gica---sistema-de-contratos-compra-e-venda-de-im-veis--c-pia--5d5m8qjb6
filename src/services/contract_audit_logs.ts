import pb from '@/lib/pocketbase/client'

export interface ContractAuditLog {
  id: string
  user: string
  contract: string
  action: string
  description: string
  changes: any
  created: string
  updated: string
  expand?: {
    user?: {
      name: string
      email: string
    }
  }
}

export async function getContractAuditLogs(contractId: string): Promise<ContractAuditLog[]> {
  return (await pb.collection('contract_audit_logs').getFullList({
    filter: `contract = "${contractId}"`,
    sort: '-created',
    expand: 'user',
  })) as unknown as ContractAuditLog[]
}

export async function createContractAuditLog(data: {
  user: string
  contract: string
  action: string
  description: string
  changes?: any
}): Promise<ContractAuditLog> {
  return (await pb.collection('contract_audit_logs').create(data)) as unknown as ContractAuditLog
}
