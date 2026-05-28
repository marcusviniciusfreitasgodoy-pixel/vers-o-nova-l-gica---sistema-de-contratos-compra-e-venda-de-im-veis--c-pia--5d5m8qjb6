import { useEffect, useState } from 'react'
import { getPropostas, updateProposta, GPDocProposta } from '@/services/gp_doc_propostas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PropostaForm } from './PropostaForm'
import { CheckCircle2, XCircle, ArrowRightLeft, FileDown, Loader2 } from 'lucide-react'
import { generateMinutaFromNegociacao, downloadDocx } from '@/services/gp_mapper'
import { toast } from 'sonner'
import { DocumentActions } from '../components/DocumentActions'

export function PropostasStep({
  negociacaoId,
  onAccepted,
}: {
  negociacaoId: string
  onAccepted: () => void
}) {
  const [propostas, setPropostas] = useState<GPDocProposta[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [counterTo, setCounterTo] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const load = () => getPropostas(negociacaoId).then(setPropostas)
  useEffect(() => {
    load()
  }, [negociacaoId])

  const handleAccept = async (p: GPDocProposta) => {
    await updateProposta(p.id, { status: 'aceita', data_aceite: new Date().toISOString() })
    load()
    onAccepted()
  }

  const handleRefuse = async (p: GPDocProposta) => {
    await updateProposta(p.id, { status: 'recusada' })
    load()
  }

  const sorted = [...propostas].sort(
    (a, b) => (b.rodada_negociacao || 0) - (a.rodada_negociacao || 0),
  )
  const lastProposta = sorted[0]

  return (
    <div className="space-y-8 mt-6">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
        <div>
          <h2 className="text-lg font-bold">Ciclo de Propostas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie o envio, recusa ou aceite de ofertas.
          </p>
        </div>
        {!lastProposta && (
          <Button onClick={() => setIsFormOpen(true)}>Iniciar Primeira Oferta</Button>
        )}
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[2rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
        {sorted.map((p) => (
          <div
            key={p.id}
            className="relative z-10 flex flex-col md:flex-row gap-4 items-start pl-12 md:pl-16"
          >
            <div className="absolute left-0 w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center font-bold shadow-sm">
              {p.rodada_negociacao}
            </div>
            <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="space-y-2 w-full">
                  <div className="flex gap-3 items-center mb-1">
                    <span className="font-bold text-base text-primary">
                      Proposta da Rodada {p.rodada_negociacao}
                    </span>
                    <Badge
                      variant={
                        p.status === 'aceita'
                          ? 'default'
                          : p.status === 'recusada'
                            ? 'destructive'
                            : p.status === 'contraproposta'
                              ? 'secondary'
                              : 'outline'
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded">
                    <div>
                      <span className="font-semibold text-muted-foreground">Valor:</span> <br />
                      <span className="text-base font-medium">
                        R$ {p.valor_ofertado.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground">Validade:</span> <br />
                      {p.prazo_validade_dias} dias
                    </div>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="font-semibold text-muted-foreground">Condições:</span>
                    <p className="mt-1 leading-relaxed">{p.condicoes_oferta}</p>
                  </div>
                </div>
                {p.id === lastProposta?.id && p.status === 'enviada' && (
                  <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                    <Button
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleAccept(p)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aceitar
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        setCounterTo(p.id)
                        setIsFormOpen(true)
                      }}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" /> Contraproposta
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleRefuse(p)}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Recusar
                    </Button>
                  </div>
                )}
                {p.status === 'aceita' && (
                  <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      className="w-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                      onClick={async () => {
                        setIsGenerating(true)
                        try {
                          const { docxResponse } = await generateMinutaFromNegociacao(negociacaoId)
                          downloadDocx(docxResponse.html, docxResponse.filename)
                          toast.success('Minuta gerada com sucesso!')
                        } catch (err: any) {
                          toast.error(err.message || 'Erro ao gerar minuta')
                        } finally {
                          setIsGenerating(false)
                        }
                      }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4 mr-2" />
                      )}
                      Gerar Minuta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="pl-0 md:pl-16 mt-8 relative z-20">
          <PropostaForm
            negociacaoId={negociacaoId}
            propostaAnteriorId={counterTo}
            rodadaAtual={lastProposta ? (lastProposta.rodada_negociacao || 1) + 1 : 1}
            onSuccess={() => {
              setIsFormOpen(false)
              setCounterTo(null)
              load()
            }}
            onCancel={() => {
              setIsFormOpen(false)
              setCounterTo(null)
            }}
          />
        </div>
      )}

      {sorted.some((p) => p.status === 'aceita') && (
        <div className="pl-0 md:pl-16 mt-8 relative z-20 animate-in fade-in slide-in-from-bottom-4">
          <DocumentActions
            negociacaoId={negociacaoId}
            tipoDocumento="recibo_sinal"
            title="Ações - Proposta / Recibo de Sinal"
            onGenerateData={() => ({
              tipo: 'recibo_sinal',
              negociacaoId,
              proposta: sorted.find((p) => p.status === 'aceita'),
            })}
          />
        </div>
      )}
    </div>
  )
}
