import pb from '@/lib/pocketbase/client'

export const getExpertRequests = () =>
  pb
    .collection('expert_support_requests')
    .getFullList({ sort: '-created', expand: 'contract,user,case' })

export const getMyExpertRequests = () =>
  pb.collection('expert_support_requests').getFullList({
    sort: '-created',
    expand: 'contract,case',
    filter: `user = "${pb.authStore.record?.id}"`,
  })

export const getExpertRequest = (id: string) =>
  pb.collection('expert_support_requests').getOne(id, { expand: 'contract,user,case' })

export const getActiveExpertRequestsByCase = (caseId: string) =>
  pb.collection('expert_support_requests').getFullList({
    filter: `case = "${caseId}" && status != 'completed' && status != 'closed' && status != 'refused'`,
  })

export const createExpertRequest = (data: FormData) =>
  pb.collection('expert_support_requests').create(data)

export const updateExpertRequest = (id: string, data: any) =>
  pb.collection('expert_support_requests').update(id, data)

export const getExpertProposals = (requestId: string) =>
  pb
    .collection('expert_proposals')
    .getFullList({ filter: `request = "${requestId}"`, sort: '-created' })

export const createExpertProposal = (data: any) => pb.collection('expert_proposals').create(data)

export const updateExpertProposal = (id: string, data: any) =>
  pb.collection('expert_proposals').update(id, data)

export const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    received: 'Recebido',
    awaiting_info: 'Aguardando Info',
    screening: 'Em Triagem',
    analyzing: 'Em Análise',
    proposal_issued: 'Proposta Emitida',
    awaiting_decision: 'Aguardando Decisão',
    accepted: 'Aceito',
    refused: 'Recusado',
    reformulating: 'Em Reformulação',
    executing: 'Em Execução',
    completed: 'Concluído',
    closed: 'Encerrado',
  }
  return map[status] || status
}

export const translateObjective = (obj: string) => {
  const map: Record<string, string> = {
    technical_doubt: 'Dúvida Técnica',
    consultative_guidance: 'Orientação Consultiva',
    doc_analysis: 'Análise de Documentação',
    partial_review: 'Revisão Parcial de Cláusula',
    full_review: 'Revisão Completa do Contrato',
    risk_analysis: 'Análise de Risco (Compliance)',
    talk_specialist: 'Falar com Especialista',
  }
  return map[obj] || obj
}
