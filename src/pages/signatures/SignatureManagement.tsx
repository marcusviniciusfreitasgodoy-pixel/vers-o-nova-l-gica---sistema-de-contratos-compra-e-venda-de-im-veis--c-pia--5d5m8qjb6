import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Eye, Search, AlertCircle, CheckCircle, FileSignature } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function SignatureManagement() {
  const [contracts, setContracts] = useState<any[]>([])
  const [partesByCase, setPartesByCase] = useState<Record<string, any[]>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const loadData = async () => {
    setIsLoading(true)
    try {
      let baseFilter = `(status = 'enviado_assinatura' || status = 'assinado' || plataforma_assinatura != '')`
      if (user?.role === 'operador') {
        baseFilter += ` && (user = "${user.id}" || negociacao_id.case_id.responsible = "${user.id}")`
      }

      const records = await pb.collection('contracts').getFullList({
        filter: baseFilter,
        expand: 'negociacao_id.case_id, user',
        sort: '-updated',
      })

      setContracts(records)

      const caseIds = Array.from(
        new Set(records.map((r) => r.expand?.negociacao_id?.case_id).filter(Boolean)),
      )
      if (caseIds.length > 0) {
        const partesRecords = await pb.collection('partes').getFullList({
          filter: caseIds.map((id) => `case_id = "${id}"`).join(' || '),
        })
        const map: Record<string, any[]> = {}
        for (const p of partesRecords) {
          if (!map[p.case_id]) map[p.case_id] = []
          map[p.case_id].push(p)
        }
        setPartesByCase(map)
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar dados de assinaturas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const markAsSigned = async (id: string) => {
    try {
      await pb.collection('contracts').update(id, { status: 'assinado' })
      toast.success('Documento marcado como assinado!')
      loadData()
    } catch (e) {
      toast.error('Erro ao atualizar documento')
    }
  }

  const filteredContracts = contracts.filter((c) => {
    const s = search.toLowerCase()
    const caseId = c.expand?.negociacao_id?.case_id || ''
    const matchSearch =
      caseId.toLowerCase().includes(s) || (c.tipo_documento || '').toLowerCase().includes(s)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter

    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-blue-600" />
            Gestão de Assinaturas
          </h1>
          <p className="text-slate-500 text-sm">
            Acompanhe o status dos documentos enviados para assinatura digital.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar por ID do Caso ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[220px] bg-slate-50 border-slate-200">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="enviado_assinatura">Enviado p/ Assinatura</SelectItem>
            <SelectItem value="assinado">Assinado / Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Caso / Negociação</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Partes Envolvidas</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></span>
                    Carregando dados...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((c) => {
                const caseId = c.expand?.negociacao_id?.case_id
                const partes = partesByCase[caseId] || []
                const missingEmails = partes.filter((p) => !p.e_mail || p.e_mail.trim() === '')

                return (
                  <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-700">
                      <div className="flex flex-col">
                        <span className="text-sm">Caso: {caseId || 'N/A'}</span>
                        <span className="text-xs text-slate-400">
                          Negociação: {c.negociacao_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize font-medium text-slate-700">
                        {String(c.tipo_documento).replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">{partes.length} partes</span>
                        {missingEmails.length > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Atenção: {missingEmails.length} parte(s) sem e-mail cadastrado.
                                </p>
                                <p className="text-xs opacity-80">
                                  Isso impedirá o envio automático pós-assinatura.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.plataforma_assinatura ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {c.plataforma_assinatura}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Não definida</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.status === 'assinado' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Assinado
                        </span>
                      ) : c.status === 'enviado_assinatura' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          Pendente
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {String(c.status).replace(/_/g, ' ')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {c.status === 'enviado_assinatura' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsSigned(c.id)}
                                  className="h-8 w-8 p-0 border-slate-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Simular Assinatura (Teste)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          asChild
                        >
                          <Link to={`/negociacao/${c.negociacao_id}/fase-1`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
