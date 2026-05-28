import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { contractSchema, type ContractFormValues, parseCurrencySafe } from '@/lib/schemas'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  FileText,
  Beaker,
} from 'lucide-react'
import { saveContractDraft } from '@/services/contracts'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Progress } from '@/components/ui/progress'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'
import { PreviewPDFModal } from './PreviewPDFModal'
import { getMinutaPDFBlobUrl, generateMinutaPDF } from '@/lib/pdf-generator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getContractTemplates,
  createContractTemplate,
  type ContractTemplate,
} from '@/services/contract_templates'

import { EnvolvidosTab } from './contract/EnvolvidosTab'
import { ImovelTab } from './contract/ImovelTab'
import { DistratoSelector } from './contract/DistratoSelector'
import { FinanceiroTab } from './contract/FinanceiroTab'
import { JuridicoTab } from './contract/JuridicoTab'
import { RevisaoTab } from './contract/RevisaoTab'

const WIZARD_STEPS_ALL = [
  { id: 'envolvidos', title: 'Envolvidos' },
  { id: 'imovel', title: 'Imóvel' },
  { id: 'financeiro', title: 'Financeiro' },
  { id: 'juridico', title: 'Jurídico' },
  { id: 'revisao', title: 'Revisão' },
]

export function ContractForm({
  tipoDocumento,
  onBack,
  onSubmit,
  handleNext: onHandleNext,
  documentName = 'Contrato',
  documentGender = 'o',
}: {
  tipoDocumento: string
  onBack: () => void
  onSubmit?: (values: any, submitFn: () => Promise<void>) => Promise<void>
  handleNext?: (values: any, nextFn: () => Promise<void>) => Promise<void>
  documentName?: string
  documentGender?: string
}) {
  const activeSteps = WIZARD_STEPS_ALL.filter((s) => {
    if (['checklist_documental', 'ficha_cadastral'].includes(tipoDocumento)) {
      return ['envolvidos', 'imovel', 'revisao'].includes(s.id)
    }
    if (tipoDocumento === 'autorizacao_intermediacao') {
      return ['envolvidos', 'imovel', 'financeiro', 'juridico', 'revisao'].includes(s.id)
    }
    if (tipoDocumento === 'recibo_sinal') {
      return ['envolvidos', 'imovel', 'financeiro', 'revisao'].includes(s.id)
    }
    if (['termo_entrega_chaves', 'termo_posse'].includes(tipoDocumento)) {
      return ['envolvidos', 'imovel', 'juridico', 'revisao'].includes(s.id)
    }
    if (tipoDocumento === 'distrato') {
      return ['envolvidos', 'financeiro', 'juridico', 'revisao'].includes(s.id)
    }
    return true
  })

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStepData = activeSteps[currentStepIndex]
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [draftId, setDraftId] = useState<string | undefined>()

  const navigate = useNavigate()
  const { user } = useAuth()

  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [currentMinuta, setCurrentMinuta] = useState<string>('')

  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGenerating || isPreviewing) {
      setProgress(0)
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95))
      }, 200)
    } else {
      setProgress(100)
    }
    return () => clearInterval(interval)
  }, [isGenerating, isPreviewing])

  useEffect(() => {
    if (user?.is_admin) {
      getContractTemplates().then(setTemplates).catch(console.error)
    }
  }, [user])

  const handleSaveTemplate = async () => {
    if (!templateName) {
      return toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome do template é obrigatório',
      })
    }
    if (!user?.id) return
    try {
      const data = form.getValues()
      const newTemplate = await createContractTemplate({
        name: templateName,
        template_data: data,
        user: user.id,
      })
      setTemplates([newTemplate, ...templates])
      setIsSaveTemplateOpen(false)
      setTemplateName('')
      toast({ title: 'Template salvo com sucesso!' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao salvar template' })
    }
  }

  const handleLoadTemplate = (templateData: any) => {
    Object.entries(templateData).forEach(([key, value]) => {
      form.setValue(key as any, value as any, { shouldValidate: true, shouldDirty: true })
    })
    toast({ title: 'Template carregado com sucesso!' })
  }

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      tipo_comprador: 'pf',
      vendedor_pj: false,
      tipo_documento: tipoDocumento,
      status: 'rascunho',
      financiamento_comprador: false,
      havera_parcelas: false,
      clausula_lgpd: false,
    } as any,
    mode: 'onChange',
  })

  const handleFillTestData = (profile: 'pf' | 'pj') => {
    const d = new Date()
    const today = d.toISOString().split('T')[0]
    d.setDate(d.getDate() + 30)
    const nextMonth = d.toISOString().split('T')[0]

    const currentNegociacao = form.getValues('tipo_negociacao')
    const isAVista = currentNegociacao === 'a_vista'

    const baseData: any = {
      tipo_negociacao: isAVista ? 'a_vista' : 'financiamento',
      tipo_imovel: 'Apartamento',
      endereco_imovel: 'Rua do Teste, 456',
      numero_imovel: '456',
      complemento_imovel: 'Apto 12',
      cidade_imovel: 'São Paulo',
      bairro_imovel: 'Centro',
      estado_imovel: 'SP',
      cep_imovel: '01000-000',
      matricula_imovel: '123.456',
      cartorio_imovel: '1º CRI',
      inscricao_municipal: '123.456.7890-1',
      area_total: '120',
      area_privativa: '100',
      vagas_garagem: '2',
      quartos: '3',
      suites: '1',

      valor_total: '550.000,00',
      valor_sinal: '50.000,00',
      comissao: '33.000,00',
      percentual_comissao: '6',

      data_assinatura: today,
      data_posse: nextMonth,
      entrega_chaves: nextMonth,
      data_pagamento_sinal: today,

      clausula_lgpd: true,
      pep: false,
      tipo_documento: tipoDocumento,
    }

    if (!isAVista) {
      baseData.valor_financiado = '500.000,00'
      baseData.valor_financiamento = '500.000,00'
      baseData.instituicao_financeira = 'Caixa'
      baseData.prazo_financiamento = '360'
      baseData.financiamento_comprador = true
      baseData.possui_financiamento = true
    } else {
      baseData.valor_recursos_proprios = '500.000,00'
      baseData.financiamento_comprador = false
      baseData.possui_financiamento = false
    }

    let profileData = {}
    if (profile === 'pf') {
      profileData = {
        tipo_comprador: 'pf',
        nome_comprador: 'João da Silva Comprador',
        cpf_comprador: '123.456.789-00',
        rg_comprador: '12.345.678-9',
        nacionalidade_comprador: 'Brasileiro',
        estado_civil_comprador: 'Casado',
        regime_bens_comprador: 'Comunhão Parcial',
        nome_conjuge_comprador: 'Maria da Silva Compradora',
        cpf_conjuge_comprador: '111.222.333-44',
        profissao_comprador: 'Engenheiro de Software',
        endereco_comprador: 'Rua das Flores, 123',
        cep_comprador: '03000-000',
        email_comprador: 'joao.comprador@teste.com',
        telefone_comprador: '(11) 98765-4321',

        vendedor_pj: false,
        nome_vendedor: 'Maria Oliveira Vendedora',
        cpf_vendedor: '987.654.321-11',
        rg_vendedor: '98.765.432-1',
        nacionalidade_vendedor: 'Brasileira',
        estado_civil_vendedor: 'Casada',
        regime_bens_vendedor: 'Comunhão Parcial',
        conjuge_vendedor: 'José Oliveira Vendedor',
        cpf_conjuge_vendedor: '444.555.666-77',
        profissao_vendedor: 'Médica',
        endereco_vendedor: 'Avenida Paulista, 1000',
        cep_vendedor: '04000-000',
        email_vendedor: 'maria.vendedora@teste.com',
        telefone_vendedor: '(11) 91234-5678',
      }
    } else {
      profileData = {
        tipo_comprador: 'pj',
        nome_comprador: 'Empresa Compradora LTDA',
        cnpj_comprador: '12.345.678/0001-90',
        representante_comprador: 'Carlos Diretor',
        email_comprador: 'contato@empresacompradora.com.br',
        telefone_comprador: '(11) 99999-9999',
        endereco_comprador: 'Rua Fictícia, 100',
        cep_comprador: '01000-000',

        vendedor_pj: true,
        nome_vendedor: 'Construtora Vendedora S.A.',
        cnpj_vendedor: '98.765.432/0001-10',
        representante_vendedor: 'Ana Gerente',
        email_vendedor: 'vendas@construtora.com.br',
        telefone_vendedor: '(11) 98888-8888',
        endereco_vendedor: 'Av. Construtora, 500',
        cep_vendedor: '02000-000',
      }
    }

    const testData = { ...baseData, ...profileData }

    Object.entries(testData).forEach(([key, value]) => {
      form.setValue(key as any, value as any, { shouldValidate: true, shouldDirty: true })
    })

    toast({ title: `Dados de teste (${profile.toUpperCase()}) preenchidos!` })
  }

  const getStepForField = (fieldName: string) => {
    const envolvidos = [
      'tipo_comprador',
      'nome_comprador',
      'cpf_comprador',
      'cnpj_comprador',
      'representante_comprador',
      'email_comprador',
      'telefone_comprador',
      'cep_comprador',
      'endereco_comprador',
      'estado_civil_comprador',
      'regime_bens_comprador',
      'nome_conjuge_comprador',
      'cpf_conjuge_comprador',
      'rg_conjuge_comprador',
      'pep',
      'vendedor_pj',
      'nome_vendedor',
      'cpf_vendedor',
      'cnpj_vendedor',
      'representante_vendedor',
      'email_vendedor',
      'telefone_vendedor',
      'cep_vendedor',
      'endereco_vendedor',
      'estado_civil_vendedor',
      'regime_bens_vendedor',
      'conjuge_vendedor',
      'cpf_conjuge_vendedor',
      'rg_conjuge_vendedor',
    ]
    const imovel = [
      'tipo_imovel',
      'matricula_imovel',
      'cartorio_imovel',
      'endereco_imovel',
      'numero_imovel',
      'complemento_imovel',
      'cep_imovel',
      'bairro_imovel',
      'cidade_imovel',
      'estado_imovel',
      'area_privativa',
      'area_total',
      'quartos',
      'vagas_garagem',
      'imovel_inventario',
      'imovel_locado',
      'imovel_ocupado',
      'imovel_desocupado',
      'numero_processo_inventario',
      'inventariante',
      'prazo_locacao',
      'preferencia_locatario',
      'estado_conservacao',
      'leitura_agua',
      'leitura_luz',
      'leitura_gas',
    ]
    const financeiro = [
      'valor_avaliacao',
      'valor_total',
      'valor_sinal',
      'valor_fgts',
      'valor_financiamento',
      'valor_financiado',
      'valor_recursos_proprios',
      'financiamento_comprador',
      'possui_financiamento',
      'havera_parcelas',
      'instituicao_financeira',
      'prazo_financiamento',
      'quantidade_parcelas',
      'valor_parcela',
      'percentual_comissao',
      'valor_comissao',
      'vendedor_banco',
      'vendedor_agencia',
      'vendedor_conta',
      'vendedor_pix',
      'permuta_imovel_endereco',
      'permuta_imovel_matricula',
      'permuta_imovel_valor',
      'permuta_imovel_detalhes',
    ]
    const juridico = [
      'tipo_negociacao',
      'gestao_exclusiva',
      'clausula_arrependimento',
      'posse_imediata',
      'assinatura_eletronica',
      'plataforma_assinatura',
      'arbitragem',
      'mediacao',
      'clausula_lgpd',
      'motivo_distrato',
      'data_distrato',
      'responsabilidade_pro_rata',
    ]

    if (fieldName === 'contrato_origem') return 'envolvidos'
    if (['valor_reembolso', 'multa_distrato'].includes(fieldName)) return 'financeiro'

    if (envolvidos.includes(fieldName)) return 'envolvidos'
    if (imovel.includes(fieldName)) return 'imovel'
    if (financeiro.includes(fieldName)) return 'financeiro'
    if (juridico.includes(fieldName)) return 'juridico'
    return null
  }

  const handleValidationFailure = (errors: Record<string, any>) => {
    toast({
      variant: 'destructive',
      title: 'Erro de validação',
      description: 'Existem campos obrigatórios inválidos ou vazios antes de gerar.',
    })

    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField) {
      const stepId = getStepForField(firstErrorField)
      if (stepId) {
        const stepIndex = activeSteps.findIndex((s) => s.id === stepId)
        if (stepIndex !== -1 && stepIndex !== currentStepIndex) {
          setCurrentStepIndex(stepIndex)
        }
      }
      setTimeout(() => {
        const errorElement = document.querySelector('.text-red-500, .border-red-500')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  const handleStepClick = async (idx: number) => {
    if (isGenerating || isPreviewing || isSaving || idx === currentStepIndex) return

    setIsSaving(true)
    try {
      const record = await saveContractDraft(form.getValues(), draftId)
      if (record?.id) setDraftId(record.id)
      toast({ title: 'Progresso salvo com sucesso' })
      setCurrentStepIndex(idx)
    } catch (err) {
      console.error('Failed to autosave draft:', err)
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: getErrorMessage(err) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    setIsSaving(true)
    const nextFn = async () => {
      try {
        const record = await saveContractDraft(form.getValues(), draftId)
        if (record?.id) setDraftId(record.id)
        toast({ title: 'Progresso salvo com sucesso' })
        setCurrentStepIndex((s) => s + 1)
      } catch (err) {
        console.error('Failed to autosave draft:', err)
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
        })
        throw err
      }
    }

    try {
      if (onHandleNext) {
        await onHandleNext(form.getValues(), nextFn)
      } else {
        await nextFn()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const getPayload = () => {
    const values = form.getValues()

    if (values.tipo_negociacao === 'a_vista') {
      values.financiamento_comprador = false
      values.possui_financiamento = false
    }

    if (!values.valor_financiado) values.valor_financiado = 0
    if (!values.valor_financiamento) values.valor_financiamento = 0

    return {
      ...values,
      json_mestre: {
        comprador: { nome: values.nome_comprador, cpf: values.cpf_comprador },
        negociacao: { valor_total: parseCurrencySafe(values.valor_total) },
      },
    }
  }

  const handlePreview = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      handleValidationFailure(form.formState.errors)
      return
    }

    setIsPreviewing(true)
    setPreviewModalOpen(true)

    const { dismiss } = toast({
      title: 'Processando documento... por favor, aguarde.',
      duration: 100000,
    })

    try {
      let text = ''

      const res = await pb.send('/backend/v1/assemble-contract', {
        method: 'POST',
        body: JSON.stringify(getPayload()),
      })
      text = (res?.minuta_texto || '').replace(/Assessoria Jurídica Imobiliária/gi, '')

      setCurrentMinuta(text)

      const record = await saveContractDraft(
        { ...form.getValues(), status: 'rascunho' },
        draftId,
        text,
      )
      setDraftId(record.id)

      const url = await getMinutaPDFBlobUrl(text, { ...user, tipoDocumento: tipoDocumento })
      if (url) setPreviewPdfUrl(url)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: getErrorMessage(err),
      })
    } finally {
      setIsPreviewing(false)
      dismiss()
    }
  }

  const initiateGeneration = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      handleValidationFailure(form.formState.errors)
      return
    }

    setIsGenerating(true)

    const { dismiss } = toast({
      title: 'Processando documento... por favor, aguarde.',
      duration: 100000,
    })

    try {
      let text = ''

      const res = await pb.send('/backend/v1/assemble-contract', {
        method: 'POST',
        body: JSON.stringify(getPayload()),
      })
      text = (res?.minuta_texto || '').replace(/Assessoria Jurídica Imobiliária/gi, '')

      const submitFn = async () => {
        await saveContractDraft({ ...form.getValues(), status: 'finalizado' }, draftId, text)
        setIsSuccess(true)
        toast({ title: 'Documento gerado com sucesso!' })
      }

      if (onSubmit) {
        await onSubmit(form.getValues(), submitFn)
      } else {
        await submitFn()
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: getErrorMessage(err),
      })
    } finally {
      setIsGenerating(false)
      dismiss()
    }
  }

  if (isSuccess) {
    const gerado =
      documentGender === 'as' ? 'Geradas' : documentGender === 'a' ? 'Gerada' : 'Gerado'
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border p-8 animate-in fade-in">
        <CheckCircle2 size={40} className="mx-auto text-[#D4AF37] mb-4" />
        <h2 className="text-3xl font-bold text-[#0C2340]">
          {documentName} {gerado}!
        </h2>
        <div className="flex justify-center gap-3 mt-8">
          <Button variant="outline" onClick={onBack}>
            Novo Documento
          </Button>
          <Button
            onClick={() => navigate('/contratos')}
            className="bg-[#0C2340] text-[#D4AF37] hover:bg-[#0C2340]/90"
          >
            Meus Documentos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 sm:pb-0 relative">
      {isGenerating && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
          <Loader2 className="w-16 h-16 text-[#D4AF37] animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-[#0C2340] mb-4">Gerando minuta...</h2>
          <div className="w-64">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="-ml-4 text-[#0C2340] hover:text-[#0C2340]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <div className="flex flex-wrap gap-2 items-center">
          {user?.is_admin && (
            <>
              {templates.length > 0 && (
                <Select
                  onValueChange={(val) => {
                    const t = templates.find((x) => x.id === val)
                    if (t) handleLoadTemplate(t.template_data)
                  }}
                >
                  <SelectTrigger className="w-auto min-w-[180px] h-9 border-[#0C2340]/20">
                    <SelectValue placeholder="Carregar Template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                onClick={() => setIsSaveTemplateOpen(true)}
                className="text-[#0C2340] border-[#0C2340]/20 h-9"
                type="button"
              >
                Salvar Template
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10 h-9"
                type="button"
              >
                <Beaker className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Preencher Dados de Teste</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFillTestData('pf')} className="cursor-pointer">
                Pessoa Física (PF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFillTestData('pj')} className="cursor-pointer">
                Pessoa Jurídica (PJ)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex justify-between mb-8 px-2 sm:px-12 relative w-full">
        <div className="absolute top-4 sm:top-5 left-4 right-4 sm:left-16 sm:right-16 h-[2px] bg-slate-200 -z-10" />
        {activeSteps.map((s, idx) => (
          <div
            key={s.id}
            onClick={() => handleStepClick(idx)}
            className={cn(
              'flex flex-col items-center z-10 cursor-pointer hover:opacity-80 transition-opacity',
              idx <= currentStepIndex ? 'text-[#0C2340]' : 'text-slate-400',
            )}
          >
            <div
              className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 border-2 text-xs sm:text-sm',
                idx === currentStepIndex
                  ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-md ring-4 ring-[#D4AF37]/20'
                  : idx < currentStepIndex
                    ? 'bg-[#0C2340] text-[#D4AF37] border-[#0C2340]'
                    : 'bg-white border-slate-200',
              )}
            >
              {idx < currentStepIndex ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                'text-[10px] sm:text-xs font-bold text-center w-16 hidden sm:block',
                idx === currentStepIndex && 'text-[#D4AF37]',
              )}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <Card className="shadow-lg border-slate-200">
        <CardContent className="p-4 sm:p-8">
          <Form {...form}>
            <form className="space-y-6">
              <fieldset disabled={isGenerating || isPreviewing || isSaving} className="space-y-6">
                {currentStepData.id === 'envolvidos' && (
                  <>
                    {tipoDocumento === 'distrato' && <DistratoSelector />}
                    <EnvolvidosTab tipoDocumento={tipoDocumento} />
                  </>
                )}
                {currentStepData.id === 'imovel' && <ImovelTab tipoDocumento={tipoDocumento} />}
                {currentStepData.id === 'financeiro' && (
                  <FinanceiroTab tipoDocumento={tipoDocumento} />
                )}
                {currentStepData.id === 'juridico' && <JuridicoTab tipoDocumento={tipoDocumento} />}
                {currentStepData.id === 'revisao' && <RevisaoTab tipoDocumento={tipoDocumento} />}
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:relative sm:border-t-0 sm:p-0 sm:bg-transparent z-40 sm:z-auto flex justify-between gap-4 mt-0 sm:mt-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-none">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStepIndex((s) => s - 1)}
          disabled={currentStepIndex === 0 || isGenerating || isPreviewing || isSaving}
          className={cn(
            'min-h-[48px] text-[#0C2340] border-[#0C2340]/20 w-1/3 sm:w-auto',
            currentStepIndex === 0 && 'invisible',
          )}
        >
          <ChevronLeft className="mr-1 sm:mr-2 w-4 h-4" />{' '}
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {currentStepIndex < activeSteps.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isGenerating || isPreviewing || isSaving}
            className="bg-[#0C2340] hover:bg-[#0C2340]/90 text-[#D4AF37] font-semibold min-h-[48px] w-2/3 sm:w-auto px-8"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Próximo <ChevronRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2 w-2/3 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={isGenerating || isPreviewing || isSaving}
              className="border-[#0C2340] text-[#0C2340] min-h-[48px] flex-1"
            >
              {isPreviewing ? (
                <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
              ) : (
                <FileText className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Gerar Ficha&nbsp;&nbsp;</span>
            </Button>
            <Button
              type="button"
              onClick={initiateGeneration}
              disabled={isGenerating || isPreviewing || isSaving}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0C2340] font-bold min-h-[48px] flex-[2]"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Gerar {documentName}</span>
              <span className="inline sm:hidden">Gerar</span>
            </Button>
          </div>
        )}
      </div>

      <PreviewPDFModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        pdfUrl={previewPdfUrl}
        content={currentMinuta}
        loading={isPreviewing}
        onDownload={async () => {
          if (!currentMinuta) return
          const safeName = documentName.replace(/\s+/g, '_')
          await generateMinutaPDF(currentMinuta, `${safeName}_Previa`, {
            ...user,
            tipo_documento: tipoDocumento,
          })
        }}
      />

      <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como Template</DialogTitle>
            <DialogDescription>
              Dê um nome para este template para utilizá-lo facilmente no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Contrato Comercial Padrão"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="bg-[#0C2340] text-white hover:bg-[#0C2340]/90"
            >
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
