import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { GPNegociacao } from '@/services/gp_negociacoes'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle2, FileText, Loader2 } from 'lucide-react'

export function StepConclusion({
  negociacaoId,
  negociacao,
  onFinish,
  onViewChaves,
  onViewPosse,
}: {
  negociacaoId: string
  negociacao: GPNegociacao
  onFinish: () => void
  onViewChaves?: () => void
  onViewPosse?: () => void
}) {
  const [timeline, setTimeline] = useState<{ name: string; date: string }[]>([])
  const [compradores, setCompradores] = useState<string[]>([])
  const [vendedores, setVendedores] = useState<string[]>([])
  const [posseDate, setPosseDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      const events: { name: string; date: string }[] = []

      // Fetch Parties
      try {
        const partes = await pb.collection('gp_negociacao_partes').getFullList({
          filter: `negociacao_id="${negociacaoId}"`,
          expand: 'pessoa_id',
        })
        setCompradores(
          partes
            .filter((p) => p.papel === 'comprador')
            .map((p) => p.expand?.pessoa_id?.nome_razao_social || 'Desconhecido'),
        )
        setVendedores(
          partes
            .filter((p) => p.papel === 'vendedor')
            .map((p) => p.expand?.pessoa_id?.nome_razao_social || 'Desconhecido'),
        )
      } catch (e) {
        // ignore
      }

      // Fetch Docs Timeline
      const collections = [
        { c: 'gp_doc_autorizacao', n: 'Autorização de Intermediação' },
        { c: 'gp_doc_ficha_cadastral', n: 'Ficha Cadastral' },
        { c: 'gp_doc_propostas', n: 'Propostas' },
        { c: 'gp_doc_checklist', n: 'Checklist Documental' },
        { c: 'gp_doc_recibo_sinal', n: 'Recibo de Sinal' },
        { c: 'gp_doc_promessa', n: 'Promessa de Compra e Venda' },
        { c: 'gp_doc_contrato_forca_escritura', n: 'Contrato com Força de Escritura' },
        { c: 'gp_doc_minuta_escritura', n: 'Minuta de Escritura' },
        { c: 'gp_doc_termo_chaves', n: 'Termo de Entrega de Chaves' },
      ]

      for (const { c, n } of collections) {
        try {
          const res = await pb
            .collection(c)
            .getFirstListItem(`negociacao_id="${negociacaoId}"`, { sort: '-created' })
          if (res) events.push({ name: n, date: res.created })
        } catch (e) {
          // ignore not found
        }
      }

      // Fetch Posse separately to grab the date
      try {
        const resPosse = await pb
          .collection('gp_doc_termo_posse')
          .getFirstListItem(`negociacao_id="${negociacaoId}"`)
        if (resPosse) {
          events.push({ name: 'Termo de Posse', date: resPosse.created })
          if (resPosse.data_imissao_posse) {
            setPosseDate(resPosse.data_imissao_posse)
          }
        }
      } catch (e) {
        // ignore
      }

      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setTimeline(events)
      setLoading(false)
    }

    fetchSummary()
  }, [negociacaoId])

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-8 animate-in fade-in zoom-in-95">
      <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
      <h2 className="text-2xl font-bold mb-2">Negociação Concluída!</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-lg">
        A negociação chegou ao fim. Os termos foram gerados e a transação está registrada no sistema
        como concluída.
      </p>

      <div className="w-full max-w-3xl bg-muted/30 p-6 rounded-lg border mb-8">
        <h3 className="text-lg font-semibold mb-4">Resumo da Transação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-muted-foreground block mb-1">Valor Total</span>
            <span className="font-medium text-base">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                negociacao.valor_total || 0,
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Forma de Pagamento</span>
            <span className="font-medium capitalize">
              {negociacao.forma_pagamento?.replace(/_/g, ' ') || 'Não informada'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Data da Posse</span>
            <span className="font-medium">
              {posseDate ? new Date(posseDate).toLocaleDateString('pt-BR') : 'Não informada'}
            </span>
          </div>
          <div className="md:col-span-3 h-px bg-border my-2" />
          <div className="md:col-span-1">
            <span className="text-muted-foreground block mb-1">Vendedor(es)</span>
            <span className="font-medium">
              {vendedores.length > 0 ? vendedores.join(', ') : 'Não informados'}
            </span>
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground block mb-1">Comprador(es)</span>
            <span className="font-medium">
              {compradores.length > 0 ? compradores.join(', ') : 'Não informados'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-4">Histórico de Documentos</h3>
        <div className="space-y-4">
          {timeline.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>
          )}
          {timeline.map((evt, i) => (
            <div key={i} className="flex items-center gap-4 bg-background border p-4 rounded-lg">
              <div className="bg-primary/10 p-2 rounded-full text-primary flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{evt.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Gerado em {new Date(evt.date).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(evt.date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {onViewChaves && (
          <Button variant="outline" onClick={onViewChaves}>
            Ver Termo de Chaves
          </Button>
        )}
        {onViewPosse && (
          <Button variant="outline" onClick={onViewPosse}>
            Ver Termo de Posse
          </Button>
        )}
        <Button onClick={onFinish}>Voltar ao Dashboard</Button>
      </div>
    </div>
  )
}
