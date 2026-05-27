import pb from '@/lib/pocketbase/client'
import { type AnalysisReport } from '@/components/AnalysisReportView'

export interface AnalysisReportRecord {
  id: string
  user: string
  contract: string
  file_name: string
  analysis_result: AnalysisReport
  summary: string
  risk_level: string
  created: string
  updated: string
}

export const getAnalysisReportsByContract = (contractId: string) =>
  pb.collection('analysis_reports').getFullList<AnalysisReportRecord>({
    filter: `contract = '${contractId}'`,
    sort: '-created',
  })
