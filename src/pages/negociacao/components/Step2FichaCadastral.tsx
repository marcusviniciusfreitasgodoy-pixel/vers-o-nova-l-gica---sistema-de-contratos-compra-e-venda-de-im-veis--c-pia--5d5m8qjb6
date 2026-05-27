import { useState, useEffect } from 'react'
import { fetchStep2Data, saveStep2Data } from '@/services/fase1_helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function Step2FichaCadastral({
  negociacaoId,
  onNext,
}: {
  negociacaoId: string
  onNext: () => void
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStep2Data(negociacaoId).then(setData)
  }, [negociacaoId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(e.target as HTMLFormElement)
      await saveStep2Data(negociacaoId, Object.fromEntries(fd.entries()), data)
      toast.success('Passo 2 salvo com sucesso!')
      onNext()
    } catch (err: any) {
      toast.error('Erro ao salvar os dados')
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
    <form onSubmit={onSubmit} className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg border-b border-slate-200 pb-2 text-slate-800">
            Complemento - Vendedor
          </h3>
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
            <Input name="rg_ie" defaultValue={data.vendedor?.rg_ie} className="bg-white" />
          </div>
          <div>
            <Label>Órgão Emissor</Label>
            <Input
              name="orgao_emissor"
              defaultValue={data.vendedor?.orgao_emissor}
              className="bg-white"
            />
          </div>
          <div>
            <Label>Nacionalidade</Label>
            <Input
              name="nacionalidade"
              defaultValue={data.vendedor?.nacionalidade}
              className="bg-white"
            />
          </div>
          <div>
            <Label>Profissão</Label>
            <Input name="profissao" defaultValue={data.vendedor?.profissao} className="bg-white" />
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
                className="bg-white"
              />
            </div>
            <div>
              <Label>Área Total (m²)</Label>
              <Input
                type="number"
                step="0.01"
                name="area_total"
                defaultValue={data.imovel?.area_total}
                className="bg-white"
              />
            </div>
          </div>
          <div>
            <Label>Fração Ideal (%)</Label>
            <Input
              type="number"
              step="0.01"
              name="fracao_ideal"
              defaultValue={data.imovel?.fracao_ideal}
              className="bg-white"
            />
          </div>
          <div>
            <Label>Inscrição IPTU</Label>
            <Input
              name="inscricao_iptu"
              defaultValue={data.imovel?.inscricao_iptu}
              className="bg-white"
            />
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
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading} size="lg">
          Salvar e continuar
        </Button>
      </div>
    </form>
  )
}
