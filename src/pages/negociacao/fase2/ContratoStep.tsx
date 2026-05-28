import { useState } from 'react'
import { createPromessa } from '@/services/gp_doc_promessa'
import { updateGPNegociacao, getGPNegociacao } from '@/services/gp_negociacoes'
import { logSystemError } from '@/services/system_error_logs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { InfoIcon, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { TestFillButton } from '@/components/TestFillButton'

export function ContratoStep({
  negociacaoId,
  negociacaoValorTotal,
}: {
  negociacaoId: string
  negociacaoValorTotal: number
}) {
  const navigate = useNavigate()
  const [hasConditions, setHasConditions] = useState(false)
  const [condicoes, setCondicoes] = useState('')
  const [prazoCondicoes, setPrazoCondicoes] = useState('')
  const [tipoArras, setTipoArras] = useState<'confirmatorias' | 'penitenciais'>('confirmatorias')
  const [dataPosse, setDataPosse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fillTestData = () => {
    setHasConditions(true)
    setCondicoes('Aprovação de financiamento bancário em até 30 dias.')
    setPrazoCondicoes('30')
    setTipoArras('penitenciais')
    setDataPosse('2024-12-31')
  }

  const documentType = hasConditions
    ? 'CONTRATO PRELIMINAR CONDICIONAL'
    : 'PROMESSA DE COMPRA E VENDA (PLENA)'

  const handleFinalize = async () => {
    if (!negociacaoId) {
      return toast.error('ID da negociação não encontrado no contexto atual.')
    }

    if (!negociacaoValorTotal || negociacaoValorTotal <= 0) {
      return toast.error('Valor total da negociação é obrigatório e deve ser maior que zero.')
    }

    if (hasConditions && (!condicoes || !prazoCondicoes)) {
      return toast.error('Preencha a descrição das condições e o prazo.')
    }

    if (!dataPosse) {
      return toast.error('Informe a data de imissão na posse.')
    }

    setIsSubmitting(true)
    try {
      const subtipo = hasConditions ? 'preliminar_condicional' : 'promessa_plena'
      const promessa = await createPromessa({
        negociacao_id: negociacaoId,
        subtipo,
        valor_total: negociacaoValorTotal,
        arras_tipo: tipoArras,
        direito_arrependimento: tipoArras === 'penitenciais',
        condicoes_suspensivas: hasConditions ? { texto: condicoes } : undefined,
        prazo_implemento_condicao: hasConditions ? Number(prazoCondicoes) : undefined,
        irretratavel: !hasConditions,
        clausula_registro: !hasConditions,
        posse_data_entrega: new Date(dataPosse).toISOString(),
      })

      try {
        const novoEstagio = subtipo === 'promessa_plena' ? 'promessa' : 'preliminar'
        await updateGPNegociacao(negociacaoId, { estagio: novoEstagio })

        const neg = await getGPNegociacao(negociacaoId)
        if (neg.case_id) {
          // Update the case status to 'aguardando_documentos' since fase 2 is complete
          await pb.collection('cases').update(neg.case_id, { estado_caso: 'aguardando_documentos' })

          toast.success('Diretrizes finalizadas com sucesso!')
          navigate(`/casos/${neg.case_id}`)
        } else {
          toast.success('Fase 2 concluída com sucesso!')
          navigate(`/negociacao/${negociacaoId}/fase-3`)
        }
      } catch (innerErr) {
        // Rollback on partial failure
        await pb
          .collection('gp_doc_promessa')
          .delete(promessa.id)
          .catch(() => {})
        throw innerErr
      }
    } catch (err: any) {
      toast.error('Erro ao salvar diretrizes do contrato')

      let negociacaoState = null
      try {
        if (negociacaoId) {
          negociacaoState = await getGPNegociacao(negociacaoId)
        }
      } catch (e) {
        // ignore if we can't fetch it to prevent breaking the error handler
      }

      await logSystemError({
        error_message: err?.message || 'Erro desconhecido ao salvar diretrizes do contrato',
        stack_trace: err?.stack || '',
        component: 'ContratoStep',
        severity: 'error',
        context_data: {
          payload: {
            subtipo: hasConditions ? 'preliminar_condicional' : 'promessa_plena',
            valor_total: negociacaoValorTotal,
            arras_tipo: tipoArras,
            condicoes,
            prazoCondicoes,
          },
          negociacao: negociacaoState,
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 mt-6 max-w-3xl mx-auto">
      <Card className="border-primary/20 bg-muted/10 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="condicoes"
                className="text-base font-bold text-foreground cursor-pointer block"
              >
                Existem condições pendentes para o fechamento?
              </Label>
              <p className="text-sm text-muted-foreground">
                Ex: liberação de financiamento, baixa de gravame, inventário pendente.
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-background p-3 rounded-full border shadow-sm shrink-0">
              <span className="text-sm font-medium">Não</span>
              <Switch id="condicoes" checked={hasConditions} onCheckedChange={setHasConditions} />
              <span className="text-sm font-medium">Sim</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-primary/5 border border-primary/20 p-5 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center">
        <InfoIcon className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="font-bold text-lg text-primary">{documentType}</p>
          <p className="text-sm text-foreground/80 mt-1">
            {hasConditions
              ? 'Este tipo de contrato protege as partes definindo condições que devem ser cumpridas antes da obrigação principal. Ele não é irretratável nem prevê registro imediato.'
              : 'Este formato garante maior segurança jurídica final, configurando uma promessa plena, de caráter irretratável, pronta para registro na matrícula (se desejado).'}
          </p>
        </div>
      </div>

      {hasConditions && (
        <Card className="border-border animate-fade-in">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <CardTitle className="text-base">Detalhes da Condição Suspensiva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="space-y-2">
              <Label>Descreva as Condições</Label>
              <Textarea
                placeholder="Descreva claramente o evento futuro e incerto..."
                value={condicoes}
                onChange={(e) => setCondicoes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo Limite para Cumprimento (dias corridos)</Label>
              <Input
                type="number"
                value={prazoCondicoes}
                onChange={(e) => setPrazoCondicoes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <CardTitle className="text-base">Configuração de Arras (Sinal)</CardTitle>
          <CardDescription>Defina as penalidades para desistência</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="space-y-2">
            <Label>Tipo de Arras</Label>
            <Select value={tipoArras} onValueChange={(v: any) => setTipoArras(v)}>
              <SelectTrigger className="w-full font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmatorias">
                  Confirmatórias (Sem direito a arrependimento)
                </SelectItem>
                <SelectItem value="penitenciais">
                  Penitenciais (Com direito a arrependimento)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted p-4 text-sm rounded-md flex gap-3 items-start border">
            <CheckCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-1">Base Legal e Efeitos (Automático):</strong>
              {tipoArras === 'confirmatorias'
                ? 'Serão aplicados os Arts. 417 e 418 do Código Civil. O contrato não terá cláusula de arrependimento. A parte inadimplente perde o sinal ou o devolve em dobro.'
                : 'Serão aplicados os Arts. 419 e 420 do Código Civil. É garantido o direito de arrependimento, funcionando as arras como taxa mínima de indenização.'}
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-border">
            <Label>Data de Imissão na Posse</Label>
            <Input type="date" value={dataPosse} onChange={(e) => setDataPosse(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Obrigatório para definir a transferência de responsabilidades.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-6 border-t">
        <TestFillButton onClick={fillTestData} />
        <Button
          size="lg"
          className="w-full md:w-auto px-10"
          onClick={handleFinalize}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Finalizando...' : 'Gerar Estrutura de Contrato'}
        </Button>
      </div>
    </div>
  )
}
