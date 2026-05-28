import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TestFillButton({
  onClick,
  className,
}: {
  onClick: () => void | Promise<void>
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('bg-primary/5 hover:bg-primary/10 border-primary/20', className)}
      onClick={onClick}
    >
      <Wand2 className="w-4 h-4 mr-2 text-primary" />
      Preencher Dados de Teste
    </Button>
  )
}
