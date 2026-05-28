import { useState, useEffect } from 'react'
import { fetchStep3Data, finishPhase1 } from '@/services/fase1_helpers'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { TestFillButton } from '@/components/TestFillButton'

export default function Step3Viabilidade({
  negociacaoId,
  onNext,
}: {
  negociacaoId: string
  onNext: () => void
}) {
  const [checklist, setChecklist] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStep3Data(negociacaoId).then((d) => setChecklist(d.checklist))
  }, [negociacaoId])

  const handleUpdateItem = (index: number, changes: any) => {
    const newItems = [...checklist.itens]
    newItems[index] = { ...newItems[index], ...changes }
    setChecklist({ ...checklist, itens: newItems })
  }

  const fillTestData = () => {
    if (!checklist) return
    const newItems = checklist.itens.map((i: any) => ({
      ...i,
      status: 'recebido',
      observacao: 'Documento recebido e validado (Teste).',
    }))
    setChecklist({ ...checklist, itens: newItems })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allReceived = checklist.itens.every((i: any) => !i.obrigatorio || i.status === 'recebido')
    if (!allReceived) {
      toast.error('Todos os itens obrigatórios devem estar marcados como Recebido.')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData(e.target as HTMLFormElement)
      fd.append('itens', JSON.stringify(checklist.itens))
      await pb.collection('gp_doc_checklist').update(checklist.id, fd)
      await finishPhase1(negociacaoId)
      toast.success('Dados salvos com sucesso! Redirecionando para Fase 2...')
      onNext()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar: Verifique os campos obrigatórios')
    } finally {
      setLoading(false)
    }
  }

  if (!checklist)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando checklist de viabilidade...
      </div>
    )

  return (
    <form onSubmit={onSubmit} className="space-y-6 animate-in fade-in">
      <div className="space-y-4">
        {checklist.itens.map((item: any, idx: number) => (
          <div
            key={idx}
            className="p-5 border border-slate-200 rounded-lg space-y-4 bg-slate-50 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={`check-${idx}`}
                checked={item.status === 'recebido'}
                onCheckedChange={(c) =>
                  handleUpdateItem(idx, { status: c ? 'recebido' : 'pendente' })
                }
                className="h-5 w-5"
              />
              <Label
                htmlFor={`check-${idx}`}
                className="font-bold text-base cursor-pointer select-none text-slate-800"
              >
                {item.descricao} {item.obrigatorio && <span className="text-red-500">*</span>}
              </Label>
            </div>
            <div className="pl-8 space-y-4">
              <Input
                placeholder="Observações adicionais (opcional)"
                value={item.observacao || ''}
                onChange={(e) => handleUpdateItem(idx, { observacao: e.target.value })}
                className="bg-white"
              />
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider font-semibold">
                  Anexar documento
                </Label>
                <Input
                  type="file"
                  name="arquivos"
                  multiple
                  className="bg-white cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-6 border-t">
        <TestFillButton onClick={fillTestData} />
        <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
          Concluir Fase 1
        </Button>
      </div>
    </form>
  )
}
