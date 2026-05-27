import { useFormContext } from 'react-hook-form'
import { useEffect } from 'react'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { FormInput, FormCurrencyInput, FormSelect } from '@/components/FormInput'
import { parseCurrency, formatCurrency } from '@/lib/formatters'

export function FinanceiroTab({ tipoDocumento }: { tipoDocumento: string }) {
  const { watch, control, setValue, clearErrors } = useFormContext()
  const total = watch('valor_total')
  const parcelas = watch('havera_parcelas')
  const temFinanciamento = watch('financiamento_comprador') || watch('possui_financiamento')

  const isAutorizacao = tipoDocumento === 'autorizacao_intermediacao'
  const isDistrato = tipoDocumento === 'distrato'
  const isReciboSinal = tipoDocumento === 'recibo_sinal'

  const showFullFinanceiro = !isAutorizacao && !isDistrato

  useEffect(() => {
    if (!showFullFinanceiro) return
    const s = parseCurrency(String(watch('valor_sinal') || '0'))
    const fin = parseCurrency(
      String(watch('valor_financiado') || watch('valor_financiamento') || '0'),
    )
    const fgts = parseCurrency(String(watch('valor_fgts') || '0'))
    const rec = parseCurrency(String(watch('valor_recursos_proprios') || '0'))
    setValue('valor_total', formatCurrency(s + fin + fgts + rec), { shouldValidate: true })
  }, [
    watch('valor_sinal'),
    watch('valor_financiado'),
    watch('valor_financiamento'),
    watch('valor_fgts'),
    watch('valor_recursos_proprios'),
    setValue,
    showFullFinanceiro,
  ])

  return (
    <div className="space-y-6 animate-in fade-in">
      {isAutorizacao && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormCurrencyInput
              name="valor_avaliacao"
              label="Valor de Avaliação Estimado (R$)"
              required
            />
            <FormCurrencyInput name="valor_total" label="Valor de Venda Pretendido (R$)" required />
          </div>
          <h3 className="font-semibold text-lg border-b pb-2 mt-6 text-[#0C2340]">
            Comissão de Intermediação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              name="percentual_comissao"
              label="Percentual da Comissão (%)"
              type="number"
            />
            <FormCurrencyInput name="valor_comissao" label="Valor Fixo da Comissão (Opcional)" />
          </div>
        </>
      )}

      {showFullFinanceiro && (
        <>
          <div className="p-4 bg-[#0C2340]/5 border border-[#0C2340]/10 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
            <span className="font-semibold text-[#0C2340]">Valor Total Estimado:</span>
            <span className="text-2xl font-bold text-[#D4AF37]">{total ? total : 'R$ 0,00'}</span>
          </div>

          <h3 className="font-semibold text-lg border-b pb-2 text-[#0C2340]">Valores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormCurrencyInput
              name="valor_sinal"
              label={isReciboSinal ? 'Valor do Sinal (R$)' : 'Sinal (Arras)'}
              required
            />
            <FormSelect
              name="tipo_arras"
              label={isReciboSinal ? 'Tipo de Arras *' : 'Tipo de Arras'}
              options={[
                { label: 'Arras Confirmatórias (Art. 417 a 419, CC)', value: 'confirmatórias' },
                { label: 'Arras Penitenciais (Art. 420, CC)', value: 'penitenciais' },
              ]}
            />
            {isReciboSinal && (
              <FormField
                control={control}
                name="data_pagamento_sinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento do Sinal</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        {...field}
                        value={field.value ? String(field.value).split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormCurrencyInput name="valor_fgts" label="Valor FGTS" />
            <FormCurrencyInput name="valor_recursos_proprios" label="Recursos Próprios / Saldo" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <FormField
              control={control}
              name="financiamento_comprador"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(val) => {
                        field.onChange(val)
                        setValue('possui_financiamento', val, { shouldValidate: true })
                        if (!val) {
                          setValue('valor_financiamento', 0, { shouldValidate: true })
                          setValue('valor_financiado', 0, { shouldValidate: true })
                          setValue('instituicao_financeira', '', { shouldValidate: true })
                          setValue('prazo_financiamento', 0, { shouldValidate: true })
                          clearErrors([
                            'valor_financiamento',
                            'valor_financiado',
                            'instituicao_financeira',
                            'prazo_financiamento',
                          ])
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">Utilizará Financiamento</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="havera_parcelas"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(val) => {
                        field.onChange(val)
                        if (!val) {
                          setValue('quantidade_parcelas', 0, { shouldValidate: true })
                          setValue('valor_parcela', 0, { shouldValidate: true })
                          clearErrors(['quantidade_parcelas', 'valor_parcela'])
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Haverá pagamento parcelado direto?
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          {temFinanciamento && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded bg-slate-50 mt-4">
              <FormCurrencyInput name="valor_financiado" label="Valor Financiado" />
              <FormSelect
                name="instituicao_financeira"
                label="Banco Pretendido"
                options={[
                  { label: 'Caixa', value: 'Caixa' },
                  { label: 'Itaú', value: 'Itaú' },
                  { label: 'Bradesco', value: 'Bradesco' },
                  { label: 'Santander', value: 'Santander' },
                  { label: 'Banco do Brasil', value: 'Banco do Brasil' },
                  { label: 'Outro', value: 'Outro' },
                ]}
              />
              <FormInput name="prazo_financiamento" label="Prazo Desejado (meses)" type="number" />
            </div>
          )}

          {parcelas && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded bg-slate-50 mt-4">
              <FormInput name="quantidade_parcelas" label="Quantidade de Parcelas" type="number" />
              <FormCurrencyInput name="valor_parcela" label="Valor da Parcela" />
            </div>
          )}

          <h3 className="font-semibold text-lg border-b pb-2 mt-6 text-[#0C2340]">
            Comissão e Recebimento
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              name="percentual_comissao"
              label="Percentual da Comissão (%)"
              type="number"
            />
            <FormCurrencyInput name="valor_comissao" label="Valor Fixo da Comissão" />
          </div>
        </>
      )}

      {isDistrato && (
        <>
          <h3 className="font-semibold text-lg border-b pb-2 mt-6 text-[#0C2340]">
            Valores do Distrato
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormCurrencyInput
              name="valor_reembolso"
              label="Valor a ser Reembolsado (R$)"
              required
            />
            <FormCurrencyInput name="multa_distrato" label="Multa de Distrato (R$)" required />
          </div>
        </>
      )}

      {!isAutorizacao && !isDistrato && (
        <>
          <h3 className="font-semibold text-lg border-b pb-2 mt-6 text-[#0C2340]">
            Dados Bancários do Vendedor / Recebedor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormInput name="vendedor_banco" label="Banco" />
            <FormInput name="vendedor_agencia" label="Agência" />
            <FormInput name="vendedor_conta" label="Conta" />
            <FormInput name="vendedor_pix" label="Chave PIX" />
          </div>
        </>
      )}
    </div>
  )
}
