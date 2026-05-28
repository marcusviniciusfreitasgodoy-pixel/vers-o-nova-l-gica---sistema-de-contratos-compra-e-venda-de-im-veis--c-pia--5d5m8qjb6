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

export default function CasesList() {
  const { user } = useAuth()
  const [cases, setCases] = useState<any[]>([])
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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
        expand: 'company,responsible,imovel_via_case_id,partes_via_case_id',
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
      await deleteCase(id)
      toast.success('Caso excluído com sucesso!')
    } catch (err: any) {
      console.error(err)
      if (err?.status === 403) {
        toast.error('Erro ao excluir o caso. Você não tem permissão.')
      } else {
        toast.error('Erro ao excluir o caso. Verifique se existem registros dependentes.')
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
                                  <AlertDialogTitle>Excluir Caso</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este caso? Esta ação não pode ser
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
    </div>
  )
}
