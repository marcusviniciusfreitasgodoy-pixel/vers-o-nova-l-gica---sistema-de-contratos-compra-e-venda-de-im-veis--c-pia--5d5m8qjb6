import { useState, useEffect } from 'react'
import { fetchStep3Data } from '@/services/fase1_helpers'
import { finishPhase1 } from '@/services/fase1_helpers'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { DocumentActions } from './DocumentActions'
import pb from '@/lib/pocketbase/client'

export default function Step3Viabilidade({
  negociacaoId,
  onNext,
}: {
  negociacaoId: string
  onNext: () => void
}) {
  const [checklist, setChecklist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    fetchStep3Data(negociacaoId).then((data) => {
      setChecklist(data.checklist)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [negociacaoId])

  const toggleItem = async (idx: number, currentStatus: string) => {
    if (!checklist) return
    const newItems = [...checklist.itens]
    newItems[idx] = {
      ...newItems[idx],
      status: currentStatus === 'aprovado' ? 'pendente' : 'aprovado',
    }

    setChecklist({ ...checklist, itens: newItems })

    try {
      await pb.collection('gp_doc_checklist').update(checklist.id, { itens: newItems })
    } catch {
      toast.error('Erro ao atualizar item do checklist')
    }
  }

  const handleFinish = async () => {
    const pendingCritical = checklist?.itens?.some(
      (i: any) => i.obrigatorio && i.status !== 'aprovado',
    )
    if (pendingCritical) {
      toast.warning('Avançando com pendências', {
        description: 'Existem documentos obrigatórios que não foram aprovados.',
      })
    }

    setSaving(true)
    try {
      await finishPhase1(negociacaoId)
      toast.success('Fase 1 concluída com sucesso!')
      onNext()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao concluir fase')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando checklist de viabilidade...
      </div>
    )

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-lg border-b border-slate-200 pb-2 text-slate-800 mb-4">
          Checklist de Viabilidade Jurídica
        </h3>

        <div className="space-y-3">
          {checklist?.itens?.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-start space-x-3 p-3 rounded bg-white border border-slate-100 shadow-sm hover:border-primary/30 transition-colors"
            >
              <Checkbox
                id={`item-${idx}`}
                checked={item.status === 'aprovado'}
                onCheckedChange={() => toggleItem(idx, item.status)}
                className="mt-1"
              />
              <label
                htmlFor={`item-${idx}`}
                className="text-sm font-medium leading-relaxed cursor-pointer flex-1 text-slate-700"
              >
                {item.descricao}
                {item.obrigatorio && (
                  <span className="text-red-500 ml-1" title="Obrigatório">
                    *
                  </span>
                )}
              </label>
              <div className="text-xs">
                {item.status === 'aprovado' ? (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    Aprovado
                  </span>
                ) : (
                  <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                    Pendente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleFinish} disabled={saving} size="lg">
          {saving ? 'Concluindo...' : 'Concluir Fase 1'}
        </Button>
      </div>

      {checklist && (
        <div className="pt-2">
          <DocumentActions
            negociacaoId={negociacaoId}
            tipoDocumento="checklist_documental"
            title="Ações - Relatório de Viabilidade"
            onGenerateData={() => ({
              tipo: 'checklist_documental',
              negociacaoId,
              checklist,
            })}
          />
        </div>
      )}
    </div>
  )
}
