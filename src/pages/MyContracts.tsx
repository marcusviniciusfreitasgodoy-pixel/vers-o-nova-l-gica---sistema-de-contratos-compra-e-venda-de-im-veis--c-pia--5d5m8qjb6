import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Plus,
  FileText,
  Calendar,
  Edit,
  MoreVertical,
  Download,
  Trash2,
  FileDown,
  Users,
} from 'lucide-react'
import { getMyContracts, deleteContract, generateContractDocx } from '@/services/contracts'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { generateMinutaPDF } from '@/lib/pdf-generator'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useRealtime } from '@/hooks/use-realtime'

const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
  ficha_cadastral: 'Ficha Cadastral',
  checklist_documental: 'Checklist Documental',
  recibo_sinal: 'Recibo de Sinal',
  promessa_compra_venda: 'Promessa de Compra e Venda',
  contrato_particular: 'Contrato Particular',
  termo_entrega_chaves: 'Termo de Entrega de Chaves',
  termo_posse: 'Termo de Posse',
  declaracoes_complementares: 'Declarações Complementares',
  autorizacao_intermediacao: 'Autorização de Intermediação',
  distrato: 'Distrato',
}

const getLabel = (tipo: string) =>
  TIPO_DOCUMENTO_LABELS[tipo] || (tipo === 'sem_tipo' ? 'Outros' : tipo.replace(/_/g, ' '))

export default function MyContracts() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadContracts = async () => {
    try {
      const data = await getMyContracts(1, 500)
      setContracts(data.items || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])

  useRealtime('contracts', () => {
    loadContracts()
  })

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) return
    try {
      await deleteContract(id)
      setContracts((prev) => prev.filter((c) => c.id !== id))
      toast.success('Documento excluído com sucesso.')
    } catch (error) {
      toast.error('Erro ao excluir documento.')
    }
  }

  const handleExportPDF = async (contract: any) => {
    if (!contract.minuta_texto) {
      toast.error('O documento não possui texto para exportar.')
      return
    }
    try {
      await generateMinutaPDF(contract.minuta_texto, `Contrato_${contract.id}`)
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar PDF.')
    }
  }

  const handleExportWord = async (contract: any) => {
    try {
      toast.info('Gerando arquivo Word...')
      const res = await generateContractDocx({
        minuta_html: contract.minuta_texto || '',
        contract_id: contract.id,
      })

      if (res?.url) {
        window.open(res.url, '_blank')
      } else if (res?.download_url) {
        window.open(res.download_url, '_blank')
      } else if (res?.base64) {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${res.base64}`
        link.download = `Contrato_${contract.id}.docx`
        link.click()
      } else {
        toast.success('Documento preparado para download.')
      }
    } catch (error) {
      toast.error('Erro ao exportar Word')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
      case 'em_elaboracao':
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
            Em rascunho
          </Badge>
        )
      case 'finalizado':
      case 'concluido':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Finalizado</Badge>
      case 'assinado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Assinado</Badge>
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status || 'Sem status'}
          </Badge>
        )
    }
  }

  const groupedContracts = useMemo(() => {
    const sorted = [...contracts].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    )
    return sorted.reduce(
      (acc, contract) => {
        const tipo = contract.tipo_documento || 'sem_tipo'
        if (!acc[tipo]) acc[tipo] = []
        acc[tipo].push(contract)
        return acc
      },
      {} as Record<string, any[]>,
    )
  }, [contracts])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const defaultAccordionValue = Object.keys(groupedContracts)

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meus Documentos</h1>
          <p className="text-slate-600 mt-2">
            Gerencie e visualize seus documentos gerados, agrupados por tipo.
          </p>
        </div>
        <Button
          onClick={() => navigate('/contratos/novo')}
          className="gap-2 shadow-sm w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Novo Documento
        </Button>
      </div>

      {contracts.length === 0 ? (
        <Card className="border-dashed shadow-none bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">Nenhum documento encontrado</h3>
            <p className="text-slate-500 mb-8 max-w-md">
              Você ainda não gerou nenhum documento. Comece criando o seu primeiro documento
              personalizado com IA.
            </p>
            <Button
              onClick={() => navigate('/contratos/novo')}
              size="lg"
              className="shadow-sm min-h-[44px] w-full sm:w-auto"
            >
              Criar Primeiro Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={defaultAccordionValue} className="space-y-4">
          {Object.entries(groupedContracts).map(([tipo, items]) => (
            <AccordionItem
              key={tipo}
              value={tipo}
              className="border rounded-xl bg-white shadow-sm overflow-hidden px-2 data-[state=open]:border-primary/20"
            >
              <AccordionTrigger className="hover:no-underline px-4 py-5 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">{getLabel(tipo)}</h2>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2.5 bg-slate-100 text-slate-600"
                  >
                    {items.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-1">
                <div className="grid gap-3">
                  {items.map((contract) => (
                    <Card
                      key={contract.id}
                      className="hover:shadow-md transition-all border-slate-200"
                    >
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center gap-3">
                              {getStatusBadge(contract.status)}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>
                                  Criado em:{' '}
                                  <span className="font-medium text-slate-800">
                                    {format(new Date(contract.created), 'dd/MM/yyyy')}
                                  </span>
                                </span>
                              </div>

                              {(contract.nome_comprador || contract.nome_vendedor) && (
                                <div className="flex items-start gap-2">
                                  <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">
                                    {contract.nome_comprador && (
                                      <>
                                        <span className="text-slate-500">Comprador:</span>{' '}
                                        <span className="font-medium text-slate-800">
                                          {contract.nome_comprador}
                                        </span>
                                      </>
                                    )}
                                    {contract.nome_comprador && contract.nome_vendedor && <br />}
                                    {contract.nome_vendedor && (
                                      <>
                                        <span className="text-slate-500">Vendedor:</span>{' '}
                                        <span className="font-medium text-slate-800">
                                          {contract.nome_vendedor}
                                        </span>
                                      </>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-4 border-t sm:border-0 sm:pt-0 shrink-0">
                          <Button
                            variant="secondary"
                            onClick={() => navigate(`/contratos/${contract.id}`)}
                            className="gap-2 flex-1 sm:flex-none min-h-[44px]"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar / Visualizar</span>
                            <span className="sm:hidden">Editar</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="shrink-0 bg-white">
                                <MoreVertical className="w-5 h-5 text-slate-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleExportPDF(contract)}
                                className="cursor-pointer"
                              >
                                <FileDown className="w-4 h-4 mr-2" />
                                Baixar PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleExportWord(contract)}
                                className="cursor-pointer"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Baixar Word
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(contract.id)}
                                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
