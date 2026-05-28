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
import {
  CASE_STATES,
  OPERATION_TYPES,
  COMPLEXITY_LEVELS,
  STATE_COLORS,
  STATE_BANNER_COLORS,
} from '@/lib/constants'

const CASE_TRANSITIONS: Record<string, string[]> = {
  rascunho: ['em_qualificacao', 'cancelado'],
  em_qualificacao: ['em_preenchimento', 'cancelado', 'arquivado'],
  em_preenchimento: ['aguardando_documentos', 'em_validacao', 'cancelado'],
  aguardando_documentos: ['em_preenchimento', 'em_validacao', 'cancelado'],
  em_validacao: [
    'pendente_revisao_juridica',
    'aprovado',
    'aprovado_ressalvas',
    'encaminhado_suporte_especializado',
    'bloqueado',
  ],
  pendente_revisao_juridica: ['aprovado', 'aprovado_ressalvas', 'em_preenchimento', 'bloqueado'],
  encaminhado_suporte_especializado: ['em_validacao', 'aprovado', 'bloqueado'],
  aprovado: ['minuta_gerada', 'cancelado'],
  aprovado_ressalvas: ['minuta_gerada', 'em_preenchimento', 'cancelado'],
  bloqueado: ['em_validacao', 'cancelado'],
  minuta_gerada: ['arquivado', 'cancelado'],
  cancelado: ['arquivado'],
  arquivado: [],
}

