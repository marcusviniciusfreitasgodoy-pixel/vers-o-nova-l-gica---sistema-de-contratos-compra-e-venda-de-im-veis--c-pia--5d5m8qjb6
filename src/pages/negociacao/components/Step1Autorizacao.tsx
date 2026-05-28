import { useState, useEffect } from 'react'
import { fetchStep1Data, saveStep1Data } from '@/services/fase1_helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput, MaskedInput } from '@/components/FormInput'
import { parseCurrency } from '@/lib/formatters'
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
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { DocumentActions } from './DocumentActions'

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const fillTestData = async () => {
    let caseIdToUse = data?.negociacao?.case_id

    if (!caseIdToUse) {
      try {
        const authUser = pb.authStore.record
        let filter = ''
        if (authUser?.company) filter = `company="${authUser.company}"`
        const firstCase = await pb
          .collection('cases')
          .getFirstListItem(filter, { sort: '-created' })
        caseIdToUse = firstCase.id
      } catch (e) {
        toast.error('Nenhum Caso (Case) encontrado no sistema. Crie um caso primeiro.')
        return
      }
    }

    setData({
      ...data,
      negociacao: {
        ...data?.negociacao,
        case_id: caseIdToUse,
      },
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
        telefone: '(11) 98765-4321',
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
    setFieldErrors({})
    try {
      const fd = new FormData(e.target as HTMLFormElement)
      const rawData = Object.fromEntries(fd.entries())

      if (rawData.vendedor_cpf) {
        rawData.vendedor_cpf = (rawData.vendedor_cpf as string).replace(/\D/g, '')
      }
      if (rawData.conjuge_cpf) {
        rawData.conjuge_cpf = (rawData.conjuge_cpf as string).replace(/\D/g, '')
      }
      if (rawData.vendedor_telefone) {
        rawData.vendedor_telefone = (rawData.vendedor_telefone as string).replace(/\D/g, '')
      }

      const errors: FieldErrors = {}
      if (!rawData.tipo_autorizacao) errors.tipo_autorizacao = 'Este campo é obrigatório'
      if (!rawData.prazo_vigencia_dias) errors.prazo_vigencia_dias = 'Este campo é obrigatório'
      if (!rawData.valor_pretendido_imovel)
        errors.valor_pretendido_imovel = 'Este campo é obrigatório'
      if (!rawData.vendedor_nome) errors.vendedor_nome = 'Este campo é obrigatório'
      if (!rawData.vendedor_cpf) errors.vendedor_cpf = 'Este campo é obrigatório'
      if (!rawData.imovel_endereco) errors.imovel_endereco = 'Este campo é obrigatório'
      if (!rawData.imovel_cidade) errors.imovel_cidade = 'Este campo é obrigatório'
      if (!rawData.imovel_estado) errors.imovel_estado = 'Este campo é obrigatório'

      if (estadoCivil === 'casado' || estadoCivil === 'uniao_estavel') {
        if (!rawData.conjuge_nome) errors.conjuge_nome = 'Este campo é obrigatório'
        if (!rawData.conjuge_cpf) errors.conjuge_cpf = 'Este campo é obrigatório'
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        toast.error('Erro ao salvar: Verifique os campos obrigatórios')
        setLoading(false)
        return
      }

      if (rawData.comissao_valor_fixo) {
        rawData.comissao_valor_fixo = String(parseCurrency(rawData.comissao_valor_fixo as string))
      }
      if (rawData.valor_pretendido_imovel) {
        rawData.valor_pretendido_imovel = String(
          parseCurrency(rawData.valor_pretendido_imovel as string),
        )
      }
      if (rawData.comissao_percentual && typeof rawData.comissao_percentual === 'string') {
        rawData.comissao_percentual = String(Number(rawData.comissao_percentual.replace(',', '.')))
      }

      if (data?.negociacao?.case_id) {
        rawData.case_id = data.negociacao.case_id
      }

      await saveStep1Data(negociacaoId, rawData, data)
      toast.success('Dados salvos com sucesso!')
      onNext()
    } catch (err: any) {
      const pbErrors = extractFieldErrors(err)
      if (Object.keys(pbErrors).length > 0) {
        const mappedErrors: FieldErrors = { ...pbErrors }
        if (pbErrors.cpf_cnpj) mappedErrors.vendedor_cpf = pbErrors.cpf_cnpj
        if (pbErrors.nome_razao_social) mappedErrors.vendedor_nome = pbErrors.nome_razao_social
        setFieldErrors(mappedErrors)

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
              <SelectTrigger
                className={cn(
                  'bg-white',
                  fieldErrors.tipo_autorizacao && 'border-red-500 ring-red-500',
                )}
              >
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="com_exclusividade">Com Exclusividade</SelectItem>
                <SelectItem value="sem_exclusividade">Sem Exclusividade</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.tipo_autorizacao && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.tipo_autorizacao}</p>
            )}
          </div>
          <div>
            <Label>Prazo de Vigência (dias)</Label>
            <Input
              type="number"
              name="prazo_vigencia_dias"
              defaultValue={data.autorizacao?.prazo_vigencia_dias}
              className={cn(
                'bg-white',
                fieldErrors.prazo_vigencia_dias && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.prazo_vigencia_dias && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.prazo_vigencia_dias}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Comissão (%)</Label>
              <Input
                type="number"
                step="0.01"
                name="comissao_percentual"
                defaultValue={data.autorizacao?.comissao_percentual}
                className={cn(
                  'bg-white',
                  fieldErrors.comissao_percentual && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {fieldErrors.comissao_percentual && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.comissao_percentual}</p>
              )}
            </div>
            <div>
              <Label>Comissão (Fixo)</Label>
              <CurrencyInput
                name="comissao_valor_fixo"
                defaultValue={data.autorizacao?.comissao_valor_fixo}
                className={cn(
                  'bg-white',
                  fieldErrors.comissao_valor_fixo && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {fieldErrors.comissao_valor_fixo && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.comissao_valor_fixo}</p>
              )}
            </div>
          </div>
          <div>
            <Label>Responsável Comissão</Label>
            <Select
              name="responsavel_comissao"
              defaultValue={data.autorizacao?.responsavel_comissao || 'vendedor'}
            >
              <SelectTrigger
                className={cn(
                  'bg-white',
                  fieldErrors.responsavel_comissao && 'border-red-500 ring-red-500',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="comprador">Comprador</SelectItem>
                <SelectItem value="divididas">Divididas</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.responsavel_comissao && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.responsavel_comissao}</p>
            )}
          </div>
          <div>
            <Label>Momento do Pagamento</Label>
            <Select
              name="momento_pagamento"
              defaultValue={data.autorizacao?.momento_pagamento || 'na_escritura'}
            >
              <SelectTrigger
                className={cn(
                  'bg-white',
                  fieldErrors.momento_pagamento && 'border-red-500 ring-red-500',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="na_promessa">Na Promessa</SelectItem>
                <SelectItem value="na_escritura">Na Escritura</SelectItem>
                <SelectItem value="no_registro">No Registro</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.momento_pagamento && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.momento_pagamento}</p>
            )}
          </div>
          <div>
            <Label>Valor Pretendido</Label>
            <CurrencyInput
              name="valor_pretendido_imovel"
              defaultValue={data.autorizacao?.valor_pretendido_imovel}
              className={cn(
                'bg-white',
                fieldErrors.valor_pretendido_imovel && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
            {fieldErrors.valor_pretendido_imovel && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.valor_pretendido_imovel}</p>
            )}
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
                className={cn(
                  'bg-white',
                  fieldErrors.vendedor_nome && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {fieldErrors.vendedor_nome && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.vendedor_nome}</p>
              )}
            </div>
            <div>
              <Label>CPF / CNPJ</Label>
              <MaskedInput
                maskType="cpf_cnpj"
                name="vendedor_cpf"
                defaultValue={data.vendedor?.cpf_cnpj}
                className={cn(
                  'bg-white',
                  fieldErrors.vendedor_cpf && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {fieldErrors.vendedor_cpf && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.vendedor_cpf}</p>
              )}
            </div>
            <div>
              <Label>Telefone (Opcional)</Label>
              <MaskedInput
                maskType="phone"
                name="vendedor_telefone"
                defaultValue={data.vendedor?.telefone}
                className="bg-white"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>Estado Civil</Label>
              <Select
                name="vendedor_estado_civil"
                value={estadoCivil}
                onValueChange={setEstadoCivil}
              >
                <SelectTrigger
                  className={cn(
                    'bg-white',
                    fieldErrors.vendedor_estado_civil && 'border-red-500 ring-red-500',
                  )}
                >
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
              {fieldErrors.vendedor_estado_civil && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.vendedor_estado_civil}</p>
              )}
            </div>
            {(estadoCivil === 'casado' || estadoCivil === 'uniao_estavel') && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div>
                  <Label>Nome Cônjuge</Label>
                  <Input
                    name="conjuge_nome"
                    defaultValue={data.conjuge?.nome_razao_social}
                    className={cn(
                      'bg-white',
                      fieldErrors.conjuge_nome && 'border-red-500 focus-visible:ring-red-500',
                    )}
                  />
                  {fieldErrors.conjuge_nome && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.conjuge_nome}</p>
                  )}
                </div>
                <div>
                  <Label>CPF Cônjuge</Label>
                  <MaskedInput
                    maskType="cpf"
                    name="conjuge_cpf"
                    defaultValue={data.conjuge?.cpf_cnpj}
                    className={cn(
                      'bg-white',
                      fieldErrors.conjuge_cpf && 'border-red-500 focus-visible:ring-red-500',
                    )}
                  />
                  {fieldErrors.conjuge_cpf && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.conjuge_cpf}</p>
                  )}
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
                <SelectTrigger
                  className={cn(
                    'bg-white',
                    fieldErrors.imovel_tipo && 'border-red-500 ring-red-500',
                  )}
                >
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
              {fieldErrors.imovel_tipo && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.imovel_tipo}</p>
              )}
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                name="imovel_endereco"
                defaultValue={data.imovel?.endereco?.logradouro}
                className={cn(
                  'bg-white',
                  fieldErrors.imovel_endereco && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {fieldErrors.imovel_endereco && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.imovel_endereco}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input
                  name="imovel_cidade"
                  defaultValue={data.imovel?.endereco?.cidade}
                  className={cn(
                    'bg-white',
                    fieldErrors.imovel_cidade && 'border-red-500 focus-visible:ring-red-500',
                  )}
                />
                {fieldErrors.imovel_cidade && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.imovel_cidade}</p>
                )}
              </div>
              <div>
                <Label>Estado (UF)</Label>
                <Input
                  name="imovel_estado"
                  defaultValue={data.imovel?.endereco?.uf}
                  className={cn(
                    'bg-white',
                    fieldErrors.imovel_estado && 'border-red-500 focus-visible:ring-red-500',
                  )}
                />
                {fieldErrors.imovel_estado && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.imovel_estado}</p>
                )}
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

      {data.autorizacao?.id && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-4">
          <DocumentActions
            negociacaoId={negociacaoId}
            tipoDocumento="autorizacao_intermediacao"
            title="Ações - Autorização de Venda"
            onGenerateData={() => ({
              ...data,
              tipo: 'autorizacao_intermediacao',
              negociacaoId,
            })}
          />
        </div>
      )}
    </form>
  )
}
