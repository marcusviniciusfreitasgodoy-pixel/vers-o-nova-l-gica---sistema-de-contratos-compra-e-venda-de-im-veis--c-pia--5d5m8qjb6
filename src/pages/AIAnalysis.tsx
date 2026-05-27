import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
  FileText,
  UploadCloud,
  AlertCircle,
  RefreshCcw,
  Bot,
  History,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link, useSearchParams, Navigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { AnalysisReportView, type AnalysisReport } from '@/components/AnalysisReportView'
import { AnalysisHistoryTable } from '@/components/AnalysisHistoryTable'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/RichTextEditor'

export default function AIAnalysis() {
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const contractIdParam = searchParams.get('contractId')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedOmission, setSelectedOmission] = useState<any>(null)
  const [contractText, setContractText] = useState<string | null>(null)
  const [contractType, setContractType] = useState<string>('a_vista')
  const [contractDetails, setContractDetails] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hasAiKey, setHasAiKey] = useState<boolean | null>(null)
  const [adaptiveThought, setAdaptiveThought] = useState(() => {
    return localStorage.getItem('adaptiveThought') === 'true'
  })
  const [usedModelLabel, setUsedModelLabel] = useState<string>('Claude 3')
  const [rawErrorDetails, setRawErrorDetails] = useState<any>(null)
  const [showRawError, setShowRawError] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMockAnalysis = async () => {
    setIsAnalyzing(true)
    setErrorMsg(null)
    setReport(null)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockReport: any = {
      id: 'mock-id',
      summary:
        'Este é um relatório gerado por mock para testes do sistema. Foram identificados alguns riscos que devem ser analisados antes de prosseguir com a assinatura.',
      risk_level: 'alto',
      usedModel: 'Mock AI (Teste)',
      analysis_result: {
        riscos: [
          {
            gravidade: 'alto',
            clausula: 'Cláusula 5ª - Da Multa Rescisória',
            descricao:
              'Multa de 50% em caso de rescisão excede o limite jurisprudencial de 10% a 25%.',
            recomendacao:
              'Reduzir o percentual da multa rescisória para 20% visando evitar nulidade em juízo.',
          },
          {
            gravidade: 'medio',
            clausula: 'Cláusula 2ª - Do Objeto',
            descricao: 'Falta especificação clara sobre as vagas de garagem inclusas na matrícula.',
            recomendacao:
              'Adicionar o número exato de vagas e sua vinculação à matrícula no registro de imóveis.',
          },
        ],
        omissoes: [
          {
            clausula: 'Cláusula de Tolerância',
            importancia: 'RECOMENDADA',
            redacaoPadrao:
              'Fica estipulado o prazo de tolerância de 180 (cento e oitenta) dias para a entrega do imóvel.',
          },
        ],
        conformidade: 'risco',
        clausulas_encontradas: ['Qualificação das Partes', 'Do Objeto', 'Da Multa Rescisória'],
        clausulas_faltando: [
          'LGPD - Lei Geral de Proteção de Dados',
          'Prevenção à Lavagem de Dinheiro (PLD-FT)',
        ],
      },
    }

    setReport(mockReport)
    setUsedModelLabel('Mock AI (Teste)')
    setIsAnalyzing(false)
    toast.success('Análise mock gerada com sucesso!')
  }

  const handleToggleAdaptiveThought = (checked: boolean) => {
    setAdaptiveThought(checked)
    localStorage.setItem('adaptiveThought', String(checked))
  }

  useEffect(() => {
    pb.send('/backend/v1/ai-status', { method: 'GET' })
      .then((res) => setHasAiKey(res.hasKey))
      .catch(() => setHasAiKey(false))
  }, [])

  useEffect(() => {
    if (contractIdParam) {
      pb.collection('contracts')
        .getOne(contractIdParam)
        .then((contract) => {
          setContractDetails(contract)
          if (contract.minuta_texto) {
            setContractText(contract.minuta_texto)
            const typeMap: Record<string, string> = {
              'À Vista': 'a_vista',
              Financiado: 'financiado',
            }
            setContractType(typeMap[contract.tipo] || contract.tipo || 'outro')
          }
        })
        .catch(console.error)
    }
  }, [contractIdParam])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleAnalyzeFile = async () => {
    if (!selectedFile && !contractText) return
    setSelectedOmission(null)

    if (selectedFile && selectedFile.size > 15 * 1024 * 1024) {
      toast.error('O arquivo é muito grande. O limite é de 15MB.')
      return
    }

    setIsAnalyzing(true)
    setErrorMsg(null)
    setRawErrorDetails(null)
    setShowRawError(false)
    setReport(null)
    setUsedModelLabel('Claude 3')

    const controller = new AbortController()
    const timeout = adaptiveThought ? 180000 : 120000
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      let base64Data = ''
      let tipo = 'outro'
      let fileName = 'contrato_gerado.txt'

      if (selectedFile) {
        if (selectedFile.type === 'application/pdf') tipo = 'pdf'
        else if (
          selectedFile.name.endsWith('.docx') ||
          selectedFile.type.includes('wordprocessingml')
        )
          tipo = 'docx'
        else if (selectedFile.type.startsWith('image/')) tipo = 'imagem'

        fileName = selectedFile.name
        const b64 = await fileToBase64(selectedFile)
        base64Data = b64.split(',')[1] || b64
      } else if (contractText) {
        tipo = 'txt'
        let txtToProcess = contractText

        // Automated Text Sanitization: Strip decorative characters before sending
        txtToProcess = txtToProcess.replace(/[═─━│┃┄┅┆┇┈┉╌╍╎╏║╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀]/g, ' ')

        if (txtToProcess.length > 500000) {
          txtToProcess = txtToProcess.slice(0, 500000)
        }
        base64Data = txtToProcess
      }

      const payload = {
        arquivo: base64Data,
        tipo,
        tipoContrato: contractType,
        fileName,
        contractId: contractIdParam || undefined,
        adaptiveThought,
      }

      const res = await pb.send('/backend/v1/analisar-contrato', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      setReport(res)
      if (res.usedModel) {
        setUsedModelLabel(res.usedModel === 'claude-3-haiku-20241022' ? 'Haiku 3.5' : 'Sonnet 3.5')
      } else {
        setUsedModelLabel('Sonnet 3.5')
      }
      toast.success('Análise concluída com sucesso!')
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error(error)
      let msg =
        'Ocorreu um erro inesperado ao processar a análise. Por favor, tente novamente mais tarde.'

      if (error.name === 'AbortError') {
        msg = adaptiveThought
          ? 'A análise expirou após 3 minutos. O pensamento adaptativo exige mais tempo.'
          : 'A análise expirou após 2 minutos. O contrato pode ser muito longo ou o servidor está sobrecarregado.'
      } else if (error.response?.message) {
        const errMsg = error.response.message
        if (
          errMsg.includes('MODEL_NOT_AVAILABLE') ||
          errMsg.includes('not_found_error') ||
          error.status === 404 ||
          error.status === 400 ||
          error.status === 403
        ) {
          msg =
            'O modelo de IA solicitado não está disponível para sua chave. Verifique se sua conta Anthropic possui créditos ativos (Tier 1+).'
        } else if (
          errMsg.includes('INVALID_KEY') ||
          errMsg.includes('authentication_error') ||
          errMsg.includes('invalid_api_key') ||
          error.status === 401
        ) {
          msg =
            'Sua chave de API da Anthropic parece ser inválida. Verifique as configurações do seu perfil.'
        } else if (errMsg.includes('INSUFFICIENT_FUNDS')) {
          msg =
            'Sem saldo ou limite de requisições excedido. Verifique o seu saldo (Credits) no Anthropic Console.'
        } else {
          msg = errMsg.replace(/^\[.*?\]\s*/, '')
        }
      } else if (error.message) {
        const errMsg = error.message
        if (errMsg.includes('MODEL_NOT_AVAILABLE') || errMsg.includes('not_found_error')) {
          msg =
            'O modelo de IA solicitado não está disponível para sua chave. Verifique se sua conta Anthropic possui créditos ativos (Tier 1+).'
        } else if (
          errMsg.includes('INVALID_KEY') ||
          errMsg.includes('authentication_error') ||
          errMsg.includes('invalid_api_key')
        ) {
          msg =
            'Sua chave de API da Anthropic parece ser inválida. Verifique as configurações do seu perfil.'
        } else if (errMsg.includes('INSUFFICIENT_FUNDS')) {
          msg =
            'Sem saldo ou limite de requisições excedido. Verifique o seu saldo (Credits) no Anthropic Console.'
        } else {
          msg = errMsg.replace(/^\[.*?\]\s*/, '')
        }
      }

      setRawErrorDetails({
        status: error.status,
        message: error.message,
        data: error.response?.data || error.data,
        originalStack: error.originalStack || error.stack || new Error().stack,
      })

      setErrorMsg(msg)
      toast.error('Erro na Análise', { description: msg })
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (authLoading) return null
  if (!user) return <Navigate to="/login" />

  return (
    <div
      className={cn(
        'container mx-auto px-4 py-12 transition-all duration-500',
        report && contractText ? 'max-w-7xl' : 'max-w-5xl',
      )}
    >
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-4">
          <Bot className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
          Análise Jurídica com IA
        </h1>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 transition-all duration-300">
            <Sparkles className="w-3 h-3 mr-1" /> Powered by {usedModelLabel}
          </span>
        </div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Faça upload do seu contrato imobiliário e receba um relatório completo de riscos, omissões
          e conformidade legal.
        </p>
        <div className="mt-6">
          <Button variant="outline" asChild className="rounded-full shadow-sm">
            <Link to="/history">
              <History className="w-4 h-4 mr-2" /> Ver Histórico de Análises
            </Link>
          </Button>
        </div>
      </div>

      {!report && !errorMsg && (
        <Card
          className={cn(
            'max-w-2xl mx-auto border-0 shadow-lg ring-1 ring-slate-200/50 transition-opacity',
            isAnalyzing && 'pointer-events-none opacity-80',
          )}
        >
          <div className="p-8">
            <div className="mb-6 space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tipo de Contrato</label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_vista">Compra e Venda (À Vista)</SelectItem>
                  <SelectItem value="financiado">Compra e Venda (Financiado)</SelectItem>
                  <SelectItem value="aluguel">Aluguel / Locação</SelectItem>
                  <SelectItem value="promessa">Promessa de Compra e Venda</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 relative mt-4',
                isDragging
                  ? 'border-purple-500 bg-purple-50 scale-[1.02]'
                  : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400',
                selectedFile && !isDragging && 'border-purple-300 bg-purple-50/30',
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const f = e.dataTransfer.files?.[0]
                if (f) setSelectedFile(f)
              }}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <FileText className="w-12 h-12 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-lg truncate max-w-xs px-4">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    className="mt-2"
                  >
                    Trocar Arquivo
                  </Button>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-700 mb-2">
                    Arraste e solte seu contrato aqui
                  </h3>
                  <p className="text-slate-500 mb-8">Suporta PDF, DOCX, JPG e PNG</p>
                  <Button variant="secondary" className="px-8 pointer-events-none">
                    Selecionar Arquivo
                  </Button>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setSelectedFile(f)
                    setContractText(null)
                  }
                }}
                accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
              />
            </div>

            {contractText && !selectedFile && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="font-medium text-slate-800">Contrato Carregado do Sistema</p>
                    <p className="text-sm text-slate-500">Pronto para análise</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setContractText(null)}>
                  Remover
                </Button>
              </div>
            )}

            {(selectedFile || contractText) && (
              <div className="mt-8 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 duration-300 gap-6">
                <div className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-4 max-w-md w-full">
                  <div className="flex-1">
                    <label
                      htmlFor="adaptive-thought"
                      className="text-sm font-semibold text-slate-800 cursor-pointer block mb-1"
                    >
                      Pensamento Adaptativo
                    </label>
                    <p className="text-xs text-slate-500">
                      Raciocina para tarefas mais complexas usando o modelo Sonnet 4.6. Pode
                      aumentar o tempo de análise.
                    </p>
                  </div>
                  <Switch
                    id="adaptive-thought"
                    checked={adaptiveThought}
                    onCheckedChange={handleToggleAdaptiveThought}
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <Tooltip open={hasAiKey === false ? undefined : false}>
                    <TooltipTrigger asChild>
                      <div className="w-full sm:w-auto flex-1 max-w-sm">
                        <Button
                          size="lg"
                          disabled={isAnalyzing || hasAiKey === false}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-14 text-lg w-full shadow-md hover:shadow-lg transition-all disabled:pointer-events-none"
                          onClick={handleAnalyzeFile}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            'Analisar com IA'
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {hasAiKey === false && (
                      <TooltipContent
                        side="top"
                        className="bg-amber-100 text-amber-900 border-amber-200"
                      >
                        <p className="font-medium">Aviso</p>
                        <p>
                          Configure sua chave de IA no painel de integração para habilitar esta
                          função.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>

                  <div className="w-full sm:w-auto flex-1 max-w-sm">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-[#0C2340] text-[#0C2340] hover:bg-[#0C2340]/5 w-full h-14 text-lg shadow-sm"
                      onClick={handleMockAnalysis}
                      disabled={isAnalyzing}
                    >
                      <Wand2 className="w-5 h-5 mr-2 text-[#D4AF37]" /> Gerar Mock (Teste)
                    </Button>
                  </div>
                </div>

                {isAnalyzing && (
                  <div className="text-center animate-in fade-in duration-300 mt-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
                    </div>
                    <p className="text-purple-600 font-medium animate-pulse text-lg">
                      Analisando contrato... Por favor, aguarde.
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      A IA está analisando as cláusulas em relação à base legal
                      {adaptiveThought
                        ? ' usando pensamento adaptativo profundo (pode levar até 3 minutos).'
                        : ' (pode levar até 2 minutos).'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {errorMsg && (
        <Card className="max-w-2xl mx-auto border-red-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-red-800 text-xl font-medium max-w-lg mx-auto leading-relaxed">
              {errorMsg}
            </p>
            <div className="pt-4 flex flex-col items-center gap-4">
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 px-8"
                onClick={() => {
                  setErrorMsg(null)
                  setRawErrorDetails(null)
                  setShowRawError(false)
                  handleAnalyzeFile()
                }}
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> Tentar novamente
              </Button>

              {rawErrorDetails && (
                <div className="w-full mt-4 flex flex-col items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-700 text-xs"
                    onClick={() => setShowRawError(!showRawError)}
                  >
                    {showRawError
                      ? 'Ocultar Scanner de Erros'
                      : 'Scanner de Erros (Detalhes Técnicos)'}
                  </Button>
                  {showRawError && (
                    <div className="w-full mt-2 text-left bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono shadow-inner max-h-60 overflow-y-auto">
                      <pre>{JSON.stringify(rawErrorDetails, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {report && !isAnalyzing && !errorMsg && (
        <div className={cn('gap-8', contractText ? 'grid lg:grid-cols-[1fr_1.1fr]' : 'block')}>
          <div className="space-y-6">
            <AnalysisReportView
              report={report}
              contract={contractDetails}
              onOmissionClick={
                contractText ? (omission) => setSelectedOmission(omission) : undefined
              }
            />
          </div>

          {contractText && (
            <div className="sticky top-6 h-[calc(100vh-6rem)] flex flex-col border rounded-xl overflow-hidden shadow-sm bg-white mb-6">
              <div className="bg-slate-50 border-b p-4 flex justify-between items-center z-10 shadow-sm">
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" /> Documento Original
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    O texto será destacado com base na seleção do relatório.
                  </p>
                </div>
                {selectedOmission && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOmission(null)}
                    className="text-slate-500"
                  >
                    Limpar Seleção
                  </Button>
                )}
              </div>
              <div className="flex-1 relative overflow-y-auto">
                <RichTextEditor
                  value={contractText}
                  onChange={setContractText}
                  selectedOmission={selectedOmission}
                  onClearOmission={() => setSelectedOmission(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {(!report || !contractText) && <AnalysisHistoryTable contractId={contractIdParam} />}
    </div>
  )
}
