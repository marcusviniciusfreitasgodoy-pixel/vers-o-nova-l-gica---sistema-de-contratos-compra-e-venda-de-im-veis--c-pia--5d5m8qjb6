import { useParams, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Fase1() {
  const { id } = useParams()

  const phases = [
    { num: 1, title: 'Fase 1', status: 'current' },
    { num: 2, title: 'Fase 2', status: 'disabled' },
    { num: 3, title: 'Fase 3', status: 'disabled' },
    { num: 4, title: 'Fase 4', status: 'disabled' },
  ]

  return (
    <div className="container mx-auto p-6 max-w-5xl animate-in fade-in space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/negociacao/nova">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Negociação{' '}
            <span className="font-mono text-muted-foreground ml-2">#{id?.slice(0, 8)}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhamento e geração de documentos
          </p>
        </div>
      </div>

      <div className="py-8">
        <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">
          <div className="absolute left-0 top-5 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
          {phases.map((p) => (
            <div key={p.num} className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors',
                  p.status === 'current'
                    ? 'bg-primary text-primary-foreground border-white shadow-sm ring-2 ring-primary/20'
                    : 'bg-slate-100 text-slate-400 border-white',
                )}
              >
                {p.num}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  p.status === 'current' ? 'text-slate-800' : 'text-slate-400',
                )}
              >
                {p.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
          <div className="bg-primary/10 p-5 rounded-full mb-6 ring-8 ring-primary/5">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Fase 1 — em construção</h2>
          <p className="text-slate-500 max-w-md text-base leading-relaxed">
            Em breve você poderá gerenciar a captação, viabilidade e checklists diretamente por
            aqui.
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link to="/negociacao/nova">Voltar para o portal</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
