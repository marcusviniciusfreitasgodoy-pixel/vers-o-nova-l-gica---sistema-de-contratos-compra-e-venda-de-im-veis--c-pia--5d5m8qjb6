import { useEffect, useState } from 'react'
import { getPartesByCase, createParte, updateParte, deleteParte } from '@/services/partes'
import { getGPPessoasByCase } from '@/services/gp_pessoas'
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
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { TestFillButton } from '@/components/TestFillButton'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Badge } from '@/components/ui/badge'

export default function CasePartes({
  caseId,
  tipoOperacao,
  triggerAction,
  onActionConsumed,
}: {
  caseId: string
  tipoOperacao?: string
  triggerAction?: { type: string; role: string } | null
  onActionConsumed?: () => void
}) {
  const [partes, setPartes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLegacy, setEditingLegacy] = useState(false)

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
      papel_na_operacao: ['autorizacao_venda', 'checklist_documental'].includes(tipoOperacao || '')
        ? 'vendedor'
        : 'comprador',
      e_mail: '',
      telefone: '',
      observacoes: '',
      possui_representacao: false,
    },
  })

  useEffect(() => {
    loadPartes()
  }, [caseId])

  useEffect(() => {
    if (triggerAction?.type === 'new_parte') {
      form.reset({
        tipo_da_parte: 'pessoa_fisica',
        nome: '',
        documento: '',
        papel_na_operacao: triggerAction.role as any,
        e_mail: '',
        telefone: '',
        observacoes: '',
        possui_representacao: false,
      })
      setEditingId(null)
      setEditingLegacy(false)
      setIsOpen(true)
      onActionConsumed?.()
    }
  }, [triggerAction, form, onActionConsumed])

  const loadPartes = async () => {
    try {
      const [legacyData, newData] = await Promise.all([
        getPartesByCase(caseId).catch(() => []),
        getGPPessoasByCase(caseId).catch(() => []),
      ])

      const merged = [
        ...legacyData.map((p) => ({ ...p, isLegacy: false })),
        ...newData.map((p) => ({
          id: p.id,
          nome: p.nome_razao_social,
          papel_na_operacao: p.papel_na_operacao || 'outro',
          tipo_da_parte: p.tipo_pessoa === 'juridica' ? 'pessoa_juridica' : 'pessoa_fisica',
          documento: p.cpf_cnpj,
          telefone: p.telefone,
          e_mail: p.email,
          observacoes: p.observacoes,
          possui_representacao: p.possui_representacao,
          isLegacy: true,
        })),
      ]

      setPartes(merged)
    } catch {
      toast.error('Erro ao carregar partes')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    form.reset()
    setEditingId(null)
    setEditingLegacy(false)
    setIsOpen(true)
  }

  const handleEdit = (p: any) => {
    if (p.isLegacy) {
      toast.error('Registros importados de versões anteriores são apenas para leitura.')
      return
    }
    form.reset({
      ...p,
      documento: formatDoc(p.documento, p.tipo_da_parte),
      telefone: formatTel(p.telefone),
    })
    setEditingId(p.id)
    setEditingLegacy(false)
    setIsOpen(true)
  }

  const handleDelete = async (p: any) => {
    if (p.isLegacy) {
      toast.error('Registros importados de versões anteriores não podem ser excluídos.')
      return
    }
    if (!confirm('Deseja excluir esta parte?')) return
    try {
      await deleteParte(p.id)
      toast.success('Excluído com sucesso')
      loadPartes()
    } catch {
      toast.error('Não foi possível concluir agora. Tente novamente.')
    }
  }

  const fillTestData = () => {
    const requireBuyer = !['autorizacao_venda', 'checklist_documental'].includes(tipoOperacao || '')
    const hasComprador = partes.some((p) => p.papel_na_operacao === 'comprador')
    const hasVendedor = partes.some((p) => p.papel_na_operacao === 'vendedor')

    let roleToFill = 'comprador'
    if (!requireBuyer) {
      roleToFill = hasVendedor ? 'testemunha' : 'vendedor'
    } else {
      if (hasComprador && !hasVendedor) {
        roleToFill = 'vendedor'
      } else if (hasComprador && hasVendedor) {
        roleToFill = 'testemunha'
      }
    }

    const existing = partes.find((p) => p.papel_na_operacao === roleToFill)
    if (existing && !existing.isLegacy) {
      setEditingId(existing.id)
      setEditingLegacy(false)
    } else {
      setEditingId(null)
      setEditingLegacy(false)
    }

    form.setValue('papel_na_operacao', roleToFill as any)
    form.setValue('tipo_da_parte', 'pessoa_fisica')
    form.setValue('nome', `Teste ${roleToFill.charAt(0).toUpperCase() + roleToFill.slice(1)}`)
    form.setValue(
      'documento',
      roleToFill === 'comprador'
        ? '11122233344'
        : roleToFill === 'vendedor'
          ? '55566677788'
          : '99988877766',
    )
    form.setValue('e_mail', `teste.${roleToFill}@exemplo.com`)
    form.setValue('telefone', '11987654321')
    form.setValue('observacoes', 'Dados preenchidos automaticamente para teste.')
    form.setValue('possui_representacao', false)
    toast.success(`Dados de teste aplicados para ${roleToFill}.`)
  }

  const onSubmit = async (vals: any) => {
    try {
      const docDigits = vals.documento?.replace(/\D/g, '') || ''

      const isDuplicate = partes.some(
        (p) => p.papel_na_operacao === vals.papel_na_operacao && p.id !== editingId,
      )

      if (isDuplicate && ['comprador', 'vendedor'].includes(vals.papel_na_operacao)) {
        toast.error(
          `Já existe um ${vals.papel_na_operacao} cadastrado para esta operação. Atualize o existente ou remova-o.`,
        )
        return
      }

      let inferredTipoDaParte = vals.tipo_da_parte
      if (docDigits.length === 14) {
        inferredTipoDaParte = 'pessoa_juridica'
      } else if (docDigits.length === 11) {
        inferredTipoDaParte = 'pessoa_fisica'
      }

      const payload = {
        case_id: caseId,
        nome: vals.nome,
        documento: docDigits,
        tipo_da_parte: inferredTipoDaParte,
        papel_na_operacao: vals.papel_na_operacao,
        e_mail: vals.e_mail,
        telefone: vals.telefone?.replace(/\D/g, ''),
        observacoes: vals.observacoes,
        possui_representacao: vals.possui_representacao,
      }

      if (editingId && !editingLegacy) {
        await updateParte(editingId, payload)
        toast.success('Parte atualizada com sucesso')
      } else {
        await createParte(payload as any)
        toast.success('Parte adicionada com sucesso')
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
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    }
  }

  if (loading) return <Loader2 className="animate-spin h-6 w-6" />

  const hasComprador = partes.some((p) => p.papel_na_operacao === 'comprador')
  const hasVendedor = partes.some((p) => p.papel_na_operacao === 'vendedor')
  const compradorDoc = partes.some(
    (p) => p.papel_na_operacao === 'comprador' && p.documento?.replace(/\D/g, '').length > 0,
  )
  const vendedorDoc = partes.some(
    (p) => p.papel_na_operacao === 'vendedor' && p.documento?.replace(/\D/g, '').length > 0,
  )

  const requireBuyer = !['autorizacao_venda', 'checklist_documental'].includes(tipoOperacao || '')

  const warnings = []
  if (requireBuyer) {
    if (!hasComprador) warnings.push('Comprador não cadastrado.')
    else if (!compradorDoc) warnings.push('Comprador sem CPF/CNPJ.')
  }

  if (!hasVendedor) warnings.push('Vendedor não cadastrado.')
  else if (!vendedorDoc) warnings.push('Vendedor sem CPF/CNPJ.')

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2 text-destructive bg-destructive/10 p-4 rounded-md text-sm font-medium border border-destructive/20 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">Avisos de Compliance de Partes:</span>
          </div>
          <ul className="list-disc list-inside ml-7 space-y-1 text-destructive/90">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Partes Envolvidas</h2>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Parte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {partes.map((p) => (
          <Card key={p.id} className="border-l-4 border-l-primary/60">
            <CardContent className="p-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="capitalize bg-primary/5 text-primary border-primary/20"
                  >
                    {p.papel_na_operacao?.replace('_', ' ')}
                  </Badge>
                  <h3 className="font-semibold text-lg">{p.nome}</h3>
                  {p.isLegacy && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Importado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground capitalize mb-1">
                  {p.tipo_da_parte?.replace('_', ' ')}
                </p>
                {p.documento && (
                  <p className="text-sm font-medium">
                    Doc: {formatDoc(p.documento, p.tipo_da_parte)}
                  </p>
                )}
                {p.telefone && <p className="text-sm">Tel: {formatTel(p.telefone)}</p>}
              </div>
              <div className="flex gap-2">
                {!p.isLegacy && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
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
                <Label>Nome/Razão Social</Label>
                <Input {...form.register('nome')} />
                {form.formState.errors.nome && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.nome.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Papel na Operação</Label>
                <Controller
                  name="papel_na_operacao"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['comprador', 'vendedor', 'representante', 'testemunha', 'outro']
                          .filter((v) => (requireBuyer ? true : v !== 'comprador'))
                          .map((v) => (
                            <SelectItem key={v} value={v} className="capitalize">
                              {v}
                            </SelectItem>
                          ))}
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
            <div className="flex justify-between items-center gap-4 mt-6">
              <TestFillButton onClick={fillTestData} />
              <Button type="submit" className="flex-1">
                Salvar Parte
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
