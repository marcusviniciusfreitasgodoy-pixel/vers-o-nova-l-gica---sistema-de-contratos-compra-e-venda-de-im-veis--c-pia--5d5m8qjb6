import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGPNegociacao, updateGPNegociacao, GPNegociacao } from '@/services/gp_negociacoes'
import { getRecibosSinal } from '@/services/gp_doc_recibo_sinal'
import { getPromessas } from '@/services/gp_doc_promessa'
import { getForcaEscrituras } from '@/services/gp_doc_contrato_forca_escritura'
import { createDistrato } from '@/services/gp_doc_distrato'
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
import { CurrencyInput } from '@/components/FormInput'
import { parseCurrency } from '@/lib/formatters'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react'
import { TestFillButton } from '@/components/TestFillButton'

type DocOption = {
  id: string
  tipo: 'recibo' | 'promessa' | 'forca_escritura' | 'preliminar'
  label: string
  valores_pagos: number
  base_legal: string
}

export default function DistratoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [negociacao, setNegociacao] = useState<GPNegociacao | null>(null)
  const [docs, setDocs] = useState<DocOption[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string>('')

  const [valoresPagos, setValoresPagos] = useState<string | number>('')
  const [valorDevolver, setValorDevolver] = useState<string | number>('')
  const [valorReter, setValorReter] = useState<string | number>('')
  const [prazoDevolucao, setPrazoDevolucao] = useState<string>('')
  const [baseLegal, setBaseLegal] = useState<string>('')
  const [motivo, setMotivo] = useState<string>('')
  const [quitacaoMutua, setQuitacaoMutua] = useState<boolean>(true)
  const [foroEleicao, setForoEleicao] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getGPNegociacao(id),
      getRecibosSinal(id),
      getPromessas(id),
      getForcaEscrituras(id),
    ])
      .then(([neg, recibos, promessas, forcas]) => {
        setNegociacao(neg)
        if (neg.estagio === 'distratado') {
          toast({ title: 'Aviso', description: 'Esta negociação já foi distratada.' })
          navigate(`/negociacao/${id}/fase-2`)
          return
        }

        const options: DocOption[] = []

        recibos.forEach((r) => {
          options.push({
            id: r.id,
            tipo: 'recibo',
            label: `Recibo de Sinal (Criado em ${new Date(r.created).toLocaleDateString()})`,
            valores_pagos: r.valor_sinal || 0,
            base_legal: 'Retenção a título de cláusula contratual, sujeita à equidade',
          })
        })

        promessas.forEach((p) => {
          let baseLegal = ''
          if (p.arras_tipo === 'penitenciais') {
            baseLegal = 'Retenção a título de arras penitenciais, nos termos do CC art. 420'
          } else if (p.arras_tipo === 'confirmatorias') {
            baseLegal = 'Retenção a título de arras confirmatórias, nos termos do CC art. 418'
          }

          options.push({
            id: p.id,
            tipo: p.subtipo === 'preliminar_condicional' ? 'preliminar' : 'promessa',
            label: `${p.subtipo === 'preliminar_condicional' ? 'Contrato Preliminar' : 'Promessa de Compra e Venda'} (Criado em ${new Date(p.created).toLocaleDateString()})`,
            valores_pagos: p.sinal_valor || 0,
            base_legal: baseLegal,
          })
        })

        forcas.forEach((f) => {
          options.push({
            id: f.id,
            tipo: 'forca_escritura',
            label: `Contrato com Força de Escritura (Criado em ${new Date(f.created).toLocaleDateString()})`,
            valores_pagos: f.valor_recursos_proprios || 0,
            base_legal: '',
          })
        })

        setDocs(options)
        if (options.length === 0) {
          toast({
            title: 'Nenhum contrato',
            description: 'Não há documentos assinados para distratar.',
            variant: 'destructive',
          })
          navigate(`/negociacao/${id}/fase-2`)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, navigate, toast])

  const handleDocChange = (docId: string) => {
    setSelectedDocId(docId)
    const doc = docs.find((d) => d.id === docId)
    if (doc) {
      setValoresPagos(doc.valores_pagos)
      setBaseLegal(doc.base_legal)
    }
  }

  const fillTestData = () => {
    if (docs.length > 0) {
      const doc = docs[0]
      handleDocChange(doc.id)
      setValorDevolver(doc.valores_pagos * 0.8)
      setValorReter(doc.valores_pagos * 0.2)
      setPrazoDevolucao(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0])
      setForoEleicao('São Paulo - SP')
      setMotivo('Desistência imotivada pelo comprador.')
      setQuitacaoMutua(true)
    } else {
      toast({
        title: 'Nenhum documento',
        description: 'Não há documentos para preencher dados de distrato.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !selectedDocId) {
      toast({
        title: 'Erro',
        description: 'Selecione o contrato a ser desfeito.',
        variant: 'destructive',
      })
      return
    }

    const doc = docs.find((d) => d.id === selectedDocId)
    if (!doc) return

    setSaving(true)
    try {
      await createDistrato({
        negociacao_id: id,
        contrato_origem_tipo: doc.tipo,
        contrato_origem_id: doc.id,
        motivo,
        valores_pagos: parseCurrency(String(valoresPagos)),
        valor_devolver: parseCurrency(String(valorDevolver)),
        valor_reter: parseCurrency(String(valorReter)),
        prazo_devolucao: prazoDevolucao
          ? new Date(prazoDevolucao + 'T12:00:00Z').toISOString()
          : undefined,
        quitacao_mutua: quitacaoMutua,
        foro_eleicao: foroEleicao,
        base_legal_retencao: baseLegal,
      })

      await updateGPNegociacao(id, { estagio: 'distratado' })

      toast({ title: 'Distrato efetuado', description: 'A negociação foi cancelada com sucesso.' })
      navigate(`/negociacao/${id}/fase-2`)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o distrato.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Carregando dados...</div>
  if (!negociacao) return null

  return (
    <div className="container mx-auto p-4 max-w-3xl py-8 animate-in fade-in">
      <div className="mb-6 flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-destructive flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" /> Termo de Distrato
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Formalize o cancelamento da negociação e gerencie as retenções financeiras.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Distrato</CardTitle>
            <CardDescription>
              Selecione o documento de origem e preencha as condições do distrato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Qual contrato será desfeito? *</Label>
              <Select value={selectedDocId} onValueChange={handleDocChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um documento assinado..." />
                </SelectTrigger>
                <SelectContent>
                  {docs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valores Pagos (R$)</Label>
                <CurrencyInput value={valoresPagos} onChange={setValoresPagos} />
              </div>
              <div className="space-y-2">
                <Label>Valor a Devolver (R$)</Label>
                <CurrencyInput value={valorDevolver} onChange={setValorDevolver} />
              </div>
              <div className="space-y-2">
                <Label>Valor a Reter (R$)</Label>
                <CurrencyInput value={valorReter} onChange={setValorReter} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prazo para Devolução</Label>
                <Input
                  type="date"
                  value={prazoDevolucao}
                  onChange={(e) => setPrazoDevolucao(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Foro de Eleição</Label>
                <Input
                  value={foroEleicao}
                  onChange={(e) => setForoEleicao(e.target.value)}
                  placeholder="Ex: São Paulo - SP"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Base Legal para Retenção</Label>
              <Textarea
                value={baseLegal}
                onChange={(e) => setBaseLegal(e.target.value)}
                rows={2}
                placeholder="Ex: Retenção a título de arras penitenciais..."
              />
              <p className="text-xs text-muted-foreground">
                Sugerido automaticamente com base no documento de origem.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Motivo do Cancelamento</Label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Descreva o motivo do distrato..."
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="quitacao"
                checked={quitacaoMutua}
                onCheckedChange={(c) => setQuitacaoMutua(!!c)}
              />
              <Label htmlFor="quitacao" className="font-normal cursor-pointer">
                Incluir cláusula de quitação mútua, geral e irrevogável
              </Label>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6 flex justify-between gap-3 border-t">
            <TestFillButton onClick={fillTestData} />
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={saving || !selectedDocId}>
                {saving ? (
                  'Processando...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Confirmar Distrato
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
