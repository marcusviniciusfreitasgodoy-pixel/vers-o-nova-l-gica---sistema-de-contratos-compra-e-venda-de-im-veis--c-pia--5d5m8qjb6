import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getCase, createCase, updateCase } from '@/services/cases'
import { getCompany, getCompanies } from '@/services/companies'
import { createParte } from '@/services/partes'
import { createGPImovel } from '@/services/gp_imoveis'
import { updateUserProfile } from '@/services/users'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Briefcase, ArrowLeft, Loader2, Save, Wand2, ArrowRight } from 'lucide-react'
import { TestFillButton } from '@/components/TestFillButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CasePartes from './CasePartes'
import CaseImovel from './CaseImovel'

const caseSchema = z
  .object({
    title: z.string().min(1, 'Este campo é obrigatório.'),
    description: z.string().optional(),
    priority: z.enum(['baixa', 'media', 'alta']).optional(),
    segmento_operacional: z.enum([
      'corretor_autonomo',
      'imobiliaria_pequena_media',
      'imobiliaria_estruturada_premium',
      'construtora_incorporadora',
    ]),
    tipo_operacao: z.enum([
      'compra_venda_padrao',
      'compra_venda_sinal',
      'compra_venda_financiamento',
      'recibo_sinal_autonomo',
      'checklist_documental',
      'promessa_compra_venda',
      'distrato',
      'termo_posse_chaves',
      'permuta',
      'autorizacao_venda',
    ]),
    nivel_complexidade: z.enum(['simples', 'moderado', 'sensivel', 'complexo', 'bloqueado']),
    estado_caso: z.enum([
      'rascunho',
      'em_qualificacao',
      'em_preenchimento',
      'aguardando_documentos',
      'em_validacao',
      'pendente_revisao_juridica',
      'encaminhado_suporte_especializado',
      'aprovado',
      'aprovado_ressalvas',
      'bloqueado',
      'minuta_gerada',
      'cancelado',
      'arquivado',
    ]),
    observacoes: z.string().optional(),
    responsible: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isCorretor = data.segmento_operacional === 'corretor_autonomo'
    const isReciboAutonomo = data.tipo_operacao === 'recibo_sinal_autonomo'

    if (isReciboAutonomo && !isCorretor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tipo_operacao'],
        message: 'Recibo de Sinal Autônomo é restrito a Corretor Autônomo.',
      })
    }
  })

type CaseFormValues = z.infer<typeof caseSchema>

