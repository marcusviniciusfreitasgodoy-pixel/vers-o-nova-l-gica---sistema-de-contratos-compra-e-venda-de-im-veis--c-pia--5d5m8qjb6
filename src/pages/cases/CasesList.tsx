import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCases, updateCase, deleteCase } from '@/services/cases'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Briefcase,
  Search,
  FileText,
  Users,
  FileSearch,
  Inbox,
  AlertCircle,
  RefreshCcw,
  Archive,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Lock,
  Ban,
  Upload,
  Trash2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterMenu } from '@/components/FilterMenu'
import pb from '@/lib/pocketbase/client'
import {
  CASE_STATES,
  OPERATION_TYPES,
  PRIORITIES,
  TIPO_IMOVEL,
  STATE_COLORS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import CasePartes from './CasePartes'
import CaseImovel from './CaseImovel'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

type Transition = {
  label: string
  from: string
  to: string
  roles: string[]
  successMessage?: string
  permissionMessage?: string
  errorMessage?: string
}

const TRANSITIONS: Transition[] = [
  {
    label: 'Qualificar Caso',
    from: 'rascunho',
    to: 'em_qualificacao',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    successMessage: 'Qualificado com sucesso',
  },
  {
    label: 'Avançar para Preenchimento',
    from: 'em_qualificacao',
    to: 'em_preenchimento',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    successMessage: 'Transição para preenchimento',
  },
  {
    label: 'Aguardar Documentos',
    from: 'em_preenchimento',
    to: 'aguardando_documentos',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    successMessage: 'Aguardando documentos',
  },
  {
    label: 'Enviar para Validação',
    from: 'aguardando_documentos',
    to: 'em_validacao',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    successMessage: 'Em validação técnica',
  },
  {
    label: 'Solicitar Revisão Jurídica',
    from: 'em_validacao',
    to: 'pendente_revisao_juridica',
    roles: ['admin', 'gestor'],
    successMessage: 'Encaminhado para jurídico',
  },
  {
    label: 'Gerar Minuta',
    from: 'aprovado',
    to: 'minuta_gerada',
    roles: ['admin', 'gestor'],
    successMessage: 'Minuta gerada com sucesso',
  },
  {
    label: 'Gerar Minuta',
    from: 'aprovado_ressalvas',
    to: 'minuta_gerada',
    roles: ['admin', 'gestor'],
    successMessage: 'Minuta gerada com sucesso',
  },
]

const hasRole = (user: any, requiredRoles: string[]) => {
  if (!user) return false
  if (user.is_admin) return true
  return requiredRoles.includes(user.role)
}

const getStageInfo = (state: string) => {
  if (['rascunho', 'em_qualificacao'].includes(state)) return 'Cadastramento'
  if (['em_preenchimento', 'aguardando_documentos'].includes(state)) return 'Documentação'
  if (
    ['em_validacao', 'pendente_revisao_juridica', 'encaminhado_suporte_especializado'].includes(
      state,
    )
  )
    return 'Revisão'
  if (['aprovado', 'aprovado_ressalvas', 'minuta_gerada'].includes(state)) return 'Formalização'
  if (['bloqueado', 'cancelado', 'arquivado'].includes(state)) return 'Encerrado / Paralisado'
  return 'Outro'
}

const getPendingItem = (c: any) => {
  const docBase = c.documento_base ? true : false
  const contAssinado = c.contrato_assinado ? true : false

  switch (c.estado_caso) {
    case 'bloqueado':
      return { text: 'Ação Requerida (Bloqueio)', icon: Ban, color: 'text-red-600' }
    case 'rascunho':
      return { text: 'Completar dados básicos', icon: AlertCircle, color: 'text-amber-600' }
    case 'em_qualificacao':
      return { text: 'Qualificar partes/imóvel', icon: AlertCircle, color: 'text-amber-600' }
    case 'em_preenchimento':
      return {
        text: !docBase ? 'Falta Documento Base' : 'Avançar estágio',
        icon: !docBase ? FileText : ArrowRight,
        color: !docBase ? 'text-destructive' : 'text-blue-600',
      }
    case 'aguardando_documentos':
      return {
        text: !contAssinado ? 'Falta Contrato Assinado' : 'Avançar p/ validação',
        icon: !contAssinado ? FileText : ArrowRight,
        color: !contAssinado ? 'text-destructive' : 'text-blue-600',
      }
    case 'em_validacao':
      return { text: 'Validar e enviar p/ jurídico', icon: ShieldAlert, color: 'text-amber-600' }
    case 'pendente_revisao_juridica':
      return { text: 'Aguardando Parecer', icon: FileSearch, color: 'text-amber-600' }
    case 'aprovado':
    case 'aprovado_ressalvas':
      return { text: 'Pendente Gerar minuta', icon: FileText, color: 'text-blue-600' }
    default:
      return { text: '-', icon: null, color: 'text-muted-foreground' }
  }
}

export default function CasesList() {
  const { user } = useAuth()
  const [cases, setCases] = useState<any[]>([])
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [quickViewCase, setQuickViewCase] = useState<any>(null)
  const [invalidateCase, setInvalidateCase] = useState<any>(null)
  const [deleteCaseId, setDeleteCaseId] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    action: 'cancelado' | 'arquivado' | null
    caseId: string | null
  }>({
    isOpen: false,
    action: null,
    caseId: null,
  })
  const [actionReason, setActionReason] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<{
    states: string[]
    pendingTasks?: string[]
    priorities: string[]
    types: string[]
    complexities: string[]
    responsibles: string[]
  }>({
    states: searchParams.getAll('state') || [],
    pendingTasks: searchParams.getAll('pendingTasks') || [],
    priorities: searchParams.getAll('priority') || [],
    types: searchParams.getAll('type') || [],
    complexities: searchParams.getAll('complexity') || [],
    responsibles: searchParams.getAll('responsible') || [],
  })

  useEffect(() => {
    const isClear = searchParams.get('clear') === 'true'
    const stateParams = searchParams.getAll('state')
    const responsibleParams = searchParams.getAll('responsible')

    if (isClear) {
      setSearch('')
      setFilters({
        states: stateParams,
        priorities: searchParams.getAll('priority'),
        types: searchParams.getAll('type'),
        complexities: searchParams.getAll('complexity'),
        responsibles: responsibleParams,
      })
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('clear')
      setSearchParams(newParams, { replace: true })
    } else if (stateParams.length > 0 || responsibleParams.length > 0) {
      setFilters((prev) => ({
        ...prev,
        states: stateParams.length > 0 ? stateParams : prev.states,
        responsibles: responsibleParams.length > 0 ? responsibleParams : prev.responsibles,
      }))
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (user?.company || user?.is_admin) {
      pb.collection('users')
        .getFullList({ filter: user?.is_admin ? '' : `company = "${user?.company}"` })
        .then(setCompanyUsers)
        .catch(console.error)
    }
  }, [user])

  const loadCases = async () => {
    const conds = []
    if (debouncedSearch) {
      conds.push(
        `(title ~ "${debouncedSearch}" || id ~ "${debouncedSearch}" || client_id.name ~ "${debouncedSearch}")`,
      )
    }
    if (filters.states.length)
      conds.push(`(${filters.states.map((v) => `estado_caso="${v}"`).join(' || ')})`)
    if (filters.pendingTasks && filters.pendingTasks.length) {
      const statesFromPending = filters.pendingTasks.flatMap((v) => v.split(','))
      conds.push(`(${statesFromPending.map((v) => `estado_caso="${v}"`).join(' || ')})`)
    }
    if (filters.priorities.length)
      conds.push(`(${filters.priorities.map((v) => `priority="${v}"`).join(' || ')})`)
    if (filters.types.length)
      conds.push(`(${filters.types.map((v) => `tipo_operacao="${v}"`).join(' || ')})`)
    if (filters.complexities.length)
      conds.push(`(${filters.complexities.map((v) => `nivel_complexidade="${v}"`).join(' || ')})`)
    if (filters.responsibles.length) {
      const respConds = filters.responsibles.map((v) => {
        if (v === 'unassigned') return `responsible=""`
        return `responsible="${v}"`
      })
      conds.push(`(${respConds.join(' || ')})`)
    }

    setLoading(true)
    setError(false)
    try {
      const data = await getCases({
        sort: '-updated',
        filter: conds.join(' && '),
        expand:
          'company,responsible,imovel_via_case_id,partes_via_case_id,gp_negociacoes_via_case_id',
      })

      const sortedCases = data.sort((a, b) => {
        const urgentStates = ['bloqueado', 'pendente_revisao_juridica']
        const aUrgent = urgentStates.includes(a.estado_caso) ? 1 : 0
        const bUrgent = urgentStates.includes(b.estado_caso) ? 1 : 0
        if (aUrgent !== bUrgent) return bUrgent - aUrgent
        return new Date(b.updated).getTime() - new Date(a.updated).getTime()
      })

      setCases(sortedCases)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [debouncedSearch, filters, user])

  useRealtime('cases', loadCases)
  useRealtime('analysis_reports', loadCases)

  const handleQuickUpload = async (
    caseId: string,
    field: 'documento_base' | 'contrato_assinado',
    file: File,
  ) => {
    try {
      const formData = new FormData()
      formData.append(field, file)
      await updateCase(caseId, formData)
      toast.success('Sucesso', {
        description: `Documento anexado com sucesso! Ação recomendada: Avançar estágio.`,
      })
      loadCases()
    } catch (err: any) {
      if (err.status === 400) {
        const errors = extractFieldErrors(err)
        const msg = Object.values(errors)[0] || 'Arquivo inválido ou regra não atendida.'
        toast.error('Bloqueio de Regra', { description: msg })
      } else {
        toast.error('Não foi possível anexar o documento agora.')
      }
    }
  }

  const usersMap = useMemo(() => {
    const map = companyUsers.reduce(
      (acc, u) => {
        acc[u.id] = u.name || u.email
        return acc
      },
      {} as Record<string, string>,
    )
    map['unassigned'] = 'Sem Responsável'
    return map
  }, [companyUsers])

  const resetFilters = () => {
    setFilters({
      states: [],
      pendingTasks: [],
      priorities: [],
      types: [],
      complexities: [],
      responsibles: [],
    })
    setSearchParams({})
  }

  const getAvailableTransitions = (c: any) => {
    const isGestorOuAdmin = hasRole(user, ['admin', 'gestor'])
    const transitions = TRANSITIONS.filter(
      (t) =>
        (t.from === c.estado_caso || t.from === '*') &&
        c.estado_caso !== t.to &&
        c.estado_caso !== 'arquivado' &&
        c.estado_caso !== 'cancelado',
    )

    if (c.estado_caso === 'pendente_revisao_juridica' && isGestorOuAdmin) {
      transitions.push({
        label: 'Aprovar / Avaliar (Acessar)',
        from: 'pendente_revisao_juridica',
        to: 'open_view',
        roles: ['admin', 'gestor'],
      })
    }
    return transitions
  }

  const handleStateTransition = async (c: any, t: Transition) => {
    if (!hasRole(user, t.roles)) {
      toast.error(
        'Você não tem permissão para concluir esta ação. Esta etapa pode ser executada apenas pelo perfil Gestor/Admin.',
        {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        },
      )
      return
    }

    if (t.from !== '*' && c.estado_caso !== t.from) {
      toast.error(
        `Esta ação ainda não está disponível neste momento do caso. Antes disso, conclua: ${CASE_STATES[t.from] || t.from}.`,
        {
          icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
        },
      )
      return
    }

    if (t.to === 'open_view') {
      window.location.href = `/casos/${c.id}`
      return
    }

    if (t.from === 'em_preenchimento' && t.to === 'aguardando_documentos' && !c.documento_base) {
      toast.error(
        'Não é possível avançar porque falta o Documento Base. Próximo passo: anexar o documento para continuar.',
        {
          icon: <FileText className="h-4 w-4 text-destructive" />,
        },
      )
      return
    }
    if (t.from === 'aguardando_documentos' && t.to === 'em_validacao' && !c.contrato_assinado) {
      toast.error(
        'Não é possível avançar porque falta o Contrato Assinado. Próximo passo: anexar o documento para continuar.',
        {
          icon: <FileText className="h-4 w-4 text-destructive" />,
        },
      )
      return
    }

    try {
      await updateCase(c.id, { estado_caso: t.to })
      toast.success('Sucesso', {
        description:
          t.successMessage ||
          `Caso alterado para ${CASE_STATES[t.to] || t.to}. Prossiga com as pendências do novo estágio.`,
      })
      loadCases()
    } catch (err: any) {
      console.error(err)
      if (err.status === 403) {
        toast.error(
          'Você não tem permissão para concluir esta ação. Esta etapa pode ser executada apenas pelo perfil Gestor/Admin.',
          {
            icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
          },
        )
      } else if (err.status === 400) {
        const errors = extractFieldErrors(err)
        if (errors.documento_base) {
          toast.error(
            'Não é possível avançar porque falta o Documento Base. Próximo passo: anexar o documento para continuar.',
            { icon: <FileText className="h-4 w-4 text-destructive" /> },
          )
        } else if (errors.contrato_assinado) {
          toast.error(
            'Não é possível avançar porque falta o Contrato Assinado. Próximo passo: anexar o documento para continuar.',
            { icon: <FileText className="h-4 w-4 text-destructive" /> },
          )
        } else if (errors.parecer) {
          toast.error(
            'Esta etapa exige parecer jurídico antes de seguir. Registre o parecer para habilitar as decisões de aprovação ou bloqueio.',
            { icon: <ShieldAlert className="h-4 w-4 text-destructive" /> },
          )
        } else {
          const msg = Object.values(errors)[0] || 'Violação de Regra'
          toast.warning('Bloqueio de Regra', {
            description: msg,
            icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
          })
        }
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    }
  }

  const handleActionCase = async () => {
    if (!actionDialog.caseId || !actionReason) {
      toast.warning('Bloqueio de Regra', {
        description: `Motivo do ${actionDialog.action === 'arquivado' ? 'arquivamento' : 'cancelamento'} obrigatório`,
      })
      return
    }

    try {
      const payload: any = { estado_caso: actionDialog.action }
      if (actionDialog.action === 'cancelado') {
        payload.motivo_cancelamento = actionReason
      } else {
        payload.observacoes = actionReason
      }

      await updateCase(actionDialog.caseId, payload)
      toast.success('Sucesso', { description: `Processo ${actionDialog.action}` })
      setActionDialog({ isOpen: false, action: null, caseId: null })
      setActionReason('')
      loadCases()
    } catch (err: any) {
      if (err.status === 403) {
        toast.error(
          'Você não tem permissão para concluir esta ação. Esta etapa pode ser executada apenas pelo perfil Gestor/Admin.',
          {
            icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
          },
        )
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    }
  }

  const handleDeleteCase = async () => {
    if (!deleteCaseId) return
    try {
      await deleteCase(deleteCaseId)
      toast.success('Caso excluído com sucesso.')
      setDeleteCaseId(null)
      loadCases()
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao excluir o caso.')
    }
  }

  const handleInvalidate = async (targetState: string) => {
    if (!invalidateCase) return

    const originalState = invalidateCase.estado_caso
    const caseId = invalidateCase.id

    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, estado_caso: targetState } : c)))
    setInvalidateCase(null)

    toast.info('Sincronizando estado...', { id: 'sync-toast' })

    try {
      await updateCase(caseId, { estado_caso: targetState })
      toast.dismiss('sync-toast')
      const successMessage =
        targetState === 'em_preenchimento'
          ? 'Reaberto para ajuste de dados'
          : 'Reaberto para revisão jurídica'
      toast.success('Sucesso', { description: successMessage })
      loadCases()
    } catch (err: any) {
      toast.dismiss('sync-toast')
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, estado_caso: originalState } : c)),
      )
      if (err.status === 403) {
        toast.error(
          'Você não tem permissão para concluir esta ação. Esta etapa pode ser executada apenas pelo perfil Gestor/Admin.',
          {
            icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
          },
        )
      } else {
        toast.error('Falha de Sincronização', {
          description: 'Erro de sincronização. O estado foi revertido.',
        })
      }
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Central de Processos
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Acompanhe e gerencie processos através do funil operacional, resolvendo pendências
            diretamente nesta tela.
          </p>
        </div>
        <Button asChild className="shrink-0" size="lg">
          <Link to="/casos/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Caso
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 bg-muted/30 p-3 rounded-lg border">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, título..."
            className="pl-8 h-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterMenu
          label="Estado do Caso"
          options={CASE_STATES}
          selected={filters.states}
          onChange={(v) => setFilters((f) => ({ ...f, states: v }))}
        />
        <FilterMenu
          label="Pendência"
          options={{
            rascunho: 'Completar dados básicos',
            em_qualificacao: 'Qualificar partes/imóvel',
            em_preenchimento: 'Anexar Documento Base',
            aguardando_documentos: 'Anexar Contrato Assinado',
            em_validacao: 'Validar e enviar p/ jurídico',
            pendente_revisao_juridica: 'Emitir parecer jurídico',
            'aprovado,aprovado_ressalvas': 'Gerar minuta',
          }}
          selected={filters.pendingTasks || []}
          onChange={(v) => setFilters((f) => ({ ...f, pendingTasks: v }))}
        />
        <FilterMenu
          label="Responsável"
          options={usersMap}
          selected={filters.responsibles}
          onChange={(v) => setFilters((f) => ({ ...f, responsibles: v }))}
        />
        <FilterMenu
          label="Prioridade"
          options={{ baixa: 'Baixa', media: 'Média', alta: 'Alta' }}
          selected={filters.priorities}
          onChange={(v) => setFilters((f) => ({ ...f, priorities: v }))}
        />
        {(filters.states.length > 0 ||
          (filters.pendingTasks && filters.pendingTasks.length > 0) ||
          filters.responsibles.length > 0 ||
          search ||
          filters.priorities.length > 0) && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-9">
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="min-w-[280px]">Caso / Resumo</TableHead>
                <TableHead className="min-w-[240px]">Estágio & Pendência</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16 float-right" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
                      <h3 className="text-lg font-semibold">Erro ao carregar casos</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Ocorreu um erro de conexão. Tente novamente.
                      </p>
                      <Button variant="outline" className="mt-4" onClick={loadCases}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Tentar Novamente
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold">Nenhum caso encontrado</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        {filters.states.includes('bloqueado')
                          ? 'Excelente! Não há nenhum caso bloqueado no momento.'
                          : 'Não encontramos casos com os filtros atuais ou você ainda não possui casos cadastrados.'}
                      </p>
                      {(filters.states.length > 0 || search || filters.priorities.length > 0) && (
                        <div className="flex gap-3 mt-6">
                          <Button variant="outline" onClick={resetFilters}>
                            Ver Todos os Casos
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((c) => {
                  const imovel = c.expand?.imovel_via_case_id?.[0]
                  const partesCount = c.expand?.partes_via_case_id?.length || 0
                  const availableTransitions = getAvailableTransitions(c)
                  const activeNegociacao = c.expand?.gp_negociacoes_via_case_id?.[0]

                  const docBase = c.documento_base ? true : false
                  const contAssinado = c.contrato_assinado ? true : false
                  const temParecer = c.parecer || c.parecer_juridico_file ? true : false
                  const pending = getPendingItem(c)

                  return (
                    <TableRow key={c.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground align-top pt-4">
                        {c.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <div className="font-medium text-base text-foreground leading-tight">
                          {c.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-muted-foreground">
                          {c.tipo_operacao && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 h-4 bg-slate-100 dark:bg-slate-800"
                            >
                              {OPERATION_TYPES?.[c.tipo_operacao] ||
                                c.tipo_operacao.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {c.priority && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 h-4',
                                PRIORITIES[c.priority]?.bg || '',
                              )}
                            >
                              {PRIORITIES[c.priority]?.label || c.priority}
                            </Badge>
                          )}
                          {imovel && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {TIPO_IMOVEL[imovel.tipo_imovel] || 'Imóvel'}
                              {imovel.cidade ? ` - ${imovel.cidade}` : ''}
                            </span>
                          )}
                          {partesCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {partesCount} {partesCount === 1 ? 'parte' : 'partes'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-medium text-sm text-foreground">
                            {getStageInfo(c.estado_caso)}
                          </span>
                          <span
                            className={cn(
                              'text-xs flex items-center gap-1.5 font-medium',
                              pending.color,
                            )}
                          >
                            {pending.icon && <pending.icon className="h-3.5 w-3.5" />}{' '}
                            {pending.text}
                          </span>

                          {c.estado_caso === 'bloqueado' && c.motivo_bloqueio && (
                            <div className="text-xs text-destructive mt-1 bg-destructive/10 p-1.5 rounded-md border border-destructive/20 flex items-start gap-1 max-w-[240px]">
                              <Ban className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>
                                <span className="font-semibold">Motivo:</span> {c.motivo_bloqueio}
                              </span>
                            </div>
                          )}

                          {c.estado_caso === 'em_preenchimento' && !docBase && (
                            <div className="relative mt-1 max-w-[200px]">
                              <Input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleQuickUpload(c.id, 'documento_base', e.target.files[0])
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] w-full bg-blue-50/50 hover:bg-blue-50 border-blue-200 text-blue-700"
                              >
                                <Upload className="h-3 w-3 mr-1" /> Upload Doc. Base
                              </Button>
                            </div>
                          )}

                          {c.estado_caso === 'aguardando_documentos' && !contAssinado && (
                            <div className="relative mt-1 max-w-[200px]">
                              <Input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleQuickUpload(c.id, 'contrato_assinado', e.target.files[0])
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] w-full bg-blue-50/50 hover:bg-blue-50 border-blue-200 text-blue-700"
                              >
                                <Upload className="h-3 w-3 mr-1" /> Upload Contrato Assinado
                              </Button>
                            </div>
                          )}

                          {c.estado_caso === 'pendente_revisao_juridica' && (
                            <Badge
                              variant="outline"
                              className="mt-0.5 bg-amber-50 text-amber-700 border-amber-200 text-[10px] w-fit"
                            >
                              Aguardando Admin/Jurídico
                            </Badge>
                          )}

                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {docBase && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                              >
                                Doc. Base OK
                              </Badge>
                            )}
                            {contAssinado && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                              >
                                Contrato OK
                              </Badge>
                            )}
                            {temParecer && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200"
                              >
                                Parecer OK
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium whitespace-nowrap',
                            STATE_COLORS[c.estado_caso] || 'bg-secondary',
                          )}
                        >
                          {CASE_STATES[c.estado_caso] || c.estado_caso}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <div className="text-sm font-medium">
                          {c.expand?.responsible?.name || c.expand?.responsible?.email || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs align-top pt-4">
                        <span title={format(new Date(c.updated), "dd/MM/yy 'às' HH:mm")}>
                          {formatDistanceToNow(new Date(c.updated), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right align-top pt-3">
                        <div className="flex justify-end gap-1.5 opacity-100 sm:opacity-70 group-hover:opacity-100 transition-opacity flex-wrap items-center">
                          {activeNegociacao && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 hidden md:flex"
                              asChild
                              title="Acessar Fases da Negociação"
                            >
                              <Link to={`/negociacao/${activeNegociacao.id}/fase-1`}>
                                <Briefcase className="mr-1 h-3 w-3" /> Fases
                              </Link>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 hidden xl:flex text-muted-foreground hover:text-foreground"
                            onClick={() => setQuickViewCase(c)}
                            title="Gestão Rápida de Partes e Imóvel"
                          >
                            <Users className="mr-1 h-3 w-3" /> Partes/Imóvel
                          </Button>

                          {!activeNegociacao && hasRole(user, ['admin', 'gestor', 'operador']) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 hidden xl:flex text-muted-foreground hover:text-foreground"
                              asChild
                              title="Iniciar Nova Negociação"
                            >
                              <Link to={`/negociacao/nova?caseId=${c.id}`}>
                                <Plus className="mr-1 h-3 w-3" /> Negociação
                              </Link>
                            </Button>
                          )}

                          {(availableTransitions.length > 0 || c.estado_caso !== 'arquivado') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  title="Ações Rápidas"
                                >
                                  Ações <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Mover no Pipeline</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {availableTransitions.map((t) => {
                                  const canExecute = hasRole(user, t.roles)
                                  return (
                                    <DropdownMenuItem
                                      key={t.to}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        if (!canExecute) return
                                        handleStateTransition(c, t)
                                      }}
                                      className={cn(
                                        'flex items-center justify-between font-medium',
                                        !canExecute && 'opacity-50 cursor-not-allowed',
                                      )}
                                      title={
                                        !canExecute
                                          ? `Ação restrita aos papéis: ${t.roles.join(', ')}`
                                          : undefined
                                      }
                                    >
                                      <span>{t.label}</span>
                                      {!canExecute && (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </DropdownMenuItem>
                                  )
                                })}
                                {[
                                  'rascunho',
                                  'em_qualificacao',
                                  'em_preenchimento',
                                  'aguardando_documentos',
                                  'em_validacao',
                                  'pendente_revisao_juridica',
                                ].includes(c.estado_caso) &&
                                  hasRole(user, ['admin']) && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setActionDialog({
                                          isOpen: true,
                                          action: 'cancelado',
                                          caseId: c.id,
                                        })
                                      }}
                                    >
                                      <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                                      <span className="text-destructive font-medium">
                                        Cancelar Caso
                                      </span>
                                    </DropdownMenuItem>
                                  )}
                                {['aprovado', 'bloqueado', 'minuta_gerada'].includes(
                                  c.estado_caso,
                                ) &&
                                  hasRole(user, ['admin']) && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setActionDialog({
                                          isOpen: true,
                                          action: 'arquivado',
                                          caseId: c.id,
                                        })
                                      }}
                                    >
                                      <Archive className="mr-2 h-4 w-4 text-amber-600" />
                                      <span className="text-amber-600 font-medium">
                                        Arquivar Caso
                                      </span>
                                    </DropdownMenuItem>
                                  )}
                                {c.estado_caso === 'minuta_gerada' && hasRole(user, ['admin']) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setInvalidateCase(c)
                                      }}
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4 text-destructive" />
                                      <span className="text-destructive font-medium">
                                        Retornar (Invalidar Minuta)
                                      </span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {hasRole(user, ['admin', 'gestor', 'operador']) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setDeleteCaseId(c.id)
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                      <span className="text-destructive font-medium">
                                        Excluir Caso
                                      </span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          <Button
                            variant="default"
                            size="icon"
                            className="h-8 w-8 bg-slate-900 hover:bg-slate-800"
                            asChild
                            title="Acessar Central Operacional do Caso"
                          >
                            <Link to={`/casos/${c.id}`}>
                              <FileSearch className="h-4 w-4" />
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

      <Sheet open={!!quickViewCase} onOpenChange={(open) => !open && setQuickViewCase(null)}>
        <SheetContent className="sm:max-w-[600px] w-full overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Gestão Rápida: {quickViewCase?.title}</SheetTitle>
            <SheetDescription>
              ID: {quickViewCase?.id.slice(0, 8)} | Status:{' '}
              {CASE_STATES[quickViewCase?.estado_caso] || quickViewCase?.estado_caso}
            </SheetDescription>
          </SheetHeader>
          {quickViewCase && (
            <Tabs defaultValue="partes" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="partes">Partes Envolvidas</TabsTrigger>
                <TabsTrigger value="imovel">Dados do Imóvel</TabsTrigger>
              </TabsList>
              <TabsContent value="partes" className="mt-4">
                <CasePartes caseId={quickViewCase.id} />
              </TabsContent>
              <TabsContent value="imovel" className="mt-4">
                <CaseImovel caseId={quickViewCase.id} />
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!invalidateCase} onOpenChange={(o) => !o && setInvalidateCase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retornar Pós-Minuta</AlertDialogTitle>
            <AlertDialogDescription>
              A invalidação da minuta reabrirá o caso para edição e os campos voltarão a ficar
              editáveis. Por favor, confirme o destino do retorno:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2 w-full mt-4">
            <AlertDialogAction
              onClick={() => handleInvalidate('em_preenchimento')}
              className="w-full justify-center"
            >
              Retornar para Preenchimento (Destrancar Dados Operacionais)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleInvalidate('pendente_revisao_juridica')}
              className="w-full justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Retornar para Revisão (Destrancar Parecer Jurídico)
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-2 justify-center">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCaseId} onOpenChange={(o) => !o && setDeleteCaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Caso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este caso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCase}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={actionDialog.isOpen}
        onOpenChange={(o) => !o && setActionDialog({ isOpen: false, action: null, caseId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === 'arquivado'
                ? 'Confirmar Arquivamento'
                : 'Confirmar Cancelamento do Caso'}
            </AlertDialogTitle>
            <AlertDialogDescription
              className={
                actionDialog.action === 'cancelado'
                  ? 'text-destructive font-medium'
                  : 'text-amber-600 font-medium'
              }
            >
              {actionDialog.action === 'arquivado'
                ? 'Esta ação moverá o caso para o arquivo. Ele sairá do fluxo ativo.'
                : 'Esta ação é irreversível e bloqueará edições futuras.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block text-foreground">
              Motivo do {actionDialog.action === 'arquivado' ? 'Arquivamento' : 'Cancelamento'} *
            </label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
              placeholder={`Descreva o motivo do ${actionDialog.action === 'arquivado' ? 'arquivamento' : 'cancelamento'} deste caso...`}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionCase}
              className={
                actionDialog.action === 'arquivado'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-destructive hover:bg-destructive/90'
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
