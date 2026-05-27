import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGPNegociacao, GPNegociacao } from '@/services/gp_negociacoes'
import { getPropostas } from '@/services/gp_doc_propostas'
import { PhaseIndicator } from './components/PhaseIndicator'
import { DistratoAction } from './components/DistratoAction'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Ban } from 'lucide-react'
import { PropostasStep } from './fase2/PropostasStep'
import { ChecklistStep } from './fase2/ChecklistStep'
import { SinalStep } from './fase2/SinalStep'
import { ContratoStep } from './fase2/ContratoStep'
import { Card } from '@/components/ui/card'

export default function Fase2() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [negociacao, setNegociacao] = useState<GPNegociacao | null>(null)
  const [hasAcceptedProposal, setHasAcceptedProposal] = useState(false)
  const [activeTab, setActiveTab] = useState('propostas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let mounted = true

    getGPNegociacao(id).then((data) => {
      if (!mounted) return
      if (['captacao'].includes(data.estagio || 'captacao')) {
        navigate(`/negociacao/${id}/fase-1`)
      }
      setNegociacao(data)
    })

    getPropostas(id).then((props) => {
      if (!mounted) return
      const accepted = props.some((p) => p.status === 'aceita')
      setHasAcceptedProposal(accepted)
      setLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [id, navigate])

  if (loading || !negociacao)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Carregando Fase 2...
      </div>
    )

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:py-8 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negociação - Fase 2</h1>
          <p className="text-muted-foreground mt-1">
            Diligência, Propostas e Promessa de Compra e Venda
          </p>
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

      <PhaseIndicator currentPhase={2} />

      <Card className="p-1 sm:p-2 border-border/50 shadow-sm mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-12 gap-1 bg-muted/50 p-1">
            <TabsTrigger value="propostas" className="py-2.5 text-xs md:text-sm font-medium">
              1. Propostas
            </TabsTrigger>
            <TabsTrigger
              value="checklist"
              disabled={!hasAcceptedProposal}
              className="py-2.5 text-xs md:text-sm font-medium"
            >
              2. Checklist
            </TabsTrigger>
            <TabsTrigger
              value="sinal"
              disabled={!hasAcceptedProposal}
              className="py-2.5 text-xs md:text-sm font-medium"
            >
              3. Sinal Opcional
            </TabsTrigger>
            <TabsTrigger
              value="contrato"
              disabled={!hasAcceptedProposal}
              className="py-2.5 text-xs md:text-sm font-medium"
            >
              4. Estrutura
            </TabsTrigger>
          </TabsList>

          <div className="p-4 md:p-6 min-h-[400px]">
            <TabsContent value="propostas" className="m-0 mt-0 focus-visible:outline-none">
              <PropostasStep
                negociacaoId={id!}
                onAccepted={() => {
                  setHasAcceptedProposal(true)
                  setActiveTab('checklist')
                }}
              />
            </TabsContent>

            <TabsContent value="checklist" className="m-0 mt-0 focus-visible:outline-none">
              <ChecklistStep negociacaoId={id!} onNext={() => setActiveTab('sinal')} />
            </TabsContent>

            <TabsContent value="sinal" className="m-0 mt-0 focus-visible:outline-none">
              <SinalStep negociacaoId={id!} onNext={() => setActiveTab('contrato')} />
            </TabsContent>

            <TabsContent value="contrato" className="m-0 mt-0 focus-visible:outline-none">
              <ContratoStep negociacaoId={id!} negociacaoValorTotal={negociacao.valor_total || 0} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
