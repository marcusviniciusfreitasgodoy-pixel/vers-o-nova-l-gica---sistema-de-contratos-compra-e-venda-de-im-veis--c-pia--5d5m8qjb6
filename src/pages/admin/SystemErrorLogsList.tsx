import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSystemErrorLogs, SystemErrorLog } from '@/services/system_error_logs'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Bug, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export default function SystemErrorLogsList() {
  const [logs, setLogs] = useState<SystemErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterComponent, setFilterComponent] = useState('')
  const [selectedLog, setSelectedLog] = useState<SystemErrorLog | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      let filterStr = ''
      const filters = []
      if (filterSeverity !== 'all') {
        filters.push(`severity = '${filterSeverity}'`)
      }
      if (filterComponent) {
        filters.push(`component ~ '${filterComponent}'`)
      }
      if (filters.length > 0) {
        filterStr = filters.join(' && ')
      }
      const data = await getSystemErrorLogs(1, 50, filterStr)
      setLogs(data.items)
    } catch (error) {
      console.error('Failed to fetch error logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filterSeverity])

  useRealtime('system_error_logs', () => {
    fetchLogs()
  })

  const getSeverityBadge = (severity: string) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold'
    switch (severity) {
      case 'critical':
        return (
          <span className={`${baseClass} bg-red-100 text-red-800 border border-red-200`}>
            <AlertCircle className="w-3 h-3 mr-1" /> Crítico
          </span>
        )
      case 'error':
        return (
          <span className={`${baseClass} bg-orange-100 text-orange-800 border border-orange-200`}>
            <AlertTriangle className="w-3 h-3 mr-1" /> Erro
          </span>
        )
      case 'warning':
        return (
          <span className={`${baseClass} bg-yellow-100 text-yellow-800 border border-yellow-200`}>
            <AlertTriangle className="w-3 h-3 mr-1" /> Aviso
          </span>
        )
      case 'info':
      default:
        return (
          <span className={`${baseClass} bg-blue-100 text-blue-800 border border-blue-200`}>
            <Info className="w-3 h-3 mr-1" /> Info
          </span>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0C2340] tracking-tight flex items-center gap-2">
            <Bug className="w-8 h-8 text-[#D4AF37]" />
            Logs de Sistema
          </h1>
          <p className="text-slate-500 mt-1">
            Monitoramento centralizado de erros e exceções da aplicação.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Filtrar por componente..."
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Gravidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Gravidades</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchLogs} variant="secondary">
          Filtrar
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Gravidade</TableHead>
              <TableHead>Componente</TableHead>
              <TableHead>Mensagem de Erro</TableHead>
              <TableHead>Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Carregando logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Nenhum log encontrado para os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="whitespace-nowrap">
                    {log.created &&
                      format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {log.component || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-slate-600">
                    {log.error_message}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {log.expand?.user?.email || 'Sistema'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedLog && getSeverityBadge(selectedLog.severity)}
              Detalhes do Erro
            </DialogTitle>
            <DialogDescription>
              Registrado em{' '}
              {selectedLog?.created &&
                format(new Date(selectedLog.created), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 mt-4 rounded-md border border-slate-200 p-4 bg-slate-50">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Mensagem</h4>
                <p className="text-slate-700 break-words">{selectedLog?.error_message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Componente</h4>
                  <p className="text-slate-700">{selectedLog?.component || '-'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Rota</h4>
                  <p className="text-slate-700 font-mono text-sm">{selectedLog?.route || '-'}</p>
                </div>
              </div>

              {selectedLog?.context_data && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Dados de Contexto</h4>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedLog.context_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog?.stack_trace && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Stack Trace</h4>
                  <pre className="bg-red-950 text-red-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
