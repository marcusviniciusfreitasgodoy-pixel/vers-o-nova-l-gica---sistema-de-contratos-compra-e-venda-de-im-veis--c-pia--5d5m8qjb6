import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCases, updateCase, deleteCase } from '@/services/cases'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
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
  validate?: (c: any) => { valid: boolean; type?: 'rule' | 'permission' | 'tech'; message?: string }
  errorMessage?: string
}

const TRANSITIONS: Transition[] = [
  {
    label: 'Qualify Case',
    from: 'rascunho',
    to: 'em_qualificacao',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    validate: (c) => {
      if (!c.title || !c.tipo_operacao) {
        return { valid: false, type: 'rule', message: 'Please provide a title and operation type.' }
      }
      return { valid: true }
    },
    errorMessage: 'Request Failed',
  },
  {
    label: 'Request Docs',
    from: 'em_qualificacao',
    to: 'aguardando_documentos',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    validate: (c) => {
      const imovel = c.expand?.imovel_via_case_id?.[0]
      if (!imovel?.endereco_resumido) {
        return {
          valid: false,
          type: 'rule',
          message: 'Property registration (endereco_resumido) is required.',
        }
      }
      return { valid: true }
    },
    errorMessage: 'Request Failed',
  },
  {
    label: 'Start Filling',
    from: 'aguardando_documentos',
    to: 'em_preenchimento',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    validate: (c) => {
      const negs = c.expand?.gp_negociacoes_via_case_id || []
      const hasMatricula = negs.some((n: any) =>
        n.expand?.contracts_via_negociacao_id?.some((ct: any) => !!ct.matricula_file),
      )
      if (!hasMatricula) {
        return {
          valid: false,
          type: 'rule',
          message: 'Property registration file (matricula_file) is required.',
        }
      }
      return { valid: true }
    },
    errorMessage: 'Request Failed',
  },
  {
    label: 'Submit for Validation',
    from: 'em_preenchimento',
    to: 'em_validacao',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    validate: (c) => {
      const negs = c.expand?.gp_negociacoes_via_case_id || []
      const hasValor = negs.some((n: any) => !!n.valor_total)
      if (!hasValor) {
        return { valid: false, type: 'rule', message: 'Total value of negotiation must be set.' }
      }
      return { valid: true }
    },
    errorMessage: 'Request Failed',
  },
  {
    label: 'Send to Legal',
    from: 'em_validacao',
    to: 'pendente_revisao_juridica',
    roles: ['admin', 'gestor'],
    validate: (c) => {
      const negs = c.expand?.gp_negociacoes_via_case_id || []
      const hasIptu = negs.some((n: any) =>
        n.expand?.contracts_via_negociacao_id?.some((ct: any) => !!ct.iptu_file),
      )
      if (!c.observacoes || !hasIptu) {
        return { valid: false, type: 'rule', message: 'Validation requires IPTU and observations.' }
      }
      return { valid: true }
    },
    errorMessage: 'Request Failed',
  },
  {
    label: 'Approve',
    from: 'pendente_revisao_juridica',
    to: 'aprovado',
    roles: ['admin'],
    errorMessage: 'Request Failed',
  },
  {
    label: 'Approve with Cav.',
    from: 'pendente_revisao_juridica',
    to: 'aprovado_ressalvas',
    roles: ['admin'],
    validate: (c) => {
      if (!c.observacoes) return { valid: false, type: 'rule', message: 'Missing observacoes' }
      return { valid: true }
    },
    errorMessage: 'Request Failed',
  },
  {
    label: 'Generate Minuta',
    from: 'aprovado',
    to: 'minuta_gerada',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    errorMessage: '504 - Service Timeout while generating document. Please try again',
  },
  {
    label: 'Generate Minuta',
    from: 'aprovado_ressalvas',
    to: 'minuta_gerada',
    roles: ['admin', 'gestor', 'operador', 'cliente'],
    errorMessage: '504 - Service Timeout while generating document. Please try again',
  },
  {
    label: 'Archive',
    from: 'minuta_gerada',
    to: 'arquivado',
    roles: ['admin'],
    errorMessage: 'Request Failed',
  },
  {
    label: 'Cancel Case',
    from: '*',
    to: 'cancelado',
    roles: ['admin', 'gestor'],
    errorMessage: 'Request Failed',
  },
]

