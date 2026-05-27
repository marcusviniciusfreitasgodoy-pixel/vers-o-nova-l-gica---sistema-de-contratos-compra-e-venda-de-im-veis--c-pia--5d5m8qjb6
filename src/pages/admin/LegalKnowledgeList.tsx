import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getLegalKnowledgeList,
  deleteLegalKnowledge,
  type LegalKnowledge,
} from '@/services/legal_knowledge'
import { getKnowledgeAuditLogs, type AuditLog } from '@/services/audit_logs'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, FileText, History, Clock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function LegalKnowledgeList() {
  const [items, setItems] = useState<LegalKnowledge[]>([])
  const [loading, setLoading] = useState(true)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LegalKnowledge | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadData = async () => {
    try {
      const data = await getLegalKnowledgeList()
      setItems(data)
    } catch (error: any) {
      toast.error('Erro ao carregar registros: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return
    try {
      await deleteLegalKnowledge(id)
      toast.success('Registro excluído com sucesso')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message)
    }
  }

  const handleViewHistory = async (item: LegalKnowledge) => {
    setSelectedItem(item)
    setHistoryOpen(true)
    setLoadingHistory(true)
    try {
      const logs = await getKnowledgeAuditLogs(item.id)
      setAuditLogs(logs)
    } catch (error: any) {
      toast.error('Erro ao carregar histórico: ' + error.message)
    } finally {
      setLoadingHistory(false)
    }
  }

  const categoryMap: Record<string, string> = {
    legislacao: 'Legislação',
    jurisprudencia: 'Jurisprudência',
    boas_praticas: 'Boas Práticas',
    clausula_fixa: 'Cláusula Fixa',
    clausula_condicional: 'Cláusula Condicional',
    protecao_comercial: 'Proteção Comercial',
    distrato: 'Distrato',
    permuta: 'Permuta',
    checklist_documental: 'Checklist Documental',
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Base de Conhecimento Jurídico</h1>
          <p className="text-muted-foreground">
            Gerencie o acervo jurídico da IA e audite alterações.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/knowledge/new">
            <Plus className="w-4 h-4 mr-2" />
            Novo Registro
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg bg-white overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-[250px] truncate" title={item.title}>
                    {item.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryMap[item.category] || item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.source_file ? (
                      <a
                        href={pb.files.getURL(item as any, item.source_file)}
                        target="_blank"
                        rel="noreferrer"
                        title={item.source_file}
                      >
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 w-fit cursor-pointer hover:bg-muted"
                        >
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{item.source_file}</span>
                        </Badge>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{item.code || '-'}</TableCell>
                  <TableCell>{item.version ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewHistory(item)}
                        title="Ver Histórico"
                      >
                        <History className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="Editar">
                        <Link to={`/admin/knowledge/${item.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Auditoria de mudanças para "{selectedItem?.title}"
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center p-8">Carregando histórico...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Nenhuma alteração registrada.
              </div>
            ) : (
              <div className="space-y-6">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="relative pl-6 pb-6 border-l last:border-0 border-slate-200"
                  >
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {log.expand?.user?.name ||
                            log.expand?.user?.email ||
                            'Usuário Desconhecido'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="text-sm">
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
                      </div>
                      <div className="mt-2 text-sm bg-slate-50 p-3 rounded-md border text-slate-700 overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
