import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { CASE_STATES, STATE_COLORS, STATE_BANNER_COLORS } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ClientDashboard from '@/pages/ClientDashboard'
import {
  LayoutDashboard,
  AlertTriangle,
  Clock,
  ShieldAlert,
  BarChart3,
  Users,
  ChevronRight,
  Activity,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [cases, setCases] = useState<any[]>([])
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const [casesData, usersData] = await Promise.all([
        pb.collection('cases').getFullList({
          fields: 'id,estado_caso,responsible',
          filter: 'estado_caso != "arquivado"',
        }),
        user?.company || user?.is_admin
          ? pb
              .collection('users')
              .getFullList({ filter: user?.is_admin ? '' : `company = "${user?.company}"` })
          : Promise.resolve([]),
      ])
      setCases(casesData || [])
      setCompanyUsers(usersData || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('cases', loadData)

  const isInternal = user?.is_admin || ['admin', 'gestor', 'operador'].includes(user?.role)

  if (!isInternal) {
    return <ClientDashboard />
  }

  const activeCases = cases || []

  const bottleneckKeys = ['bloqueado', 'pendente_revisao_juridica', 'aguardando_documentos']

  const casesByState = activeCases.reduce(
    (acc, c) => {
      const state = c?.estado_caso
      if (state) {
        acc[state] = (acc[state] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const casesByUser = activeCases.reduce(
    (acc, c) => {
      const respId = c?.responsible || 'unassigned'
      acc[respId] = (acc[respId] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const teamStats = (companyUsers || []).map((u) => ({
    id: u.id,
    name: u.name || u.email || 'Usuário',
    avatar: u.avatar ? pb.files.getUrl(u, u.avatar) : null,
    count: casesByUser[u.id] || 0,
  }))

  if (casesByUser['unassigned'] > 0) {
    teamStats.push({
      id: 'unassigned',
      name: 'Sem Responsável',
      avatar: null,
      count: casesByUser['unassigned'],
    })
  }

  teamStats.sort((a, b) => b.count - a.count)

  const funnelStates = [
    'rascunho',
    'em_qualificacao',
    'em_preenchimento',
    'aguardando_documentos',
    'em_validacao',
    'pendente_revisao_juridica',
    'encaminhado_suporte_especializado',
    'aprovado',
    'aprovado_ressalvas',
    'bloqueado',
    'minuta_gerada',
    'cancelado',
  ]

  const getBottleneckIcon = (state: string) => {
    switch (state) {
      case 'bloqueado':
        return ShieldAlert
      case 'aguardando_documentos':
        return Clock
      case 'pendente_revisao_juridica':
        return AlertTriangle
      default:
        return AlertTriangle
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
        <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Erro ao carregar o dashboard</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Não foi possível conectar ao servidor para buscar os dados operacionais.
        </p>
        <Button variant="outline" onClick={loadData}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-in fade-in space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 tracking-tight">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            Visão Geral Operacional
          </h2>
          <p className="text-muted-foreground mt-2">
            Acompanhe o funil de casos, identifique gargalos e distribua a carga de trabalho.
          </p>
        </div>

        <div className="flex gap-4">
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <Activity className="h-8 w-8 text-primary/70" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Casos Ativos</p>
                <p className="text-2xl font-bold text-primary">{activeCases.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Radar de Gargalos (Atenção Imediata)
            </h2>
            <p className="text-sm text-muted-foreground">
              Casos que exigem ação manual, correção ou cobrança de terceiros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bottleneckKeys.map((state) => {
              const Icon = getBottleneckIcon(state)
              const count = casesByState[state] || 0
              return (
                <Link key={state} to={`/casos?state=${state}&clear=true`} className="block group">
                  <Card
                    className={cn(
                      'relative overflow-hidden transition-all duration-300 hover:shadow-md border-l-4 h-full',
                      STATE_BANNER_COLORS[state],
                      count > 0
                        ? 'border-l-current'
                        : 'border-l-slate-200 opacity-70 grayscale-[0.5]',
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <p
                            className={cn(
                              'text-sm font-semibold uppercase tracking-wider',
                              STATE_COLORS[state]?.split(' ')[1] || 'text-slate-700',
                            )}
                          >
                            {CASE_STATES[state] || state}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-slate-800">{count}</span>
                            <span className="text-sm font-medium text-slate-500">
                              {count === 1 ? 'caso parado' : 'casos parados'}
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'p-3 rounded-xl bg-white/50 backdrop-blur-sm',
                            STATE_COLORS[state]?.split(' ')[1] || 'text-slate-500',
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Resumo da Esteira (Funil)
              </h2>
              <p className="text-sm text-muted-foreground">
                Distribuição de todos os casos ativos por estágio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {funnelStates.map((state) => {
                const count = casesByState[state] || 0
                return (
                  <Link key={state} to={`/casos?state=${state}&clear=true`} className="block group">
                    <Card className="hover:shadow-sm transition-all hover:border-primary/30 h-full">
                      <CardContent className="p-4 flex items-center justify-between h-full">
                        <Badge variant="outline" className={cn('px-2 py-1', STATE_COLORS[state])}>
                          {CASE_STATES[state] || state}
                        </Badge>
                        <div className="flex items-center gap-3 text-slate-600 group-hover:text-primary transition-colors">
                          <span className="font-bold text-xl">{count}</span>
                          <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Carga por Responsável
              </h2>
              <p className="text-sm text-muted-foreground">
                Volume de casos ativos atribuídos à equipe.
              </p>
            </div>

            <Card className="h-[calc(100%-3.5rem)] min-h-[300px]">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex-1 overflow-auto max-h-[500px]">
                  {teamStats.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {teamStats.map((member) => (
                        <Link
                          key={member.id}
                          to={`/casos?responsible=${member.id}&clear=true`}
                          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              {member.avatar && <AvatarImage src={member.avatar} />}
                              <AvatarFallback
                                className={cn(
                                  'font-medium',
                                  member.id === 'unassigned'
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-primary/10 text-primary',
                                )}
                              >
                                {member.id === 'unassigned'
                                  ? 'SR'
                                  : member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                {member.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={member.count > 10 ? 'destructive' : 'secondary'}
                              className="font-mono"
                            >
                              {member.count}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[200px]">
                      <Users className="h-10 w-10 opacity-20 mb-3" />
                      <p>Nenhum responsável encontrado.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
