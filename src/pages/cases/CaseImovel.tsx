import { useEffect, useState } from 'react'
import { getImovelByCase, createImovel, updateImovel } from '@/services/imovel'
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
import { Loader2, Save } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

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
        const data = await getImovelByCase(caseId)
        if (data) {
          setImovelId(data.id)
          form.reset(data)
        }
      } catch {
        // Not found or error, ignore
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [caseId])

  const onSubmit = async (vals: any) => {
    setSaving(true)
    try {
      if (imovelId) {
        await updateImovel(imovelId, vals)
        toast.success('Operação realizada com sucesso')
      } else {
        const created = await createImovel({ ...vals, case_id: caseId })
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
        toast.error(
          'Ocorreu um erro ao salvar os dados. Por favor, tente novamente ou contate o suporte se o problema persistir.',
        )
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Imóvel</Label>
              <Controller
                name="tipo_imovel"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                  <Select value={field.value} onValueChange={field.onChange}>
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
              <Input {...form.register('endereco_resumido')} placeholder="Rua, Número, Bairro" />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input {...form.register('cidade')} />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Controller
                name="estado"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
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
              <Input {...form.register('matricula')} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição IPTU</Label>
              <Input {...form.register('inscricao_iptu')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea {...form.register('observacoes')} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Imóvel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
