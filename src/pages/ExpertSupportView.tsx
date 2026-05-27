import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  getExpertRequest,
  getExpertProposals,
  updateExpertRequest,
  updateExpertProposal,
  translateStatus,
  translateObjective,
} from '@/services/expert'
import {
  Loader2,
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  Paperclip,
  AlertCircle,
  Plus,
  Briefcase,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function ExpertSupportView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [reformulateNotes, setReformulateNotes] = useState('')
  const [showReformulate, setShowReformulate] = useState(false)

  const loadData = async () => {
    try {
      const req = await getExpertRequest(id!)
      setRequest(req)
      const props = await getExpertProposals(id!)
      setProposals(props)
      if (props.length > 0) setProposal(props[0])
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar solicitação')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      if (action === 'accept') {
        await updateExpertProposal(proposal.id, { user_response: 'accepted' })
        await updateExpertRequest(id!, { status: 'executing' })
        toast.success('Proposta aceita! O especialista iniciará a execução.')
      } else if (action === 'refuse') {
        await updateExpertProposal(proposal.id, { user_response: 'refused' })
        await updateExpertRequest(id!, { status: 'closed' })
        toast.success('Proposta recusada. Solicitação encerrada.')
      } else if (action === 'reformulate') {
        if (!reformulateNotes) {
          toast.error('Informe o motivo da reformulação.')
          setActionLoading(false)
          return
        }
        await updateExpertProposal(proposal.id, {
          user_response: 'reformulate',
          reformulation_notes: reformulateNotes,
        })
        await updateExpertRequest(id!, { status: 'reformulating' })
        toast.success('Pedido de reformulação enviado.')
        setShowReformulate(false)
      }
      await loadData()
    } catch (err) {
      toast.error('Erro ao processar ação.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const resetsAnalysis = ['analyzing', 'proposal_issued', 'awaiting_decision'].includes(
      request.status,
    )
    if (resetsAnalysis) {
      if (
        !window.confirm(
          'Adicionar novos documentos reiniciará a análise e poderá invalidar a proposta atual. Deseja continuar?',
        )
      ) {
        return
      }
    }

    setActionLoading(true)
    try {
      const formData = new FormData()
      if (request.attachments && request.attachments.length > 0) {
        request.attachments.forEach((f: string) => formData.append('attachments', f))
      }
      formData.append('attachments', file)

      // Reset to received if analysis had started or proposal issued
      if (resetsAnalysis) {
        formData.append('status', 'received')
        toast.info('Novo anexo recebido. A análise foi reiniciada.')
      }

      await updateExpertRequest(id!, formData)
      toast.success('Arquivo anexado com sucesso!')
      await loadData()
    } catch (err) {
      toast.error('Erro ao enviar arquivo.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading)
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  if (!request)
    return <div className="p-12 text-center text-slate-500">Solicitação não encontrada.</div>

  const isProposalActive =
    proposal && (request.status === 'proposal_issued' || request.status === 'awaiting_decision')

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl animate-in fade-in pb-20">
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/expert-support')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Solicitação #{request.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4" /> Criado em{' '}
            {new Date(request.created).toLocaleString('pt-BR')}
          </p>
        </div>
        <Badge
          className={
            request.status === 'completed'
              ? 'bg-green-100 text-green-800 px-4 py-1 text-sm'
              : request.status === 'proposal_issued' || request.status === 'awaiting_decision'
                ? 'bg-blue-100 text-blue-800 px-4 py-1 text-sm'
                : request.status === 'closed' || request.status === 'refused'
                  ? 'bg-slate-100 text-slate-800 px-4 py-1 text-sm'
                  : 'bg-amber-100 text-amber-800 px-4 py-1 text-sm'
          }
        >
          Status: {translateStatus(request.status)}
        </Badge>
      </div>

      {isProposalActive && (
        <Card className="mb-6 border-blue-200 shadow-md">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Proposta Especializada Recebida
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-2">Escopo do Serviço</h4>
              <p className="text-slate-700 whitespace-pre-wrap text-sm">{proposal.scope}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Prazo de Entrega</span>
                <span className="font-semibold text-slate-800">
                  {proposal.deadline_days} dias úteis
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Valor do Honorário</span>
                <span className="font-semibold text-slate-800">
                  {proposal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2 md:col-span-1">
                <span className="text-xs text-slate-500 block mb-1">Complexidade</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {proposal.complexity_type === 'standard'
                    ? 'Padronizada'
                    : proposal.complexity_type === 'adjusted'
                      ? 'Ajustada'
                      : 'Personalizada'}
                </span>
              </div>
            </div>

            {showReformulate ? (
              <div className="mt-4 border-t pt-4 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Motivo da Reformulação
                </label>
                <Textarea
                  value={reformulateNotes}
                  onChange={(e) => setReformulateNotes(e.target.value)}
                  placeholder="Explique o que precisa ser alterado na proposta..."
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleAction('reformulate')}
                  >
                    Enviar Pedido
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowReformulate(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={actionLoading}
                  onClick={() => handleAction('accept')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Aceitar Proposta
                </Button>
                {proposals.filter((p) => p.user_response === 'reformulate').length < 2 ? (
                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => setShowReformulate(true)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Solicitar Reformulação
                  </Button>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md flex items-center gap-1 border border-amber-200">
                    <AlertCircle className="w-4 h-4" /> Limite de reformulações atingido.
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={actionLoading}
                  onClick={() => handleAction('refuse')}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Recusar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {proposal &&
        proposal.user_response !== 'none' &&
        request.status !== 'proposal_issued' &&
        request.status !== 'awaiting_decision' && (
          <Card className="mb-6 border-slate-200">
            <CardHeader className="bg-slate-50 py-3">
              <CardTitle className="text-sm text-slate-700">
                Resumo da Proposta (Histórico)
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-800">Status da Proposta:</span>
                <Badge variant="outline">
                  {proposal.user_response === 'accepted'
                    ? 'Aceita'
                    : proposal.user_response === 'refused'
                      ? 'Recusada'
                      : 'Em Reformulação'}
                </Badge>
              </div>
              <p className="text-slate-600">
                Valor:{' '}
                {proposal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-slate-600">Prazo: {proposal.deadline_days} dias úteis</p>
            </CardContent>
          </Card>
        )}

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <Card className="shadow-sm border-slate-200 h-fit">
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Detalhes da Solicitação</CardTitle>
            {request.expand?.case && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Link to={`/casos/${request.case}`}>Voltar para o Caso</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Objetivo</span>
                <span className="font-medium text-slate-800">
                  {translateObjective(request.objective)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Urgência</span>
                <Badge
                  variant={request.urgency === 'high' ? 'destructive' : 'secondary'}
                  className="capitalize"
                >
                  {request.urgency}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Fase da Negociação</span>
                <span className="font-medium text-slate-800 capitalize">
                  {request.negotiation_stage.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">SLA de Primeira Resposta</span>
                <span className="font-medium text-slate-800">
                  {request.sla_deadline
                    ? new Date(request.sla_deadline).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-1">Descrição do Caso</span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
                {request.description}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
              {request.operation_value && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Valor da Operação</span>
                  <span className="text-sm text-slate-700">R$ {request.operation_value}</span>
                </div>
              )}
              {request.property_type && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Tipo de Imóvel</span>
                  <span className="text-sm text-slate-700">{request.property_type}</span>
                </div>
              )}
              {request.location_city_state && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Localização</span>
                  <span className="text-sm text-slate-700">{request.location_city_state}</span>
                </div>
              )}
            </div>

            {request.notary_pending_issues && (
              <div className="pt-4 border-t">
                <span className="text-xs text-slate-500 block mb-1">Pendências de Cartório</span>
                <p className="text-sm text-slate-700">{request.notary_pending_issues}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Anexos e Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {request.expand?.contract && (
                <div className="border border-indigo-100 bg-indigo-50/50 p-3 rounded-md mb-2">
                  <span className="text-xs font-semibold text-indigo-800 mb-1 block">
                    Contrato Vinculado
                  </span>
                  <Link
                    to={`/contratos/${request.contract}`}
                    className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" /> Ver Documento Original
                  </Link>
                </div>
              )}

              {request.expand?.case && (
                <div className="border border-purple-100 bg-purple-50/50 p-3 rounded-md">
                  <span className="text-xs font-semibold text-purple-800 mb-1 block">
                    Caso Operacional Vinculado
                  </span>
                  <Link
                    to={`/casos/${request.case}`}
                    className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Briefcase className="w-4 h-4" /> Ver Resumo do Caso
                  </Link>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-700 mb-2 block">
                  Arquivos Anexados
                </span>
                {request.attachments && request.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {request.attachments.map((file: string, idx: number) => (
                      <li key={idx} className="text-sm text-blue-600 hover:underline">
                        <a
                          href={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/expert_support_requests/${request.id}/${file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> {file.slice(0, 25)}...
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhum arquivo extra anexado.</p>
                )}
              </div>

              {request.status !== 'completed' &&
                request.status !== 'closed' &&
                request.status !== 'refused' && (
                  <div className="pt-4 border-t border-slate-100">
                    <input
                      type="file"
                      id="add-file"
                      className="hidden"
                      onChange={handleUploadNewFile}
                      disabled={actionLoading}
                    />
                    <label htmlFor="add-file" className="cursor-pointer">
                      <div className="text-sm text-center p-3 border border-dashed rounded-md hover:bg-slate-50 text-slate-600 transition-colors flex items-center justify-center gap-2">
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Adicionar Anexo
                      </div>
                    </label>
                    {isProposalActive && (
                      <div className="mt-2 text-[10px] leading-tight text-amber-600 bg-amber-50 p-1.5 rounded flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        Atenção: Adicionar novos arquivos cancelará a proposta atual e devolverá o
                        pedido para triagem.
                      </div>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
