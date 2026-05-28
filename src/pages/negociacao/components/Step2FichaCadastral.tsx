import { useState, useEffect } from 'react'
import { fetchStep2Data, saveStep2Data } from '@/services/fase1_helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerInput } from '@/components/FormInput'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { TestFillButton } from '@/components/TestFillButton'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'
import { DocumentActions } from './DocumentActions'

export default function Step2FichaCadastral({
  negociacaoId,
  onNext,
}: {
  negociacaoId: string
  onNext: () => void
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const fillTestData = () => {
    setData({
      ...data,
      ficha: {
        data_captacao: new Date().toISOString(),
      },
      vendedor: {
        regime_bens: 'comunhao_parcial',
        rg_ie: '12.345.678-9',
        orgao_emissor: 'SSP/SP',
        nacionalidade: 'Brasileiro(a)',
        profissao: 'Engenheiro(a)',
      },
      imovel: {
        condominio_nome: 'Condomínio Teste',
        area_privativa: 100,
        area_total: 150,
        fracao_ideal: 50,
        inscricao_iptu: '123.456.789-00',
        onus_gravames: [{ tipo: 'hipoteca', descricao: 'Banco X' }],
      },
    })
    setFormKey((k) => k + 1)
  }

  useEffect(() => {
    fetchStep2Data(negociacaoId).then(setData)
  }, [negociacaoId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})
    try {
      const fd = new FormData(e.target as HTMLFormElement)
      const rawData = Object.fromEntries(fd.entries())

      const errors: FieldErrors = {}
      if (!rawData.rg_ie) errors.rg_ie = 'Este campo é obrigatório'
      if (!rawData.orgao_emissor) errors.orgao_emissor = 'Este campo é obrigatório'
      if (!rawData.nacionalidade) errors.nacionalidade = 'Este campo é obrigatório'
      if (!rawData.profissao) errors.profissao = 'Este campo é obrigatório'
      if (!rawData.area_privativa) errors.area_privativa = 'Este campo é obrigatório'
      if (!rawData.area_total) errors.area_total = 'Este campo é obrigatório'
      if (!rawData.fracao_ideal) errors.fracao_ideal = 'Este campo é obrigatório'
      if (!rawData.inscricao_iptu) errors.inscricao_iptu = 'Este campo é obrigatório'

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        toast.error('Erro ao salvar: Verifique os campos obrigatórios')
        setLoading(false)
        return
      }

      await saveStep2Data(negociacaoId, rawData, data)
      toast.success('Dados salvos com sucesso!')
      onNext()
    } catch (err: any) {
      const pbErrors = extractFieldErrors(err)
      if (Object.keys(pbErrors).length > 0) {
        setFieldErrors(pbErrors)
        const firstErrorMsg = Object.values(pbErrors)[0]
        toast.error(`Erro de validação: ${firstErrorMsg}`)
      } else {
        toast.error(err.message || 'Erro ao salvar os dados. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!data)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando dados complementares...
      </div>
    )

  return (
    <form key={formKey} onSubmit={onSubmit} className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg border-b border-slate-200 pb-2 text-slate-800">
            Complemento - Vendedor
          </h3>
          <div>
            <Label>Data de Captação</Label>
            <DatePickerInput name="data_captacao" defaultValue={data.ficha?.data_captacao} />
          </div>
          <div>
            <Label>Regime de Bens</Label>
            <Select name="regime_bens" defaultValue={data.vendedor?.regime_bens || 'nao_aplicavel'}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comunhao_parcial">Comunhão Parcial</SelectItem>
                <SelectItem value="comunhao_universal">Comunhão Universal</SelectItem>
                <SelectItem value="separacao_total">Separação Total</SelectItem>
                <SelectItem value="participacao_final">Participação Final</SelectItem>
                <SelectItem value="nao_aplicavel">Não Aplicável</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>RG / IE</Label>
            <Input
              name="rg_ie"
              defaultValue={data.vendedor?.rg_ie}
              className={cn(
                'bg-white',
                fieldErrors.rg_ie && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.rg_ie && <p className="text-sm text-red-500 mt-1">{fieldErrors.rg_ie}</p>}
          </div>
          <div>
            <Label>Órgão Emissor</Label>
            <Input
              name="orgao_emissor"
              defaultValue={data.vendedor?.orgao_emissor}
              className={cn(
                'bg-white',
                fieldErrors.orgao_emissor && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.orgao_emissor && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.orgao_emissor}</p>
            )}
          </div>
          <div>
            <Label>Nacionalidade</Label>
            <Input
              name="nacionalidade"
              defaultValue={data.vendedor?.nacionalidade}
              className={cn(
                'bg-white',
                fieldErrors.nacionalidade && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.nacionalidade && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.nacionalidade}</p>
            )}
          </div>
          <div>
            <Label>Profissão</Label>
            <Input
              name="profissao"
              defaultValue={data.vendedor?.profissao}
              className={cn(
                'bg-white',
                fieldErrors.profissao && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.profissao && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.profissao}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg border-b border-slate-200 pb-2 text-slate-800">
            Complemento - Imóvel
          </h3>
          <div>
            <Label>Nome do Condomínio</Label>
            <Input
              name="condominio_nome"
              defaultValue={data.imovel?.condominio_nome}
              className="bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Área Privativa (m²)</Label>
              <Input
                type="number"
                step="0.01"
                name="area_privativa"
                defaultValue={data.imovel?.area_privativa}
                className={cn(
                  'bg-white',
                  fieldErrors.area_privativa && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {fieldErrors.area_privativa && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.area_privativa}</p>
              )}
            </div>
            <div>
              <Label>Área Total (m²)</Label>
              <Input
                type="number"
                step="0.01"
                name="area_total"
                defaultValue={data.imovel?.area_total}
                className={cn(
                  'bg-white',
                  fieldErrors.area_total && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {fieldErrors.area_total && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.area_total}</p>
              )}
            </div>
          </div>
          <div>
            <Label>Fração Ideal (%)</Label>
            <Input
              type="number"
              step="0.01"
              name="fracao_ideal"
              defaultValue={data.imovel?.fracao_ideal}
              className={cn(
                'bg-white',
                fieldErrors.fracao_ideal && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.fracao_ideal && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.fracao_ideal}</p>
            )}
          </div>
          <div>
            <Label>Inscrição IPTU</Label>
            <Input
              name="inscricao_iptu"
              defaultValue={data.imovel?.inscricao_iptu}
              className={cn(
                'bg-white',
                fieldErrors.inscricao_iptu && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.inscricao_iptu && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.inscricao_iptu}</p>
            )}
          </div>
          <div>
            <Label>Ônus e Gravames (JSON ou Texto)</Label>
            <Textarea
              name="onus_gravames"
              placeholder='Ex: [{"tipo": "hipoteca", "descricao": "Banco X"}]'
              defaultValue={JSON.stringify(data.imovel?.onus_gravames || [])}
              className="font-mono text-xs bg-white"
              rows={4}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t">
        <TestFillButton onClick={fillTestData} />
        <Button type="submit" disabled={loading} size="lg">
          Salvar e continuar
        </Button>
      </div>

      {data.ficha?.id && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-4">
          <DocumentActions
            negociacaoId={negociacaoId}
            tipoDocumento="ficha_cadastral"
            title="Ações - Ficha Cadastral"
            onGenerateData={() => ({
              ...data,
              tipo: 'ficha_cadastral',
              negociacaoId,
            })}
          />
        </div>
      )}
    </form>
  )
}
