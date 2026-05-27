import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Calendar, FileText, Loader2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link, Navigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { AnalysisReportView } from '@/components/AnalysisReportView'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'

export default function AnalysisHistory() {
  const { user, loading: authLoading } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<any | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  useRealtime('analysis_reports', () => {
    loadReports()
  })

  const loadReports = async () => {
    try {
      const records = await pb.collection('analysis_reports').getList(1, 50, {
        sort: '-created',
        expand: 'contract',
      })
      setReports(records.items)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critico':
      case 'crítico':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'alto':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medio':
      case 'médio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'baixo':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  if (authLoading) return null
  if (!user) return <Navigate to="/login" />

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Bot className="w-8 h-8 text-purple-600" />
          Histórico de Análises
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Consulte os diagnósticos jurídicos realizados anteriormente.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700">Nenhuma análise encontrada</h3>
          <p className="text-slate-500 mt-2 mb-6">Você ainda não realizou análises jurídicas.</p>
          <Link to="/analysis" className="text-purple-600 hover:underline font-medium">
            Fazer uma análise agora &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 animate-in fade-in">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={cn('uppercase', getRiskColor(report.risk_level))}>
                      Risco: {report.risk_level || 'Desconhecido'}
                    </Badge>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(report.created), "dd 'de' MMMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                    {report.expand?.contract
                      ? `Contrato: ${report.expand.contract.tipo === 'a_vista' ? 'À Vista' : report.expand.contract.tipo === 'financiado' ? 'Financiado' : report.expand.contract.tipo}`
                      : `Documento Avulso ${report.file_name ? `(${report.file_name})` : ''}`}
                  </h3>
                  <p className="text-slate-600 text-sm mt-1 line-clamp-1">
                    {report.summary || 'Análise concluída com sucesso.'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Bot className="w-7 h-7 text-purple-600" />
              Relatório de Análise Jurídica
            </DialogTitle>
            <DialogDescription className="text-base mt-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {selectedReport &&
                format(new Date(selectedReport.created), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </div>
          <div className="p-6">
            {selectedReport?.analysis_result && (
              <AnalysisReportView report={selectedReport.analysis_result} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
