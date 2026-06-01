import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCase, updateCase } from '@/services/cases'
import { getPartesByCase } from '@/services/partes'
import { getImovelByCase } from '@/services/imovel'
import { getGPImoveisByCase } from '@/services/gp_imoveis'
import { getGPPessoasByCase } from '@/services/gp_pessoas'
import { getActiveExpertRequestsByCase } from '@/services/expert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
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
  FileText,
  Loader2,
  Info,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Download,
  Clock,
  MoreVertical,
  ShieldAlert,
  FileCheck,
  Lock,
  Upload,
  RotateCcw,
  Archive,
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
import { logFrictionEvent } from '@/services/friction'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import ClientCaseView from '@/pages/cases/ClientCaseView'
import CasePartes from '@/pages/cases/CasePartes'
import CaseImovel from '@/pages/cases/CaseImovel'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CASE_STATES, OPERATION_TYPES, COMPLEXITY_LEVELS, STATE_COLORS } from '@/lib/constants'
import { format } from 'date-fns'
import { generateCaseSummaryPDF } from '@/lib/export-summary'

const PIPELINE_STEPS = [
  { id: 'rascunho', label: 'Rascunho' },
  { id: 'em_qualificacao', label: 'Qualificação' },
  { id: 'em_preenchimento', label: 'Preenchimento' },
  { id: 'aguardando_documentos', label: 'Documentos' },
  { id: 'em_validacao', label: 'Validação' },
  { id: 'pendente_revisao_juridica', label: 'Rev. Jurídica' },
  { id: 'aprovado', label: 'Aprovação' },
  { id: 'minuta_gerada', label: 'Minuta Gerada' },
]

const getStepIndex = (state: string) => {
  if (state === 'aprovado_ressalvas') return 6
  return PIPELINE_STEPS.findIndex((s) => s.id === state)
}

const SEGMENTS: Record<string, string> = {
  corretor_autonomo: 'Corretor Autônomo',
  imobiliaria_pequena_media: 'Imobiliária P/M',
  imobiliaria_estruturada_premium: 'Imobiliária Premium',
  construtora_incorporadora: 'Construtora/Incorporadora',
}

