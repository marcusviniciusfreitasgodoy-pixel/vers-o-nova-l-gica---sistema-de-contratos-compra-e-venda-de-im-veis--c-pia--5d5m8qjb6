import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PhaseIndicator } from './components/PhaseIndicator'
import { StepTermoChaves } from './components/StepTermoChaves'
import { StepTermoPosse } from './components/StepTermoPosse'
import { StepConclusion } from './components/StepConclusion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { GPNegociacao } from '@/services/gp_negociacoes'
import { Loader2 } from 'lucide-react'

export default function Fase4() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [negociacao, setNegociacao] = useState<GPNegociacao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      pb.collection('gp_negociacoes')
        .getOne<GPNegociacao>(id)
        .then((n) => {
          setNegociacao(n)
          if (n.estagio === 'concluido') {
            setStep(3)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!id || !negociacao) return null

  const isReadOnly = negociacao.estagio === 'concluido'

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-8 animate-in fade-in">
      <PhaseIndicator currentPhase={4} />
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Fase 4: Termo de Entrega de Chaves'}
            {step === 2 && 'Fase 4: Termo de Posse'}
            {step === 3 && 'Conclusão da Negociação'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 && (
            <StepTermoChaves
              negociacaoId={id}
              onNext={() => setStep(isReadOnly ? 3 : 2)}
              isReadOnly={isReadOnly}
            />
          )}
          {step === 2 && (
            <StepTermoPosse
              negociacaoId={id}
              onNext={() => {
                setNegociacao({ ...negociacao, estagio: 'concluido' })
                setStep(3)
              }}
              onBack={() => setStep(1)}
              isReadOnly={isReadOnly}
            />
          )}
          {step === 3 && (
            <StepConclusion
              negociacaoId={id}
              negociacao={negociacao}
              onFinish={() => navigate('/dashboard')}
              onViewChaves={() => setStep(1)}
              onViewPosse={() => setStep(2)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
