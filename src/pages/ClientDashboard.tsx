import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, ChevronRight, Loader2, MapPin } from 'lucide-react'
import { CASE_STATES, STATE_COLORS, TIPO_IMOVEL } from '@/lib/constants'
import { format } from 'date-fns'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadCases = async () => {
    try {
      const records = await pb.collection('cases').getFullList({
        sort: '-updated',
        expand: 'imovel_via_case_id',
      })
      setCases(records)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [user])

  useRealtime('cases', loadCases)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6 animate-in fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Briefcase className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Minhas Negociações</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o andamento dos seus processos imobiliários.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {cases.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto opacity-20 mb-4" />
              <p className="text-lg font-medium text-slate-600">Nenhuma negociação encontrada</p>
              <p className="text-sm mt-1">
                Você não possui processos vinculados ao seu perfil no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          cases.map((c) => {
            const imovel = c.expand?.imovel_via_case_id?.[0]
            return (
              <Link key={c.id} to={`/casos/${c.id}`} className="block group">
                <Card className="hover:shadow-md transition-all hover:border-primary/30">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-slate-800 group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      {imovel && (
                        <div className="flex items-center text-sm text-slate-500 gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {(TIPO_IMOVEL as any)[imovel.tipo_imovel] || 'Imóvel'} -{' '}
                            {imovel.endereco_resumido || imovel.cidade || 'Endereço não informado'}
                          </span>
                        </div>
                      )}
                      <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md inline-block">
                        Atualizado em {format(new Date(c.updated), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                      <Badge
                        variant="outline"
                        className={STATE_COLORS[c.estado_caso] || 'bg-slate-100 text-slate-700'}
                      >
                        {CASE_STATES[c.estado_caso] || c.estado_caso}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors hidden md:block" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
