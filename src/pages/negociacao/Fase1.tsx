import { useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhaseIndicator } from './components/PhaseIndicator'
import Step1Autorizacao from './components/Step1Autorizacao'
import Step2FichaCadastral from './components/Step2FichaCadastral'
import Step3Viabilidade from './components/Step3Viabilidade'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/use-auth'
import { getGPNegociacao, deleteGPNegociacao } from '@/services/gp_negociacoes'
import { deleteCase } from '@/services/cases'
import { toast } from 'sonner'

export default function Fase1() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isDeleting, setIsDeleting] = useState(false)

  const phases = [
    {
      num: 1,
      title: 'Autorização',
      status: step > 1 ? 'completed' : step === 1 ? 'current' : 'disabled',
    },
    {
      num: 2,
      title: 'Ficha Cadastral',
      status: step > 2 ? 'completed' : step === 2 ? 'current' : 'disabled',
    },
    {
      num: 3,
      title: 'Viabilidade',
      status: step > 3 ? 'completed' : step === 3 ? 'current' : 'disabled',
    },
  ]

  const handleDelete = async () => {
    if (!id) return
    try {
      setIsDeleting(true)
      const neg = await getGPNegociacao(id)

      await deleteGPNegociacao(id)

      if (neg.case_id) {
        try {
          await deleteCase(neg.case_id)
        } catch (err) {
          console.warn('Caso atrelado não pôde ser excluído ou já removido:', err)
        }
      }

      toast.success('Negociação excluída com sucesso!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao excluir negociação:', error)
      toast.error('Erro ao excluir negociação. Verifique as permissões ou dependências.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (step > 3) {
    return <Navigate to={`/negociacao/${id}/fase-2`} replace />
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl animate-in fade-in space-y-8 pb-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
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

          {user?.role !== 'operador' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir Negociação
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deseja realmente excluir esta negociação? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <PhaseIndicator currentPhase={2} />
      </div>

      <div className="py-2 px-4 mb-4">
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
                  p.status === 'completed'
                    ? 'bg-green-500 text-white border-white shadow-md ring-2 ring-green-500/20'
                    : p.status === 'current'
                      ? 'bg-primary text-primary-foreground border-white shadow-md ring-2 ring-primary/20 scale-110'
                      : 'bg-slate-100 text-slate-400 border-white',
                )}
              >
                {p.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : p.num}
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tracking-tight transition-colors',
                  p.status === 'current'
                    ? 'text-slate-800'
                    : p.status === 'completed'
                      ? 'text-green-600'
                      : 'text-slate-400',
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
