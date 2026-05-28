import { useState } from 'react'
import { createReciboSinal } from '@/services/gp_doc_recibo_sinal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/FormInput'
import { parseCurrency } from '@/lib/formatters'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { TestFillButton } from '@/components/TestFillButton'

export function SinalStep({ negociacaoId, onNext }: { negociacaoId: string; onNext: () => void }) {
  const [hasSinal, setHasSinal] = useState(false)
  const [formData, setFormData] = useState({
    valor_sinal: '',
    forma_recebimento: '',
    data_recebimento: '',
    natureza_valor: 'principio_pagamento',
  })

  const fillTestData = () => {
    setHasSinal(true)
    setFormData({
      valor_sinal: '50000',
      forma_recebimento: 'pix',
      data_recebimento: new Date().toISOString().split('T')[0],
      natureza_valor: 'principio_pagamento',
    })
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (hasSinal && formData.valor_sinal) {
      await createReciboSinal({
        negociacao_id: negociacaoId,
        valor_sinal: parseCurrency(formData.valor_sinal),
        forma_recebimento: formData.forma_recebimento as any,
        data_recebimento: new Date(formData.data_recebimento).toISOString(),
        natureza_valor: formData.natureza_valor as any,
      })
    }
    onNext()
  }

  return (
    <div className="space-y-8 mt-6 max-w-2xl mx-auto">
      <div className="bg-muted/30 p-6 rounded-lg border text-center space-y-4">
        <h2 className="text-lg font-bold">Recibo de Sinal (Arras)</h2>
        <p className="text-sm text-muted-foreground">
          Registre recebimentos de valores efetuados antes da assinatura do contrato formal.
        </p>

        <div className="flex items-center justify-center space-x-3 pt-4">
          <Switch id="sinal" checked={hasSinal} onCheckedChange={setHasSinal} />
          <Label htmlFor="sinal" className="font-semibold text-base cursor-pointer">
            Houve recebimento prévio de sinal?
          </Label>
        </div>
      </div>

      {hasSinal && (
        <Card className="shadow-md border-primary/20 animate-fade-in">
          <CardContent className="p-6">
            <form id="sinal-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Valor do Sinal (R$)</Label>
                  <CurrencyInput
                    required
                    value={formData.valor_sinal}
                    onChange={(v) => setFormData({ ...formData, valor_sinal: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Recebimento</Label>
                  <Input
                    type="date"
                    required
                    value={formData.data_recebimento}
                    onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Recebimento</Label>
                  <Select
                    value={formData.forma_recebimento}
                    onValueChange={(v) => setFormData({ ...formData, forma_recebimento: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="ted">TED</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Natureza do Valor</Label>
                  <Select
                    value={formData.natureza_valor}
                    onValueChange={(v) => setFormData({ ...formData, natureza_valor: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principio_pagamento">Princípio de Pagamento</SelectItem>
                      <SelectItem value="arras">Arras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <TestFillButton onClick={fillTestData} />
        {hasSinal ? (
          <Button type="submit" form="sinal-form" size="lg">
            Salvar e Avançar <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={() => handleSubmit()} variant="secondary" size="lg">
            Pular e Avançar <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
