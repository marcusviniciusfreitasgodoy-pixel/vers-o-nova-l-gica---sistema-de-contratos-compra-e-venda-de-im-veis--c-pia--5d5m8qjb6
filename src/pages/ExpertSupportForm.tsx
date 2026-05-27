import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from '@/components/ui/card'
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
import { toast } from 'sonner'
import { createExpertRequest } from '@/services/expert'
import { getCase } from '@/services/cases'
import { getImovelByCase } from '@/services/imovel'
import {
  Loader2,
  UserCheck,
  ArrowLeft,
  Paperclip,
  AlertCircle,
  Clock,
  Briefcase,
} from 'lucide-react'
import { CASE_STATES } from '@/lib/constants'

export default function ExpertSupportForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contractId = searchParams.get('contractId')
  const caseId = searchParams.get('caseId')

  const [loading, setLoading] = useState(false)
  const [loadingCase, setLoadingCase] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [linkedCase, setLinkedCase] = useState<any>(null)

  const [form, setForm] = useState({
    objective: '',
    description: '',
    negotiation_stage: '',
    urgency: 'medium',
    critical_deadline: '',
    operation_value: '',
    property_type: '',
    location_city_state: '',
    notary_pending_issues: '',
    additional_notes: '',
  })

  useEffect(() => {
    if (caseId) {
      setLoadingCase(true)
      Promise.all([getCase(caseId), getImovelByCase(caseId).catch(() => null)])
        .then(([c, i]) => {
          setLinkedCase(c)

          let negotiationStage = 'fase_inicial'
          const estado = c.estado_caso
          if (['em_validacao', 'pendente_revisao_juridica'].includes(estado))
            negotiationStage = 'minuta_em_revisao'
          if (['aprovado', 'aprovado_ressalvas'].includes(estado))
            negotiationStage = 'prestes_a_assinar'
          if (estado === 'minuta_gerada') negotiationStage = 'pos_assinatura'
          if (c.tipo_operacao === 'distrato') negotiationStage = 'distrato'

          const propertyType = i?.tipo_imovel ? i.tipo_imovel.replace('_', ' ') : ''
          const location = i?.cidade && i?.estado ? `${i.cidade}/${i.estado}` : ''

          setForm((prev) => ({
            ...prev,
            description: `Caso: ${c.title}\nStatus Atual: ${CASE_STATES[estado] || estado}\n\n[Descreva sua dúvida técnica ou problema aqui...]`,
            negotiation_stage: negotiationStage,
            property_type: propertyType,
            location_city_state: location,
          }))
        })
        .catch((err) => {
          toast.error('Erro ao carregar dados do caso')
        })
        .finally(() => {
          setLoadingCase(false)
        })
    }
  }, [caseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.objective || !form.description || !form.negotiation_stage) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    if (form.description.includes('[Descreva sua dúvida técnica ou problema aqui...]')) {
      toast.error(
        'Por favor, substitua o texto padrão e descreva sua dúvida técnica detalhadamente na Descrição do Caso.',
      )
      return
    }
    if (form.description.length < 50) {
      toast.error(
        'A descrição deve ter pelo menos 50 caracteres para garantir que possamos entender o contexto.',
      )
      return
    }
    if (form.urgency === 'high' && !form.critical_deadline) {
      toast.error('O prazo crítico é obrigatório para urgência alta.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('user', user.id)
      formData.append('status', 'received')
      if (contractId) formData.append('contract', contractId)
      if (caseId) formData.append('case', caseId)

      formData.append('objective', form.objective)
      formData.append('description', form.description)
      formData.append('negotiation_stage', form.negotiation_stage)
      formData.append('urgency', form.urgency)
      if (form.critical_deadline)
        formData.append('critical_deadline', new Date(form.critical_deadline).toISOString())
      if (form.operation_value)
        formData.append('operation_value', form.operation_value.replace(/\D/g, ''))
      if (form.property_type) formData.append('property_type', form.property_type)
      if (form.location_city_state) formData.append('location_city_state', form.location_city_state)
      if (form.notary_pending_issues)
        formData.append('notary_pending_issues', form.notary_pending_issues)
      if (form.additional_notes) formData.append('additional_notes', form.additional_notes)

      files.forEach((f) => formData.append('attachments', f))

      await createExpertRequest(formData)
      toast.success('Solicitação enviada com sucesso!')

      if (caseId) {
        navigate(`/casos/${caseId}`)
      } else {
        navigate('/expert-support')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  const OBJECTIVE_OPTIONS = [
    { value: 'technical_doubt', label: 'Dúvida Técnica', price: 'A partir de R$ 150,00' },
    {
      value: 'consultative_guidance',
      label: 'Orientação Consultiva',
      price: 'A partir de R$ 200,00',
    },
    { value: 'doc_analysis', label: 'Análise de Documentação', price: 'A partir de R$ 250,00' },
    {
      value: 'partial_review',
      label: 'Revisão Parcial de Cláusula',
      price: 'A partir de R$ 250,00',
    },
    { value: 'full_review', label: 'Revisão Completa do Contrato', price: 'A partir de R$ 600,00' },
    {
      value: 'risk_analysis',
      label: 'Análise de Risco (Compliance)',
      price: 'A partir de R$ 400,00',
    },
    { value: 'talk_specialist', label: 'Falar com Especialista', price: 'A partir de R$ 300,00' },
  ]

  if (loadingCase) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl animate-in fade-in">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-slate-800">Solicitar Suporte Especializado</h1>
            <p className="text-slate-500 mt-1">
              Nossa equipe de especialistas fará a análise do seu caso.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg">Detalhes da Solicitação</CardTitle>
                <CardDescription>Campos com * são obrigatórios</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Objetivo do Suporte *</Label>
                    <Select
                      value={form.objective}
                      onValueChange={(v) => setForm({ ...form, objective: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {OBJECTIVE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}{' '}
                            <span className="text-slate-400 text-xs ml-2">({opt.price})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fase da Negociação *</Label>
                    <Select
                      value={form.negotiation_stage}
                      onValueChange={(v) => setForm({ ...form, negotiation_stage: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fase_inicial">Fase Inicial / Sondagem</SelectItem>
                        <SelectItem value="minuta_em_revisao">Minuta em Revisão</SelectItem>
                        <SelectItem value="prestes_a_assinar">Prestes a Assinar</SelectItem>
                        <SelectItem value="pos_assinatura">Pós Assinatura / Registro</SelectItem>
                        <SelectItem value="distrato">Distrato / Conflito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição do Caso *</Label>
                  <Textarea
                    rows={6}
                    placeholder="Descreva detalhadamente qual é a sua dúvida ou necessidade de suporte (mínimo 50 caracteres)..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 text-right">
                    {form.description.length} / 50 min
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Urgência *</Label>
                    <Select
                      value={form.urgency}
                      onValueChange={(v) => setForm({ ...form, urgency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.urgency === 'high' && (
                    <div className="space-y-2">
                      <Label>Prazo Crítico *</Label>
                      <Input
                        type="date"
                        value={form.critical_deadline}
                        onChange={(e) => setForm({ ...form, critical_deadline: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Valor da Operação (R$)</Label>
                    <Input
                      placeholder="Ex: 500.000,00"
                      value={form.operation_value}
                      onChange={(e) => setForm({ ...form, operation_value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Imóvel</Label>
                    <Input
                      placeholder="Ex: Apartamento, Terreno..."
                      value={form.property_type}
                      onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade/Estado</Label>
                    <Input
                      placeholder="Ex: Rio de Janeiro/RJ"
                      value={form.location_city_state}
                      onChange={(e) => setForm({ ...form, location_city_state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pendências com Cartório/Registro?</Label>
                  <Textarea
                    rows={2}
                    placeholder="Descreva se o cartório fez alguma exigência..."
                    value={form.notary_pending_issues}
                    onChange={(e) => setForm({ ...form, notary_pending_issues: e.target.value })}
                  />
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label>Anexar Documentos</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => {
                        if (e.target.files) {
                          setFiles(Array.from(e.target.files))
                        }
                      }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Paperclip className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-700">
                        Clique para anexar arquivos
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        PDF, DOCX, JPG ou PNG (Máx 15MB)
                      </span>
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="text-sm text-slate-600 bg-slate-50 p-2 rounded flex justify-between"
                        >
                          <span>{f.name}</span>
                          <span className="text-xs text-slate-400">
                            {(f.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {contractId && (
                    <div className="mt-2 text-sm text-blue-600 flex items-center gap-1 bg-blue-50 p-2 rounded border border-blue-100">
                      <AlertCircle className="w-4 h-4 shrink-0" /> O contrato analisado será
                      automaticamente vinculado a esta solicitação.
                    </div>
                  )}
                  {caseId && linkedCase && (
                    <div className="mt-2 text-sm text-indigo-700 flex items-center gap-1 bg-indigo-50 p-2 rounded border border-indigo-100">
                      <Briefcase className="w-4 h-4 shrink-0" /> O caso operacional{' '}
                      <strong>"{linkedCase.title}"</strong> será vinculado automaticamente.
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-amber-500" />
                  SLA de Resposta: <strong className="text-slate-800">Até 2 dias úteis</strong>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full sm:w-auto shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Enviar Solicitação
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div>
          <Card className="sticky top-6 border-indigo-100 shadow-md">
            <CardHeader className="bg-indigo-50 border-b border-indigo-100">
              <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Perfil do Especialista
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-2 border-indigo-200">
                  <UserCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Equipe de Especialistas</h4>
                  <p className="text-xs text-slate-500">Escreventes e Juristas</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Escrevente Notarial</strong> com vasta experiência em registros
                    públicos.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Bacharel em Direito</strong>, focado em segurança jurídica de contratos.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Pós-graduado</strong> em Direito Imobiliário.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>
                    Mais de <strong>40 anos de vivência</strong> no mercado imobiliário do RJ.
                  </span>
                </li>
              </ul>
              <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-800 mt-4 leading-relaxed border border-indigo-100">
                Nossos especialistas revisam seu caso para garantir a conformidade técnica,
                registral e notarial, evitando exigências e prejuízos.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