const hasRole = (user: any, requiredRoles: string[]) => {
  if (!user) return false
  if (user.is_admin) return true
  return requiredRoles.includes(user.role)
}

const syncNegotiation = async (caseData: any, newState: string) => {
  const negMap: Record<string, string> = {
    rascunho: 'captacao',
    em_qualificacao: 'preliminar',
    aguardando_documentos: 'preliminar',
    em_preenchimento: 'proposta',
    em_validacao: 'proposta',
    aprovado: 'promessa',
    aprovado_ressalvas: 'promessa',
    minuta_gerada: 'promessa',
    cancelado: 'distratado',
  }

  const targetEstagio = negMap[newState]
  if (!targetEstagio) return

  const negs = await pb
    .collection('gp_negociacoes')
    .getFullList({ filter: `case_id="${caseData.id}"` })

  if (negs.length > 0) {
    for (const neg of negs) {
      if (neg.estagio !== targetEstagio) {
        await pb.collection('gp_negociacoes').update(neg.id, { estagio: targetEstagio })
      }
    }
  } else {
    await pb.collection('gp_negociacoes').create({
      case_id: caseData.id,
      estagio: targetEstagio,
      company_id: caseData.company,
    })
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

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    states: searchParams.getAll('state') || [],
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
    if (debouncedSearch) conds.push(`title ~ "${debouncedSearch}"`)
    if (filters.states.length)
      conds.push(`(${filters.states.map((v) => `estado_caso="${v}"`).join(' || ')})`)
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
          'company,responsible,imovel_via_case_id,partes_via_case_id,gp_negociacoes_via_case_id,gp_negociacoes_via_case_id.contracts_via_negociacao_id',
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
    setFilters({ states: [], priorities: [], types: [], complexities: [], responsibles: [] })
    setSearchParams({})
  }

  const getAvailableTransitions = (c: any) => {
    return TRANSITIONS.filter(
      (t) =>
        (t.from === c.estado_caso || t.from === '*') &&
        c.estado_caso !== t.to &&
        c.estado_caso !== 'arquivado' &&
        c.estado_caso !== 'cancelado',
    )
  }

  const handleStateTransition = async (c: any, t: Transition) => {
    if (!hasRole(user, t.roles)) {
      toast.error('Access Denied: You do not have permission for this action.', {
        icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
      })
      return
    }

    if (t.validate) {
      const val = t.validate(c)
      if (!val.valid) {
        toast.warning(val.message || 'Validation failed for this stage.', {
          icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
        })
        return
      }
    }

    try {
      await syncNegotiation(c, t.to)
      await updateCase(c.id, { estado_caso: t.to })
      toast.success(`Case transitioned to ${CASE_STATES[t.to] || t.to}`)
      loadCases()
    } catch (err: any) {
      console.error(err)
      toast.error(t.errorMessage || 'Technical Error: Request Failed', {
        description: err?.message,
      })
    }
  }

  const handleInvalidate = async (targetState: string) => {
    if (!invalidateCase) return
    try {
      const negs = invalidateCase.expand?.gp_negociacoes_via_case_id || []
      for (const neg of negs) {
        const contracts = neg.expand?.contracts_via_negociacao_id || []
        for (const ct of contracts) {
          if (ct.arquivo_gerado) {
            await pb.collection('contracts').update(ct.id, { arquivo_gerado: null })
          }
        }
      }

      await syncNegotiation(invalidateCase, targetState)
      await updateCase(invalidateCase.id, { estado_caso: targetState })
      toast.success(
        `Minuta invalidated. Case returned to ${CASE_STATES[targetState] || targetState}.`,
      )
      setInvalidateCase(null)
      loadCases()
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to invalidate minuta.')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await updateCase(id, { estado_caso: 'arquivado' })
      toast.success('Caso arquivado com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao arquivar o caso.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      try {
        const linkedNegs = await pb
          .collection('gp_negociacoes')
          .getFullList({ filter: `case_id="${id}"` })
        for (const neg of linkedNegs) {
          await pb.collection('gp_negociacoes').delete(neg.id)
        }
      } catch (e) {
        console.warn('Could not fetch or delete associated negotiations', e)
      }

      await deleteCase(id)
      toast.success('Negociação excluída com sucesso!')
      loadCases()
    } catch (err: any) {
      console.error(err)
      if (err?.status === 403) {
        toast.error('Erro ao excluir a negociação. Você não tem permissão.')
      } else {
        toast.error('Erro ao excluir a negociação. Verifique se existem registros dependentes.')
      }
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Gestão de Casos
          </h1>
          <p className="text-muted-foreground mt-2">
            Estrutura centralizada para classificação e gestão de formalizações imobiliárias.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/casos/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Caso
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterMenu
          label="Estado"
          options={CASE_STATES}
          selected={filters.states}
          onChange={(v) => setFilters((f) => ({ ...f, states: v }))}
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
        <FilterMenu
          label="Operação"
          options={OPERATION_TYPES}
          selected={filters.types}
          onChange={(v) => setFilters((f) => ({ ...f, types: v }))}
        />
        <FilterMenu
          label="Complexidade"
          options={COMPLEXITY_LEVELS}
          selected={filters.complexities}
          onChange={(v) => setFilters((f) => ({ ...f, complexities: v }))}
        />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caso / Resumo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Complexidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-28" />
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
                  <TableCell colSpan={8} className="h-[400px] text-center">
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
                  <TableCell colSpan={8} className="h-[400px] text-center">
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

                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium text-base">{c.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                        </div>
                      </TableCell>
                      <TableCell>{c.expand?.responsible?.name || '-'}</TableCell>
                      <TableCell>
                        {c.priority ? (
                          <Badge variant="outline" className={PRIORITIES[c.priority]?.bg || ''}>
                            {PRIORITIES[c.priority]?.label || c.priority}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{OPERATION_TYPES[c.tipo_operacao] || '-'}</TableCell>
                      <TableCell>{COMPLEXITY_LEVELS[c.nivel_complexidade] || '-'}</TableCell>
                      <TableCell>
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
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(c.updated), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {availableTransitions.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" title="Avançar Estado">
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Avançar Estado</DropdownMenuLabel>
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
                                      className="flex items-center justify-between"
                                    >
                                      <span>{t.label}</span>
                                      {!canExecute && (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </DropdownMenuItem>
                                  )
                                })}
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
                                        Invalidar Minuta
                                      </span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button variant="ghost" size="icon" asChild title="Ver Resumo">
                            <Link to={`/casos/${c.id}`}>
                              <FileSearch className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Editar Caso">
                            <Link to={`/casos/${c.id}/editar`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          {c.estado_caso !== 'arquivado' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Arquivar Caso"
                              onClick={() => handleArchive(c.id)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          {user?.role !== 'operador' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Excluir Caso">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deseja realmente excluir esta negociação? Esta ação não pode ser
                                    desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(c.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
            <AlertDialogTitle>Invalidar Minuta</AlertDialogTitle>
            <AlertDialogDescription>
              A invalidação da minuta reabrirá o caso para edição. Por favor, confirme o destino:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2 w-full">
            <AlertDialogAction
              onClick={() => handleInvalidate('em_preenchimento')}
              className="w-full justify-center"
            >
              Retornar para Preenchimento (Dados Financeiros)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleInvalidate('pendente_revisao_juridica')}
              className="w-full justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Retornar para Revisão (Texto Legal)
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-2 justify-center">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
