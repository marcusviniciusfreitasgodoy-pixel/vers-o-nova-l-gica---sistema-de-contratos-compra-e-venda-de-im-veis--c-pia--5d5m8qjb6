import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronRight,
  ArrowLeft,
  Info,
  Landmark,
  Save,
  AlertCircle,
  Ban as BanIcon,
} from 'lucide-react'
import { getGPNegociacao, updateGPNegociacao, type GPNegociacao } from '@/services/gp_negociacoes'
import { getPromessas } from '@/services/gp_doc_promessa'
import {
  getForcaEscrituras,
  createForcaEscritura,
  updateForcaEscritura,
} from '@/services/gp_doc_contrato_forca_escritura'
import {
  getMinutasEscritura,
  createMinutaEscritura,
  updateMinutaEscritura,
} from '@/services/gp_doc_minuta_escritura'
import type { GpDocContratoForcaEscritura, GpDocMinutaEscritura } from '@/types/gp_schema'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { TestFillButton } from '@/components/TestFillButton'
import { Ban } from 'lucide-react'
import { DistratoAction } from './components/DistratoAction'

export default function Fase3() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [negociacao, setNegociacao] = useState<GPNegociacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [docForca, setDocForca] = useState<Partial<GpDocContratoForcaEscritura>>({})
  const [docMinuta, setDocMinuta] = useState<Partial<GpDocMinutaEscritura>>({})
  const [existingId, setExistingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        const neg = await getGPNegociacao(id)
        setNegociacao(neg)

        if (!neg.forma_pagamento) {
          setLoading(false)
          return
        }

        const isFinanciado = ['financiado_sfh', 'financiado_fiduciario'].includes(
          neg.forma_pagamento,
        )

        if (isFinanciado) {
          const forcas = await getForcaEscrituras(id)
          if (forcas.length > 0) {
            setDocForca(forcas[0])
            setExistingId(forcas[0].id)
          } else {
            const baseForca =
              neg.forma_pagamento === 'financiado_fiduciario'
                ? 'Lei 9.514/97, art. 38'
                : 'Lei 4.380/64, art. 61, §5º'
            const clausulaExec =
              neg.forma_pagamento === 'financiado_fiduciario'
                ? 'Procedimento de execução extrajudicial nos termos da Lei 9.514/97, arts. 26 e 27'
                : ''

            setDocForca({
              negociacao_id: id,
              valor_total: neg.valor_total || 0,
              base_legal_forca_escritura: baseForca,
              clausula_execucao_extrajudicial: clausulaExec,
            })
          }
        } else {
          const minutas = await getMinutasEscritura(id)
          if (minutas.length > 0) {
            setDocMinuta(minutas[0])
            setExistingId(minutas[0].id)
          } else {
            const promessas = await getPromessas(id)
            const recentPromessa = promessas[0]

            setDocMinuta({
              negociacao_id: id,
              valor_transacao: neg.valor_total || 0,
              promessa_origem_id: recentPromessa?.id,
            })
          }
        }
      } catch (err) {
        console.error(err)
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar os dados.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, toast])

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!negociacao?.forma_pagamento) {
    return (
      <div className="container mx-auto p-4 max-w-3xl flex items-center justify-center min-h-[50vh]">
        <Card className="w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Pagamento Não Definido</CardTitle>
            <CardDescription>
              A forma de pagamento é essencial para determinar o instrumento definitivo desta
              negociação.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">
              Defina a forma de pagamento antes de prosseguir para a elaboração do documento.
            </p>
            <Button onClick={() => navigate(`/negociacao/${id}/fase-2`)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Fase 2
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isFinanciado = ['financiado_sfh', 'financiado_fiduciario'].includes(
    negociacao.forma_pagamento,
  )

  const uiTitle = isFinanciado
    ? 'Documento definitivo: CONTRATO PARTICULAR COM FORÇA DE ESCRITURA'
    : 'Documento de fechamento: MINUTA DE ESCRITURA PÚBLICA'

  const uiDescription = isFinanciado
    ? 'Como há financiamento com alienação fiduciária ou SFH, a Lei 9.514/97 art. 38 permite que este instrumento particular tenha força de escritura pública e seja registrado diretamente na matrícula, sem passagem pelo tabelionato de notas.'
    : 'Este sistema gera a MINUTA da escritura, que deve ser apresentada ao tabelionato de notas para lavratura. O sistema NÃO substitui o cartório. Após a lavratura pelo tabelião, a escritura deve ser levada ao Registro de Imóveis para transferência da propriedade (CC art. 108 e art. 1.245).'

  const fillTestData = () => {
    if (isFinanciado) {
      setDocForca({
        ...docForca,
        valor_total: 500000,
        valor_financiado: 400000,
        valor_recursos_proprios: 100000,
        numero_parcelas: 360,
        taxa_juros_aa: 8.5,
        indice_correcao: 'tr',
        sistema_amortizacao: 'sac',
        garantia_fiduciaria_valor: 500000,
        despesas_itbi: 'Comprador',
        despesas_registro: 'Comprador',
        cartorio_registro: '1º CRI de São Paulo',
        foro_eleicao: 'São Paulo - SP',
        base_legal_forca_escritura: docForca.base_legal_forca_escritura || 'Lei 9.514/97, art. 38',
        clausula_execucao_extrajudicial:
          docForca.clausula_execucao_extrajudicial || 'Procedimento de execução extrajudicial...',
      })
    } else {
      setDocMinuta({
        ...docMinuta,
        valor_transacao: 500000,
        valor_venal_itbi: 520000,
        guia_itbi_numero: '123456789',
        tabelionato_destino: '1º Tabelionato de Notas de São Paulo',
        cartorio_registro: '1º CRI de São Paulo',
        status_minuta: 'rascunho',
        forma_quitacao: 'Pagamento à vista via PIX',
        declaracao_quitacao: true,
      })
    }
  }

  const educationalNote = isFinanciado
    ? 'Dica: Se a compra fosse à vista ou parcelada diretamente com o vendedor sem alienação fiduciária, seria obrigatória a lavratura de Escritura Pública no tabelionato de notas para imóveis acima de 30 salários mínimos.'
    : 'Dica: Se a compra envolvesse financiamento bancário pelo SFH ou com alienação fiduciária, o próprio contrato bancário teria força de escritura pública, dispensando o tabelionato de notas.'

  const handleSaveForca = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (existingId) {
        await updateForcaEscritura(existingId, docForca)
      } else {
        const res = await createForcaEscritura(docForca)
        setExistingId(res.id)
      }

      if (negociacao.id && negociacao.estagio !== 'definitivo') {
        await updateGPNegociacao(negociacao.id, { estagio: 'definitivo' })
        setNegociacao({ ...negociacao, estagio: 'definitivo' })
      }

      toast({
        title: 'Documento salvo',
        description: 'O contrato com força de escritura foi salvo com sucesso.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMinuta = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (existingId) {
        await updateMinutaEscritura(existingId, docMinuta)
      } else {
        const res = await createMinutaEscritura(docMinuta)
        setExistingId(res.id)
      }

      if (negociacao.id && negociacao.estagio !== 'definitivo') {
        await updateGPNegociacao(negociacao.id, { estagio: 'definitivo' })
        setNegociacao({ ...negociacao, estagio: 'definitivo' })
      }

      toast({
        title: 'Documento salvo',
        description: 'A minuta de escritura pública foi salva com sucesso.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground overflow-x-auto pb-2">
          <Link to={`/negociacao/${id}/fase-1`} className="hover:text-primary whitespace-nowrap">
            Fase 1: Viabilidade
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link to={`/negociacao/${id}/fase-2`} className="hover:text-primary whitespace-nowrap">
            Fase 2: Promessa
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium whitespace-nowrap">Fase 3: Definitivo</span>
        </div>
        <DistratoAction negociacaoId={id!} estagio={negociacao.estagio} />
      </div>

      {negociacao.estagio === 'distratado' && (
        <Alert variant="destructive" className="mb-6">
          <Ban className="h-4 w-4" />
          <AlertTitle>Negociação Distratada</AlertTitle>
          <AlertDescription>
            Esta negociação foi cancelada/distratada. Os dados abaixo são apenas para histórico.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="mb-6 bg-blue-50/50 text-blue-900 border-blue-200 dark:bg-blue-950/20 dark:text-blue-200 dark:border-blue-900">
        <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="font-semibold">{uiTitle}</AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed">
          {uiDescription}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{isFinanciado ? 'Dados do Contrato Definitivo' : 'Dados da Minuta'}</CardTitle>
          <CardDescription>
            Preencha os dados complementares para a geração do documento final da operação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFinanciado ? (
            <form id="form-forca" onSubmit={handleSaveForca}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={docForca.valor_total || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, valor_total: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Financiado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={docForca.valor_financiado || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, valor_financiado: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recursos Próprios (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={docForca.valor_recursos_proprios || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, valor_recursos_proprios: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Input
                    type="number"
                    value={docForca.numero_parcelas || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, numero_parcelas: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxa de Juros (a.a. %)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={docForca.taxa_juros_aa || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, taxa_juros_aa: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Índice de Correção</Label>
                  <Select
                    value={docForca.indice_correcao || ''}
                    onValueChange={(val: any) => setDocForca({ ...docForca, indice_correcao: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">TR</SelectItem>
                      <SelectItem value="ipca">IPCA</SelectItem>
                      <SelectItem value="igpm">IGPM</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sistema de Amortização</Label>
                  <Select
                    value={docForca.sistema_amortizacao || ''}
                    onValueChange={(val: any) =>
                      setDocForca({ ...docForca, sistema_amortizacao: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sac">SAC</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor da Garantia Fiduciária (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={docForca.garantia_fiduciaria_valor || ''}
                    onChange={(e) =>
                      setDocForca({
                        ...docForca,
                        garantia_fiduciaria_valor: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Despesas de ITBI</Label>
                  <Input
                    value={docForca.despesas_itbi || ''}
                    onChange={(e) => setDocForca({ ...docForca, despesas_itbi: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Despesas de Registro</Label>
                  <Input
                    value={docForca.despesas_registro || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, despesas_registro: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cartório de Registro</Label>
                  <Input
                    value={docForca.cartorio_registro || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, cartorio_registro: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foro de Eleição</Label>
                  <Input
                    value={docForca.foro_eleicao || ''}
                    onChange={(e) => setDocForca({ ...docForca, foro_eleicao: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4 mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold">Fundamentação Legal</h3>
                <div className="space-y-2">
                  <Label>Base Legal - Força de Escritura</Label>
                  <Input
                    value={docForca.base_legal_forca_escritura || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, base_legal_forca_escritura: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente de acordo com a modalidade de financiamento.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Cláusula de Execução Extrajudicial</Label>
                  <Textarea
                    value={docForca.clausula_execucao_extrajudicial || ''}
                    onChange={(e) =>
                      setDocForca({ ...docForca, clausula_execucao_extrajudicial: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
            </form>
          ) : (
            <form id="form-minuta" onSubmit={handleSaveMinuta}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor da Transação (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={docMinuta.valor_transacao || ''}
                    onChange={(e) =>
                      setDocMinuta({ ...docMinuta, valor_transacao: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Venal ITBI (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={docMinuta.valor_venal_itbi || ''}
                    onChange={(e) =>
                      setDocMinuta({ ...docMinuta, valor_venal_itbi: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nº Guia ITBI</Label>
                  <Input
                    value={docMinuta.guia_itbi_numero || ''}
                    onChange={(e) =>
                      setDocMinuta({ ...docMinuta, guia_itbi_numero: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tabelionato de Notas (Destino)</Label>
                  <Input
                    value={docMinuta.tabelionato_destino || ''}
                    onChange={(e) =>
                      setDocMinuta({ ...docMinuta, tabelionato_destino: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cartório de Registro (Após Lavratura)</Label>
                  <Input
                    value={docMinuta.cartorio_registro || ''}
                    onChange={(e) =>
                      setDocMinuta({ ...docMinuta, cartorio_registro: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status da Minuta</Label>
                  <Select
                    value={docMinuta.status_minuta || ''}
                    onValueChange={(val: any) => setDocMinuta({ ...docMinuta, status_minuta: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="revisada">Revisada</SelectItem>
                      <SelectItem value="enviada_cartorio">Enviada ao Cartório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Forma de Quitação</Label>
                  <Textarea
                    value={docMinuta.forma_quitacao || ''}
                    onChange={(e) => setDocMinuta({ ...docMinuta, forma_quitacao: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2 flex items-center space-x-2">
                  <Checkbox
                    id="declaracao_quitacao"
                    checked={docMinuta.declaracao_quitacao || false}
                    onCheckedChange={(checked) =>
                      setDocMinuta({ ...docMinuta, declaracao_quitacao: !!checked })
                    }
                  />
                  <Label htmlFor="declaracao_quitacao" className="text-sm font-normal">
                    Incluir declaração expressa de quitação total e irrevogável
                  </Label>
                </div>

                {docMinuta.promessa_origem_id && (
                  <div className="col-span-1 md:col-span-2 p-3 bg-secondary/30 rounded-md text-sm text-muted-foreground flex items-center gap-2 mt-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>
                      Vinculado automaticamente à Promessa de Compra e Venda anterior (ID:{' '}
                      {docMinuta.promessa_origem_id.substring(0, 8)}).
                    </span>
                  </div>
                )}
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t p-6 gap-4 flex-wrap">
          <Button variant="outline" onClick={() => navigate(`/negociacao/${id}/fase-2`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Fase 2
          </Button>

          <div className="flex items-center gap-4">
            <TestFillButton onClick={fillTestData} />
            <Button
              type="submit"
              form={isFinanciado ? 'form-forca' : 'form-minuta'}
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span> Salvando...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" /> Salvar Definitivo
                </span>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Alert className="mt-8 bg-muted text-muted-foreground border-transparent">
        <Info className="h-4 w-4" />
        <AlertTitle>Nota Educativa</AlertTitle>
        <AlertDescription className="mt-1">{educationalNote}</AlertDescription>
      </Alert>
    </div>
  )
}
