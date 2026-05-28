import { useState, useEffect } from 'react'
import { fetchStep1Data, saveStep1Data } from '@/services/fase1_helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { TestFillButton } from '@/components/TestFillButton'

export default function Step1Autorizacao({
  negociacaoId,
  onNext,
}: {
  negociacaoId: string
  onNext: () => void
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [estadoCivil, setEstadoCivil] = useState('')
  const [formKey, setFormKey] = useState(0)

  const fillTestData = () => {
    setData({
      ...data,
      autorizacao: {
        tipo_autorizacao: 'com_exclusividade',
        prazo_vigencia_dias: 90,
        comissao_percentual: 6,
        comissao_valor_fixo: 0,
        responsavel_comissao: 'vendedor',
        momento_pagamento: 'na_escritura',
        valor_pretendido_imovel: 500000,
      },
      vendedor: {
        nome_razao_social: 'Vendedor Teste',
        cpf_cnpj: '111.222.333-44',
      },
      conjuge: {
        nome_razao_social: 'Cônjuge Teste',
        cpf_cnpj: '555.666.777-88',
      },
      imovel: {
        tipo_imovel: 'apartamento',
        endereco: {
          logradouro: 'Rua das Flores, 123',
          cidade: 'São Paulo',
          uf: 'SP',
        },
      },
    })
    setEstadoCivil('casado')
    setFormKey((k) => k + 1)
  }

  useEffect(() => {
    fetchStep1Data(negociacaoId).then((d) => {
      setData(d)
      if (d.vendedor?.estado_civil) setEstadoCivil(d.vendedor.estado_civil)
    })
  }, [negociacaoId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(e.target as HTMLFormElement)
      await saveStep1Data(negociacaoId, Object.fromEntries(fd.entries()), data)
      toast.success('Passo 1 salvo com sucesso!')
      onNext()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  if (!data)
    return (
      <div className="p-8 text-center text-muted-foreground">Carregando dados da negociação...</div>
    )

  return (
    <form key={formKey} onSubmit={onSubmit} className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg border-b border-slate-200 pb-2 text-slate-800">
            Dados da Autorização
          </h3>
          <div>
            <Label>Tipo de Autorização</Label>
            <Select
              name="tipo_autorizacao"
              defaultValue={data.autorizacao?.tipo_autorizacao || 'com_exclusividade'}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="com_exclusividade">Com Exclusividade</SelectItem>
                <SelectItem value="sem_exclusividade">Sem Exclusividade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prazo de Vigência (dias)</Label>
            <Input
              type="number"
              name="prazo_vigencia_dias"
              defaultValue={data.autorizacao?.prazo_vigencia_dias}
              required
              className="bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Comissão (%)</Label>
              <Input
                type="number"
                step="0.01"
                name="comissao_percentual"
                defaultValue={data.autorizacao?.comissao_percentual}
                className="bg-white"
              />
            </div>
            <div>
              <Label>Comissão (Fixo)</Label>
              <Input
                type="number"
                step="0.01"
                name="comissao_valor_fixo"
                defaultValue={data.autorizacao?.comissao_valor_fixo}
                className="bg-white"
              />
            </div>
          </div>
          <div>
            <Label>Responsável Comissão</Label>
            <Select
              name="responsavel_comissao"
              defaultValue={data.autorizacao?.responsavel_comissao || 'vendedor'}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="comprador">Comprador</SelectItem>
                <SelectItem value="divididas">Divididas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Momento do Pagamento</Label>
            <Select
              name="momento_pagamento"
              defaultValue={data.autorizacao?.momento_pagamento || 'na_escritura'}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="na_promessa">Na Promessa</SelectItem>
                <SelectItem value="na_escritura">Na Escritura</SelectItem>
                <SelectItem value="no_registro">No Registro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor Pretendido</Label>
            <Input
              type="number"
              step="0.01"
              name="valor_pretendido_imovel"
              defaultValue={data.autorizacao?.valor_pretendido_imovel}
              required
              className="bg-white"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-lg border-b border-slate-200 pb-2 text-slate-800">
              Vendedor
            </h3>
            <div>
              <Label>Nome / Razão Social</Label>
              <Input
                name="vendedor_nome"
                defaultValue={data.vendedor?.nome_razao_social}
                required
                className="bg-white"
              />
            </div>
            <div>
              <Label>CPF / CNPJ</Label>
              <Input
                name="vendedor_cpf"
                defaultValue={data.vendedor?.cpf_cnpj}
                required
                className="bg-white"
              />
            </div>
            <div>
              <Label>Estado Civil</Label>
              <Select
                name="vendedor_estado_civil"
                value={estadoCivil}
                onValueChange={setEstadoCivil}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  <SelectItem value="separado">Separado(a)</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="vendedor_estado_civil" value={estadoCivil} />
            </div>
            {(estadoCivil === 'casado' || estadoCivil === 'uniao_estavel') && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div>
                  <Label>Nome Cônjuge</Label>
                  <Input
                    name="conjuge_nome"
                    defaultValue={data.conjuge?.nome_razao_social}
                    required
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label>CPF Cônjuge</Label>
                  <Input
                    name="conjuge_cpf"
                    defaultValue={data.conjuge?.cpf_cnpj}
                    required
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-lg border-b border-slate-200 pb-2 text-slate-800">
              Imóvel
            </h3>
            <div>
              <Label>Tipo de Imóvel</Label>
              <Select name="imovel_tipo" defaultValue={data.imovel?.tipo_imovel || 'apartamento'}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="lote">Lote</SelectItem>
                  <SelectItem value="sala_comercial">Sala Comercial</SelectItem>
                  <SelectItem value="galpao">Galpão</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                name="imovel_endereco"
                defaultValue={data.imovel?.endereco?.logradouro}
                required
                className="bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input
                  name="imovel_cidade"
                  defaultValue={data.imovel?.endereco?.cidade}
                  required
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Estado (UF)</Label>
                <Input
                  name="imovel_estado"
                  defaultValue={data.imovel?.endereco?.uf}
                  required
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t">
        <TestFillButton onClick={fillTestData} />
        <Button type="submit" disabled={loading} size="lg">
          Salvar e continuar
        </Button>
      </div>
    </form>
  )
}
