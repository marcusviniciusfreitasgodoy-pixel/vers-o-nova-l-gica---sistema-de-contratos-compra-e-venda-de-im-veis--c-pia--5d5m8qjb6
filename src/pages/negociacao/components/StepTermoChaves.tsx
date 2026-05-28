import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { TestFillButton } from '@/components/TestFillButton'

const formSchema = z.object({
  data_entrega: z.string().min(1, 'Obrigatório'),
  estado_conservacao: z.string().optional(),
  leitura_agua: z.string().optional(),
  leitura_luz: z.string().optional(),
  leitura_gas: z.string().optional(),
  transferencia_taxas_data: z.string().optional(),
  itens_entregues: z.array(z.string()).optional(),
  vistoria_anexa: z.string().optional(),
})

const itensDefault = [
  'Chaves principais',
  'Chaves internas',
  'Controle remoto portão',
  'Tags de acesso',
  'Manual do proprietário',
]

export function StepTermoChaves({
  negociacaoId,
  onNext,
  isReadOnly,
}: {
  negociacaoId: string
  onNext: () => void
  isReadOnly?: boolean
}) {
  const { toast } = useToast()
  const [recordId, setRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_entrega: new Date().toISOString().split('T')[0],
      estado_conservacao: '',
      leitura_agua: '',
      leitura_luz: '',
      leitura_gas: '',
      transferencia_taxas_data: '',
      itens_entregues: [],
      vistoria_anexa: '',
    },
  })

  useEffect(() => {
    pb.collection('gp_doc_termo_chaves')
      .getFirstListItem(`negociacao_id="${negociacaoId}"`)
      .then((rec) => {
        setRecordId(rec.id)
        form.reset({
          data_entrega: rec.data_entrega?.split('T')[0] || '',
          estado_conservacao: rec.estado_conservacao || '',
          leitura_agua: rec.leitura_agua || '',
          leitura_luz: rec.leitura_luz || '',
          leitura_gas: rec.leitura_gas || '',
          transferencia_taxas_data: rec.transferencia_taxas_data?.split('T')[0] || '',
          itens_entregues: rec.itens_entregues || [],
          vistoria_anexa: rec.vistoria_anexa?.link || '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [negociacaoId, form])

  const fillTestData = () => {
    form.setValue('data_entrega', new Date().toISOString().split('T')[0])
    form.setValue('estado_conservacao', 'Imóvel em perfeito estado, recém pintado.')
    form.setValue('leitura_agua', '123 m³')
    form.setValue('leitura_luz', '4560 kWh')
    form.setValue('leitura_gas', '78 m³')
    form.setValue(
      'transferencia_taxas_data',
      new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    )
    form.setValue('itens_entregues', ['Chaves principais', 'Controle remoto portão'])
    form.setValue('vistoria_anexa', 'https://exemplo.com/vistoria.pdf')
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = {
        ...values,
        negociacao_id: negociacaoId,
        data_entrega: values.data_entrega
          ? new Date(values.data_entrega + 'T12:00:00Z').toISOString()
          : '',
        transferencia_taxas_data: values.transferencia_taxas_data
          ? new Date(values.transferencia_taxas_data + 'T12:00:00Z').toISOString()
          : '',
        vistoria_anexa: values.vistoria_anexa ? { link: values.vistoria_anexa } : null,
      }

      if (recordId) {
        await pb.collection('gp_doc_termo_chaves').update(recordId, data)
      } else {
        const rec = await pb.collection('gp_doc_termo_chaves').create(data)
        setRecordId(rec.id)
      }
      toast({ title: 'Termo de Chaves salvo com sucesso' })
      onNext()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={isReadOnly} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="data_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Entrega</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transferencia_taxas_data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Limite Transf. de Taxas</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estado_conservacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de Conservação</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva as condições gerais do imóvel..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vistoria_anexa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vistoria Anexa (Link/Referência)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="leitura_agua"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leitura Água</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1234 m³" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leitura_luz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leitura Luz</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 5678 kWh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leitura_gas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leitura Gás</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 90 m³" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="itens_entregues"
            render={() => (
              <FormItem>
                <FormLabel className="text-base">Itens Entregues</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {itensDefault.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="itens_entregues"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item])
                                    : field.onChange(field.value?.filter((value) => value !== item))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item}</FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <div className="flex justify-between items-center mt-8 pt-4 border-t">
          {!isReadOnly ? <TestFillButton onClick={fillTestData} /> : <div />}
          <div className="flex justify-end gap-4">
            {isReadOnly ? (
              <Button type="button" onClick={onNext}>
                Avançar ao Termo de Posse
              </Button>
            ) : (
              <Button type="submit">Salvar e Avançar</Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