export default function CaseForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditing = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const saveActionRef = useRef<'stay' | 'return'>('stay')

  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([])
  const [isLinkingCompany, setIsLinkingCompany] = useState(false)

  useEffect(() => {
    async function checkCompany() {
      if (!isEditing && user && !user.company) {
        try {
          const companies = await getCompanies()
          if (companies.length === 1) {
            await updateUserProfile(user.id, { company: companies[0].id })
            await pb.collection('users').authRefresh()
            toast.success('Empresa associada automaticamente.')
          } else if (companies.length > 1) {
            setAvailableCompanies(companies)
            setShowCompanyDialog(true)
          }
        } catch (error) {
          console.error('Erro ao verificar empresas:', error)
        }
      }
    }
    checkCompany()
  }, [user, isEditing])

  const handleSelectCompany = async (companyId: string) => {
    setIsLinkingCompany(true)
    try {
      await updateUserProfile(user.id, { company: companyId })
      await pb.collection('users').authRefresh()
      toast.success('Empresa associada com sucesso.')
      setShowCompanyDialog(false)
    } catch (error) {
      toast.error('Erro ao associar empresa.')
      console.error(error)
    } finally {
      setIsLinkingCompany(false)
    }
  }

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      estado_caso: 'rascunho',
      priority: 'media',
      nivel_complexidade: 'simples',
      segmento_operacional: 'corretor_autonomo',
      tipo_operacao: 'compra_venda_padrao',
    },
  })

  useEffect(() => {
    if (user?.company || user?.is_admin) {
      pb.collection('users')
        .getFullList({ filter: user?.is_admin ? '' : `company = "${user?.company}"` })
        .then(setCompanyUsers)
        .catch(console.error)
    }
  }, [user])

  useEffect(() => {
    async function init() {
      if (isEditing) {
        try {
          const data = await getCase(id as string)

          // RBAC and Process Governance: Lock edits for finalized/paralyzed cases
          if (['minuta_gerada', 'cancelado', 'arquivado'].includes(data.estado_caso)) {
            toast.error('Este caso está trancado e não pode ser editado.', {
              description: 'Retorne o estágio do caso caso precise alterar os dados.',
            })
            navigate(`/casos/${id}`)
            return
          }

          form.reset({
            title: data.title,
            description: data.description || '',
            priority: data.priority,
            segmento_operacional: data.segmento_operacional,
            tipo_operacao: data.tipo_operacao,
            nivel_complexidade: data.nivel_complexidade,
            estado_caso: data.estado_caso,
            observacoes: data.observacoes || '',
            responsible: data.responsible,
          })
        } catch (err) {
          toast.error('Não foi possível concluir agora. Tente novamente.')
        } finally {
          setInitialLoading(false)
        }
      } else {
        form.setValue('responsible', user?.id)
        if (user?.company) {
          try {
            const c = await getCompany(user.company)
            if (c.segment) {
              form.setValue('segmento_operacional', c.segment as any)
            }
          } catch (e) {
            console.error(e)
          }
        }
      }
    }
    init()
  }, [id, isEditing, form, user])

  const fillTestData = () => {
    form.setValue('title', 'Venda Apt 302 Centro (Teste Completo)')
    form.setValue(
      'description',
      'Operação de compra e venda padrão para teste rápido de geração de documentos, com todos os campos realistas preenchidos.',
    )
    form.setValue('priority', 'alta')
    form.setValue('segmento_operacional', 'imobiliaria_estruturada_premium')
    form.setValue('tipo_operacao', 'compra_venda_padrao')
    form.setValue('nivel_complexidade', 'simples')
    form.setValue('observacoes', 'Cliente pré-aprovado, documentação em dia.')
    toast.success('Dados de teste aplicados.')
  }

  const handleMasterFill = async () => {
    if (!id) return
    setLoading(true)
    try {
      const isAutorizacao =
        form.getValues('tipo_operacao') === 'autorizacao_venda' ||
        form.getValues('tipo_operacao') === 'checklist_documental'

      if (!isAutorizacao) {
        await createParte({
          nome: 'João Silva (Comprador Teste)',
          documento: '11122233344',
          tipo_da_parte: 'pessoa_fisica',
          papel_na_operacao: 'comprador',
          e_mail: 'joao.comprador@teste.com',
          telefone: '11999999999',
          observacoes: 'Gerado via Teste Mestre',
          possui_representacao: false,
          case_id: id,
        } as any)
      }

      await createParte({
        nome: 'Maria Oliveira (Vendedora Teste)',
        documento: '55566677788',
        tipo_da_parte: 'pessoa_fisica',
        papel_na_operacao: 'vendedor',
        e_mail: 'maria.vendedora@teste.com',
        telefone: '11888888888',
        observacoes: 'Gerado via Teste Mestre',
        possui_representacao: false,
        case_id: id,
      } as any)

      await createGPImovel({
        tipo_imovel: 'apartamento',
        finalidade: 'residencial',
        endereco_resumido: 'Av. Paulista, 1000, Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        matricula_numero: '987654',
        inscricao_iptu: '123.456.789-00',
        observacoes: 'Gerado via Teste Mestre',
        case_id: id,
      } as any)

      toast.success('Estrutura de teste (Partes e Imóvel) gerada com sucesso!')
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar estrutura de teste.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: CaseFormValues) => {
    if (!pb.authStore.isValid) {
      toast.error('Sessão expirada.', { description: 'Faça login novamente para continuar.' })
      return
    }
    setLoading(true)
    try {
      if (!user?.company && !isEditing) {
        toast.error('Você não possui uma empresa associada para criar um caso.')
        setLoading(false)
        return
      }

      if (isEditing) {
        // Prevent manual update of state through the form payload
        const { estado_caso, ...updatePayload } = values
        await updateCase(id as string, updatePayload)

        toast.success('Operação realizada com sucesso')
        if (saveActionRef.current === 'return') {
          navigate(`/casos/${id}`)
        }
      } else {
        const payload = {
          ...values,
          company: user?.company,
        }
        const created = await createCase(payload)
        toast.success('Caso criado! Avançando para a central operacional...')
        navigate(`/casos/${created.id}`)
      }
    } catch (err: any) {
      if (err?.status === 401) {
        toast.error('Sessão expirada.', { description: 'Faça login novamente para continuar.' })
        return
      }
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        for (const [field, msg] of Object.entries(errors)) {
          form.setError(field as any, { type: 'manual', message: msg })
        }
      } else {
        toast.error('Não foi possível concluir agora. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const FormContent = () => {
    const role = user?.role || (user?.is_admin ? 'admin' : 'operador')
    const canEditResponsible = role === 'admin' || role === 'gestor'

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Principais</CardTitle>
            <CardDescription>
              Defina o título e a descrição da operação imobiliária.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Título do Caso</Label>
              <Input placeholder="Ex: Venda Apt 302 Centro" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Breve resumo da operação..."
                className="resize-none"
                {...form.register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={form.watch('responsible')}
                onValueChange={(val) => form.setValue('responsible', val)}
                disabled={!canEditResponsible}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {companyUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canEditResponsible && (
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas gestores ou administradores podem alterar o responsável.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classificadores Operacionais</CardTitle>
            <CardDescription>
              A classificação correta define o escopo e a estrutura de análise.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Segmento Operacional</Label>
              <Select
                value={form.watch('segmento_operacional')}
                onValueChange={(val) => form.setValue('segmento_operacional', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corretor_autonomo">Corretor Autônomo</SelectItem>
                  <SelectItem value="imobiliaria_pequena_media">Imobiliária P/M</SelectItem>
                  <SelectItem value="imobiliaria_estruturada_premium">
                    Imobiliária Estruturada Premium
                  </SelectItem>
                  <SelectItem value="construtora_incorporadora">
                    Construtora/Incorporadora
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Operação</Label>
              <Select
                value={form.watch('tipo_operacao')}
                onValueChange={(val) => form.setValue('tipo_operacao', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra_venda_padrao">Compra e Venda Padrão</SelectItem>
                  <SelectItem value="compra_venda_sinal">Compra e Venda com Sinal</SelectItem>
                  <SelectItem value="compra_venda_financiamento">C/V com Financiamento</SelectItem>
                  <SelectItem value="recibo_sinal_autonomo">Recibo de Sinal Autônomo</SelectItem>
                  <SelectItem value="checklist_documental">Checklist Documental</SelectItem>
                  <SelectItem value="promessa_compra_venda">Promessa de Compra e Venda</SelectItem>
                  <SelectItem value="distrato">Distrato</SelectItem>
                  <SelectItem value="termo_posse_chaves">Termo de Posse / Chaves</SelectItem>
                  <SelectItem value="permuta">Permuta</SelectItem>
                  <SelectItem value="autorizacao_venda">Autorização de Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de Complexidade</Label>
              <Select
                value={form.watch('nivel_complexidade')}
                onValueChange={(val) => form.setValue('nivel_complexidade', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples">Simples</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="sensivel">Sensível</SelectItem>
                  <SelectItem value="complexo">Complexo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado do Caso</Label>
              <p className="text-xs text-muted-foreground mb-2">
                O estado do caso é somente leitura. Utilize o fluxo de trabalho (Workflow) no resumo
                do caso para realizar transições.
              </p>
              <Select
                value={form.watch('estado_caso')}
                onValueChange={(val) => form.setValue('estado_caso', val as any)}
                disabled={true}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="em_qualificacao">Em Qualificação</SelectItem>
                  <SelectItem value="em_preenchimento">Em Preenchimento</SelectItem>
                  <SelectItem value="aguardando_documentos">Aguardando Documentos</SelectItem>
                  <SelectItem value="em_validacao">Em Validação</SelectItem>
                  <SelectItem value="pendente_revisao_juridica">
                    Pendente Revisão Jurídica
                  </SelectItem>
                  <SelectItem value="encaminhado_suporte_especializado">
                    Encaminhado Suporte Especializado
                  </SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="aprovado_ressalvas">Aprovado com Ressalvas</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="minuta_gerada">Minuta Gerada</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(val) => form.setValue('priority', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
            <CardDescription>Informações adicionais e acompanhamento geral.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notas gerais sobre andamento, ressalvas, contatos..."
              className="min-h-[100px]"
              {...form.register('observacoes')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-between items-center gap-4 mt-6">
          {!isEditing ? <TestFillButton onClick={fillTestData} /> : <div />}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link to={isEditing ? `/casos/${id}` : '/casos'}>
                {isEditing ? 'Voltar para o Resumo' : 'Cancelar'}
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={() => {
                saveActionRef.current = 'return'
              }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!loading && isEditing && <Save className="mr-2 h-4 w-4" />}
              {!isEditing ? 'Próxima Etapa' : 'Salvar Caso'}
              {!loading && !isEditing && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Selecione sua Empresa</DialogTitle>
            <DialogDescription>
              Para criar um caso, você precisa estar associado a uma empresa. Selecione uma das
              opções abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableCompanies.map((c) => (
              <Button
                key={c.id}
                variant="outline"
                className="justify-start"
                onClick={() => handleSelectCompany(c.id)}
                disabled={isLinkingCompany}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to={isEditing ? `/casos/${id}` : '/casos'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            {isEditing ? 'Editar Caso' : 'Novo Caso'}
          </h1>
        </div>
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMasterFill}
            disabled={loading}
            className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
          >
            <Wand2 className="w-4 h-4 mr-2" /> Gerar Partes e Imóvel
          </Button>
        )}
      </div>

      {!isEditing ? (
        <FormContent />
      ) : (
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detalhes">Detalhes do Caso</TabsTrigger>
            <TabsTrigger value="partes">Partes Envolvidas</TabsTrigger>
            <TabsTrigger value="imovel">Imóvel</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-6">
            <FormContent />
          </TabsContent>

          <TabsContent value="partes" className="mt-6">
            <CasePartes caseId={id as string} tipoOperacao={form.watch('tipo_operacao')} />
          </TabsContent>

          <TabsContent value="imovel" className="mt-6">
            <CaseImovel caseId={id as string} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
