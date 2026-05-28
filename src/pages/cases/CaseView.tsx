import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getCase, updateCase } from '@/services/cases'
import { getPartesByCase } from '@/services/partes'
import { getImovelByCase } from '@/services/imovel'
import { getGPImoveisByCase } from '@/services/gp_imoveis'
import { getGPPessoasByCase } from '@/services/gp_pessoas'
import { getActiveExpertRequestsByCase } from '@/services/expert'
import { createGPNegociacao } from '@/services/gp_negociacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Edit,
  Briefcase,
  Users,
  MapPin,
  FileText,
  Loader2,
  Info,
  UserCheck,
  AlertCircle,
  Trash2,
  CheckCircle2,
  PlayCircle,
  Download,
  Clock,
  MoreVertical,
  ShieldAlert,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import ClientCaseView from '@/pages/cases/ClientCaseView'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CASE_STATES, OPERATION_TYPES, COMPLEXITY_LEVELS, STATE_COLORS } from '@/lib/constants'
import { format } from 'date-fns'
import { generateCaseSummaryPDF } from '@/lib/export-summary'

const STAGES = [
  { id: 1, name: 'Cadastro', states: ['rascunho', 'em_qualificacao'] },
  { id: 2, name: 'Negociação', states: ['em_preenchimento', 'aguardando_documentos'] },
  {
    id: 3,
    name: 'Revisão',
    states: ['em_validacao', 'pendente_revisao_juridica', 'encaminhado_suporte_especializado'],
  },
  { id: 4, name: 'Assinatura', states: ['aprovado', 'aprovado_ressalvas', 'minuta_gerada'] },
]

const SEGMENTS: Record<string, string> = {
  corretor_autonomo: 'Corretor Autônomo',
  imobiliaria_pequena_media: 'Imobiliária P/M',
  imobiliaria_estruturada_premium: 'Imobiliária Premium',
  construtora_incorporadora: 'Construtora/Incorporadora',
}

