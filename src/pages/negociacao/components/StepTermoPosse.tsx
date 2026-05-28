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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { TestFillButton } from '@/components/TestFillButton'

const formSchema = z.object({
  data_imissao_posse: z.string().min(1, 'Obrigatório'),
  imovel_locado: z.boolean(),
  dados_locacao: z
    .object({
      tenant_name: z.string().optional(),
      rental_value: z.coerce.number().optional(),
      due_date: z.string().optional(),
      transfer_details: z.string().optional(),
    })
    .optional(),
  responsabilidades_transferidas: z.array(z.string()).optional(),
})

const responsabilidadesDefault = ['IPTU', 'Condomínio', 'Água', 'Energia Elétrica', 'Gás']

export function StepTermoPosse({
  negociacaoId,
  onNext,
  onBack,
  isReadOnly,
}: {
  negociacaoId: string
  onNext: () => void
  onBack: () => void
  isReadOnly?: boolean
}) {
  const { toast } = useToast()
  const [recordId, setRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_imissao_posse: new Date().toISOString().split('T')[0],
      imovel_locado: false,
      dados_locacao: { tenant_name: '', rental_value: 0, due_date: '', transfer_details: '' },
      responsabilidades_transferidas: [],
    },
  })

  const locado = form.watch('imovel_locado')

  useEffect(() => {
    pb.collection('gp_doc_termo_posse')
      .getFirstListItem(`negociacao_id="${negociacaoId}"`)
      .then((rec) => {
        setRecordId(rec.id)
        form.reset({
          data_imissao_posse: rec.data_imissao_posse?.split('T')[0] || '',
          imovel_locado: rec.imovel_locado || false,
          dados_locacao: rec.dados_locacao || {
            tenant_name: '',
            rental_value: 0,
            due_date: '',
            transfer_details: '',
          },
          responsabilidades_transferidas: rec.responsabilidades_transferidas || [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [negociacaoId, form])

  const fillTestData = () => {
    form.setValue('data_imissao_posse', new Date().toISOString().split('T')[0])
    form.setValue('imovel_locado', true)
    form.setValue('dados_locacao', {
      tenant_name: 'Inquilino Teste',
      rental_value: 2500,
      due_date: 'Dia 10',
      transfer_details: 'Contrato de 30 meses',
    })
    form.setValue('responsabilidades_transferidas', ['IPTU', 'Condomínio', 'Energia Elétrica'])
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = {
        ...values,
        negociacao_id: negociacaoId,
        tipo_posse: values.imovel_locado ? 'com_locatario' : 'direta_livre',
        data_imissao_posse: values.data_imissao_posse
          ? new Date(values.data_imissao_posse + 'T12:00:00Z').toISOString()
          : '',
      }

      if (recordId) {
        await pb.collection('gp_doc_termo_posse').update(recordId, data)
      } else {
        const rec = await pb.collection('gp_doc_termo_posse').create(data)
        setRecordId(rec.id)
      }

      await pb.collection('gp_negociacoes').update(negociacaoId, { estagio: 'concluido' })

      toast({ title: 'Termo de Posse salvo e negociação concluída!' })
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
          <FormField
            control={form.control}
            name="data_imissao_posse"
            render={({ field }) => (
              <FormItem className="md:w-1/2">
                <FormLabel>Data de Imissão na Posse</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imovel_locado"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">O imóvel está locado?</FormLabel>
                  <FormDescription>
                    Ative caso haja um inquilino e os direitos de locação serão transferidos.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {locado && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
              <FormField
                control={form.control}
                name="dados_locacao.tenant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Inquilino</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dados_locacao.rental_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Aluguel (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dados_locacao.due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Vencimento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Dia 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dados_locacao.transfer_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhes da Transferência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Multas, garantias..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="responsabilidades_transferidas"
            render={() => (
              <FormItem>
                <FormLabel className="text-base">Responsabilidades Transferidas</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {responsabilidadesDefault.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="responsabilidades_transferidas"
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

        <div className="flex justify-between items-center mt-8 pt-4 border-t gap-4">
          <Button type="button" variant="outline" onClick={onBack}>
            {isReadOnly ? 'Voltar ao Termo de Chaves' : 'Voltar'}
          </Button>

          <div className="flex items-center gap-4">
            {!isReadOnly && <TestFillButton onClick={fillTestData} />}
            {isReadOnly ? (
              <Button type="button" onClick={onNext}>
                Voltar ao Resumo
              </Button>
            ) : (
              <Button type="submit">Concluir Negociação</Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
