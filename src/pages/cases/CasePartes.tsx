import { useEffect, useState } from 'react'
import { getPartesByCase, createParte, updateParte, deleteParte } from '@/services/partes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function CasePartes({ caseId }: { caseId: string }) {
  const [partes, setPartes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const parteSchema = z
    .object({
      tipo_da_parte: z.enum(['pessoa_fisica', 'pessoa_juridica']),
      nome: z.string().min(1, 'Este campo é obrigatório.'),
      documento: z.string().optional(),
      papel_na_operacao: z.enum(['comprador', 'vendedor', 'representante', 'testemunha', 'outro']),
      e_mail: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
      telefone: z.string().optional(),
      observacoes: z.string().optional(),
      possui_representacao: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.tipo_da_parte === 'pessoa_fisica' && data.documento) {
        const digits = data.documento.replace(/\D/g, '')
        if (digits.length > 0 && digits.length !== 11) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['documento'],
            message: 'O documento deve ter o número correto de dígitos.',
          })
        }
      }
      if (data.tipo_da_parte === 'pessoa_juridica' && data.documento) {
        const digits = data.documento.replace(/\D/g, '')
        if (digits.length > 0 && digits.length !== 14) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['documento'],
            message: 'O documento deve ter o número correto de dígitos.',
          })
        }
      }
    })

  const formatDoc = (doc: string | undefined, tipo: string) => {
    if (!doc) return '-'
    const digits = doc.replace(/\D/g, '')
    if (tipo === 'pessoa_fisica' && digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    if (tipo === 'pessoa_juridica' && digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return doc
  }

  const formatTel = (tel: string | undefined) => {
    if (!tel) return '-'
    const digits = tel.replace(/\D/g, '')
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    return tel
  }

  const form = useForm({
    resolver: zodResolver(parteSchema),
    defaultValues: {
      tipo_da_parte: 'pessoa_fisica',
      nome: '',
      documento: '',
      papel_na_operacao: 'comprador',
      e_mail: '',
      telefone: '',
      observacoes: '',
      possui_representacao: false,
    },
  })

  useEffect(() => {
    loadPartes()
  }, [caseId])

  const loadPartes = async () => {
    try {
      const data = await getPartesByCase(caseId)
      setPartes(data)
    } catch {
      toast.error('Erro ao carregar partes')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    form.reset()
    setEditingId(null)
    setIsOpen(true)
  }

  const handleEdit = (p: any) => {
    form.reset({
      ...p,
      documento: formatDoc(p.documento, p.tipo_da_parte),
      telefone: formatTel(p.telefone),
    })
    setEditingId(p.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta parte?')) return
    try {
      await deleteParte(id)
      toast.success('Excluído com sucesso')
      loadPartes()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const onSubmit = async (vals: any) => {
    try {
      const payload = {
        ...vals,
        case_id: caseId,
        documento: vals.documento?.replace(/\D/g, ''),
        telefone: vals.telefone?.replace(/\D/g, ''),
      }
      if (editingId) {
        await updateParte(editingId, payload)
        toast.success('Operação realizada com sucesso')
      } else {
        await createParte(payload)
        toast.success('Operação realizada com sucesso')
      }
      setIsOpen(false)
      loadPartes()
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
    }
  }

  if (loading) return <Loader2 className="animate-spin h-6 w-6" />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Partes Envolvidas</h2>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Parte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {partes.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{p.nome}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {p.papel_na_operacao?.replace('_', ' ')} • {p.tipo_da_parte?.replace('_', ' ')}
                </p>
                {p.documento && (
                  <p className="text-sm">Doc: {formatDoc(p.documento, p.tipo_da_parte)}</p>
                )}
                {p.telefone && <p className="text-sm">Tel: {formatTel(p.telefone)}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {partes.length === 0 && (
          <p className="text-muted-foreground text-sm">Nenhuma parte cadastrada para este caso.</p>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Parte' : 'Nova Parte'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input {...form.register('nome')} />
                {form.formState.errors.nome && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.nome.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Controller
                  name="papel_na_operacao"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['comprador', 'vendedor', 'representante', 'testemunha', 'outro'].map(
                          (v) => (
                            <SelectItem key={v} value={v} className="capitalize">
                              {v}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Controller
                  name="tipo_da_parte"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                        <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Documento (CPF/CNPJ)</Label>
                <Controller
                  name="documento"
                  control={form.control}
                  render={({ field }) => {
                    const tipo = form.watch('tipo_da_parte')
                    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      let val = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, tipo === 'pessoa_fisica' ? 11 : 14)
                      if (val.length > 0) {
                        if (tipo === 'pessoa_fisica') {
                          val = val.replace(/(\d{3})(\d)/, '$1.$2')
                          val = val.replace(/(\d{3})(\d)/, '$1.$2')
                          val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                        } else {
                          val = val.replace(/(\d{2})(\d)/, '$1.$2')
                          val = val.replace(/(\d{3})(\d)/, '$1.$2')
                          val = val.replace(/(\d{3})(\d)/, '$1/$2')
                          val = val.replace(/(\d{4})(\d{1,2})$/, '$1-$2')
                        }
                      }
                      field.onChange(val)
                    }
                    return (
                      <Input
                        {...field}
                        value={field.value || ''}
                        onChange={handleChange}
                        maxLength={tipo === 'pessoa_fisica' ? 14 : 18}
                        placeholder={
                          tipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'
                        }
                      />
                    )
                  }}
                />
                {form.formState.errors.documento && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.documento.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" {...form.register('e_mail')} />
                {form.formState.errors.e_mail && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.e_mail.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Controller
                  name="telefone"
                  control={form.control}
                  render={({ field }) => {
                    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      let val = e.target.value.replace(/\D/g, '').slice(0, 11)
                      if (val.length > 0) {
                        val = val.replace(/^(\d{2})(\d)/g, '($1) $2')
                        val = val.replace(/(\d)(\d{4})$/, '$1-$2')
                      }
                      field.onChange(val)
                    }
                    return (
                      <Input
                        {...field}
                        value={field.value || ''}
                        onChange={handleChange}
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                      />
                    )
                  }}
                />
                {form.formState.errors.telefone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.telefone.message as string}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea {...form.register('observacoes')} />
            </div>
            <div className="flex items-center gap-2">
              <Controller
                name="possui_representacao"
                control={form.control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="rep" />
                )}
              />
              <Label htmlFor="rep" className="cursor-pointer">
                Possui Representação
              </Label>
            </div>
            <Button type="submit" className="w-full">
              Salvar Parte
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
