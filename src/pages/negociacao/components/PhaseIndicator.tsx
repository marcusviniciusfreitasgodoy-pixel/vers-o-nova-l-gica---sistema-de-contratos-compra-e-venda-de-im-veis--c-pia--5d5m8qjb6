import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PhaseIndicator({ currentPhase }: { currentPhase: number }) {
  const phases = [
    { num: 1, label: 'Cadastro', desc: 'Qualificação' },
    { num: 2, label: 'Negociação', desc: 'Propostas e Diretrizes' },
    { num: 3, label: 'Revisão', desc: 'Análise Jurídica' },
    { num: 4, label: 'Assinatura', desc: 'Minuta e Aprovação' },
  ]

  return (
    <div className="flex items-center justify-between w-full mb-8">
      {phases.map((phase, idx) => {
        const isCompleted = phase.num < currentPhase
        const isCurrent = phase.num === currentPhase
        return (
          <div key={phase.num} className="flex items-center w-full">
            <div className="flex flex-col items-center flex-shrink-0 z-10 bg-background px-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors',
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground border-2 border-primary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : phase.num}
              </div>
              <div className="mt-2 text-xs font-semibold">{phase.label}</div>
              <div className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:block">
                {phase.desc}
              </div>
            </div>
            {idx < phases.length - 1 && (
              <div className="flex-1 -ml-4 -mr-4">
                <div
                  className={cn(
                    'h-1 rounded-full w-full',
                    phase.num < currentPhase ? 'bg-green-500' : 'bg-muted',
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