const TRANSITION_LABELS: Record<string, string> = {
  rascunho: 'Voltar para Rascunho',
  em_qualificacao: 'Iniciar Qualificação',
  em_preenchimento: 'Iniciar Preenchimento',
  aguardando_documentos: 'Aguardar Documentos',
  em_validacao: 'Enviar para Validação',
  pendente_revisao_juridica: 'Solicitar Revisão Jurídica',
  encaminhado_suporte_especializado: 'Acionar Suporte',
  aprovado: 'Aprovar',
  aprovado_ressalvas: 'Aprovar com Ressalvas',
  bloqueado: 'Bloquear Caso',
  minuta_gerada: 'Gerar Minuta',
  cancelado: 'Cancelar Caso',
  arquivado: 'Arquivar Caso',
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
  const [loading, setLoading] = useState(true)
  const [activeSupportRequest, setActiveSupportRequest] = useState<any>(null)

  const [transitionDialog, setTransitionDialog] = useState<{
    isOpen: boolean
    targetState: string | null
  }>({ isOpen: false, targetState: null })
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [isStartingNeg, setIsStartingNeg] = useState(false)

  const loadData = async () => {
    try {
      const [c, pLegacy, pNew, iLegacy, iNew, activeReqs, negs] = await Promise.all([
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

      setCaseData(c)
      setPartes(mergedPartes)
      setImovel(iNew || iLegacy)
      setActiveSupportRequest(activeReqs[0] || null)
      setNegociacao(negs[0] || null)
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
  useRealtime('gp_pessoas', (e) => {
    if (e.record.case_id === id) loadData()
  })
  useRealtime('imovel', (e) => {
    if (e.record.case_id === id) loadData()
  })
  useRealtime('gp_imoveis', (e) => {
    if (e.record.case_id === id) loadData()
  })
  useRealtime('gp_negociacoes', (e) => {
    if (e.record.case_id === id) loadData()
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

  const handleTransition = async () => {
    if (!transitionDialog.targetState) return
    setTransitionLoading(true)
    try {
      const newState = transitionDialog.targetState
      const prevState = caseData.estado_caso

      await updateCase(id as string, { estado_caso: newState })

      await pb.collection('case_state_transitions').create({
        case: id,
        user: user?.id,
        user_role: user?.role || (user?.is_admin ? 'admin' : 'operador'),
        previous_state: prevState,
        new_state: newState,
      })

      toast.success('Operação realizada com sucesso')
      setTransitionDialog({ isOpen: false, targetState: null })
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar o estado do caso')
    } finally {
      setTransitionLoading(false)
    }
  }

  const handleSmartAction = async () => {
    if (negociacao) {
      navigate(`/negociacao/${negociacao.id}/fase-1`)
    } else {
      setIsStartingNeg(true)
      try {
        const newNeg = await createGPNegociacao({
          case_id: id,
          estagio: 'captacao',
          company_id: caseData.company,
        })
        if (caseData.estado_caso === 'rascunho' || caseData.estado_caso === 'em_qualificacao') {
          await updateCase(id as string, { estado_caso: 'em_preenchimento' })
        }
        toast.success('Negociação iniciada com sucesso!')
        navigate(`/negociacao/${newNeg.id}/fase-1`)
      } catch (err: any) {
        toast.error('Erro ao iniciar negociação')
        console.error(err)
      } finally {
        setIsStartingNeg(false)
      }
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

  const canTransition = user?.is_admin || user?.company === caseData?.company
  const availableTransitions = canTransition ? CASE_TRANSITIONS[caseData.estado_caso] || [] : []

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
        <div className="flex items-center gap-2">
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
                        console.error(e)
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

      {/* Banner de Workflow */}
      <Card
        className={cn(
          'shadow-sm transition-colors duration-300',
          STATE_BANNER_COLORS[caseData.estado_caso] || 'bg-muted/30 border-primary/20',
        )}
      >
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground font-medium">Status Atual</p>
            <Badge
              variant="outline"
              className={cn('text-sm px-3 py-1 font-medium', STATE_COLORS[caseData.estado_caso])}
            >
              {CASE_STATES[caseData.estado_caso] || caseData.estado_caso}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {activeSupportRequest ? (
              <Button
                variant="outline"
                asChild
                className="border-amber-500 text-amber-700 hover:bg-amber-50 bg-amber-50/50"
              >
                <Link to={`/expert-support/${activeSupportRequest.id}`}>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Suporte em Andamento
                </Link>
              </Button>
            ) : !['cancelado', 'arquivado'].includes(caseData.estado_caso) ? (
              <Button
                variant="secondary"
                asChild
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200"
              >
                <Link to={`/expert-support/new?caseId=${id}`}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Solicitar Suporte
                </Link>
              </Button>
            ) : null}

            {canTransition && availableTransitions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {availableTransitions.map((state) => {
                  const isOperador = user?.role === 'operador' && !user?.is_admin
                  const restrictedForOperador = [
                    'aprovado',
                    'aprovado_ressalvas',
                    'cancelado',
                    'arquivado',
                  ]
                  const isRestricted = isOperador && restrictedForOperador.includes(state)

                  return (
                    <Button
                      key={state}
                      variant={
                        state === 'cancelado' || state === 'bloqueado' ? 'destructive' : 'default'
                      }
                      disabled={isRestricted}
                      onClick={() => setTransitionDialog({ isOpen: true, targetState: state })}
                      title={
                        isRestricted ? 'Seu perfil não tem permissão para esta ação' : undefined
                      }
                    >
                      {TRANSITION_LABELS[state] || `Mover para ${CASE_STATES[state]}`}
                    </Button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma transição disponível no momento.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos (Checklist) */}
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Próximos Passos
            </CardTitle>
            <span className="text-sm font-medium text-muted-foreground">
              {progressPercentage}% Concluído
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="check-seller"
                  checked={hasSeller}
                  disabled
                  className="data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="check-seller"
                  className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    hasSeller ? 'line-through text-muted-foreground' : '',
                  )}
                >
                  Cadastrar Vendedor
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="check-buyer"
                  checked={hasBuyer}
                  disabled
                  className="data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="check-buyer"
                  className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    hasBuyer ? 'line-through text-muted-foreground' : '',
                  )}
                >
                  Cadastrar Comprador
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="check-property"
                  checked={hasProperty}
                  disabled
                  className="data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="check-property"
                  className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    hasProperty ? 'line-through text-muted-foreground' : '',
                  )}
                >
                  Vincular Dados do Imóvel
                </label>
              </div>
            </div>
            <div className="flex items-center justify-start md:justify-end">
              <Button
                onClick={handleSmartAction}
                disabled={isStartingNeg || (completedSteps < 3 && !negociacao)}
                size="lg"
                className={cn(
                  'w-full md:w-auto shadow-md transition-all',
                  negociacao ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary',
                )}
              >
                {isStartingNeg ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-5 w-5" />
                )}
                {negociacao ? 'Continuar Negociação' : 'Iniciar Negociação'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Bloco de Identificação */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Identificação
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

        {/* Bloco de Classificadores */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Classificadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo de Operação</h3>
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
        {/* Bloco de Propriedade */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Imóvel
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
                    {imovel.tipo_imovel?.replace('_', ' ')} • {imovel.finalidade?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Endereço:</span>
                  <p className="text-sm">
                    {imovel.endereco_resumido || 'Não informado'}
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
              <p className="text-sm text-muted-foreground">Nenhum imóvel vinculado a este caso.</p>
            )}
          </CardContent>
        </Card>

        {/* Bloco de Metadados / Obs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              Informações Adicionais
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
              <span className="text-sm font-medium text-muted-foreground">Observações Gerais:</span>
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {caseData.observacoes || 'Nenhuma observação cadastrada.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bloco de Partes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Partes Envolvidas
          </CardTitle>
          <CardDescription>
            Tabela de pessoas físicas e jurídicas relacionadas a esta operação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partes.length === 0 ? (
            <div className="py-8 text-center border rounded-md bg-muted/20">
              <p className="text-muted-foreground">Nenhuma parte cadastrada.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partes.map((p) => {
                    const formatDoc = (doc: string, tipo: string) => {
                      if (!doc) return '-'
                      const digits = doc.replace(/\D/g, '')
                      if (tipo === 'pessoa_fisica' && digits.length === 11) {
                        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                      }
                      if (tipo === 'pessoa_juridica' && digits.length === 14) {
                        return digits.replace(
                          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                          '$1.$2.$3/$4-$5',
                        )
                      }
                      return doc
                    }

                    const formatTel = (tel: string) => {
                      if (!tel) return '-'
                      const digits = tel.replace(/\D/g, '')
                      if (digits.length === 11)
                        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                      if (digits.length === 10)
                        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                      return tel
                    }

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell className="capitalize">
                          {p.papel_na_operacao?.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="capitalize">
                          {p.tipo_da_parte?.replace('_', ' ')}
                        </TableCell>
                        <TableCell>{formatDoc(p.documento, p.tipo_da_parte)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            {p.telefone && <span>{formatTel(p.telefone)}</span>}
                            {p.e_mail && <span className="text-muted-foreground">{p.e_mail}</span>}
                            {!p.telefone && !p.e_mail && '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={transitionDialog.isOpen}
        onOpenChange={(open) => !open && setTransitionDialog({ isOpen: false, targetState: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Transição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja mover este caso para o estado{' '}
              <strong>
                {transitionDialog.targetState ? CASE_STATES[transitionDialog.targetState] : ''}
              </strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransition} disabled={transitionLoading}>
              {transitionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
