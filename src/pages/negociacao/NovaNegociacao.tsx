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
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { checkCasePermission } from '@/services/cases_rbac'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createCase } from '@/services/cases'
import { TestFillButton } from '@/components/TestFillButton'

export default function NovaNegociacao() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [negociacoes, setNegociacoes] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false)
  const [creatingCase, setCreatingCase] = useState(false)
  const [newCaseData, setNewCaseData] = useState({
    title: '',
    description: '',
    priority: 'media',
    segmento_operacional: 'corretor_autonomo',
    tipo_operacao: 'compra_venda_padrao',
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const caseIdParam = searchParams.get('case_id')
    if (caseIdParam) {
      setSelectedCase(caseIdParam)
    }
  }, [])

  const loadData = async () => {
    if (!user) return
    try {
      const data = await pb.collection('gp_negociacoes').getFullList({
        filter: `corretor_id = "${user.id}"`,
        expand: 'imovel_id',
        sort: '-created',
      })
      setNegociacoes(data)

      const casesData = await pb.collection('cases').getFullList({
        filter: `company = "${user.company}"`,
        sort: '-created',
      })
      setCases(casesData)
    } catch (err) {
      console.error('Error fetching negotiations or cases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime(
    'gp_negociacoes',
    () => {
      loadData()
    },
    !!user,
  )

  const handleCreate = async () => {
    if (creating || !selectedCase) return
    setCreating(true)
    try {
      try {
        const rbac = await checkCasePermission(selectedCase, 'create_negotiation')
        if (!rbac.allowed) {
          toast({
            title: 'Acesso Negado',
            description: rbac.reason || 'Você não tem permissão para iniciar negociações.',
            variant: 'destructive',
          })
          setCreating(false)
          return
        }
      } catch (e) {
        console.warn('RBAC check fallback to create hook')
      }

      let linkedImovelId = null
      try {
        const imovel = await pb.collection('imovel').getFirstListItem(`case_id = "${selectedCase}"`)
        if (imovel && imovel.gp_imovel_id) {
          linkedImovelId = imovel.gp_imovel_id
        }
      } catch {
        /* intentionally ignored */
      }

      const record = await pb.collection('gp_negociacoes').create({
        estagio: 'captacao',
        corretor_id: user?.id,
        company_id: user?.company,
        case_id: selectedCase,
        imovel_id: linkedImovelId,
      })

      toast({
        title: 'Negociação Iniciada',
        description: 'A negociação foi vinculada ao caso com sucesso.',
      })

      navigate(`/negociacao/${record.id}/fase-1`)
    } catch (err: any) {
      console.error('Error creating negotiation:', err)
      toast({
        title: 'Erro ao criar negociação',
        description: err?.response?.message || 'Não foi possível criar a negociação.',
        variant: 'destructive',
      })
      setCreating(false)
    }
  }

  const handleCreateNewCase = async () => {
    if (!newCaseData.title) {
      toast({
        title: 'Atenção',
        description: 'O título do caso é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    setCreatingCase(true)
    try {
      const payload = {
        ...newCaseData,
        company: user?.company,
        responsible: user?.id,
        estado_caso: 'rascunho',
        nivel_complexidade: 'simples',
      }

      const createdCase = await createCase(payload)
      setCases((prev) => [createdCase, ...prev])
      setSelectedCase(createdCase.id)
      setIsNewCaseModalOpen(false)

      toast({ title: 'Caso Criado', description: 'Novo caso criado e selecionado com sucesso.' })

      setNewCaseData({
        title: '',
        description: '',
        priority: 'media',
        segmento_operacional: 'corretor_autonomo',
        tipo_operacao: 'compra_venda_padrao',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o caso.',
        variant: 'destructive',
      })
    } finally {
      setCreatingCase(false)
    }
  }

  const fillNewCaseTestData = () => {
    setNewCaseData({
      title: 'Venda Apt 101 Centro (Teste Completo)',
      description:
        'Operação de compra e venda padrão para teste rápido de geração de documentos e fases. Endereço: Rua de Teste, 123 - Centro, São Paulo - SP. Valor avaliado: R$ 500.000,00',
      priority: 'alta',
      segmento_operacional: 'imobiliaria_estruturada_premium',
      tipo_operacao: 'compra_venda_padrao',
    })
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
    if (imovel.endereco?.logradouro)
      return <span className="font-medium text-slate-700">{imovel.endereco.logradouro}</span>
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
            Nova negociação
          </h1>
          <p className="text-slate-600 mt-2 text-base">
            Geração inteligente de documentos baseada no estágio.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="flex w-full sm:w-auto gap-2">
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger className="w-full sm:w-[220px] bg-white">
                <SelectValue placeholder="Vincular a um Caso" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isNewCaseModalOpen} onOpenChange={setIsNewCaseModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shrink-0 gap-1 px-3">
                  <Plus className="h-4 w-4" /> Novo Caso
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Caso</DialogTitle>
                  <DialogDescription>
                    Inicie rapidamente um caso para vincular a negociação.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Título do Caso</Label>
                    <Input
                      value={newCaseData.title}
                      onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                      placeholder="Ex: Venda Apt 302 Centro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newCaseData.description}
                      onChange={(e) =>
                        setNewCaseData({ ...newCaseData, description: e.target.value })
                      }
                      placeholder="Resumo da operação..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Operação</Label>
                      <Select
                        value={newCaseData.tipo_operacao}
                        onValueChange={(v) => setNewCaseData({ ...newCaseData, tipo_operacao: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compra_venda_padrao">Compra e Venda Padrão</SelectItem>
                          <SelectItem value="compra_venda_sinal">C/V com Sinal</SelectItem>
                          <SelectItem value="compra_venda_financiamento">
                            C/V com Financiamento
                          </SelectItem>
                          <SelectItem value="recibo_sinal_autonomo">
                            Recibo de Sinal Autônomo
                          </SelectItem>
                          <SelectItem value="checklist_documental">Checklist Documental</SelectItem>
                          <SelectItem value="promessa_compra_venda">
                            Promessa de Compra e Venda
                          </SelectItem>
                          <SelectItem value="distrato">Distrato</SelectItem>
                          <SelectItem value="termo_posse_chaves">
                            Termo de Posse / Chaves
                          </SelectItem>
                          <SelectItem value="permuta">Permuta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={newCaseData.priority}
                        onValueChange={(v) => setNewCaseData({ ...newCaseData, priority: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Segmento Operacional</Label>
                      <Select
                        value={newCaseData.segmento_operacional}
                        onValueChange={(v) =>
                          setNewCaseData({ ...newCaseData, segmento_operacional: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corretor_autonomo">Corretor Autônomo</SelectItem>
                          <SelectItem value="imobiliaria_pequena_media">Imobiliária P/M</SelectItem>
                          <SelectItem value="imobiliaria_estruturada_premium">
                            Imobiliária Estruturada Premium
                          </SelectItem>
                          <SelectItem value="construtora_incorporadora">
                            Construtora/Incorporadora
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex justify-between items-center sm:justify-between">
                  <TestFillButton onClick={fillNewCaseTestData} />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsNewCaseModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateNewCase} disabled={creatingCase}>
                      {creatingCase ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Caso'}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            onClick={handleCreate}
            size="lg"
            className="w-full sm:w-auto gap-2 shrink-0"
            disabled={creating || !selectedCase}
          >
            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Iniciar negociação
          </Button>
        </div>
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
                          <Link to={`/negociacao/${neg.id}/fase-1`} className="gap-2">
                            Continuar <ArrowRight className="h-4 w-4" />
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
