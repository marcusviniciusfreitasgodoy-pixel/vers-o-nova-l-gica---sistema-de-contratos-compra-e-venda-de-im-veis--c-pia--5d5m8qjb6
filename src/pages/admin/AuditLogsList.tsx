import { useEffect, useState } from 'react'
import { getKnowledgeAuditLogs, type AuditLog } from '@/services/audit_logs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function AuditLogsList() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const loadData = async () => {
    try {
      const data = await getKnowledgeAuditLogs()
      setLogs(data)
    } catch (error: any) {
      toast.error('Erro ao carregar auditoria: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Histórico de Auditoria</h1>
        <p className="text-muted-foreground">
          Registro completo de alterações na Base Jurídica de Compliance.
        </p>
      </div>

      <div className="border rounded-lg bg-white overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Item (Base Jurídica)</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum registro de auditoria encontrado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {log.expand?.user?.name || log.expand?.user?.email || 'Sistema'}
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={log.expand?.knowledge_item?.title}
                  >
                    {log.expand?.knowledge_item?.title || 'Item Removido/Desconhecido'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        log.action === 'create'
                          ? 'bg-green-50 text-green-700'
                          : log.action === 'update'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-red-50 text-red-700'
                      }
                    >
                      {log.action.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleViewDetails(log)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver Detalhes
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Auditoria</DialogTitle>
            <DialogDescription>
              Mudanças registradas para o item "
              {selectedLog?.expand?.knowledge_item?.title || selectedLog?.knowledge_item}"
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-muted-foreground block">Data/Hora:</span>
                    {format(new Date(selectedLog.created), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block">Ação:</span>
                    <Badge variant="outline">{selectedLog.action.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block">Usuário:</span>
                    {selectedLog.expand?.user?.name || selectedLog.expand?.user?.email || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block">ID Item:</span>
                    {selectedLog.knowledge_item}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-sm text-muted-foreground block mb-2">
                    Modificações (JSON):
                  </span>
                  <div className="bg-slate-50 p-4 rounded-md border text-slate-700 overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
