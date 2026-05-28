import { useEffect, useState } from 'react'
import {
  getChecklistsByNegociacao,
  createChecklist,
  updateChecklist,
  GPDocChecklist,
} from '@/services/gp_doc_checklist'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { DocumentActions } from '../components/DocumentActions'

const PRE_POPULATED = {
  vendedor: [
    { descricao: 'RG/CPF', obrigatorio: true, status: 'pendente' },
    { descricao: 'Certidão de Estado Civil', obrigatorio: true, status: 'pendente' },
    { descricao: 'Pacto Antenupcial (se aplicável)', obrigatorio: false, status: 'pendente' },
    {
      descricao: 'Certidões Pessoais (Federal, Estadual, Trabalhista)',
      obrigatorio: true,
      status: 'pendente',
    },
    { descricao: 'Comprovante de Residência', obrigatorio: true, status: 'pendente' },
  ],
  comprador: [
    { descricao: 'RG/CPF', obrigatorio: true, status: 'pendente' },
    { descricao: 'Certidão de Estado Civil', obrigatorio: true, status: 'pendente' },
    { descricao: 'Comprovante de Renda', obrigatorio: true, status: 'pendente' },
    { descricao: 'Comprovante de Residência', obrigatorio: true, status: 'pendente' },
    { descricao: 'Certidões Pessoais', obrigatorio: true, status: 'pendente' },
  ],
  imovel: [
    { descricao: 'IPTU do ano vigente', obrigatorio: true, status: 'pendente' },
    { descricao: 'Certidão de Quitação Condominial', obrigatorio: true, status: 'pendente' },
    { descricao: 'Planta baixa', obrigatorio: false, status: 'pendente' },
    { descricao: 'Habite-se', obrigatorio: true, status: 'pendente' },
    { descricao: 'Espelho IPTU', obrigatorio: true, status: 'pendente' },
    { descricao: 'Declaração de inexistência de débitos', obrigatorio: true, status: 'pendente' },
  ],
}

export function ChecklistStep({
  negociacaoId,
  onNext,
}: {
  negociacaoId: string
  onNext: () => void
}) {
  const [checklists, setChecklists] = useState<GPDocChecklist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getChecklistsByNegociacao(negociacaoId).then(async (data) => {
      if (!mounted) return
      const fase2List = data.filter((c) => c.momento_exigencia === 'diligencia_fase2')
      if (fase2List.length === 0) {
        try {
          const created = await Promise.all([
            createChecklist({
              negociacao_id: negociacaoId,
              momento_exigencia: 'diligencia_fase2',
              categoria_parte: 'vendedor',
              itens: PRE_POPULATED.vendedor as any,
            }),
            createChecklist({
              negociacao_id: negociacaoId,
              momento_exigencia: 'diligencia_fase2',
              categoria_parte: 'comprador',
              itens: PRE_POPULATED.comprador as any,
            }),
            createChecklist({
              negociacao_id: negociacaoId,
              momento_exigencia: 'diligencia_fase2',
              categoria_parte: 'imovel',
              itens: PRE_POPULATED.imovel as any,
            }),
          ])
          if (mounted) setChecklists(created as any)
        } catch (err) {
          console.error(err)
        }
      } else {
        setChecklists(fase2List)
      }
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [negociacaoId])

  const toggleItem = async (checklistId: string, itemIdx: number, currentStatus: string) => {
    const cl = checklists.find((c) => c.id === checklistId)
    if (!cl || !cl.itens) return
    const newItems = [...cl.itens]
    newItems[itemIdx] = {
      ...newItems[itemIdx],
      status: currentStatus === 'aprovado' ? 'pendente' : 'aprovado',
    }

    // Optimistic update
    setChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? ({ ...c, itens: newItems } as GPDocChecklist) : c)),
    )

    try {
      await updateChecklist(checklistId, { itens: newItems })
    } catch {
      toast.error('Erro ao atualizar item')
    }
  }

  const handleAdvance = () => {
    const pendingCritical = checklists.some((c) =>
      c.itens?.some((i) => i.obrigatorio && i.status !== 'aprovado'),
    )
    if (pendingCritical) {
      toast.warning('Avançando com pendências', {
        description: 'Existem documentos obrigatórios que ainda não foram aprovados.',
      })
    }
    onNext()
  }

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando checklist...
      </div>
    )

  return (
    <div className="space-y-8 mt-6">
      <div className="bg-muted/30 p-4 rounded-lg border">
        <h2 className="text-lg font-bold">Checklist de Diligência</h2>
        <p className="text-sm text-muted-foreground">
          Documentação exigida para a fase de análise pré-contratual.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {checklists.map((cl) => (
          <Card key={cl.id} className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="capitalize text-base">{cl.categoria_parte}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {cl.itens?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`${cl.id}-${idx}`}
                    checked={item.status === 'aprovado'}
                    onCheckedChange={() => toggleItem(cl.id, idx, item.status)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`${cl.id}-${idx}`}
                    className="text-sm font-medium leading-tight cursor-pointer flex-1"
                  >
                    {item.descricao}
                    {item.obrigatorio && (
                      <span className="text-destructive ml-1" title="Obrigatório">
                        *
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleAdvance} size="lg">
          Avançar para Sinal <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="pt-4">
        <DocumentActions
          negociacaoId={negociacaoId}
          tipoDocumento="checklist_documental"
          title="Ações - Checklist de Documentos"
          onGenerateData={() => ({
            tipo: 'checklist_documental',
            negociacaoId,
            checklists,
          })}
        />
      </div>
    </div>
  )
}