export default function CaseView() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [caseData, setCaseData] = useState<any>(null)
  const [partes, setPartes] = useState<any[]>([])
  const [imovel, setImovel] = useState<any>(null)
  const [negociacao, setNegociacao] = useState<any>(null)
  const [transitions, setTransitions] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [transitionDialog, setTransitionDialog] = useState<{
    isOpen: boolean
    targetState: string | null
  }>({ isOpen: false, targetState: null })

  const [legalDecisionDialog, setLegalDecisionDialog] = useState(false)
  const [parecerJuridico, setParecerJuridico] = useState('')
  const [observacoesDialog, setObservacoesDialog] = useState('')
  const [parecerFile, setParecerFile] = useState<File | null>(null)

  const [missingRequirementsDialog, setMissingRequirementsDialog] = useState<{
    isOpen: boolean
    missingItems: {
      name: string
      type: 'upload' | 'text' | 'action' | 'qualificacao' | 'parecer'
      field?: string
      actionLabel?: string
      rootCause?: string
    }[]
    targetState: string
  }>({ isOpen: false, missingItems: [], targetState: '' })

  const [motivoCancelamento, setMotivoCancelamento] = useState('')

  const [transitionLoading, setTransitionLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState<string | null>(null)

  const [triggerAction, setTriggerAction] = useState<{ type: 'new_parte'; role: string } | null>(
    null,
  )
  const [activeTab, setActiveTab] = useState('resumo')

  const calculateLeadTime = (currentState: string) => {
    const transition = transitions.find((t) => t.new_state === currentState)
    if (transition) {
      const enteredAt = new Date(transition.created).getTime()
      const now = new Date().getTime()
      return Math.round((now - enteredAt) / 1000)
    }
    return null
  }

  const loadData = async () => {
    try {
      const [c, pLegacy, pNew, iLegacy, iNew, negs, trans, caseContracts, checklistDocs] =
        await Promise.all([
          getCase(id as string, { expand: 'responsible' }),
          getPartesByCase(id as string).catch(() => []),
          getGPPessoasByCase(id as string).catch(() => []),
          getImovelByCase(id as string).catch(() => null),
          getGPImoveisByCase(id as string).catch(() => null),
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
      setNegociacao(negs[0] || null)
      setTransitions(trans)
      setDocuments(docsList)
    } catch (err) {
      toast.error(
        'Não foi possível carregar os detalhes do caso. Verifique a conexão e tente novamente.',
      )
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
  useRealtime('analysis_reports', () => loadData())
  useRealtime('partes', () => loadData())
  useRealtime('gp_pessoas', () => loadData())
  useRealtime('gp_imoveis', () => loadData())
  useRealtime('imovel', () => loadData())

  const hasSeller = partes.some((p) => p.papel_na_operacao === 'vendedor')
  const hasBuyer = partes.some((p) => p.papel_na_operacao === 'comprador')
  const hasProperty = !!imovel

  const requireBuyer = !['autorizacao_venda', 'checklist_documental'].includes(
    caseData?.tipo_operacao || '',
  )
  const completedSteps = [hasSeller, requireBuyer ? hasBuyer : true, hasProperty].filter(
    Boolean,
  ).length

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

  const canTransition =
    user?.is_admin || user?.company === caseData?.company || user?.role === 'gestor'
  const isAdmin = user?.is_admin || user?.role === 'admin'
  const isGestor = user?.role === 'gestor' || isAdmin
  const isLocked = ['minuta_gerada', 'cancelado', 'arquivado'].includes(caseData?.estado_caso)
  const isTerminal = ['cancelado', 'arquivado', 'bloqueado'].includes(caseData?.estado_caso)

  const isGestorRequiredState = (state: string) => {
    return ['em_validacao', 'pendente_revisao_juridica'].includes(state)
  }

  const getCurrentPendencies = () => {
    if (!caseData) return []
    const p = []
    if (caseData.estado_caso === 'rascunho') {
      if (!hasSeller)
        p.push({
          name: 'Qualificação do Vendedor',
          type: 'qualificacao',
          action: 'Cadastrar Vendedor',
        })
      if (requireBuyer && !hasBuyer)
        p.push({
          name: 'Qualificação do Comprador',
          type: 'qualificacao',
          action: 'Cadastrar Comprador',
        })
      if (!hasProperty)
        p.push({ name: 'Dados do Imóvel', type: 'qualificacao', action: 'Vincular Imóvel' })
    } else if (caseData.estado_caso === 'em_preenchimento') {
      if (!caseData.documento_base)
        p.push({
          name: 'Documento Base',
          type: 'upload',
          field: 'documento_base',
          action: 'anexar o documento',
        })
    } else if (caseData.estado_caso === 'aguardando_documentos') {
      if (!caseData.contrato_assinado)
        p.push({
          name: 'Contrato Assinado',
          type: 'upload',
          field: 'contrato_assinado',
          action: 'anexar o documento',
        })
    } else if (caseData.estado_caso === 'pendente_revisao_juridica') {
      if (!caseData.parecer && !caseData.parecer_juridico_file)
        p.push({
          name: 'Parecer Jurídico',
          type: 'parecer',
          action: 'registrar o parecer jurídico',
        })
    }
    return p
  }

  const pendencies = getCurrentPendencies()
  const isPending = pendencies.length > 0

  let primaryMessage = ''
  let primaryAlertVariant: 'default' | 'destructive' | 'warning' | 'success' = 'default'

  if (isTerminal || caseData?.estado_caso === 'minuta_gerada') {
    primaryMessage = 'Fluxo concluído ou bloqueado. Nenhuma ação pendente de compliance.'
    primaryAlertVariant = 'default'
  } else if (isGestorRequiredState(caseData?.estado_caso) && !isGestor) {
    primaryMessage =
      'Ação indisponível para o seu perfil. Esta etapa pode ser concluída apenas por Gestor ou Admin.'
    primaryAlertVariant = 'warning'
  } else if (isPending) {
    if (pendencies[0].type === 'parecer') {
      primaryMessage =
        'Para continuar nesta etapa, registre o parecer jurídico. Depois disso, as ações de aprovar e bloquear serão liberadas.'
    } else {
      primaryMessage = `Falta 1 item obrigatório para avançar: ${pendencies[0].name}. Ação recomendada: ${pendencies[0].action}.`
    }
    primaryAlertVariant = 'warning'
  } else {
    if (
      [
        'rascunho',
        'em_qualificacao',
        'em_preenchimento',
        'aguardando_documentos',
        'em_validacao',
        'pendente_revisao_juridica',
        'aprovado',
        'aprovado_ressalvas',
      ].includes(caseData?.estado_caso)
    ) {
      primaryMessage = 'Compliance em dia. O caso está liberado para a próxima etapa.'
      primaryAlertVariant = 'success'
    } else {
      primaryMessage = 'Nenhuma ação pendente de compliance.'
      primaryAlertVariant = 'default'
    }
  }

  const handleFileUpload = async (field: 'documento_base' | 'contrato_assinado', file: File) => {
    setUploadLoading(field)
    try {
      const formData = new FormData()
      formData.append(field, file)
      await updateCase(id as string, formData)

      logFrictionEvent({
        user: user?.id,
        case: caseData?.id,
        event_type: 'success_resolution',
        context_data: { field, lead_time_seconds: calculateLeadTime(caseData.estado_caso) },
      })

      toast.success('Documento anexado com sucesso. O status de compliance foi atualizado.')
      loadData()
    } catch (err: any) {
      if (err.status === 400) {
        toast.error('O arquivo enviado não é suportado ou excede o tamanho limite.')
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    } finally {
      setUploadLoading(null)
    }
  }

  useEffect(() => {
    if (missingRequirementsDialog.isOpen) {
      logFrictionEvent({
        user: user?.id,
        case: caseData?.id,
        event_type: 'block_view',
        context_data: { items: missingRequirementsDialog.missingItems.map((i) => i.name) },
      })
    }
  }, [missingRequirementsDialog.isOpen, user?.id, caseData?.id])

  useEffect(() => {
    if (legalDecisionDialog) {
      logFrictionEvent({
        user: user?.id,
        case: caseData?.id,
        event_type: 'block_view',
        context_data: { source: 'legal_decision_dialog' },
      })
    }
  }, [legalDecisionDialog, user?.id, caseData?.id])

  const handleResolvePendency = (pendency: any) => {
    logFrictionEvent({
      user: user?.id,
      case: caseData?.id,
      event_type: 'correction_link_click',
      context_data: { pendency_type: pendency.type, pendency_name: pendency.name },
    })

    if (pendency.type === 'qualificacao') {
      const tab = pendency.name.includes('Imóvel') ? 'imovel' : 'partes'
      setActiveTab(tab)
      setTimeout(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' })
        if (tab === 'partes') {
          const role = pendency.name.includes('Comprador') ? 'comprador' : 'vendedor'
          setTriggerAction({ type: 'new_parte', role })
        }
      }, 100)
    } else if (pendency.type === 'parecer') {
      setLegalDecisionDialog(true)
    } else if (pendency.type === 'upload') {
      setMissingRequirementsDialog({
        isOpen: true,
        targetState: '',
        missingItems: [
          {
            name: pendency.name,
            type: 'upload',
            field: pendency.field,
            actionLabel: 'Anexar',
            rootCause:
              pendency.field === 'documento_base'
                ? 'O Documento Base é obrigatório para comprovar a existência e os termos iniciais da negociação.'
                : 'O Contrato Assinado é obrigatório para registrar o acordo firmado entre as partes antes da validação técnica e jurídica.',
          },
        ],
      })
    }
  }

  const handleAdvanceState = async () => {
    if (isPending) {
      handleResolvePendency(pendencies[0])
      return
    }

    const currentState = caseData.estado_caso
    let targetState = ''
    if (currentState === 'rascunho') targetState = 'em_qualificacao'
    else if (currentState === 'em_qualificacao') targetState = 'em_preenchimento'
    else if (currentState === 'em_preenchimento') targetState = 'aguardando_documentos'
    else if (currentState === 'aguardando_documentos') targetState = 'em_validacao'
    else if (currentState === 'em_validacao') targetState = 'pendente_revisao_juridica'
    else if (currentState === 'pendente_revisao_juridica') {
      setLegalDecisionDialog(true)
      return
    } else if (currentState === 'aprovado' || currentState === 'aprovado_ressalvas')
      targetState = 'minuta_gerada'

    if (!targetState) return

    setTransitionLoading(true)
    try {
      await updateCase(id as string, { estado_caso: targetState })
      toast.success('Compliance em dia. O caso avançou para a próxima etapa com sucesso.')
      loadData()
    } catch (err: any) {
      toast.error('Não foi possível avançar a etapa agora. Verifique a conexão e tente novamente.')
    } finally {
      setTransitionLoading(false)
    }
  }

  const handleLegalDecision = async (decision: string) => {
    setTransitionLoading(true)
    try {
      const dataToUpdate = new FormData()
      dataToUpdate.append('estado_caso', decision)
      if (parecerJuridico) dataToUpdate.append('parecer', parecerJuridico)
      if (parecerFile) dataToUpdate.append('parecer_juridico_file', parecerFile)

      if (decision === 'bloqueado') {
        dataToUpdate.append('motivo_bloqueio', observacoesDialog)
      } else {
        if (observacoesDialog) dataToUpdate.append('observacoes', observacoesDialog)
        dataToUpdate.append('data_aprovacao', new Date().toISOString())
      }

      await updateCase(id as string, dataToUpdate)

      logFrictionEvent({
        user: user?.id,
        case: caseData?.id,
        event_type: 'success_resolution',
        context_data: { decision, lead_time_seconds: calculateLeadTime(caseData.estado_caso) },
      })

      toast.success('Parecer registrado com sucesso. As ações de decisão já estão disponíveis.')
      setLegalDecisionDialog(false)
      loadData()
    } catch (err: any) {
      toast.error('Não foi possível registrar a decisão. Verifique a conexão e tente novamente.')
    } finally {
      setTransitionLoading(false)
    }
  }

  const handleManualTransition = async () => {
    if (!transitionDialog.targetState) return

    if (!canTransition && !isAdmin) {
      toast.error(
        'Ação indisponível para o seu perfil. Esta etapa pode ser concluída apenas por Gestor ou Admin.',
      )
      return
    }

    if (
      (transitionDialog.targetState === 'cancelado' ||
        transitionDialog.targetState === 'arquivado') &&
      !motivoCancelamento
    ) {
      toast.warning('Bloqueio de Regra', {
        description: `Motivo do ${transitionDialog.targetState === 'arquivado' ? 'arquivamento' : 'cancelamento'} obrigatório`,
      })
      return
    }

    const isReturn =
      caseData?.estado_caso === 'minuta_gerada' &&
      (transitionDialog.targetState === 'em_preenchimento' ||
        transitionDialog.targetState === 'pendente_revisao_juridica')
    const originalState = caseData.estado_caso

    if (isReturn) {
      setCaseData({ ...caseData, estado_caso: transitionDialog.targetState })
      setTransitionDialog({ isOpen: false, targetState: null })
      toast.info('Sincronizando estado...', { id: 'sync-toast' })
    }

    setTransitionLoading(!isReturn)
    try {
      let dataToUpdate: any = { estado_caso: transitionDialog.targetState }
      if (transitionDialog.targetState === 'cancelado')
        dataToUpdate.motivo_cancelamento = motivoCancelamento
      else if (transitionDialog.targetState === 'arquivado')
        dataToUpdate.observacoes = motivoCancelamento

      await updateCase(id as string, dataToUpdate)

      if (isReturn) toast.dismiss('sync-toast')

      if (transitionDialog.targetState === 'cancelado')
        toast.success('Caso cancelado com sucesso. Operação paralisada.')
      else if (transitionDialog.targetState === 'arquivado')
        toast.success('Caso arquivado com sucesso. Removido do fluxo ativo.')
      else toast.success(`Caso movido para ${CASE_STATES[transitionDialog.targetState]}.`)

      if (!isReturn) setTransitionDialog({ isOpen: false, targetState: null })
      setMotivoCancelamento('')
      if (!isReturn) loadData()
    } catch (err: any) {
      if (isReturn) {
        toast.dismiss('sync-toast')
        setCaseData({ ...caseData, estado_caso: originalState })
        toast.error('Falha de Sincronização', {
          description: 'Erro de sincronização. O estado foi revertido.',
        })
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
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
      toast.error('Não foi possível concluir agora. Tente novamente.')
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
  const currentIndex = getStepIndex(caseData.estado_caso)

  const hasParecerText = parecerJuridico.trim().length > 0
  const hasParecerValid = hasParecerText || !!parecerFile

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
            Central Operacional (Hub)
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
          {isAdmin && !isTerminal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Cancelar/Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Caso / Excluir</AlertDialogTitle>
                  <AlertDialogDescription>
                    O cancelamento paralisa a operação mantendo o histórico. A exclusão remove os
                    dados de forma permanente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => setTransitionDialog({ isOpen: true, targetState: 'cancelado' })}
                    className="bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Confirmar Cancelamento
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        const linkedNegs = await pb
                          .collection('gp_negociacoes')
                          .getFullList({ filter: `case_id="${id}"` })
                        for (const neg of linkedNegs)
                          await pb.collection('gp_negociacoes').delete(neg.id)
                        await pb.collection('cases').delete(id as string)
                        toast.success('Excluído com sucesso!')
                        window.location.href = '/casos'
                      } catch (e: any) {
                        toast.error('Não foi possível concluir agora. Tente novamente.')
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {!isLocked && canTransition && (
            <Button asChild>
              <Link to={`/casos/${id}/editar`}>
                <Edit className="mr-2 h-4 w-4" /> Editar Dados
              </Link>
            </Button>
          )}
          {isLocked && (
            <Button variant="secondary" disabled className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Dados Trancados
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
                {isAdmin &&
                  [
                    'rascunho',
                    'em_qualificacao',
                    'em_preenchimento',
                    'aguardando_documentos',
                    'em_validacao',
                    'pendente_revisao_juridica',
                  ].includes(caseData.estado_caso) && (
                    <DropdownMenuItem
                      onClick={() =>
                        setTransitionDialog({ isOpen: true, targetState: 'cancelado' })
                      }
                    >
                      <AlertCircle className="w-4 h-4 mr-2 text-destructive" />{' '}
                      <span className="text-destructive">Cancelar Caso</span>
                    </DropdownMenuItem>
                  )}
                {isAdmin &&
                  ['aprovado', 'bloqueado', 'minuta_gerada'].includes(caseData.estado_caso) && (
                    <DropdownMenuItem
                      onClick={() =>
                        setTransitionDialog({ isOpen: true, targetState: 'arquivado' })
                      }
                    >
                      <Archive className="w-4 h-4 mr-2 text-amber-600" />{' '}
                      <span className="text-amber-600">Arquivar Caso</span>
                    </DropdownMenuItem>
                  )}
                {caseData.estado_caso === 'minuta_gerada' && isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        setTransitionDialog({ isOpen: true, targetState: 'em_preenchimento' })
                      }
                    >
                      <RotateCcw className="w-4 h-4 mr-2 text-destructive" />{' '}
                      <span className="text-destructive">Retornar p/ Preenchimento</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setTransitionDialog({
                          isOpen: true,
                          targetState: 'pendente_revisao_juridica',
                        })
                      }
                    >
                      <RotateCcw className="w-4 h-4 mr-2 text-destructive" />{' '}
                      <span className="text-destructive">Retornar p/ Revisão</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Visual Progress Stepper - Linear Pipeline */}
      <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto px-4 py-8 overflow-x-auto mb-2">
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-10 rounded-full">
          <div
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              isTerminal ? 'bg-red-400' : 'bg-primary',
            )}
            style={{
              width: `${Math.max(0, Math.min(100, (currentIndex / (PIPELINE_STEPS.length - 1)) * 100))}%`,
            }}
          />
        </div>
        {PIPELINE_STEPS.map((s, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 relative z-10 w-20">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-4 transition-all duration-300 ring-2 ring-white',
                  isCompleted
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : isCurrent && !isTerminal
                      ? 'bg-background text-primary border-primary shadow-md scale-125 ring-primary/20'
                      : isCurrent && isTerminal
                        ? 'bg-red-100 text-red-600 border-red-500 shadow-md scale-125 ring-red-500/20'
                        : 'bg-slate-100 text-slate-400 border-slate-200',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isTerminal && isCurrent ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-semibold tracking-tight text-center leading-tight',
                  isCurrent && !isTerminal
                    ? 'text-primary'
                    : isCurrent && isTerminal
                      ? 'text-red-600'
                      : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400',
                )}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Case Central Hierarchy (Top Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Block 1 (Case State) */}
        <Card className="flex flex-col bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-2 pt-4 px-4 border-b bg-slate-50/50">
            <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              1. Estado do Caso
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'w-fit text-sm px-2.5 py-0.5 border-transparent shadow-sm',
                STATE_COLORS[caseData.estado_caso],
              )}
            >
              {CASE_STATES[caseData.estado_caso] || caseData.estado_caso}
            </Badge>
            <div className="text-sm text-slate-600 mt-2">
              <span className="block text-xs text-slate-400 mb-0.5">Responsável</span>
              <span className="font-medium truncate block max-w-full">
                {caseData.expand?.responsible?.name ||
                  caseData.expand?.responsible?.email ||
                  'Não atribuído'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Block 2 (Primary Pendency) */}
        <Card className="lg:col-span-2 flex flex-col bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-2 pt-4 px-4 border-b bg-slate-50/50 flex flex-row items-center gap-2 space-y-0">
            <AlertCircle
              className={cn(
                'w-4 h-4',
                primaryAlertVariant === 'success'
                  ? 'text-emerald-500'
                  : primaryAlertVariant === 'warning'
                    ? 'text-amber-500'
                    : 'text-slate-400',
              )}
            />
            <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              2. Pendência Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex items-center">
            <p
              className={cn(
                'text-[15px] font-medium leading-relaxed',
                primaryAlertVariant === 'success'
                  ? 'text-emerald-700'
                  : primaryAlertVariant === 'warning'
                    ? 'text-amber-700'
                    : 'text-slate-600',
              )}
            >
              {primaryMessage}
            </p>
          </CardContent>
        </Card>

        {/* Block 3 (Compliance Checklist) */}
        <Card className="lg:col-span-2 flex flex-col bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-2 pt-4 px-4 border-b bg-slate-50/50">
            <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              3. Checklist de Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] font-medium text-slate-700">
            <div className="flex items-center gap-2">
              {hasSeller && (!requireBuyer || hasBuyer) && hasProperty ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-400 ml-1 mr-1 shrink-0" />
              )}
              <span className="truncate">Partes & Imóvel</span>
            </div>
            <div className="flex items-center gap-2">
              {caseData.documento_base ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-400 ml-1 mr-1 shrink-0" />
              )}
              <span className="truncate">Documento Base</span>
            </div>
            <div className="flex items-center gap-2">
              {caseData.contrato_assinado ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-400 ml-1 mr-1 shrink-0" />
              )}
              <span className="truncate">Contrato Assinado</span>
            </div>
            <div className="flex items-center gap-2">
              {caseData.parecer || caseData.parecer_juridico_file ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-400 ml-1 mr-1 shrink-0" />
              )}
              <span className="truncate">Parecer Jurídico</span>
            </div>
          </CardContent>
        </Card>

        {/* Block 4 (Primary CTA) */}
        <Card className="flex flex-col bg-slate-50 shadow-sm border-slate-200 justify-center items-center p-6">
          <div className="w-full max-w-xs flex flex-col gap-3">
            {isPending && pendencies[0] ? (
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold"
                onClick={() => handleResolvePendency(pendencies[0])}
              >
                Resolver pendência
              </Button>
            ) : !isTerminal ? (
              <div
                className="w-full"
                onClickCapture={() => {
                  if (
                    !canTransition ||
                    (isGestorRequiredState(caseData.estado_caso) && !isGestor)
                  ) {
                    logFrictionEvent({
                      user: user?.id,
                      case: caseData?.id,
                      event_type: 'invalid_attempt',
                      context_data: {
                        reason: 'permission_denied',
                        role: user?.role,
                        state: caseData.estado_caso,
                      },
                    })
                    if (isGestorRequiredState(caseData.estado_caso) && !isGestor) {
                      toast.error(
                        'Ação indisponível para o seu perfil. Esta etapa pode ser concluída apenas por Gestor ou Admin.',
                      )
                    }
                  }
                }}
              >
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
                  disabled={
                    !canTransition ||
                    (isGestorRequiredState(caseData.estado_caso) && !isGestor) ||
                    transitionLoading
                  }
                  onClick={handleAdvanceState}
                >
                  {transitionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isGestorRequiredState(caseData.estado_caso) && !isGestor && (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Seguir etapa
                </Button>
              </div>
            ) : (
              <Button className="w-full" variant="secondary" disabled>
                Fluxo concluído
              </Button>
            )}

            {!isTerminal && (
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={() => {
                  setActiveTab('resumo')
                  setTimeout(() => window.scrollTo({ top: 500, behavior: 'smooth' }), 100)
                }}
              >
                Ver Requisitos
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex-wrap w-full justify-start h-auto">
          <TabsTrigger value="resumo">Resumo do Caso & Compliance</TabsTrigger>
          <TabsTrigger value="partes">Partes Envolvidas</TabsTrigger>
          <TabsTrigger value="imovel">Imóvel</TabsTrigger>
          <TabsTrigger value="documentos">Documentos Anexos</TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            {['aprovado', 'aprovado_ressalvas', 'minuta_gerada'].includes(caseData.estado_caso) && (
              <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Compliance Concluído</AlertTitle>
                <AlertDescription className="mt-1 font-medium">
                  Caso liberado: nenhum item pendente no compliance.
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-4 bg-muted/20 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" /> Checklist Unificado de Compliance
                </CardTitle>
                <CardDescription>
                  Acompanhe e resolva todos os requisitos obrigatórios, documentos e validações
                  necessárias para a conclusão do caso.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-t-0">
                  {/* Qualificação */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {hasSeller && (!requireBuyer || hasBuyer) ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Qualificação das Partes</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            Obrigatório
                          </Badge>
                          <span className="text-xs text-muted-foreground">Resp: Operador</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {requireBuyer
                            ? 'Vendedor e Comprador (Obrigatório no Rascunho)'
                            : 'Vendedor (Obrigatório no Rascunho)'}
                        </p>
                      </div>
                    </div>
                    {!hasSeller || (requireBuyer && !hasBuyer) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveTab('partes')
                          setTimeout(() => {
                            window.scrollTo({ top: 500, behavior: 'smooth' })
                            const role = !hasSeller ? 'vendedor' : 'comprador'
                            setTriggerAction({ type: 'new_parte', role })
                          }, 100)
                        }}
                      >
                        {requireBuyer && hasSeller && !hasBuyer
                          ? 'Cadastrar Comprador'
                          : 'Cadastrar Vendedor'}
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                        Validado
                      </Badge>
                    )}
                  </div>

                  {/* Imóvel */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {hasProperty ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Dados do Imóvel</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            Obrigatório
                          </Badge>
                          <span className="text-xs text-muted-foreground">Resp: Operador</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vinculação do imóvel objeto (Obrigatório no Rascunho)
                        </p>
                      </div>
                    </div>
                    {!hasProperty ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveTab('imovel')
                          setTimeout(() => window.scrollTo({ top: 500, behavior: 'smooth' }), 100)
                        }}
                      >
                        Vincular Imóvel
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                        Validado
                      </Badge>
                    )}
                  </div>

                  {/* Documento Base */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {caseData.documento_base ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Documento Base</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            Obrigatório
                          </Badge>
                          <span className="text-xs text-muted-foreground">Resp: Operador</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exigido para avançar de Preenchimento para Documentos
                        </p>
                      </div>
                    </div>
                    {caseData.documento_base ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                          Anexado
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={pb.files.getUrl(caseData, caseData.documento_base)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ) : !isLocked ? (
                      <div className="relative">
                        <Input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onClick={() => {
                            logFrictionEvent({
                              user: user?.id,
                              case: caseData?.id,
                              event_type: 'correction_link_click',
                              context_data: { source: 'checklist_upload', field: 'documento_base' },
                            })
                          }}
                          onChange={(e) =>
                            e.target.files && handleFileUpload('documento_base', e.target.files[0])
                          }
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          {uploadLoading === 'documento_base' ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3 mr-2" />
                          )}{' '}
                          Fazer Upload
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        <Lock className="w-3 h-3 inline mr-1" /> Trancado
                      </span>
                    )}
                  </div>

                  {/* Contrato Assinado */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {caseData.contrato_assinado ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Contrato Assinado</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            Obrigatório
                          </Badge>
                          <span className="text-xs text-muted-foreground">Resp: Operador</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exigido para enviar para Validação Técnica
                        </p>
                      </div>
                    </div>
                    {caseData.contrato_assinado ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                          Anexado
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={pb.files.getUrl(caseData, caseData.contrato_assinado)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ) : !isLocked ? (
                      <div className="relative">
                        <Input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onClick={() => {
                            logFrictionEvent({
                              user: user?.id,
                              case: caseData?.id,
                              event_type: 'correction_link_click',
                              context_data: {
                                source: 'checklist_upload',
                                field: 'contrato_assinado',
                              },
                            })
                          }}
                          onChange={(e) =>
                            e.target.files &&
                            handleFileUpload('contrato_assinado', e.target.files[0])
                          }
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          {uploadLoading === 'contrato_assinado' ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3 mr-2" />
                          )}{' '}
                          Fazer Upload
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        <Lock className="w-3 h-3 inline mr-1" /> Trancado
                      </span>
                    )}
                  </div>

                  {/* Parecer Jurídico */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors rounded-b-lg">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {caseData.parecer || caseData.parecer_juridico_file ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Parecer Jurídico</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            Obrigatório
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Resp: Gestor Jurídico
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exigido para aprovação do caso (Gestor/Admin)
                        </p>
                      </div>
                    </div>
                    {caseData.parecer || caseData.parecer_juridico_file ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                          Registrado
                        </Badge>
                        {caseData.parecer_juridico_file && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={pb.files.getUrl(caseData, caseData.parecer_juridico_file)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : caseData.estado_caso === 'pendente_revisao_juridica' ? (
                      isGestor ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLegalDecisionDialog(true)}
                        >
                          Emitir Parecer
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium text-amber-600">
                          Ação restrita ao Gestor
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Pendente liberação da etapa
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {(caseData.parecer || caseData.parecer_juridico_file) && (
              <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Parecer Jurídico Registrado e Anexos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {caseData.parecer && (
                    <div className="mb-4">
                      <p className="text-sm text-emerald-950 whitespace-pre-wrap">
                        {caseData.parecer}
                      </p>
                    </div>
                  )}
                  {caseData.parecer_juridico_file && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={pb.files.getUrl(caseData, caseData.parecer_juridico_file)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="h-4 w-4 mr-2" /> Baixar Parecer Anexo
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

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
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Responsável Operacional
                  </h3>
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
        </TabsContent>

        <TabsContent value="partes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Partes</CardTitle>
              <CardDescription>
                Gerencie os compradores, vendedores e outras partes envolvidas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CasePartes
                caseId={id as string}
                tipoOperacao={caseData.tipo_operacao}
                triggerAction={triggerAction}
                onActionConsumed={() => setTriggerAction(null)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imovel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão do Imóvel</CardTitle>
              <CardDescription>Detalhes do imóvel objeto desta negociação.</CardDescription>
            </CardHeader>
            <CardContent>
              <CaseImovel caseId={id as string} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Centro de Documentos (Checklist e Minutas)</CardTitle>
              <CardDescription>
                Arquivos, minutas e contratos gerados e anexados a esta operação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="py-8 text-center border rounded-md bg-muted/20">
                  <p className="text-muted-foreground">Caso ainda sem documentos obrigatórios.</p>
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
                            <FileText className="w-4 h-4 text-muted-foreground" /> {doc.title}
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
        open={missingRequirementsDialog.isOpen}
        onOpenChange={(o) =>
          !o && setMissingRequirementsDialog((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" /> Pendência de Compliance
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700">
              Não é possível avançar a operação devido a itens obrigatórios ausentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            {missingRequirementsDialog.missingItems.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col p-4 border border-amber-200 rounded-md bg-amber-50 gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-900">{item.name}</span>
                </div>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>
                    <strong>Causa Raiz:</strong>{' '}
                    {item.rootCause || 'Item obrigatório não preenchido ou não anexado.'}
                  </p>
                  <p>
                    <strong>Impacto:</strong> O fluxo permanecerá travado nesta etapa até a
                    resolução.
                  </p>
                </div>
                {item.type === 'upload' && item.field && (
                  <div className="relative mt-2">
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onClick={() => {
                        logFrictionEvent({
                          user: user?.id,
                          case: caseData?.id,
                          event_type: 'correction_link_click',
                          context_data: { source: 'modal_upload_button', field: item.field },
                        })
                      }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(item.field as any, e.target.files[0]).then(() => {
                            setMissingRequirementsDialog((prev) => ({ ...prev, isOpen: false }))
                          })
                        }
                      }}
                    />
                    <Button
                      variant="default"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm pointer-events-none"
                    >
                      {uploadLoading === item.field ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}{' '}
                      Corrigir Agora ({item.actionLabel})
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={transitionDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTransitionDialog({ isOpen: false, targetState: null })
            setMotivoCancelamento('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {transitionDialog.targetState === 'cancelado'
                ? 'Cancelar Caso'
                : transitionDialog.targetState === 'arquivado'
                  ? 'Arquivar Caso'
                  : transitionDialog.targetState === 'em_preenchimento' ||
                      transitionDialog.targetState === 'pendente_revisao_juridica'
                    ? 'Invalidar Minuta / Retornar'
                    : 'Confirmar Transição'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {transitionDialog.targetState === 'cancelado' ? (
                <span className="text-destructive font-medium">
                  Esta ação é irreversível e paralisa a operação.
                </span>
              ) : transitionDialog.targetState === 'arquivado' ? (
                <span className="text-amber-600 font-medium">
                  Isto irá arquivar o caso. Você poderá consultá-lo, mas ele sairá do fluxo ativo.
                </span>
              ) : transitionDialog.targetState === 'em_preenchimento' ||
                transitionDialog.targetState === 'pendente_revisao_juridica' ? (
                <span className="text-destructive font-medium">
                  Isto irá anular minutas trancadas e retornar o caso para{' '}
                  {CASE_STATES[transitionDialog.targetState]}. Continuar?
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

          {(transitionDialog.targetState === 'cancelado' ||
            transitionDialog.targetState === 'arquivado') && (
            <div className="my-4">
              <label className="text-sm font-medium mb-2 block text-foreground">
                Motivo do{' '}
                {transitionDialog.targetState === 'arquivado' ? 'Arquivamento' : 'Cancelamento'} *
              </label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                placeholder={`Descreva o motivo do ${transitionDialog.targetState === 'arquivado' ? 'arquivamento' : 'cancelamento'}...`}
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManualTransition}
              disabled={transitionLoading}
              className={cn(
                transitionDialog.targetState === 'cancelado'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : transitionDialog.targetState === 'arquivado'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : '',
                transitionLoading ? 'pointer-events-none opacity-50' : '',
              )}
            >
              {transitionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={legalDecisionDialog}
        onOpenChange={(open) => {
          if (!open) {
            setLegalDecisionDialog(false)
            setParecerJuridico('')
            setObservacoesDialog('')
            setParecerFile(null)
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
          <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" /> Decisão Jurídica e Compliance
            </DialogTitle>
            <DialogDescription>
              Analise o contexto operacional e emita seu parecer para liberar ou bloquear a
              operação.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex overflow-hidden">
            {/* Context Area */}
            <div className="w-2/3 p-6 overflow-y-auto border-r bg-white space-y-6">
              <div>
                <h3 className="font-semibold text-lg border-b pb-2 mb-3 text-slate-800">
                  Contexto da Operação
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Tipo</span>{' '}
                    <span className="font-medium">
                      {(caseData && OPERATION_TYPES[caseData.tipo_operacao]) ||
                        caseData?.tipo_operacao}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Complexidade</span>{' '}
                    <span className="font-medium">
                      {(caseData && COMPLEXITY_LEVELS[caseData.nivel_complexidade]) ||
                        caseData?.nivel_complexidade}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-xs">Responsável</span>{' '}
                    <span className="font-medium">
                      {caseData?.expand?.responsible?.name || caseData?.expand?.responsible?.email}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg border-b pb-2 mb-3 text-slate-800">
                  Evidências e Anexos
                </h3>
                <div className="space-y-2">
                  {caseData?.documento_base ? (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-sm">Documento Base</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={pb.files.getUrl(caseData, caseData.documento_base)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visualizar
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-md text-sm text-muted-foreground text-center">
                      Documento Base não anexado
                    </div>
                  )}

                  {caseData?.contrato_assinado ? (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-sm">Contrato Assinado</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={pb.files.getUrl(caseData, caseData.contrato_assinado)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visualizar
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-md text-sm text-muted-foreground text-center">
                      Contrato Assinado não anexado
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Area */}
            <div className="w-1/3 p-6 overflow-y-auto bg-slate-50 flex flex-col">
              <h3 className="font-semibold text-lg border-b pb-2 mb-4 text-slate-800">
                Registro do Parecer
              </h3>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-700">
                    Parecer Jurídico (Texto) *
                  </label>
                  <textarea
                    className="w-full min-h-[120px] p-3 rounded-md border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="Descreva a fundamentação da sua decisão..."
                    value={parecerJuridico}
                    onChange={(e) => setParecerJuridico(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-700">
                    Anexo Complementar (Opcional)
                  </label>
                  <input
                    type="file"
                    id="parecer-file-modal"
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                    onChange={(e) => setParecerFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-700">
                    Ressalvas ou Motivo de Bloqueio
                  </label>
                  <textarea
                    className="w-full min-h-[80px] p-3 rounded-md border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="Obrigatório para Aprovar com Ressalvas ou Bloquear..."
                    value={observacoesDialog}
                    onChange={(e) => setObservacoesDialog(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2 pt-4 border-t">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={transitionLoading || !hasParecerValid}
                  onClick={() => handleLegalDecision('aprovado')}
                >
                  Aprovar Operação
                </Button>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={transitionLoading || !hasParecerValid || !observacoesDialog.trim()}
                  onClick={() => handleLegalDecision('aprovado_ressalvas')}
                >
                  Aprovar com Ressalvas
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={transitionLoading || !hasParecerValid || !observacoesDialog.trim()}
                  onClick={() => handleLegalDecision('bloqueado')}
                >
                  Bloquear Operação
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
