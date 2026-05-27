import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, FilePlus, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentInfo } from './dashboard-data'

export function PhaseCard({ doc }: { doc: DocumentInfo }) {
  const navigate = useNavigate()

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-md border-border/60',
        doc.goldenRule &&
          'border-amber-400 dark:border-amber-500 shadow-amber-100/50 dark:shadow-amber-900/20',
      )}
    >
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          doc.statusType === 'mandatory' && !doc.goldenRule && 'bg-red-500',
          doc.statusType === 'optional' && !doc.goldenRule && 'bg-slate-300 dark:bg-slate-700',
          doc.goldenRule && 'bg-amber-500',
        )}
      />
      <CardHeader className="pb-3 pl-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <CardTitle className="text-xl">{doc.title}</CardTitle>
              {doc.goldenRule && (
                <Badge
                  variant="default"
                  className="bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-1 px-2 py-0.5 shadow-sm"
                >
                  <Star className="w-3 h-3 fill-current" />
                  Regra de Ouro
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm mt-1 font-medium">{doc.subtitle}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 text-center px-3 py-1',
              doc.statusType === 'mandatory' &&
                'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 font-semibold',
              doc.statusType === 'optional' &&
                'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 font-normal',
            )}
          >
            {doc.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pl-6">
        <p className="text-sm md:text-base leading-relaxed text-foreground/90">{doc.description}</p>
        <div className="mt-5 bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-lg flex items-start gap-3 border border-amber-100 dark:border-amber-900/40">
          <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-full shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm block mb-0.5">
              Dica de Uso
            </span>
            <p className="text-sm text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
              {doc.tip}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 pb-4 bg-muted/30 border-t border-border/50 pl-6">
        <Button
          onClick={() =>
            navigate(`/contratos/novo?tipo=${doc.typeId}`, {
              state: { tipo_documento: doc.typeId },
            })
          }
          className={cn(
            'w-full sm:w-auto font-medium shadow-sm',
            doc.goldenRule && 'bg-amber-500 hover:bg-amber-600 text-white',
          )}
          variant={
            (doc.statusType === 'mandatory' && !doc.goldenRule) || doc.goldenRule
              ? 'default'
              : 'secondary'
          }
        >
          <FilePlus className="w-4 h-4 mr-2" />
          Gerar documento
        </Button>
      </CardFooter>
    </Card>
  )
}
