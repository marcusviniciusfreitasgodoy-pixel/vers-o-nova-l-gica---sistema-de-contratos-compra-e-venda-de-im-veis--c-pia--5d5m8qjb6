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
  MapPin,
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
  }>({ isOpen: false, targetState: null })

  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [parecerJuridico, setParecerJuridico] = useState('')
  const [observacoesDialog, setObservacoesDialog] = useState('')

  const [transitionLoading, setTransitionLoading] = useState(false)
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

  const canTransition =
    user?.is_admin || user?.company === caseData?.company || user?.role === 'gestor'
  const isAdmin = user?.is_admin || user?.role === 'admin'
  const isGestor = user?.role === 'gestor' || isAdmin
  const isOperador = user?.role === 'operador' || user?.role === 'cliente' || isGestor
  const isLocked = ['minuta_gerada', 'cancelado', 'arquivado'].includes(caseData?.estado_caso)

  const handleFileUpload = async (field: 'documento_base' | 'contrato_assinado', file: File) => {
    try {
      const formData = new FormData()
      formData.append(field, file)
      await updateCase(id as string, formData)
      toast.success('Documento anexado com sucesso!')
      loadData()
    } catch (err) {
      toast.error('Não foi possível concluir agora. Tente novamente.')
    }
  }

  const transitionTo = async (targetState: string) => {
    const originalState = caseData?.estado_caso

    setTransitionLoading(true)
    try {
      await updateCase(id as string, { estado_caso: targetState })
      toast.success('Sucesso', { description: 'Transição realizada com sucesso.' })
      loadData()
      return true
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Você não tem permissão para executar esta ação.', {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        })
      } else if (err.status === 400) {
        const errors = extractFieldErrors(err)
        const msg = Object.values(errors)[0] || 'Regra de negócio não atendida'
        toast.warning('Bloqueio de Regra', {
          description: msg,
          icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
        })
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
      return false
    } finally {
      setTransitionLoading(false)
    }
  }

  const getPendingActionInfo = (c: any) => {
    switch (c.estado_caso) {
      case 'rascunho':
        return {
          missing: 'Qualificação inicial incompleta',
          blockedBy: 'Aguardando cadastro de partes e imóvel',
          authorized: 'Operador, Gestor, Admin',
          nextStep: 'Completar dados e aguardar auto-avanço',
        }
      case 'em_qualificacao':
        return {
          missing: 'Dados do negócio e minutas',
          blockedBy: 'Aguardando preenchimento',
          authorized: 'Operador, Gestor, Admin',
          nextStep: 'Avançar para Preenchimento',
        }
      case 'em_preenchimento':
        return {
          missing: 'Documento Base (Anexo)',
          blockedBy: !c.documento_base
            ? 'Falta upload do documento base'
            : 'Aguardando transição manual',
          authorized: 'Operador, Gestor, Admin',
          nextStep: 'Avançar para Aguardando Documentos',
        }
      case 'aguardando_documentos':
        return {
          missing: 'Contrato Assinado (Anexo)',
          blockedBy: !c.contrato_assinado
            ? 'Falta upload do contrato assinado'
            : 'Aguardando envio para validação',
          authorized: 'Operador, Gestor, Admin',
          nextStep: 'Enviar para Validação Técnica',
        }
      case 'em_validacao':
        return {
          missing: 'Validação técnica',
          blockedBy: 'Aguardando revisão do Gestor',
          authorized: 'Gestor, Admin',
          nextStep: 'Solicitar Revisão Jurídica',
        }
      case 'pendente_revisao_juridica':
        return {
          missing: 'Parecer Jurídico',
          blockedBy:
            !c.parecer && !c.parecer_juridico_file
              ? 'Falta emissão e anexo de parecer'
              : 'Aguardando decisão jurídica',
          authorized: 'Gestor, Admin',
          nextStep: 'Aprovar, Aprovar com Ressalvas ou Bloquear',
        }
      case 'aprovado':
      case 'aprovado_ressalvas':
        return {
          missing: 'Geração de Minuta Final',
          blockedBy: 'Aguardando emissão',
          authorized: 'Operador, Gestor, Admin',
          nextStep: 'Gerar Minuta no painel de contrato',
        }
      case 'bloqueado':
        return {
          missing: 'Resolução de pendências jurídicas',
          blockedBy: c.motivo_bloqueio || 'Bloqueado pelo jurídico',
          authorized: 'Admin',
          nextStep: 'Arquivar Caso',
        }
      case 'minuta_gerada':
        return {
          missing: 'Nenhuma (Fluxo Concluído)',
          blockedBy: 'Caso travado e finalizado',
          authorized: 'Admin',
          nextStep: 'Arquivar Caso ou Retornar para ajuste',
        }
      default:
        return { missing: '-', blockedBy: '-', authorized: '-', nextStep: '-' }
    }
  }

  let smartAction: {
    label: string
    action: () => void
    disabled?: boolean
    tooltip?: string
  } | null = null
  if (caseData) {
    switch (caseData.estado_caso) {
      case 'rascunho':
        if (isOperador)
          smartAction = {
            label: 'Iniciar Qualificação',
            action: () => transitionTo('em_qualificacao'),
          }
        break
      case 'em_qualificacao':
        if (isOperador)
          smartAction = {
            label: 'Avançar para Preenchimento',
            action: () => transitionTo('em_preenchimento'),
          }
        break
      case 'em_preenchimento':
        if (isOperador) {
          const disabled = !caseData.documento_base
          smartAction = {
            label: 'Aguardar Documentos',
            action: () => transitionTo('aguardando_documentos'),
            disabled,
            tooltip: disabled ? 'Anexe o documento base para continuar.' : '',
          }
        }
        break
      case 'aguardando_documentos':
        if (isOperador) {
          const disabled = !caseData.contrato_assinado
          smartAction = {
            label: 'Enviar para Validação',
            action: () => transitionTo('em_validacao'),
            disabled,
            tooltip: disabled ? 'Anexe o contrato assinado para continuar.' : '',
          }
        }
        break
      case 'em_validacao':
        if (isGestor) {
          smartAction = {
            label: 'Solicitar Revisão',
            action: () => transitionTo('pendente_revisao_juridica'),
          }
        } else {
          smartAction = {
            label: 'Em Validação',
            action: () => {},
            disabled: true,
            tooltip: 'Somente Gestores podem enviar para revisão.',
          }
        }
        break
      case 'pendente_revisao_juridica':
        if (isGestor) {
          smartAction = {
            label: 'Aprovar / Decidir Caso',
            action: () => setTransitionDialog({ isOpen: true, targetState: 'aprovado' }),
          }
        } else {
          smartAction = { label: 'Aguardando Revisão', action: () => {}, disabled: true }
        }
        break
      case 'aprovado':
      case 'aprovado_ressalvas':
        if (isGestor)
          smartAction = { label: 'Gerar Minuta', action: () => transitionTo('minuta_gerada') }
        break
      case 'minuta_gerada':
      case 'bloqueado':
        if (isAdmin)
          smartAction = {
            label: 'Arquivar Caso',
            action: () => setTransitionDialog({ isOpen: true, targetState: 'arquivado' }),
          }
        break
    }
  }

  const handleManualTransition = async () => {
    if (!transitionDialog.targetState) return

    if (transitionDialog.targetState === 'cancelado' && !motivoCancelamento) {
      toast.warning('Bloqueio de Regra', { description: 'Regra de cancelamento' })
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
      toast.info('Sincronizando estado...', {
        id: 'sync-toast',
      })
    }

    setTransitionLoading(!isReturn)
    try {
      let dataToUpdate: any = { estado_caso: transitionDialog.targetState }

      if (transitionDialog.targetState === 'cancelado')
        dataToUpdate.motivo_cancelamento = motivoCancelamento

      if (
        ['aprovado', 'aprovado_ressalvas', 'bloqueado'].includes(transitionDialog.targetState) &&
        caseData.estado_caso === 'pendente_revisao_juridica'
      ) {
        const fileInput = document.getElementById('parecer-file') as HTMLInputElement
        const hasFile = fileInput && fileInput.files && fileInput.files[0]

        if (!parecerJuridico && !hasFile) {
          toast.warning('Bloqueio de Regra', {
            description: 'Anexe ou escreva o parecer jurídico para continuar.',
          })
          if (isReturn) {
            toast.dismiss('sync-toast')
            setCaseData({ ...caseData, estado_caso: originalState })
          }
          setTransitionLoading(false)
          return
        }

        dataToUpdate = new FormData()
        dataToUpdate.append('estado_caso', transitionDialog.targetState)
        if (parecerJuridico) dataToUpdate.append('parecer', parecerJuridico)
        if (hasFile) dataToUpdate.append('parecer_juridico_file', fileInput.files![0])

        if (
          transitionDialog.targetState === 'aprovado_ressalvas' ||
          transitionDialog.targetState === 'bloqueado'
        ) {
          if (!observacoesDialog) {
            toast.warning('Bloqueio de Regra', {
              description: 'Ressalvas ou Motivo de bloqueio são obrigatórios.',
            })
            if (isReturn) setCaseData({ ...caseData, estado_caso: originalState })
            setTransitionLoading(false)
            return
          }
          if (transitionDialog.targetState === 'bloqueado')
            dataToUpdate.append('motivo_bloqueio', observacoesDialog)
          else dataToUpdate.append('observacoes', observacoesDialog)
        }

        if (
          transitionDialog.targetState === 'aprovado' ||
          transitionDialog.targetState === 'aprovado_ressalvas'
        ) {
          dataToUpdate.append('data_aprovacao', new Date().toISOString())
        }
      }

      await updateCase(id as string, dataToUpdate)

      if (isReturn) toast.dismiss('sync-toast')

      if (['aprovado', 'aprovado_ressalvas'].includes(transitionDialog.targetState as string)) {
        toast.success('Parecer registrado com sucesso.')
      } else if (transitionDialog.targetState === 'bloqueado') {
        toast.success('Caso bloqueado com sucesso.')
      } else if (transitionDialog.targetState === 'cancelado') {
        toast.success('Caso cancelado com sucesso.')
      } else if (transitionDialog.targetState === 'arquivado') {
        toast.success('Caso arquivado com sucesso.')
      } else {
        toast.success('Transição de estado realizada com sucesso.')
      }

      if (!isReturn) setTransitionDialog({ isOpen: false, targetState: null })
      setMotivoCancelamento('')
      setParecerJuridico('')
      setObservacoesDialog('')
      if (!isReturn) loadData()
    } catch (err: any) {
      if (isReturn) {
        toast.dismiss('sync-toast')
        setCaseData({ ...caseData, estado_caso: originalState })
        toast.error('Falha de Sincronização', {
          description: 'Erro de sincronização. O estado foi revertido.',
        })
      } else {
        if (err.status === 403)
          toast.error('Você não tem permissão para executar esta ação.', {
            icon: <ShieldAlert className="h-4 w-4" />,
          })
        else if (err.status === 400) {
          const errors = extractFieldErrors(err)
          toast.warning('Bloqueio de Regra', {
            description: Object.values(errors)[0] || 'Regra não atendida',
            icon: <ShieldAlert className="h-4 w-4" />,
          })
        } else toast.error('Não foi possível concluir agora. Tente novamente.')
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
  const isTerminal = ['cancelado', 'arquivado', 'bloqueado'].includes(caseData.estado_caso)
  const pendingInfo = getPendingActionInfo(caseData)

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
        </div>
      </div>

      <div className="mb-6 space-y-4">
        {/* Visual Progress Stepper - Linear Pipeline */}
        <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto px-4 py-8 overflow-x-auto">
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
            const isUpcoming = index > currentIndex
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

        {/* Status and Smart Action Banner */}
        <Card
          className={cn('shadow-sm transition-colors duration-300 bg-muted/10 border-primary/10')}
        >
          <CardContent className="p-4 sm:p-6 flex flex-col items-start gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Status Atual (Gravação)
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
                {smartAction && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            onClick={smartAction.action}
                            disabled={smartAction.disabled || transitionLoading}
                            className={cn(
                              'w-full sm:w-auto shadow-md transition-all',
                              smartAction.disabled
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary',
                            )}
                            size="lg"
                          >
                            {transitionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {smartAction.label}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {smartAction.tooltip && (
                        <TooltipContent>
                          <p>{smartAction.tooltip}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
                        ['aprovado', 'bloqueado', 'minuta_gerada'].includes(
                          caseData.estado_caso,
                        ) && (
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
                      {caseData.estado_caso === 'pendente_revisao_juridica' && isGestor && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              setTransitionDialog({
                                isOpen: true,
                                targetState: 'aprovado_ressalvas',
                              })
                            }
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2 text-amber-500" /> Aprovar com
                            Ressalvas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setTransitionDialog({ isOpen: true, targetState: 'bloqueado' })
                            }
                          >
                            <AlertCircle className="w-4 h-4 mr-2 text-destructive" /> Bloquear Caso
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions Panel */}
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Painel de Ação e Pendências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md border border-blue-100">
                <p className="text-[10px] text-blue-600/70 font-semibold uppercase mb-1">
                  O que falta
                </p>
                <p className="text-sm font-medium text-blue-950">{pendingInfo.missing}</p>
              </div>
              <div className="bg-white p-3 rounded-md border border-blue-100">
                <p className="text-[10px] text-blue-600/70 font-semibold uppercase mb-1">
                  Status / Bloqueio
                </p>
                <p className="text-sm font-medium text-blue-950">{pendingInfo.blockedBy}</p>
              </div>
              <div className="bg-white p-3 rounded-md border border-blue-100">
                <p className="text-[10px] text-blue-600/70 font-semibold uppercase mb-1">
                  Quem atua
                </p>
                <p className="text-sm font-medium text-blue-950">{pendingInfo.authorized}</p>
              </div>
              <div className="bg-white p-3 rounded-md border border-blue-100 bg-blue-600 text-white">
                <p className="text-[10px] text-blue-200 font-semibold uppercase mb-1">
                  Recomendação
                </p>
                <p className="text-sm font-medium text-white">{pendingInfo.nextStep}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="mb-4 flex-wrap w-full justify-start h-auto">
          <TabsTrigger value="resumo">Resumo do Caso</TabsTrigger>
          <TabsTrigger value="documentos">Documentos Anexos</TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Qualificação Base
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    {progressPercentage}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2 mt-2" />
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center space-x-3 w-max">
                  <Checkbox
                    id="check-seller"
                    checked={hasSeller}
                    disabled
                    className="data-[state=checked]:bg-primary"
                  />
                  <label
                    className={cn(
                      'text-sm font-medium leading-none',
                      hasSeller && 'line-through text-muted-foreground',
                    )}
                  >
                    Cadastrar Vendedor
                  </label>
                </div>
                <div className="flex items-center space-x-3 w-max">
                  <Checkbox
                    id="check-buyer"
                    checked={hasBuyer}
                    disabled
                    className="data-[state=checked]:bg-primary"
                  />
                  <label
                    className={cn(
                      'text-sm font-medium leading-none',
                      hasBuyer && 'line-through text-muted-foreground',
                    )}
                  >
                    Cadastrar Comprador
                  </label>
                </div>
                <div className="flex items-center space-x-3 w-max">
                  <Checkbox
                    id="check-property"
                    checked={hasProperty}
                    disabled
                    className="data-[state=checked]:bg-primary"
                  />
                  <label
                    className={cn(
                      'text-sm font-medium leading-none',
                      hasProperty && 'line-through text-muted-foreground',
                    )}
                  >
                    Vincular Dados do Imóvel
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" /> Documentos Obrigatórios
                </CardTitle>
                <CardDescription>
                  Anexos essenciais para transição de estados operacionais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-slate-50/50">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-sm">Documento Base</p>
                    <p className="text-xs text-muted-foreground">Exigido no Preenchimento</p>
                  </div>
                  {caseData.documento_base ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Enviado
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
                  ) : (
                    <div className="flex items-center gap-2">
                      {!isLocked ? (
                        <div className="relative">
                          <Input
                            type="file"
                            className="w-[180px] h-8 text-xs cursor-pointer opacity-0 absolute inset-0 z-10"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload('documento_base', e.target.files[0])
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-[180px] pointer-events-none"
                          >
                            <Upload className="w-3 h-3 mr-2" /> Fazer Upload
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          <Lock className="w-3 h-3 inline mr-1" /> Trancado
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-slate-50/50">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-sm">Contrato Assinado</p>
                    <p className="text-xs text-muted-foreground">Exigido para Validação</p>
                  </div>
                  {caseData.contrato_assinado ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Enviado
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
                  ) : (
                    <div className="flex items-center gap-2">
                      {!isLocked ? (
                        <div className="relative">
                          <Input
                            type="file"
                            className="w-[180px] h-8 text-xs cursor-pointer opacity-0 absolute inset-0 z-10"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload('contrato_assinado', e.target.files[0])
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-[180px] pointer-events-none"
                          >
                            <Upload className="w-3 h-3 mr-2" /> Fazer Upload
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          <Lock className="w-3 h-3 inline mr-1" /> Trancado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                  <p className="text-muted-foreground">Nenhum documento anexado nesta etapa.</p>
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
            setObservacoesDialog('')
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
                    : transitionDialog.targetState === 'aprovado' ||
                        transitionDialog.targetState === 'aprovado_ressalvas'
                      ? 'Aprovar Caso (Revisão Jurídica)'
                      : transitionDialog.targetState === 'bloqueado'
                        ? 'Bloquear Caso'
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

          {transitionDialog.targetState === 'cancelado' && (
            <div className="my-4">
              <label className="text-sm font-medium mb-2 block text-foreground">
                Motivo do Cancelamento *
              </label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                placeholder="Descreva o motivo..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
              />
            </div>
          )}

          {['aprovado', 'aprovado_ressalvas', 'bloqueado'].includes(
            transitionDialog.targetState as string,
          ) &&
            caseData.estado_caso === 'pendente_revisao_juridica' && (
              <div className="my-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">
                    Parecer Jurídico (Texto) *
                  </label>
                  <textarea
                    className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                    placeholder="Descreva o parecer jurídico (Obrigatório caso não envie arquivo)..."
                    value={parecerJuridico}
                    onChange={(e) => setParecerJuridico(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">
                    Parecer Jurídico (Arquivo Anexo)
                  </label>
                  <input
                    type="file"
                    id="parecer-file"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

          {(transitionDialog.targetState === 'aprovado_ressalvas' ||
            transitionDialog.targetState === 'bloqueado') &&
            caseData.estado_caso === 'pendente_revisao_juridica' && (
              <div className="my-4">
                <label className="text-sm font-medium mb-2 block text-foreground">
                  {transitionDialog.targetState === 'bloqueado'
                    ? 'Motivo do Bloqueio *'
                    : 'Descreva as Ressalvas *'}
                </label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                  placeholder={
                    transitionDialog.targetState === 'bloqueado'
                      ? 'Justifique o bloqueio...'
                      : 'Descreva as ressalvas para a geração da minuta...'
                  }
                  value={observacoesDialog}
                  onChange={(e) => setObservacoesDialog(e.target.value)}
                />
              </div>
            )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManualTransition}
              disabled={transitionLoading}
              className={cn(
                transitionDialog.targetState === 'cancelado' ||
                  transitionDialog.targetState === 'bloqueado'
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
    </div>
  )
}
