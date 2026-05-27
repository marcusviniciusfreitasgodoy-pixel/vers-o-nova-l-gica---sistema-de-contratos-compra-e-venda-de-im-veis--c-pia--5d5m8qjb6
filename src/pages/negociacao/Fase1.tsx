import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Step1Autorizacao from './components/Step1Autorizacao'
import Step2FichaCadastral from './components/Step2FichaCadastral'
import Step3Viabilidade from './components/Step3Viabilidade'

export default function Fase1() {
  const { id } = useParams()
  const [step, setStep] = useState(1)

  const phases = [
    { num: 1, title: 'Autorização', status: step >= 1 ? 'current' : 'disabled' },
    { num: 2, title: 'Ficha Cadastral', status: step >= 2 ? 'current' : 'disabled' },
    { num: 3, title: 'Viabilidade', status: step >= 3 ? 'current' : 'disabled' },
  ]

  if (step > 3) {
    return (
      <div className="container mx-auto p-6 max-w-5xl animate-in fade-in space-y-8 text-center">
        <div className="py-24">
          <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-500/10">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-4xl font-bold text-slate-800">Fase 1 Concluída!</h2>
          <p className="text-muted-foreground mt-4 text-lg max-w-md mx-auto">
            A negociação avançou com sucesso para o estágio de proposta.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to={`/negociacao/${id}/fase-2`}>Ir para Fase 2</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard">Voltar ao Painel</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl animate-in fade-in space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Fase 1: Captação{' '}
            <span className="font-mono text-muted-foreground ml-2">#{id?.slice(0, 8)}</span>
          </h1>
        </div>
      </div>

      <div className="py-8 px-4">
        <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">
          <div className="absolute left-0 top-5 w-full h-1 bg-slate-200 -z-10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
          {phases.map((p) => (
            <div key={p.num} className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300',
                  p.status === 'current'
                    ? 'bg-primary text-primary-foreground border-white shadow-md ring-2 ring-primary/20 scale-110'
                    : 'bg-slate-100 text-slate-400 border-white',
                )}
              >
                {p.num}
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tracking-tight transition-colors',
                  p.status === 'current' ? 'text-slate-800' : 'text-slate-400',
                )}
              >
                {p.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="shadow-md border-slate-200/60">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xl text-slate-700">
            Passo {step}: {phases[step - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 && <Step1Autorizacao negociacaoId={id!} onNext={() => setStep(2)} />}
          {step === 2 && <Step2FichaCadastral negociacaoId={id!} onNext={() => setStep(3)} />}
          {step === 3 && <Step3Viabilidade negociacaoId={id!} onNext={() => setStep(4)} />}
        </CardContent>
      </Card>
    </div>
  )
}
