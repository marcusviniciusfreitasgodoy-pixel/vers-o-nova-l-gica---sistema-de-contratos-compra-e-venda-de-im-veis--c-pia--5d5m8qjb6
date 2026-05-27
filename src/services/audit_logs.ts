import pb from '@/lib/pocketbase/client'

export interface AuditLog {
  id: string
  user: string
  knowledge_item: string
  action: string
  changes: any
  created: string
  updated: string
  expand?: {
    user?: {
      name: string
      email: string
    }
    knowledge_item?: {
      title: string
    }
  }
}

export async function getKnowledgeAuditLogs(knowledgeItemId?: string): Promise<AuditLog[]> {
  const filter = knowledgeItemId ? `knowledge_item = "${knowledgeItemId}"` : ''
  const records = await pb.collection('knowledge_audit_logs').getFullList({
    sort: '-created',
    filter,
    expand: 'user,knowledge_item',
  })
  return records as unknown as AuditLog[]
}
