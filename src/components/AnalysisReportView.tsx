import {
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldAlert,
  XCircle,
  AlertOctagon,
  Copy,
  Download,
  ShieldCheck,
  Scale,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { generateAnalysisPDF } from '@/lib/pdf-generator'

export interface AnalysisReport {
  conformidade: any
  clausulas_encontradas?: string[]
  clausulas_faltando?: string[]
  clausulasEncontradas?: string[]
  clausulasFaltando?: string[]
  riscos: Array<{
    titulo: string
    descricao: string
    severidade: 'ALTO' | 'MEDIO' | 'BAIXO' | string
    embasamento: string
  }>
  omissoes?: Array<{
    clausula: string
    importancia: 'CRITICA' | 'IMPORTANTE' | 'RECOMENDADA' | string
    redacaoPadrao: string
  }>
  omissoesImportantes?: Array<{
    clausula: string
    importancia: 'CRITICA' | 'IMPORTANTE' | 'RECOMENDADA' | string
    redacaoPadrao: string
  }>
  clausulasAbusivas?: Array<{
    texto: string
    motivo: string
    recomendacao: string
  }>
  clausulas_abusivas?: Array<{
    texto: string
    motivo: string
    recomendacao: string
  }>
  recomendacoes: {
    imediatas: string[]
    recomendadas: string[]
  }
  rag_sources?: Array<{ titulo: string; categoria: string }>
  alerta_coaf?: boolean
  reportId?: string
}

export function AnalysisReportView({
  report,
  contract,
  onOmissionClick,
  onApplySuggestion,
}: {
  report: AnalysisReport
  contract?: any
  onOmissionClick?: (omission: any) => void
  onApplySuggestion?: (text: string, title: string) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  const conformidadeObj = {
    status:
      typeof report.conformidade === 'string'
        ? report.conformidade
        : report.conformidade?.status || 'DESCONHECIDO',
    clausulasEncontradas:
      typeof report.conformidade === 'string'
        ? report.clausulas_encontradas || report.clausulasEncontradas || []
        : report.conformidade?.clausulasEncontradas ||
          report.clausulas_encontradas ||
          report.clausulasEncontradas ||
          [],
    clausulasFaltando:
      typeof report.conformidade === 'string'
        ? report.clausulas_faltando || report.clausulasFaltando || []
        : report.conformidade?.clausulasFaltando ||
          report.clausulas_faltando ||
          report.clausulasFaltando ||
          [],
  }

  const generalStatus = conformidadeObj.status?.toUpperCase() || 'DESCONHECIDO'

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true)
      await new Promise((resolve) => setTimeout(resolve, 50)) // Give UI time to show spinner
      await generateAnalysisPDF(report, contract)
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('PDF Generation Error:', error)
      toast.error('Erro ao gerar PDF', {
        description: 'Não foi possível criar o documento.',
        action: {
          label: 'Tentar novamente',
          onClick: () => handleDownloadPDF(),
        },
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICO':
      case 'CRÍTICO':
      case 'ALTO':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'RISCO':
      case 'MEDIO':
      case 'MÉDIO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CONFORME':
      case 'BAIXO':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" />
            Relatório de Compliance Jurídico
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            className={cn('text-sm px-4 py-1.5 shadow-sm uppercase', getRiskColor(generalStatus))}
          >
            Status: {generalStatus}
          </Badge>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Baixar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {report.alerta_coaf && (
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">
            Atenção: Indício de Operação Suspeita (PLD-FT)
          </AlertTitle>
          <AlertDescription className="text-red-700">
            A análise identificou características de uma operação suspeita. De acordo com o
            Provimento CNJ 88/2019 e manuais de PLD-FT, é obrigatória a comunicação ao COAF/SISCOAF.
          </AlertDescription>
        </Alert>
      )}

      {(generalStatus === 'RISCO' ||
        generalStatus === 'CRÍTICO' ||
        generalStatus === 'CRITICO' ||
        generalStatus === 'ALTO') && (
        <Alert className="mb-6 border-orange-500 bg-orange-50">
          <ShieldAlert className="h-5 w-5 text-orange-600" />
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
            <div>
              <AlertTitle className="text-orange-800 font-bold">
                Red Flags de Compliance Detectadas
              </AlertTitle>
              <AlertDescription className="text-orange-800">
                Atenção aos seguintes riscos de severidade alta:
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  {report.riscos
                    ?.filter(
                      (r) =>
                        r.severidade?.toUpperCase() === 'ALTO' ||
                        r.severidade?.toUpperCase() === 'CRÍTICO' ||
                        r.severidade?.toUpperCase() === 'CRITICO',
                    )
                    .map((r, i) => (
                      <li key={i}>
                        <span className="font-semibold">{r.titulo}</span>: {r.descricao}
                      </li>
                    ))}
                  {(!report.riscos ||
                    report.riscos.filter(
                      (r) =>
                        r.severidade?.toUpperCase() === 'ALTO' ||
                        r.severidade?.toUpperCase() === 'CRÍTICO' ||
                        r.severidade?.toUpperCase() === 'CRITICO',
                    ).length === 0) && (
                    <li>Verifique a seção de Omissões ou Cláusulas Abusivas para mais detalhes.</li>
                  )}
                </ul>
              </AlertDescription>
            </div>
            <Button
              onClick={() =>
                (window.location.href = `/expert-support/new${contract?.id ? `?contractId=${contract.id}` : ''}`)
              }
              variant="outline"
              className="shrink-0 bg-white text-orange-800 border-orange-300 hover:bg-orange-100"
            >
              Falar com Especialista
            </Button>
          </div>
        </Alert>
      )}

      <Accordion
        type="multiple"
        defaultValue={[
          'auditoria',
          'conformidade',
          'riscos',
          'omissoes',
          'abusivas',
          'recomendacoes',
        ]}
        className="w-full space-y-4"
      >
        {/* AUDITORIA */}
        <AccordionItem
          value="auditoria"
          className="bg-white border border-slate-200 rounded-lg shadow-sm px-4"
        >
          <AccordionTrigger className="hover:no-underline font-semibold text-lg text-slate-800">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> Auditoria de Conformidade (Base Legal)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6">
            <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
              <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Diretrizes e Normas Utilizadas (CNJ 88 / PLD-FT)
              </h4>
              <p className="text-sm text-indigo-700 mb-4">
                Esta análise foi embasada nos seguintes documentos da base de conhecimento jurídico:
              </p>
              <ul className="space-y-2">
                {report.rag_sources?.map((source, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 flex items-center gap-3 bg-white p-3 rounded shadow-sm border border-slate-100"
                  >
                    <Badge variant="outline" className="bg-slate-50 text-xs shrink-0 capitalize">
                      {source.categoria.replace('_', ' ')}
                    </Badge>
                    <span className="font-medium">{source.titulo}</span>
                  </li>
                ))}
                {(!report.rag_sources || report.rag_sources.length === 0) && (
                  <li className="text-sm text-slate-500 italic">
                    Normas gerais de compliance aplicadas. Nenhuma fonte específica listada.
                  </li>
                )}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CONFORMIDADE */}
        <AccordionItem
          value="conformidade"
          className="bg-white border border-slate-200 rounded-lg shadow-sm px-4"
        >
          <AccordionTrigger className="hover:no-underline font-semibold text-lg text-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" /> Conformidade Essencial
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Cláusulas Presentes
                </h4>
                <ScrollArea className="h-[200px] pr-4">
                  <ul className="space-y-2">
                    {conformidadeObj.clausulasEncontradas?.map((c: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-green-900 flex items-start gap-2 bg-white p-2 rounded shadow-sm border border-green-50"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                    {!conformidadeObj.clausulasEncontradas?.length && (
                      <li className="text-sm text-slate-500 italic">
                        Nenhuma cláusula identificada.
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
              <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Cláusulas Ausentes
                </h4>
                <ScrollArea className="h-[200px] pr-4">
                  <ul className="space-y-2">
                    {conformidadeObj.clausulasFaltando?.map((c: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-red-900 flex items-start gap-2 bg-white p-2 rounded shadow-sm border border-red-50"
                      >
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                    {!conformidadeObj.clausulasFaltando?.length && (
                      <li className="text-sm text-slate-500 italic">Nenhuma cláusula ausente.</li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* RISCOS */}
        <AccordionItem
          value="riscos"
          className="bg-white border border-slate-200 rounded-lg shadow-sm px-4"
        >
          <AccordionTrigger className="hover:no-underline font-semibold text-lg text-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Riscos Analisados
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.riscos?.map((risk, idx) => (
                <Card
                  key={idx}
                  className="border-l-4 shadow-sm"
                  style={{
                    borderLeftColor:
                      risk.severidade?.toUpperCase() === 'ALTO'
                        ? '#ef4444'
                        : risk.severidade?.toUpperCase() === 'MEDIO'
                          ? '#f59e0b'
                          : '#3b82f6',
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={cn(
                            'w-5 h-5 mt-0.5 shrink-0',
                            risk.severidade?.toUpperCase() === 'ALTO'
                              ? 'text-red-500'
                              : risk.severidade?.toUpperCase() === 'MEDIO'
                                ? 'text-yellow-500'
                                : 'text-blue-500',
                          )}
                        />
                        <CardTitle className="text-base leading-tight">{risk.titulo}</CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0', getRiskColor(risk.severidade))}
                      >
                        {risk.severidade}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="prose prose-sm max-w-none text-slate-600"
                      dangerouslySetInnerHTML={{
                        __html: risk.descricao
                          .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
                          .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
                          .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                      }}
                    />
                    {risk.embasamento && (
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-500 flex items-start gap-1">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span
                          dangerouslySetInnerHTML={{
                            __html: risk.embasamento
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!report.riscos || report.riscos.length === 0) && (
                <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" /> Nenhum risco
                  significativo identificado.
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* OMISSÕES */}
        <AccordionItem
          value="omissoes"
          className="bg-white border border-slate-200 rounded-lg shadow-sm px-4"
        >
          <AccordionTrigger className="hover:no-underline font-semibold text-lg text-slate-800">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-orange-500" /> Omissões Importantes
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6 space-y-4">
            {(report.omissoes || report.omissoesImportantes || [])?.map((omission, idx) => (
              <Card
                key={idx}
                className="border-amber-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <CardHeader className="bg-amber-50/30 pb-4 flex flex-row items-center justify-between border-b border-amber-100">
                  <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-amber-600" /> {omission.clausula}
                  </CardTitle>
                  <Badge variant="outline" className="bg-white">
                    {omission.importancia}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-700 shadow-sm relative">
                    <span className="block font-semibold mb-2 text-slate-800">
                      Sugestão de Redação:
                    </span>
                    <div
                      className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: omission.redacaoPadrao
                          .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
                          .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
                          .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        navigator.clipboard.writeText(omission.redacaoPadrao)
                        toast.success('Copiado!')
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copiar redação padrão
                    </Button>
                    {onOmissionClick && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 shadow-sm"
                        onClick={() => onOmissionClick(omission)}
                      >
                        <MapPin className="w-4 h-4 mr-2 text-purple-600" /> Localizar no Documento
                      </Button>
                    )}
                    {onApplySuggestion && (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onApplySuggestion(omission.redacaoPadrao, omission.clausula)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Aplicar Sugestão
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!(report.omissoes || report.omissoesImportantes) ||
              (report.omissoes || report.omissoesImportantes)?.length === 0) && (
              <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" /> Nenhuma omissão
                crítica identificada.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ABUSIVAS */}
        <AccordionItem
          value="abusivas"
          className="bg-white border border-slate-200 rounded-lg shadow-sm px-4"
        >
          <AccordionTrigger className="hover:no-underline font-semibold text-lg text-slate-800">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Cláusulas Abusivas
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6 space-y-4">
            {(report.clausulasAbusivas || report.clausulas_abusivas || [])?.length > 0 ? (
              (report.clausulasAbusivas || report.clausulas_abusivas || []).map((item, idx) => (
                <Card key={idx} className="border-red-200 shadow-sm">
                  <CardHeader className="bg-red-50/50 pb-4 border-b border-red-100">
                    <CardTitle className="text-base text-red-800 flex items-center gap-2">
                      <XCircle className="w-5 h-5" /> Cláusula Abusiva Detectada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                        Texto Encontrado
                      </span>
                      <div className="bg-slate-100 p-4 rounded-md italic text-sm text-slate-700 border border-slate-200">
                        "{item.texto}"
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="text-sm">
                        <span className="font-semibold text-red-700 block mb-1">Motivo:</span>
                        <div
                          className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: item.motivo
                              .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
                              .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
                              .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                          }}
                        />
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-amber-700 block mb-1">
                          Recomendação:
                        </span>
                        <div
                          className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: item.recomendacao
                              .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
                              .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
                              .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-8 text-center bg-green-50/30 rounded-xl border border-dashed border-green-200">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-green-800">
                  ✅ Nenhuma cláusula abusiva identificada
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* RECOMENDAÇÕES */}
        <AccordionItem
          value="recomendacoes"
          className="bg-white border border-slate-200 rounded-lg shadow-sm px-4"
        >
          <AccordionTrigger className="hover:no-underline font-semibold text-lg text-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" /> Recomendações Finais
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-red-100 shadow-sm h-full">
                <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
                  <CardTitle className="text-base text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Ações Imediatas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <ul className="space-y-4">
                    {report.recomendacoes?.imediatas?.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                    {(!report.recomendacoes?.imediatas ||
                      report.recomendacoes.imediatas.length === 0) && (
                      <li className="text-sm text-slate-500 italic">
                        Nenhuma ação imediata pendente.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-100 shadow-sm h-full">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                  <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                    <Info className="w-5 h-5" /> Ações Recomendadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <ul className="space-y-4">
                    {report.recomendacoes?.recomendadas?.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                    {(!report.recomendacoes?.recomendadas ||
                      report.recomendacoes.recomendadas.length === 0) && (
                      <li className="text-sm text-slate-500 italic">
                        Nenhuma recomendação adicional.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 print:block hidden">
        <strong>AVISO JURÍDICO:</strong> Este relatório é gerado automaticamente por Inteligência
        Artificial e tem caráter puramente informativo e auxiliar. Não substitui a avaliação,
        revisão ou parecer de um advogado devidamente qualificado e inscrito na OAB.
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-100 mt-8 print:hidden">
        <Button
          size="lg"
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="bg-slate-800 hover:bg-slate-900 w-full sm:w-auto shadow-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" /> Baixar relatório em PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
