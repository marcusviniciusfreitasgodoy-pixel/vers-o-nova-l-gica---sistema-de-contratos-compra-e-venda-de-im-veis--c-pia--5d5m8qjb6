import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { History, Eye, ShieldAlert, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AnalysisReportView, type AnalysisReport } from '@/components/AnalysisReportView'

export function AnalysisHistoryTable({ contractId }: { contractId?: string | null }) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null)

  const loadReports = async () => {
    try {
      const filter = contractId ? `contract = "${contractId}"` : ''
      const records = await pb.collection('analysis_reports').getList(1, 50, {
        filter,
        sort: '-created',
      })
      setReports(records.items)
    } catch (err) {
      console.error('Failed to load history', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [contractId])

  useRealtime('analysis_reports', () => {
    loadReports()
  })

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">Carregando histórico...</div>
    )

  if (reports.length === 0) return null

  return (
    <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-purple-600" />
        {contractId ? 'Histórico de Análises deste Contrato' : 'Histórico Recente de Análises'}
      </h3>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Data da Análise</th>
              <th className="px-6 py-4">Nome do Arquivo</th>
              <th className="px-6 py-4">Nível de Risco</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 text-slate-700 font-medium">
                  {format(new Date(report.created), "dd 'de' MMMM, yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span
                      className="truncate max-w-[200px]"
                      title={report.file_name || 'Texto do Editor'}
                    >
                      {report.file_name || 'Texto do Editor'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                      report.risk_level === 'critico'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : report.risk_level === 'alto'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : report.risk_level === 'medio'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                    }`}
                  >
                    {report.risk_level?.toUpperCase() || 'BAIXO'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 font-medium"
                    onClick={() => setSelectedReport(report.analysis_result)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Ver Relatório
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <ShieldAlert className="w-6 h-6 text-purple-600" />
              Relatório Arquivado
            </DialogTitle>
          </div>
          <div className="px-6 py-6">
            {selectedReport && <AnalysisReportView report={selectedReport} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
