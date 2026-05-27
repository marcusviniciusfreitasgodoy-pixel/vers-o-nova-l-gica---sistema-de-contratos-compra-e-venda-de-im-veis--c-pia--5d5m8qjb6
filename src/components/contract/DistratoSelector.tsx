import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { getAllMyContracts } from '@/services/contracts'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

export function DistratoSelector() {
  const { control, setValue } = useFormContext()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllMyContracts()
      .then((data) => {
        // Filter out drafts or contracts that don't have basic data
        setContracts(data.filter((c) => c.endereco_imovel || c.nome_vendedor || c.nome_comprador))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (contractId: string) => {
    const c = contracts.find((x) => x.id === contractId)
    if (!c) return

    const fieldsToCopy = [
      'vendedor_pj',
      'nome_vendedor',
      'cpf_vendedor',
      'rg_vendedor',
      'orgao_emissor_vendedor',
      'data_nascimento_vendedor',
      'nacionalidade_vendedor',
      'profissao_vendedor',
      'estado_civil_vendedor',
      'regime_bens_vendedor',
      'conjuge_vendedor',
      'cpf_conjuge_vendedor',
      'rg_conjuge_vendedor',
      'endereco_vendedor',
      'cep_vendedor',
      'email_vendedor',
      'telefone_vendedor',
      'cnpj_vendedor',
      'representante_vendedor',

      'tipo_comprador',
      'nome_comprador',
      'cpf_comprador',
      'rg_comprador',
      'orgao_emissor_comprador',
      'data_nascimento_comprador',
      'nacionalidade_comprador',
      'profissao_comprador',
      'estado_civil_comprador',
      'regime_bens_comprador',
      'email_comprador',
      'telefone_comprador',
      'endereco_comprador',
      'cep_comprador',
      'nome_conjuge_comprador',
      'cpf_conjuge_comprador',
      'rg_conjuge_comprador',
      'cnpj_comprador',
      'representante_comprador',

      'endereco_imovel',
      'numero_imovel',
      'complemento_imovel',
      'bairro_imovel',
      'cidade_imovel',
      'estado_imovel',
      'cep_imovel',
      'matricula_imovel',
      'cartorio_imovel',
      'inscricao_iptu',
      'rgi_imovel',
      'inscricao_municipal',
      'area_privativa',
      'area_total',
    ]

    fieldsToCopy.forEach((field) => {
      if (c[field] !== undefined && c[field] !== null) {
        setValue(field, c[field], { shouldValidate: true, shouldDirty: true })
      }
    })

    if (c.valor_total) {
      setValue('valor_total', formatCurrency(c.valor_total), {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  return (
    <div className="mb-8 p-5 border border-[#0C2340]/20 rounded-xl bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />
      <FormField
        control={control}
        name="contrato_origem"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[#0C2340] font-semibold flex items-center gap-2">
              <Search className="w-4 h-4 text-[#D4AF37]" />
              Vincular Contrato Original
            </FormLabel>
            <Select
              onValueChange={(val) => {
                field.onChange(val)
                handleSelect(val)
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="bg-white border-slate-300 shadow-sm h-11">
                  <SelectValue
                    placeholder={
                      loading
                        ? 'Buscando contratos...'
                        : 'Selecione o contrato para importar dados...'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px]">
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="cursor-pointer py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">
                        {c.tipo_documento
                          ? c.tipo_documento.replace(/_/g, ' ').toUpperCase()
                          : 'CONTRATO'}
                        {c.endereco_imovel && ` - ${c.endereco_imovel}`}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        Partes: {c.nome_comprador || 'N/I'} e {c.nome_vendedor || 'N/I'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {contracts.length === 0 && !loading && (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Nenhum contrato encontrado.
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-2 flex items-center">
              * Ao selecionar, os dados das partes e do imóvel serão automaticamente importados para
              este distrato.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
