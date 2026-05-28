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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { History, Mail } from 'lucide-react'
import { DocumentTimeline } from '@/components/DocumentTimeline'

export default function SignatureManagement() {
  const [contracts, setContracts] = useState<any[]>([])
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    successes: 0,
    failures: 0,
  })
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

  const canBatchProcess = user?.role === 'admin' || user?.role === 'gestor'

  const toggleDoc = (id: string) => {
    const next = new Set(selectedDocs)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedDocs(next)
  }

  const toggleAll = () => {
    if (selectedDocs.size === filteredContracts.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(filteredContracts.map((c) => c.id)))
    }
  }

  const handleBatchDispatch = async () => {
    if (selectedDocs.size === 0) return

    const docsToProcess = contracts.filter(
      (c) =>
        selectedDocs.has(c.id) &&
        c.status !== 'assinado' &&
        c.status !== 'enviado_assinatura' &&
        c.arquivo_gerado,
    )

    if (docsToProcess.length === 0) {
      toast.error(
        'Nenhum documento válido para envio. Apenas documentos com arquivo gerado e pendentes de envio podem ser selecionados.',
      )
      return
    }

    setIsBatchProcessing(true)
    setBatchProgress({ current: 0, total: docsToProcess.length, successes: 0, failures: 0 })

    let successes = 0
    let failures = 0

    for (let i = 0; i < docsToProcess.length; i++) {
      setBatchProgress((prev) => ({ ...prev, current: i + 1 }))
      const doc = docsToProcess[i]

      try {
        await pb.send('/backend/v1/contracts/send-signature', {
          method: 'POST',
          body: JSON.stringify({
            contractId: doc.id,
            sendWhatsApp: true,
          }),
        })
        successes++
      } catch (err) {
        failures++
      }
    }

    setBatchProgress((prev) => ({ ...prev, successes, failures }))

    setTimeout(() => {
      setIsBatchProcessing(false)
      setSelectedDocs(new Set())
      loadData()
      if (failures === 0) {
        toast.success(`Todos os ${successes} documentos foram enviados com sucesso!`)
      } else {
        toast.warning(`${successes} enviados com sucesso, ${failures} falharam.`)
      }
    }, 2000)
  }

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
              {canBatchProcess && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedDocs.size > 0 && selectedDocs.size === filteredContracts.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
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
                    {canBatchProcess && (
                      <TableCell>
                        <Checkbox
                          checked={selectedDocs.has(c.id)}
                          onCheckedChange={() => toggleDoc(c.id)}
                        />
                      </TableCell>
                    )}
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-xl h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Histórico de Eventos</DialogTitle>
                            </DialogHeader>
                            <DocumentTimeline contractId={c.id} />
                          </DialogContent>
                        </Dialog>

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

      {selectedDocs.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10">
          <span className="font-medium text-sm">
            {selectedDocs.size} documento(s) selecionado(s)
          </span>
          <Button
            onClick={handleBatchDispatch}
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            disabled={isBatchProcessing}
          >
            <Mail className="w-4 h-4 mr-2" />
            Disparar para Assinatura ({selectedDocs.size})
          </Button>
        </div>
      )}

      <Dialog open={isBatchProcessing}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Processando Envio em Lote</DialogTitle>
            <DialogDescription>Enviando documentos para os destinatários...</DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="text-3xl font-bold text-slate-800">
              {batchProgress.current} / {batchProgress.total}
            </div>
            <Progress
              value={(batchProgress.current / batchProgress.total) * 100}
              className="w-full h-2"
            />
            <div className="flex gap-4 text-sm mt-4">
              <span className="text-emerald-600 font-medium">
                Sucesso: {batchProgress.successes}
              </span>
              <span className="text-red-500 font-medium">Falhas: {batchProgress.failures}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