export default function CaseView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [caseData, setCaseData] = useState<any>(null)
  const [partes, setPartes] = useState<any[]>([])
  const [imovel, setImovel] = useState<any>(null)
  const [negociacao, setNegociacao] = useState<any>(null)
  const [transitions, setTransitions] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSupportRequest, setActiveSupportRequest] = useState<any>(null)

  const [transitionDialog, setTransitionDialog] = useState<{
    isOpen: boolean
    targetState: string | null
    payload?: any
  }>({ isOpen: false, targetState: null })
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [parecerJuridico, setParecerJuridico] = useState('')
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [isStartingNeg, setIsStartingNeg] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const loadData = async () => {
    try {
      const [
        c,
        pLegacy,
        pNew,
        iLegacy,
        iNew,
        activeReqs,
        negs,
        trans,
        caseContracts,
        checklistDocs,
      ] = await Promise.all([
        getCase(id as string, { expand: 'responsible' }),
        getPartesByCase(id as string).catch(() => []),
        getGPPessoasByCase(id as string).catch(() => []),
        getImovelByCase(id as string).catch(() => null),
        getGPImoveisByCase(id as string).catch(() => null),
        getActiveExpertRequestsByCase(id as string).catch(() => []),
        pb
          .collection('gp_negociacoes')
          .getFullList({ filter: `case_id="${id}"` })
          .catch(() => []),
        pb
          .collection('case_state_transitions')
          .getFullList({ filter: `case="${id}"`, sort: '-created', expand: 'user' })
          .catch(() => []),
        pb
          .collection('contracts')
          .getFullList({ filter: `negociacao_id.case_id="${id}"` })
          .catch(() => []),
        pb
          .collection('gp_doc_checklist')
          .getFullList({ filter: `negociacao_id.case_id="${id}"` })
          .catch(() => []),
      ])

      const mergedPartes = [
        ...pLegacy,
        ...pNew.map((p) => ({
          id: p.id,
          nome: p.nome_razao_social,
          papel_na_operacao: p.papel_na_operacao || 'outro',
          tipo_da_parte: p.tipo_pessoa === 'juridica' ? 'pessoa_juridica' : 'pessoa_fisica',
          documento: p.cpf_cnpj,
          telefone: p.telefone,
          e_mail: p.email,
        })),
      ]

      const docsList: any[] = []
      caseContracts.forEach((cont) => {
        if (cont.arquivo_gerado) {
          docsList.push({
            id: cont.id,
            title: `Contrato: ${cont.tipo_documento || 'Minuta'}`,
            type: 'Contrato Gerado',
            file: cont.arquivo_gerado,
            collection: 'contracts',
            record: cont,
          })
        }
      })
      checklistDocs.forEach((chk) => {
        if (Array.isArray(chk.arquivos) && chk.arquivos.length > 0) {
          chk.arquivos.forEach((arq: string, i: number) => {
            docsList.push({
              id: `${chk.id}-${i}`,
              title: `Documento Checklist`,
              type: 'Anexo',
              file: arq,
              collection: 'gp_doc_checklist',
              record: chk,
            })
          })
        } else if (chk.arquivos && typeof chk.arquivos === 'string') {
          docsList.push({
            id: `${chk.id}-0`,
            title: `Documento Checklist`,
            type: 'Anexo',
            file: chk.arquivos,
            collection: 'gp_doc_checklist',
            record: chk,
          })
        }
      })

      docsList.sort(
        (a, b) => new Date(b.record.created).getTime() - new Date(a.record.created).getTime(),
      )

      setCaseData(c)
      setPartes(mergedPartes)
      setImovel(iNew || iLegacy)
      setActiveSupportRequest(activeReqs[0] || null)
      setNegociacao(negs[0] || null)
      setTransitions(trans)
      setDocuments(docsList)
    } catch (err) {
      toast.error('Erro ao carregar detalhes do caso')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('cases', (e) => {
    if (e.record.id === id) loadData()
  })
  useRealtime('partes', (e) => {
    if (e.record.case_id === id) loadData()
  })
  useRealtime('contracts', (e) => {
    loadData()
  })
  useRealtime('gp_doc_checklist', (e) => {
    loadData()
  })

  const hasSeller = partes.some((p) => p.papel_na_operacao === 'vendedor')
  const hasBuyer = partes.some((p) => p.papel_na_operacao === 'comprador')
  const hasProperty = !!imovel

  const completedSteps = [hasSeller, hasBuyer, hasProperty].filter(Boolean).length
  const progressPercentage = Math.round((completedSteps / 3) * 100)

  useEffect(() => {
    if (!caseData || loading) return
    const autoUpdate = async () => {
      if (caseData.estado_caso === 'rascunho' && completedSteps === 3) {
        try {
          await updateCase(id as string, { estado_caso: 'em_qualificacao' })
          loadData()
        } catch (e) {
          console.error('Failed to auto update status', e)
        }
      }
    }
    autoUpdate()
  }, [caseData?.estado_caso, completedSteps, loading])

  const canTransition = user?.is_admin || user?.company === caseData?.company

  const transitionTo = async (targetState: string) => {
    setTransitionLoading(true)
    try {
      await updateCase(id as string, { estado_caso: targetState })
      await pb.collection('case_state_transitions').create({
        case: id,
        user: user?.id,
        user_role: user?.role || (user?.is_admin ? 'admin' : 'operador'),
        previous_state: caseData?.estado_caso,
        new_state: targetState,
      })
      toast.success('Success', { description: 'Status updated successfully.' })
      loadData()
      return true
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Access Denied', {
          description: 'Insufficient permissions.',
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        })
      } else if (err.status === 400) {
        const errors = extractFieldErrors(err)
        const msg = Object.values(errors)[0] || 'Rule Violation'
        toast.warning('Rule Violation', {
          description: msg,
          icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
        })
      } else {
        toast.error('Technical Failure', {
          description: 'Internal error.',
          action: { label: 'Report to Support', onClick: () => console.log('report') },
        })
      }
      return false
    } finally {
      setTransitionLoading(false)
    }
  }

  const proceedToNegociacao = async () => {
    if (negociacao) {
      const fase = negociacao.estagio === 'captacao' ? 1 : 2
      navigate(`/negociacao/${negociacao.id}/fase-${fase}`)
    } else {
      setIsStartingNeg(true)
      try {
        const newNeg = await createGPNegociacao({
          case_id: id,
          estagio: 'proposta',
          company_id: caseData.company,
        })
        toast.success('Painel de Negociação iniciado com sucesso!')
        navigate(`/negociacao/${newNeg.id}/fase-1`)
      } catch (err: any) {
        toast.error('Erro ao iniciar painel')
      } finally {
        setIsStartingNeg(false)
      }
    }
  }

  let smartAction: { label: string; action: () => void; disabled?: boolean } | null = null
  if (canTransition) {
    switch (caseData?.estado_caso) {
      case 'rascunho':
        smartAction = {
          label: 'Iniciar Qualificação',
          action: () => transitionTo('em_qualificacao'),
        }
        break
      case 'em_qualificacao':
        smartAction = {
          label: 'Avançar para Preenchimento',
          action: () => {
            transitionTo('em_preenchimento').then((res) => {
              if (res !== false) proceedToNegociacao()
            })
          },
        }
        break
      case 'em_preenchimento':
        smartAction = {
          label: 'Aguardar Documentos',
          action: () => transitionTo('aguardando_documentos'),
        }
        break
      case 'aguardando_documentos':
        smartAction = { label: 'Enviar para Validação', action: () => transitionTo('em_validacao') }
        break
      case 'em_validacao':
        smartAction = {
          label: 'Solicitar Revisão',
          action: () => transitionTo('pendente_revisao_juridica'),
        }
        break
      case 'pendente_revisao_juridica':
        if (user?.is_admin || user?.role === 'gestor')
          smartAction = {
            label: 'Aprovar Caso',
            action: () => setTransitionDialog({ isOpen: true, targetState: 'aprovado' }),
          }
        else smartAction = { label: 'Aguardando Revisão', action: () => {}, disabled: true }
        break
      case 'encaminhado_suporte_especializado':
        if (user?.is_admin || user?.role === 'gestor')
          smartAction = {
            label: 'Retornar para Validação',
            action: () => transitionTo('em_validacao'),
          }
        else smartAction = { label: 'Em Suporte Especializado', action: () => {}, disabled: true }
        break
      case 'aprovado':
      case 'aprovado_ressalvas':
        smartAction = { label: 'Gerar Minuta', action: () => transitionTo('minuta_gerada') }
        break
      case 'minuta_gerada':
        if (user?.is_admin || user?.role === 'gestor') {
          smartAction = {
            label: 'Arquivar Caso',
            action: () => setTransitionDialog({ isOpen: true, targetState: 'arquivado' }),
          }
        }
        break
    }
  }

  const handleManualTransition = async () => {
    if (!transitionDialog.targetState) return

    if (transitionDialog.targetState === 'cancelado' && !motivoCancelamento) {
      toast.warning('Rule Violation', { description: 'Field motivo_cancelamento is mandatory.' })
      return
    }

    setTransitionLoading(true)
    try {
      const dataToUpdate: any = { estado_caso: transitionDialog.targetState }
      if (transitionDialog.targetState === 'cancelado') {
        dataToUpdate.motivo_cancelamento = motivoCancelamento
      }
      if (
        transitionDialog.targetState === 'aprovado' ||
        transitionDialog.targetState === 'aprovado_ressalvas'
      ) {
        if (!parecerJuridico) {
          toast.warning('Rule Violation', { description: 'Legal opinion (parecer) missing.' })
          setTransitionLoading(false)
          return
        }
        dataToUpdate.parecer = parecerJuridico
      }

      await updateCase(id as string, dataToUpdate)
      await pb.collection('case_state_transitions').create({
        case: id,
        user: user?.id,
        user_role: user?.role || (user?.is_admin ? 'admin' : 'operador'),
        previous_state: caseData.estado_caso,
        new_state: transitionDialog.targetState,
      })
      toast.success('Success', { description: 'Status updated successfully.' })
      setTransitionDialog({ isOpen: false, targetState: null })
      loadData()
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Access Denied', {
          description: 'Insufficient permissions.',
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        })
      } else if (err.status === 400) {
        const errors = extractFieldErrors(err)
        const msg = Object.values(errors)[0] || 'Rule Violation'
        toast.warning('Rule Violation', {
          description: msg,
          icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
        })
      } else {
        toast.error('Technical Failure', {
          description: 'Internal error.',
          action: { label: 'Report to Support', onClick: () => console.log('report') },
        })
      }
    } finally {
      setTransitionLoading(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const caseContracts = await pb
        .collection('contracts')
        .getFullList({ filter: `negociacao_id.case_id="${id}"`, sort: '-created' })
        .catch(() => [])

      await generateCaseSummaryPDF(caseData, partes, imovel, negociacao, transitions, caseContracts)
      toast.success('Resumo exportado com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar resumo')
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user?.role === 'cliente' && caseData) {
    return <ClientCaseView caseId={id as string} caseData={caseData} imovel={imovel} />
  }

  if (!caseData) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Caso não encontrado</h2>
        <Button className="mt-4" asChild>
          <Link to="/casos">Voltar para Casos</Link>
        </Button>
      </div>
    )
  }

  const canExport = user?.is_admin || user?.role === 'gestor' || caseData.responsible === user?.id
  const currentStageId = STAGES.find((s) => s.states.includes(caseData.estado_caso))?.id || 1

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/casos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Resumo do Caso
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canExport && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center gap-2"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar Resumo
            </Button>
          )}
          {user?.role !== 'operador' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deseja realmente excluir esta negociação? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        const linkedNegs = await pb
                          .collection('gp_negociacoes')
                          .getFullList({ filter: `case_id="${id}"` })
                        for (const neg of linkedNegs) {
                          await pb.collection('gp_negociacoes').delete(neg.id)
                        }
                        await pb.collection('cases').delete(id as string)
                        toast.success('Negociação excluída com sucesso!')
                        window.location.href = '/casos'
                      } catch (e: any) {
                        toast.error('Erro ao excluir a negociação.')
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button asChild>
            <Link to={`/casos/${id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Caso
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        {/* Visual Progress Stepper */}
        <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto px-4 py-6">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentStageId - 1) / 3) * 100}%` }}
            />
          </div>
          {STAGES.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300',
                  currentStageId > s.id
                    ? 'bg-green-500 text-white border-white shadow-md ring-2 ring-green-500/20'
                    : currentStageId === s.id
                      ? 'bg-primary text-primary-foreground border-white shadow-md ring-2 ring-primary/20 scale-110'
                      : 'bg-slate-100 text-slate-400 border-white',
                )}
              >
                {currentStageId > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tracking-tight transition-colors',
                  currentStageId === s.id
                    ? 'text-slate-800'
                    : currentStageId > s.id
                      ? 'text-green-600'
                      : 'text-slate-400',
                )}
              >
                {s.name}
              </span>
            </div>
          ))}
        </div>

        {/* Status and Smart Action Banner */}
        <Card
          className={cn('shadow-sm transition-colors duration-300 bg-muted/10 border-primary/10')}
        >
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Status Atual
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-sm px-3 py-1 font-medium',
                    STATE_COLORS[caseData.estado_caso],
                  )}
                >
                  {CASE_STATES[caseData.estado_caso] || caseData.estado_caso}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {activeSupportRequest && (
                <Button
                  variant="outline"
                  asChild
                  className="border-amber-500 text-amber-700 hover:bg-amber-50 bg-amber-50/50 w-full sm:w-auto"
                >
                  <Link to={`/expert-support/${activeSupportRequest.id}`}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Suporte em Andamento
                  </Link>
                </Button>
              )}
              {smartAction && (
                <Button
                  onClick={smartAction.action}
                  disabled={smartAction.disabled || transitionLoading}
                  className={cn(
                    'w-full sm:w-auto shadow-md transition-all',
                    smartAction.disabled
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary hover:bg-primary/90',
                  )}
                  size="lg"
                >
                  {transitionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {smartAction.label}
                </Button>
              )}
              {canTransition && !['cancelado', 'arquivado'].includes(caseData.estado_caso) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user?.is_admin && (
                      <DropdownMenuItem
                        onClick={() =>
                          setTransitionDialog({ isOpen: true, targetState: 'cancelado' })
                        }
                      >
                        <AlertCircle className="w-4 h-4 mr-2 text-destructive" />{' '}
                        <span className="text-destructive">Cancelar Caso</span>
                      </DropdownMenuItem>
                    )}
                    {caseData.estado_caso === 'minuta_gerada' && user?.is_admin && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            setTransitionDialog({ isOpen: true, targetState: 'em_preenchimento' })
                          }
                        >
                          <AlertCircle className="w-4 h-4 mr-2 text-destructive" />{' '}
                          <span className="text-destructive">
                            Invalidar Minuta (P/ Preenchimento)
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setTransitionDialog({
                              isOpen: true,
                              targetState: 'pendente_revisao_juridica',
                            })
                          }
                        >
                          <AlertCircle className="w-4 h-4 mr-2 text-destructive" />{' '}
                          <span className="text-destructive">Invalidar Minuta (P/ Revisão)</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {(user?.is_admin || user?.role === 'gestor') && (
                      <DropdownMenuItem
                        onClick={() =>
                          setTransitionDialog({ isOpen: true, targetState: 'arquivado' })
                        }
                      >
                        <Archive className="w-4 h-4 mr-2 text-muted-foreground" /> Arquivar Caso
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="mb-4 flex-wrap w-full justify-start h-auto">
          <TabsTrigger value="resumo">Resumo do Caso</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Linha do Tempo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Qualificação Inicial
                </CardTitle>
                <span className="text-sm font-medium text-muted-foreground">
                  {progressPercentage}% Concluído
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="pt-4">
              <TooltipProvider>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-3 w-max cursor-help">
                          <Checkbox
                            id="check-seller"
                            checked={hasSeller}
                            disabled
                            className="data-[state=checked]:bg-primary pointer-events-none"
                          />
                          <label
                            htmlFor="check-seller"
                            className={cn(
                              'text-sm font-medium leading-none cursor-help',
                              hasSeller ? 'line-through text-muted-foreground' : '',
                            )}
                          >
                            Cadastrar Vendedor
                          </label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Adicione pelo menos uma parte com o papel de 'Vendedor' na aba de Partes.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-3 w-max cursor-help">
                          <Checkbox
                            id="check-buyer"
                            checked={hasBuyer}
                            disabled
                            className="data-[state=checked]:bg-primary pointer-events-none"
                          />
                          <label
                            htmlFor="check-buyer"
                            className={cn(
                              'text-sm font-medium leading-none cursor-help',
                              hasBuyer ? 'line-through text-muted-foreground' : '',
                            )}
                          >
                            Cadastrar Comprador
                          </label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Adicione pelo menos uma parte com o papel de 'Comprador' na aba de Partes.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-3 w-max cursor-help">
                          <Checkbox
                            id="check-property"
                            checked={hasProperty}
                            disabled
                            className="data-[state=checked]:bg-primary pointer-events-none"
                          />
                          <label
                            htmlFor="check-property"
                            className={cn(
                              'text-sm font-medium leading-none cursor-help',
                              hasProperty ? 'line-through text-muted-foreground' : '',
                            )}
                          >
                            Vincular Dados do Imóvel
                          </label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cadastre ou vincule um imóvel a este caso na aba correspondente.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" /> Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Título</h3>
                  <p className="text-lg font-semibold">{caseData.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {caseData.description || 'Nenhuma descrição informada.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Responsável</h3>
                  <p className="text-sm font-medium">
                    {caseData.expand?.responsible?.name ||
                      caseData.expand?.responsible?.email ||
                      'Não informado'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Classificadores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Tipo de Operação
                  </h3>
                  <p className="text-sm font-medium">
                    {OPERATION_TYPES[caseData.tipo_operacao] || caseData.tipo_operacao}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Segmento</h3>
                  <p className="text-sm font-medium">
                    {SEGMENTS[caseData.segmento_operacional] || caseData.segmento_operacional}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Complexidade</h3>
                  <p className="text-sm font-medium">
                    {COMPLEXITY_LEVELS[caseData.nivel_complexidade] || caseData.nivel_complexidade}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" /> Imóvel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imovel ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Tipo/Finalidade:
                      </span>
                      <p className="text-sm font-medium capitalize">
                        {imovel.tipo_imovel?.replace('_', ' ')} •{' '}
                        {imovel.finalidade?.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Endereço:</span>
                      <p className="text-sm">
                        {imovel.endereco_resumido || 'Não informado'}{' '}
                        {imovel.cidade && imovel.estado && ` - ${imovel.cidade}/${imovel.estado}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Matrícula:</span>
                      <p className="text-sm font-mono">
                        {imovel.matricula || imovel.matricula_numero || 'Não informada'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum imóvel vinculado a este caso.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" /> Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Prioridade:</span>
                  <div className="text-sm font-medium capitalize mt-1">
                    <Badge variant={caseData.priority === 'alta' ? 'destructive' : 'secondary'}>
                      {caseData.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Observações Gerais:
                  </span>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {caseData.observacoes || 'Nenhuma observação cadastrada.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Centro de Documentos</CardTitle>
              <CardDescription>
                Arquivos, minutas e contratos gerados e anexados a esta operação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="py-8 text-center border rounded-md bg-muted/20">
                  <p className="text-muted-foreground">Nenhum documento encontrado.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome/Tipo</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            {doc.title}
                          </TableCell>
                          <TableCell className="capitalize">{doc.type}</TableCell>
                          <TableCell>
                            {format(new Date(doc.record.created), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={pb.files.getUrl(doc.record, doc.file)}
                                target="_blank"
                                rel="noreferrer"
                                download
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
              <CardDescription>
                Acompanhe todas as mudanças de estado registradas para este caso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transitions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Nenhum evento registrado na linha do tempo.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  {transitions.map((t, index) => (
                    <div key={t.id} className="relative flex gap-4">
                      {index !== transitions.length - 1 && (
                        <div className="absolute left-[11px] top-6 h-full w-[2px] bg-border" />
                      )}
                      <div className="relative mt-1 h-6 w-6 flex-none rounded-full bg-primary/20 flex items-center justify-center border-2 border-background ring-2 ring-background z-10">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-foreground">
                          Status alterado de{' '}
                          <span className="font-bold text-primary">
                            {CASE_STATES[t.previous_state] || t.previous_state}
                          </span>{' '}
                          para{' '}
                          <span className="font-bold text-primary">
                            {CASE_STATES[t.new_state] || t.new_state}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Realizado por{' '}
                          <span className="font-medium text-foreground/80">
                            {t.expand?.user?.name || t.expand?.user?.email || 'Sistema'}
                          </span>{' '}
                          em {format(new Date(t.created), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={transitionDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTransitionDialog({ isOpen: false, targetState: null })
            setMotivoCancelamento('')
            setParecerJuridico('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {transitionDialog.targetState === 'cancelado'
                ? 'Cancelar Caso'
                : transitionDialog.targetState === 'em_preenchimento' ||
                    (transitionDialog.targetState === 'pendente_revisao_juridica' &&
                      caseData?.estado_caso === 'minuta_gerada')
                  ? 'Invalidar Minuta'
                  : transitionDialog.targetState === 'aprovado' ||
                      transitionDialog.targetState === 'aprovado_ressalvas'
                    ? 'Aprovar Caso'
                    : 'Confirmar Transição Manual'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {transitionDialog.targetState === 'cancelado' ? (
                <span className="text-destructive font-medium">
                  Esta ação é irreversível. Deseja realmente cancelar este caso?
                </span>
              ) : transitionDialog.targetState === 'em_preenchimento' ||
                (transitionDialog.targetState === 'pendente_revisao_juridica' &&
                  caseData?.estado_caso === 'minuta_gerada') ? (
                <span className="text-destructive font-medium">
                  Isto irá anular os contratos gerados e retornar o caso para{' '}
                  {CASE_STATES[transitionDialog.targetState]}. Deseja continuar?
                </span>
              ) : (
                <>
                  Tem certeza que deseja mover o caso para o estado{' '}
                  <strong>
                    {transitionDialog.targetState ? CASE_STATES[transitionDialog.targetState] : ''}
                  </strong>
                  ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {transitionDialog.targetState === 'cancelado' && (
            <div className="my-4">
              <label className="text-sm font-medium mb-2 block">Motivo do Cancelamento *</label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                placeholder="Descreva o motivo do cancelamento..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
              />
            </div>
          )}

          {(transitionDialog.targetState === 'aprovado' ||
            transitionDialog.targetState === 'aprovado_ressalvas') && (
            <div className="my-4">
              <label className="text-sm font-medium mb-2 block">Parecer Jurídico *</label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                placeholder="Descreva o parecer jurídico para aprovação..."
                value={parecerJuridico}
                onChange={(e) => setParecerJuridico(e.target.value)}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManualTransition}
              disabled={
                transitionLoading ||
                (transitionDialog.targetState === 'cancelado' && !motivoCancelamento)
              }
              className={
                transitionDialog.targetState === 'cancelado'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {transitionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {transitionDialog.targetState === 'cancelado'
                ? 'Confirmar Cancelamento'
                : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
