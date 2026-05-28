import { useEffect, useState } from 'react'
import { getContractAuditLogs, ContractAuditLog } from '@/services/contract_audit_logs'
import { CheckCircle2, Eye, Mail, FileText, Edit, MessageSquare, PlusCircle } from 'lucide-react'
import { format } from 'date-fns'

export function DocumentTimeline({ contractId }: { contractId: string }) {
  const [logs, setLogs] = useState<ContractAuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getContractAuditLogs(contractId)
      .then((data) => {
        setLogs(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [contractId])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-slate-100 rounded"></div>
        <div className="h-16 bg-slate-100 rounded"></div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-6">
        Nenhum evento registrado para este documento.
      </div>
    )
  }

  const getIcon = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('regenerated') || act.includes('edit')) return <Edit className="w-4 h-4" />
    if (act.includes('generated') || act.includes('created'))
      return <PlusCircle className="w-4 h-4" />
    if (act.includes('sent_for_signature')) return <Mail className="w-4 h-4" />
    if (act.includes('whatsapp')) return <MessageSquare className="w-4 h-4" />
    if (act.includes('viewed')) return <Eye className="w-4 h-4" />
    if (act.includes('signed') || act.includes('assinado'))
      return <CheckCircle2 className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getIconColor = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('regenerated') || act.includes('edit'))
      return 'text-amber-500 group-[.is-active]:bg-amber-50 group-[.is-active]:border-amber-100'
    if (act.includes('generated') || act.includes('created'))
      return 'text-blue-500 group-[.is-active]:bg-blue-50 group-[.is-active]:border-blue-100'
    if (act.includes('sent_for_signature'))
      return 'text-indigo-500 group-[.is-active]:bg-indigo-50 group-[.is-active]:border-indigo-100'
    if (act.includes('whatsapp'))
      return 'text-emerald-500 group-[.is-active]:bg-emerald-50 group-[.is-active]:border-emerald-100'
    if (act.includes('viewed'))
      return 'text-purple-500 group-[.is-active]:bg-purple-50 group-[.is-active]:border-purple-100'
    if (act.includes('signed') || act.includes('assinado'))
      return 'text-emerald-600 group-[.is-active]:bg-emerald-50 group-[.is-active]:border-emerald-100'
    return 'text-slate-500 group-[.is-active]:bg-slate-50 group-[.is-active]:border-slate-200'
  }

  const translateAction = (action: string) => {
    const act = action.toLowerCase()
    if (act === 'document_generated') return 'Documento Gerado'
    if (act === 'document_regenerated') return 'Documento Regerado / Editado'
    if (act === 'sent_for_signature') return 'Enviado para Assinatura'
    if (act === 'document_viewed') return 'Documento Visualizado'
    if (act === 'document_signed') return 'Documento Assinado'
    return action
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pt-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
        >
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${getIconColor(log.action)}`}
          >
            {getIcon(log.action)}
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between space-x-2 mb-2">
              <div className="font-bold text-slate-800 text-sm">{translateAction(log.action)}</div>
              <time className="font-medium text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
              </time>
            </div>
            <div className="text-slate-600 text-sm leading-relaxed">{log.description}</div>
            {log.expand?.user && (
              <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                Usuário: {log.expand.user.name || log.expand.user.email}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
