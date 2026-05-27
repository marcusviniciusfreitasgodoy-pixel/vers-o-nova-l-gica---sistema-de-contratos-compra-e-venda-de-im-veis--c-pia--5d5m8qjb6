import { useState } from 'react'
import { createProposta } from '@/services/gp_doc_propostas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function PropostaForm({
  negociacaoId,
  propostaAnteriorId,
  rodadaAtual,
  onSuccess,
  onCancel,
}: any) {
  const [formData, setFormData] = useState({
    valor_ofertado: '',
    prazo_validade_dias: '',
    condicoes_oferta: '',
    prazo_resposta: '',
    entrada: '',
    financiamento: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProposta({
      negociacao_id: negociacaoId,
      rodada_negociacao: rodadaAtual,
      proposta_anterior_id: propostaAnteriorId || undefined,
      valor_ofertado: Number(formData.valor_ofertado),
      prazo_validade_dias: Number(formData.prazo_validade_dias),
      condicoes_oferta: formData.condicoes_oferta,
      prazo_resposta: formData.prazo_resposta
        ? new Date(formData.prazo_resposta).toISOString()
        : undefined,
      forma_pagamento_proposta: {
        entrada: formData.entrada,
        financiamento: formData.financiamento,
      },
      status: 'enviada',
      contraproposta_de: propostaAnteriorId ? 'vendedor' : 'comprador',
    })
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="border p-6 rounded-lg bg-card shadow-sm space-y-6">
      <h3 className="text-lg font-semibold">
        {propostaAnteriorId ? 'Contraproposta' : 'Nova Proposta'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor Ofertado (R$)</Label>
          <Input
            type="number"
            required
            value={formData.valor_ofertado}
            onChange={(e) => setFormData({ ...formData, valor_ofertado: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Prazo de Validade (dias)</Label>
          <Input
            type="number"
            value={formData.prazo_validade_dias}
            onChange={(e) => setFormData({ ...formData, prazo_validade_dias: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Valor de Entrada (R$)</Label>
          <Input
            type="number"
            value={formData.entrada}
            onChange={(e) => setFormData({ ...formData, entrada: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Valor de Financiamento (R$)</Label>
          <Input
            type="number"
            value={formData.financiamento}
            onChange={(e) => setFormData({ ...formData, financiamento: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Data Limite para Resposta</Label>
          <Input
            type="date"
            value={formData.prazo_resposta}
            onChange={(e) => setFormData({ ...formData, prazo_resposta: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Condições Gerais da Oferta</Label>
        <Textarea
          required
          placeholder="Detalhes, exigências, documentação extra..."
          value={formData.condicoes_oferta}
          onChange={(e) => setFormData({ ...formData, condicoes_oferta: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Enviar Proposta</Button>
      </div>
    </form>
  )
}
