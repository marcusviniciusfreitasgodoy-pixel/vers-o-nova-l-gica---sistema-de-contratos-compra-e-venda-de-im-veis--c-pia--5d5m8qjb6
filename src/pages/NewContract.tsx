import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ContractForm } from '@/components/ContractForm'
import { useAuth } from '@/hooks/use-auth'
import { DocumentContext } from '@/contexts/DocumentContext'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  FileText,
  CheckSquare,
  Receipt,
  FileSignature,
  FileKey,
  Key,
  FileCheck,
  Users,
  Ban,
  Handshake,
  ChevronLeft,
  FileClock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GodoyLogo } from '@/components/GodoyLogo'
import { logSystemError } from '@/services/system_error_logs'
import { documentPhases } from '@/components/dashboard/dashboard-data'

const ICON_MAP: Record<string, any> = {
  ficha_cadastral: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  checklist_documental: { icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
  autorizacao_intermediacao: { icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
  recibo_sinal: { icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  contrato_preliminar: { icon: FileClock, color: 'text-sky-600', bg: 'bg-sky-50' },
  promessa_compra_venda: { icon: Handshake, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  contrato_particular: { icon: FileSignature, color: 'text-purple-600', bg: 'bg-purple-50' },
  contrato_definitivo: { icon: ShieldCheck, color: 'text-blue-700', bg: 'bg-blue-100' },
  termo_entrega_chaves: { icon: Key, color: 'text-orange-600', bg: 'bg-orange-50' },
  termo_posse: { icon: FileKey, color: 'text-teal-600', bg: 'bg-teal-50' },
  distrato: { icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
}

export default function NewContract() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()

  const [tipoDocumento, setTipoDocumento] = useState<string | null>(null)
  const [invalidTypeError, setInvalidTypeError] = useState(false)

  const isValidDoc = (tipo: string) =>
    documentPhases.some((p) => p.docs.some((d) => d.typeId === tipo))

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    let tipo = location.state?.tipo_documento || params.get('tipo')

    if (tipo) {
      if (tipo === 'promessa_cv') tipo = 'promessa_compra_venda'
      if (tipo === 'checklist') tipo = 'checklist_documental'
      if (tipo === 'termo_chaves') tipo = 'termo_entrega_chaves'
      if (tipo === 'autorizacao') tipo = 'autorizacao_intermediacao'

      if (isValidDoc(tipo)) {
        setTipoDocumento(tipo)
        setInvalidTypeError(false)
        // Clean URL to prevent hydration loops or unexpected redirects on back navigation
        if (params.has('tipo')) {
          navigate('/contratos/novo', { replace: true, state: {} })
        }
      } else {
        setInvalidTypeError(true)
        setTipoDocumento(null)
      }
    }
  }, [location, navigate])

  const infoMap: Record<string, { title: string; gender: string }> = {
    ficha_cadastral: { title: 'Ficha Cadastral', gender: 'a' },
    checklist_documental: { title: 'Checklist Documental', gender: 'o' },
    recibo_sinal: { title: 'Recibo de Sinal', gender: 'o' },
    contrato_preliminar: { title: 'Contrato Particular Preliminar', gender: 'o' },
    promessa_compra_venda: { title: 'Promessa de Compra e Venda', gender: 'a' },
    contrato_particular: { title: 'Contrato Particular de Compra e Venda', gender: 'o' },
    contrato_definitivo: { title: 'Contrato Definitivo de Compra e Venda', gender: 'o' },
    termo_entrega_chaves: { title: 'Termo de Entrega de Chaves', gender: 'o' },
    termo_posse: { title: 'Termo de Posse', gender: 'o' },
    autorizacao_intermediacao: { title: 'Autorização de Intermediação', gender: 'a' },
    distrato: { title: 'Distrato', gender: 'o' },
  }

  const docInfo = tipoDocumento ? infoMap[tipoDocumento] : { title: 'Documento', gender: 'o' }
  const documentName = docInfo?.title || 'Documento'
  const documentGender = docInfo?.gender || 'o'

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl animate-pulse space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!tipoDocumento) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl animate-fade-in-up">
        {invalidTypeError && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Validação</AlertTitle>
            <AlertDescription>
              O tipo de documento solicitado é inválido ou não foi reconhecido. Por favor, selecione
              uma opção válida abaixo.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-[#0C2340] rounded-2xl p-8 md:p-10 mb-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-4 border-[#D4AF37]">
          <div className="z-10 relative max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
              Novo Documento
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Selecione o tipo de instrumento jurídico ou formulário que deseja gerar para dar
              andamento à sua transação.
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {documentPhases.map((phase) => (
            <section key={phase.id} className="animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-6 border-b border-slate-200 pb-3">
                <h2 className="text-2xl font-bold text-[#0C2340] tracking-tight">{phase.title}</h2>
                <p className="text-slate-500 mt-1">{phase.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {phase.docs.map((doc) => {
                  const ui = ICON_MAP[doc.typeId] || {
                    icon: FileText,
                    color: 'text-slate-600',
                    bg: 'bg-slate-50',
                  }
                  return (
                    <Card
                      key={doc.id}
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200/60 overflow-hidden relative flex flex-col h-full"
                      onClick={() => {
                        setInvalidTypeError(false)
                        setTipoDocumento(doc.typeId)
                      }}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${ui.bg} group-hover:scale-110 transition-transform duration-500 shadow-sm border border-black/5 shrink-0`}
                        >
                          <ui.icon className={`w-7 h-7 ${ui.color}`} />
                        </div>
                        <h3 className="font-bold text-lg text-[#0C2340] mb-2 group-hover:text-[#D4AF37] transition-colors leading-tight">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed mt-auto">
                          {doc.subtitle ? `${doc.subtitle} ${doc.description}` : doc.description}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DocumentContext.Provider value={documentName}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => {
              setTipoDocumento(null)
              setInvalidTypeError(false)
              navigate('/contratos/novo', { replace: true, state: {} })
            }}
            className="mb-4 -ml-4 text-slate-500 hover:text-[#0C2340]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Selecionar outro documento
          </Button>
          <h1 className="text-3xl font-bold text-[#0C2340] tracking-tight animate-in fade-in slide-in-from-bottom-2">
            Gerar {documentName}
          </h1>
          <p className="text-slate-600 mt-2 text-lg animate-in fade-in slide-in-from-bottom-3">
            Preencha os dados da negociação abaixo. O sistema estruturará as cláusulas específicas
            baseadas na estratégia escolhida e adicionará automaticamente regras de Compliance.
          </p>
        </div>
        <ContractForm
          tipoDocumento={tipoDocumento}
          onBack={() => {
            setTipoDocumento(null)
            setInvalidTypeError(false)
            navigate('/contratos/novo', { replace: true, state: {} })
          }}
          onSubmit={async (formValues: any, submitFn: () => Promise<void>) => {
            try {
              if (submitFn) await submitFn()
            } catch (err: any) {
              await logSystemError({
                error_message: err.message || 'Erro durante a submissão do contrato',
                component: 'NewContract',
                severity: 'error',
                context_data: { formValues, tipoDocumento },
                stack_trace: err.stack,
              })
              throw err
            }
          }}
          handleNext={async (formValues: any, nextFn: () => Promise<void>) => {
            try {
              if (nextFn) await nextFn()
            } catch (err: any) {
              await logSystemError({
                error_message: err.message || 'Erro de validação ao avançar etapa',
                component: 'NewContract',
                severity: 'warning',
                context_data: { formValues, tipoDocumento },
                stack_trace: err.stack,
              })
              throw err
            }
          }}
          documentName={documentName}
          documentGender={documentGender}
        />
      </div>
    </DocumentContext.Provider>
  )
}
