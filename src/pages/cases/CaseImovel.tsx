import { useEffect, useState } from 'react'
import { getImovelByCase } from '@/services/imovel'
import { getGPImoveisByCase, createGPImovel, updateGPImovel } from '@/services/gp_imoveis'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { TestFillButton } from '@/components/TestFillButton'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const ESTADOS_BR = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

const imovelSchema = z.object({
  tipo_imovel: z.string(),
  finalidade: z.string(),
  endereco_resumido: z.string().optional(),
  cidade: z.string().optional(),
  estado: z
    .string()
    .toUpperCase()
    .refine((val) => !val || ESTADOS_BR.includes(val), {
      message: 'Sigla de estado inválida. Use uma sigla válida com 2 letras (ex: SP, RJ).',
    })
    .optional(),
  matricula: z.string().optional(),
  inscricao_iptu: z.string().optional(),
  observacoes: z.string().optional(),
})

export default function CaseImovel({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState(true)
  const [imovelId, setImovelId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isLegacy, setIsLegacy] = useState(false)

  const form = useForm({
    resolver: zodResolver(imovelSchema),
    defaultValues: {
      tipo_imovel: 'apartamento',
      finalidade: 'residencial',
      endereco_resumido: '',
      cidade: '',
      estado: '',
      matricula: '',
      inscricao_iptu: '',
      observacoes: '',
    },
  })

  useEffect(() => {
    async function init() {
      try {
        const newImovel = await getGPImoveisByCase(caseId)
        if (newImovel) {
          setImovelId(newImovel.id)
          setIsLegacy(false)
          form.reset({
            tipo_imovel: newImovel.tipo_imovel || 'apartamento',
            finalidade: newImovel.finalidade || 'residencial',
            endereco_resumido: newImovel.endereco_resumido || '',
            cidade: newImovel.cidade || '',
            estado: newImovel.estado || '',
            matricula: newImovel.matricula_numero || '',
            inscricao_iptu: newImovel.inscricao_iptu || '',
            observacoes: newImovel.observacoes || '',
          })
        } else {
          const legacy = await getImovelByCase(caseId)
          if (legacy) {
            setIsLegacy(true)
            form.reset({
              tipo_imovel: legacy.tipo_imovel || 'apartamento',
              finalidade: legacy.finalidade || 'residencial',
              endereco_resumido: legacy.endereco_resumido || '',
              cidade: legacy.cidade || '',
              estado: legacy.estado || '',
              matricula: legacy.matricula || '',
              inscricao_iptu: legacy.inscricao_iptu || '',
              observacoes: legacy.observacoes || '',
            })
          }
        }
      } catch {
        // Not found
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [caseId])

  const fillTestData = () => {
    form.setValue('tipo_imovel', 'apartamento')
    form.setValue('finalidade', 'residencial')
    form.setValue('endereco_resumido', 'Rua de Teste, 123, Bairro Fictício')
    form.setValue('cidade', 'São Paulo')
    form.setValue('estado', 'SP')
    form.setValue('matricula', '123456')
    form.setValue('inscricao_iptu', '000.111.222.333-4')
    form.setValue('observacoes', 'Imóvel de teste preenchido automaticamente.')
    toast.success('Dados de teste aplicados.')
  }

  const onSubmit = async (vals: any) => {
    if (isLegacy) {
      toast.error(
        'Registros legados são apenas leitura. Crie um novo caso para atualizar a estrutura.',
      )
      return
    }

    setSaving(true)
    try {
      const payload = {
        tipo_imovel: vals.tipo_imovel,
        finalidade: vals.finalidade,
        endereco_resumido: vals.endereco_resumido,
        cidade: vals.cidade,
        estado: vals.estado,
        matricula_numero: vals.matricula,
        inscricao_iptu: vals.inscricao_iptu,
        observacoes: vals.observacoes,
        case_id: caseId,
      }

      if (imovelId) {
        await updateGPImovel(imovelId, payload)
        toast.success('Operação realizada com sucesso')
      } else {
        const created = await createGPImovel(payload as any)
        setImovelId(created.id)
        toast.success('Operação realizada com sucesso')
      }
    } catch (err) {
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        for (const [field, msg] of Object.entries(errors)) {
          form.setError(field as any, { type: 'manual', message: msg })
        }
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="flex p-8 justify-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    )

  return (
    <Card>
      <CardContent className="pt-6">
        {isLegacy && (
          <Alert variant="default" className="mb-6 bg-slate-50 border-slate-200">
            <AlertCircle className="h-4 w-4 text-slate-500" />
            <AlertTitle className="text-slate-700">Imóvel Legado</AlertTitle>
            <AlertDescription className="text-slate-600">
              Este imóvel foi cadastrado no formato antigo e é apenas leitura. Para criar um novo
              modelo de negociação neste caso, crie um novo.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Imóvel</Label>
              <Controller
                name="tipo_imovel"
                control={form.control}
                render={({ field }) => (
                  <Select disabled={isLegacy} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'apartamento',
                        'casa',
                        'terreno',
                        'comercial',
                        'cobertura',
                        'sala_comercial',
                        'outro',
                      ].map((v) => (
                        <SelectItem key={v} value={v} className="capitalize">
                          {v.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Controller
                name="finalidade"
                control={form.control}
                render={({ field }) => (
                  <Select disabled={isLegacy} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['residencial', 'comercial', 'mista', 'outro'].map((v) => (
                        <SelectItem key={v} value={v} className="capitalize">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço Resumido</Label>
              <Input
                disabled={isLegacy}
                {...form.register('endereco_resumido')}
                placeholder="Rua, Número, Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input disabled={isLegacy} {...form.register('cidade')} />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Controller
                name="estado"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      disabled={isLegacy}
                      {...field}
                      value={field.value || ''}
                      maxLength={2}
                      placeholder="Ex: SP"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .replace(/[^a-zA-Z]/g, '')
                            .toUpperCase()
                            .slice(0, 2),
                        )
                      }
                    />
                    {fieldState.error && (
                      <p className="text-xs text-destructive">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input disabled={isLegacy} {...form.register('matricula')} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição IPTU</Label>
              <Input disabled={isLegacy} {...form.register('inscricao_iptu')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea disabled={isLegacy} {...form.register('observacoes')} />
            </div>
          </div>
          {!isLegacy && (
            <div className="flex justify-between items-center pt-4 border-t">
              <TestFillButton onClick={fillTestData} />
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Imóvel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
