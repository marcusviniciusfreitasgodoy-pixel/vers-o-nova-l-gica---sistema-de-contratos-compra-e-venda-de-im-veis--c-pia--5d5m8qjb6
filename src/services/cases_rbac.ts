import pb from '@/lib/pocketbase/client'

export interface RbacCheckResponse {
  allowed: boolean
  reason: string
}

export const checkCasePermission = async (
  caseId: string,
  action: string,
): Promise<RbacCheckResponse> => {
  return pb.send('/backend/v1/cases/check-permission', {
    method: 'POST',
    body: JSON.stringify({ case_id: caseId, action }),
    headers: { 'Content-Type': 'application/json' },
  })
}
