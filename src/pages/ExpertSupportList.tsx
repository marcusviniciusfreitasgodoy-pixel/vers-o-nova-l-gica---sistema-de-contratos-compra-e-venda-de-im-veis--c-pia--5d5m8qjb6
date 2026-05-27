import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Clock,
  FileText,
  UserCheck,
  ChevronRight,
  Scale,
  FileSignature,
  GraduationCap,
  Building,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getMyExpertRequests, translateStatus, translateObjective } from '@/services/expert'
import { Loader2 } from 'lucide-react'

export default function ExpertSupportList() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyExpertRequests()
      .then((res) => {
        setRequests(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-primary" />
            Suporte Especializado
          </h1>
          <p className="text-slate-500 mt-1">
            Escalone casos complexos para nossa equipe de Escreventes Notariais e Especialistas.
          </p>
        </div>
        <Button asChild className="shrink-0 shadow-sm">
          <Link to="/expert-support/new">
            <Plus className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Authority Banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 md:p-8 mb-10 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-primary" />
        </div>
        <div className="hidden md:flex w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center shrink-0 shadow-inner">
          <UserCheck className="w-8 h-8 text-primary" />
        </div>
        <div className="relative z-10 flex-1">
          <Badge
            variant="outline"
            className="bg-white border-primary/20 text-primary hover:bg-white mb-3 font-semibold shadow-sm"
          >
            Autoridade & Experiência
          </Badge>
          <h2 className="text-2xl font-bold mb-2 text-slate-800">
            Equipe de Especialistas e Escreventes
          </h2>
          <p className="text-slate-600 text-sm md:text-base max-w-3xl leading-relaxed">
            Nossos especialistas revisam seu caso para garantir a conformidade técnica, registral e
            notarial, evitando exigências e prejuízos. Mais de 40 anos de vivência no mercado
            imobiliário do Rio de Janeiro.
          </p>
        </div>
      </div>

      {/* Knowledge Board (Quadro de Conhecimento) */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Quadro de Conhecimento e Segurança</h2>
            <p className="text-sm text-slate-500">
              Os pilares que garantem a segurança jurídica das suas operações.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
            <CardContent className="p-5 md:p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-125" />
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5 relative z-10 shadow-sm border border-blue-200/50">
                <FileSignature className="w-6 h-6 text-blue-700" />
              </div>
              <Badge
                variant="outline"
                className="mb-3 border-blue-200 text-blue-800 bg-blue-50 font-semibold"
              >
                Registral
              </Badge>
              <h3 className="font-bold text-slate-800 mb-2">Escrevente Notarial</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Profissional com vasta prática em registros públicos e análise de documentações
                complexas e matrículas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
            <CardContent className="p-5 md:p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-125" />
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-5 relative z-10 shadow-sm border border-indigo-200/50">
                <Scale className="w-6 h-6 text-indigo-700" />
              </div>
              <Badge
                variant="outline"
                className="mb-3 border-indigo-200 text-indigo-800 bg-indigo-50 font-semibold"
              >
                Segurança Jurídica
              </Badge>
              <h3 className="font-bold text-slate-800 mb-2">Prevenção de Riscos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bacharelado em Direito com foco total na elaboração segura de contratos e mitigação
                de futuros litígios.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
            <CardContent className="p-5 md:p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-125" />
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-5 relative z-10 shadow-sm border border-emerald-200/50">
                <GraduationCap className="w-6 h-6 text-emerald-700" />
              </div>
              <Badge
                variant="outline"
                className="mb-3 border-emerald-200 text-emerald-800 bg-emerald-50 font-semibold"
              >
                Legislação
              </Badge>
              <h3 className="font-bold text-slate-800 mb-2">Especialização</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pós-graduação específica em Direito Imobiliário, sempre atualizado com as leis e
                normas regulamentares.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
            <CardContent className="p-5 md:p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-125" />
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-5 relative z-10 shadow-sm border border-amber-200/50">
                <Building className="w-6 h-6 text-amber-700" />
              </div>
              <Badge
                variant="outline"
                className="mb-3 border-amber-200 text-amber-800 bg-amber-50 font-semibold"
              >
                Mercado Local
              </Badge>
              <h3 className="font-bold text-slate-800 mb-2">Experiência Prática</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Conhecimento profundo das particularidades e práticas reais do mercado imobiliário
                do Rio de Janeiro.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg">Minhas Solicitações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <p>Nenhuma solicitação encontrada.</p>
              <Button variant="outline" asChild className="mt-4">
                <Link to="/expert-support/new">Criar a primeira</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  to={`/expert-support/${req.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-white">
                        {translateObjective(req.objective)}
                      </Badge>
                      {req.urgency === 'high' && (
                        <Badge variant="destructive" className="text-[10px] px-1.5">
                          Urgente
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 line-clamp-1">{req.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Criado em{' '}
                        {new Date(req.created).toLocaleDateString()}
                      </span>
                      {req.expand?.contract && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Contrato Vinculado
                        </span>
                      )}
                      {req.expand?.case && (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <FileText className="w-3.5 h-3.5" /> Caso Vinculado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:ml-auto">
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className={
                          req.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : req.status === 'proposal_issued' || req.status === 'awaiting_decision'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'closed' || req.status === 'refused'
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {translateStatus(req.status)}
                      </Badge>
                      {req.status !== 'completed' &&
                        req.status !== 'closed' &&
                        req.status !== 'refused' && (
                          <Badge
                            variant="outline"
                            className={
                              req.urgency === 'high'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : req.urgency === 'medium'
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-green-200 bg-green-50 text-green-700'
                            }
                          >
                            {req.urgency === 'high'
                              ? 'Urgência Alta'
                              : req.urgency === 'medium'
                                ? 'Urgência Média'
                                : 'Urgência Baixa'}
                          </Badge>
                        )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
