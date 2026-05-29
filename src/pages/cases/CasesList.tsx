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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Edit,
  FileSearch,
  Inbox,
  AlertCircle,
  RefreshCcw,
  Archive,
  Trash2,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Lock,
} from 'lucide-react'
import { format } from 'date-fns'
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
  COMPLEXITY_LEVELS,
  PRIORITIES,
  TIPO_IMOVEL,
  STATE_COLORS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

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
    permissionMessage: 'Você não tem permissão para executar esta ação.',
  },
  {
    label: 'Avançar para Preenchimento',
    from: 'em_qualificacao',
    to: 'em_preenchimento',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    successMessage: 'Transição para preenchimento',
    permissionMessage: 'Você não tem permissão para executar esta ação.',
  },
  {
    label: 'Aguardar Documentos',
    from: 'em_preenchimento',
    to: 'aguardando_documentos',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    successMessage: 'Aguardando documentos',
    permissionMessage: 'Você não tem permissão para executar esta ação.',
  },
  {
    label: 'Enviar para Validação',
    from: 'aguardando_documentos',
    to: 'em_validacao',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    successMessage: 'Em validação técnica',
    permissionMessage: 'Você não tem permissão para executar esta ação.',
  },
  {
    label: 'Solicitar Revisão Jurídica',
    from: 'em_validacao',
    to: 'pendente_revisao_juridica',
    roles: ['admin', 'gestor'],
    successMessage: 'Encaminhado para jurídico',
    permissionMessage: 'Você não tem permissão para executar esta ação.',
  },
  {
    label: 'Gerar Minuta',
    from: 'aprovado',
    to: 'minuta_gerada',
    roles: ['admin', 'gestor'],
    successMessage: 'Minuta gerada com sucesso',
    permissionMessage: 'Você não tem permissão para executar esta ação.',
  },
  {
    label: 'Gerar Minuta',
    from: 'aprovado_ressalvas',
    to: 'minuta_gerada',
    roles: ['admin', 'gestor'],
    successMessage: 'Minuta gerada com sucesso',
    permissionMessage: 'Você não tem permissão para executar esta ação.',
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
  switch (c.estado_caso) {
    case 'rascunho':
      return 'Completar dados básicos'
    case 'em_qualificacao':
      return 'Qualificar partes/imóvel'
    case 'em_preenchimento':
      return 'Anexar Documento Base'
    case 'aguardando_documentos':
      return 'Anexar Contrato Assinado'
    case 'em_validacao':
      return 'Validar e enviar p/ jurídico'
    case 'pendente_revisao_juridica':
      return 'Emitir parecer jurídico'
    case 'aprovado':
    case 'aprovado_ressalvas':
      return 'Gerar minuta'
    default:
      return '-'
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

  const [invalidateCase, setInvalidateCase] = useState<any>(null)
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; caseId: string | null }>({
    isOpen: false,
    caseId: null,
  })
  const [cancelReason, setCancelReason] = useState('')

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
      setCases(data)
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

    // Add dynamic links to Case View for actions requiring file/text inputs
    if (c.estado_caso === 'pendente_revisao_juridica' && isGestorOuAdmin) {
      transitions.push({
        label: 'Aprovar / Avaliar Caso (Acessar)',
        from: 'pendente_revisao_juridica',
        to: 'open_view',
        roles: ['admin', 'gestor'],
      })
    }
    return transitions
  }

  const handleStateTransition = async (c: any, t: Transition) => {
    if (!hasRole(user, t.roles)) {
      toast.error('You do not have permission to execute this action.', {
        icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
      })
      return
    }

    if (t.to === 'open_view') {
      window.location.href = `/casos/${c.id}`
      return
    }

    if (t.from === 'em_preenchimento' && t.to === 'aguardando_documentos' && !c.documento_base) {
      toast.warning('Bloqueio de Regra', {
        description: 'Anexe o documento base para continuar.',
      })
      return
    }
    if (t.from === 'aguardando_documentos' && t.to === 'em_validacao' && !c.contrato_assinado) {
      toast.warning('Bloqueio de Regra', {
        description: 'Anexe o contrato assinado para continuar.',
      })
      return
    }

    try {
      await updateCase(c.id, { estado_caso: t.to })
      toast.success('Sucesso', {
        description: t.successMessage || `Caso alterado para ${CASE_STATES[t.to] || t.to}`,
      })
      loadCases()
    } catch (err: any) {
      console.error(err)
      if (err.status === 403) {
        toast.error('Você não tem permissão para executar esta ação.', {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        })
      } else if (err.status === 400) {
        const errors = extractFieldErrors(err)
        const msg = Object.values(errors)[0] || 'Violação de Regra'
        toast.warning('Bloqueio de Regra', {
          description: msg,
          icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
        })
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    }
  }

  const handleCancelCase = async () => {
    if (!cancelDialog.caseId || !cancelReason) {
      toast.warning('Bloqueio de Regra', { description: 'Motivo do cancelamento obrigatório' })
      return
    }

    try {
      await updateCase(cancelDialog.caseId, {
        estado_caso: 'cancelado',
        motivo_cancelamento: cancelReason,
      })
      toast.success('Sucesso', { description: 'Processo cancelado' })
      setCancelDialog({ isOpen: false, caseId: null })
      setCancelReason('')
      loadCases()
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Você não tem permissão para executar esta ação.', {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        })
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    }
  }

  const handleInvalidate = async (targetState: string) => {
    if (!invalidateCase) return

    toast.info('Sincronizando estado...', {
      id: 'sync-toast',
    })

    try {
      // Opt UI Update: Just let real-time handle it or wait for the fast DB response.
      await updateCase(invalidateCase.id, { estado_caso: targetState })
      toast.dismiss('sync-toast')
      const successMessage =
        targetState === 'em_preenchimento'
          ? 'Reaberto para ajuste de dados'
          : 'Reaberto para revisão jurídica'
      toast.success('Sucesso', {
        description: successMessage,
      })
      setInvalidateCase(null)
      loadCases()
    } catch (err: any) {
      toast.dismiss('sync-toast')
      if (err.status === 403) {
        toast.error('Você não tem permissão para executar esta ação.', {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        })
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.', {
          description: 'Erro de sincronização. O estado foi revertido.',
        })
      }
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await updateCase(id, { estado_caso: 'arquivado' })
      toast.success('Sucesso', { description: 'Arquivado com sucesso' })
      loadCases()
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Você não tem permissão para executar esta ação.', {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        })
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Gestão de Casos (Pipeline)
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Acompanhe e gerencie processos através do funil operacional, garantindo a conformidade e
            completude de documentos em cada etapa.
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
                <TableHead className="min-w-[250px]">Caso / Resumo</TableHead>
                <TableHead className="min-w-[220px]">Estágio & Pendência</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right w-[180px]">Ações</TableHead>
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
                        Não encontramos casos com os filtros atuais.
                      </p>
                      <Button variant="outline" className="mt-4" onClick={resetFilters}>
                        Limpar Filtros
                      </Button>
                      <Button variant="link" className="mt-2" asChild>
                        <Link to="/casos/novo">Criar Novo Caso</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((c) => {
                  const imovel = c.expand?.imovel_via_case_id?.[0]
                  const partesCount = c.expand?.partes_via_case_id?.length || 0
                  const availableTransitions = getAvailableTransitions(c)

                  const docBase = c.documento_base ? true : false
                  const contAssinado = c.contrato_assinado ? true : false
                  const temParecer = c.parecer || c.parecer_juridico_file ? true : false

                  return (
                    <TableRow key={c.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground align-top pt-4">
                        {c.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium text-base text-foreground leading-tight">
                          {c.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                          {imovel && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {TIPO_IMOVEL[imovel.tipo_imovel] || 'Imóvel'} -{' '}
                              {imovel.cidade || 'Sem cidade'}
                            </span>
                          )}
                          {partesCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {partesCount} {partesCount === 1 ? 'parte' : 'partes'}
                            </span>
                          )}
                          {c.priority && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1 h-4',
                                PRIORITIES[c.priority]?.bg || '',
                              )}
                            >
                              {PRIORITIES[c.priority]?.label || c.priority}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-medium text-sm text-foreground">
                            {getStageInfo(c.estado_caso)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {getPendingItem(c)}
                          </span>
                          <div className="flex gap-1.5 mt-0.5 flex-wrap">
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
                            {!docBase && !contAssinado && !temParecer && (
                              <span className="text-[10px] text-muted-foreground">Sem anexos</span>
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
                        {format(new Date(c.updated), "dd/MM/yy 'às' HH:mm")}
                      </TableCell>
                      <TableCell className="text-right align-top pt-3">
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-70 group-hover:opacity-100 transition-opacity">
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
                                        handleStateTransition(c, t)
                                      }}
                                      className="flex items-center justify-between font-medium"
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
                                ].includes(c.estado_caso) && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setCancelDialog({ isOpen: true, caseId: c.id })
                                    }}
                                  >
                                    <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                                    <span className="text-amber-500 font-medium">
                                      Cancelar Caso
                                    </span>
                                  </DropdownMenuItem>
                                )}
                                {['aprovado', 'bloqueado', 'minuta_gerada'].includes(
                                  c.estado_caso,
                                ) && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleArchive(c.id)
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                            title="Central Operacional"
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

      <AlertDialog
        open={cancelDialog.isOpen}
        onOpenChange={(o) => !o && setCancelDialog({ isOpen: false, caseId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento do Caso</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive font-medium">
              Esta ação é irreversível e bloqueará edições futuras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block text-foreground">
              Motivo do Cancelamento *
            </label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
              placeholder="Descreva o motivo da desistência ou cancelamento deste caso..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelCase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
