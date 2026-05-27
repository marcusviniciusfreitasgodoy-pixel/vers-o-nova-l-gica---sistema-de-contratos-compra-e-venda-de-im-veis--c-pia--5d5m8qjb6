import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, FileText, Loader2 } from 'lucide-react'

export default function NovaNegociacao() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [negociacoes, setNegociacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const data = await pb.collection('gp_negociacoes').getFullList({
          filter: `corretor_id = "${user.id}"`,
          expand: 'imovel_id',
          sort: '-created',
        })
        setNegociacoes(data)
      } catch (err) {
        console.error('Error fetching negotiations:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleCreate = async () => {
    if (creating) return
    setCreating(true)
    try {
      const record = await pb.collection('gp_negociacoes').create({
        estagio: 'captacao',
        corretor_id: user?.id,
        company_id: user?.company,
      })
      navigate(`/negociacao/${record.id}/fase-1`)
    } catch (err) {
      console.error('Error creating negotiation:', err)
      setCreating(false)
    }
  }

  const getPhaseRoute = (id: string, estagio: string) => {
    // Current AC explicitly asks only for fase-1.
    // For now we map all to fase-1, but the logic handles matching dynamically.
    return `/negociacao/${id}/fase-1`
  }

  const formatEstagio = (estagio: string) => {
    const map: Record<string, string> = {
      captacao: 'Captação',
      proposta: 'Proposta',
      preliminar: 'Preliminar',
      promessa: 'Promessa',
      definitivo: 'Definitivo',
      finalizacao: 'Finalização',
      concluido: 'Concluído',
      distratado: 'Distratado',
    }
    return map[estagio] || estagio
  }

  const renderImovel = (imovel: any) => {
    if (!imovel) return <span className="text-slate-400 italic">Não vinculado</span>
    if (imovel.condominio_nome)
      return <span className="font-medium text-slate-700">{imovel.condominio_nome}</span>
    if (imovel.endereco && typeof imovel.endereco === 'object' && imovel.endereco.logradouro) {
      return <span className="font-medium text-slate-700">{imovel.endereco.logradouro}</span>
    }
    return (
      <span className="font-medium text-slate-700">
        Imóvel ({imovel.tipo_imovel || 'Não especificado'})
      </span>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-in fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Nova negociação por fase
          </h1>
          <p className="text-slate-600 mt-2 text-base">
            Geração inteligente de documentos baseada no estágio da negociação.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          size="lg"
          className="gap-2 shrink-0 shadow-sm"
          disabled={creating}
        >
          {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Iniciar nova negociação
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-xl text-slate-800">Negociações em andamento</CardTitle>
          <CardDescription>
            Acompanhe suas negociações ativas no novo fluxo por fases.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-md" />
              ))}
            </div>
          ) : negociacoes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {negociacoes.map((neg) => (
                    <TableRow key={neg.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs text-slate-500">
                        {neg.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{renderImovel(neg.expand?.imovel_id)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent"
                        >
                          {formatEstagio(neg.estagio)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(neg.created).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:text-primary hover:bg-primary/5"
                        >
                          <Link to={getPhaseRoute(neg.id, neg.estagio)} className="gap-2">
                            Continuar
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="bg-slate-100 p-5 rounded-full mb-5">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Nenhuma negociação encontrada</h3>
              <p className="text-slate-500 max-w-md mt-3 text-base">
                Você ainda não possui negociações iniciadas neste novo fluxo. Clique no botão acima
                para começar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
