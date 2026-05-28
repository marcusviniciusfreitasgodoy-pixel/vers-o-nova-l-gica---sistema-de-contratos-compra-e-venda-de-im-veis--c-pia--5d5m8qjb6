import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileDown, FileText, History, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { CASE_STATES, STATE_COLORS, TIPO_IMOVEL } from '@/lib/constants'
import { DocumentTimeline } from '@/components/DocumentTimeline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function ClientCaseView({
  caseId,
  caseData,
  imovel,
}: {
  caseId: string
  caseData: any
  imovel: any
}) {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const negs = await pb
          .collection('gp_negociacoes')
          .getFullList({ filter: `case_id="${caseId}"` })
        if (negs.length > 0) {
          const filterStr = negs.map((n: any) => `negociacao_id="${n.id}"`).join(' || ')
          const docs = await pb.collection('contracts').getFullList({
            filter: filterStr,
            sort: '-created',
          })
          setContracts(docs)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [caseId])

  const handleDownload = (doc: any) => {
    if (!doc.arquivo_gerado) return
    const url = pb.files.getURL(doc, doc.arquivo_gerado)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.arquivo_gerado
    a.target = '_blank'
    a.click()
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6 animate-in fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{caseData.title}</h1>
        <div className="flex items-center gap-3 mt-3">
          <Badge
            variant="outline"
            className={cn(
              'px-3 py-1 text-sm font-medium',
              STATE_COLORS[caseData.estado_caso] || 'bg-slate-100',
            )}
          >
            {CASE_STATES[caseData.estado_caso] || caseData.estado_caso}
          </Badge>
          <span className="text-sm text-slate-500">
            Última atualização: {format(new Date(caseData.updated), 'dd/MM/yyyy HH:mm')}
          </span>
        </div>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="resumo">Resumo da Negociação</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Informações do Imóvel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imovel ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Tipo</p>
                      <p className="text-base text-slate-800 capitalize">
                        {(TIPO_IMOVEL as any)[imovel.tipo_imovel] ||
                          imovel.tipo_imovel?.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Finalidade</p>
                      <p className="text-base text-slate-800 capitalize">
                        {imovel.finalidade?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Endereço</p>
                    <p className="text-base text-slate-800">
                      {imovel.endereco_resumido || 'Não informado'}
                      {imovel.cidade && imovel.estado && ` - ${imovel.cidade}/${imovel.estado}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Nenhum imóvel vinculado.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">
                {caseData.description || 'Sem detalhes adicionais.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Central de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">Carregando documentos...</div>
              ) : contracts.length === 0 ? (
                <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Nenhum documento disponível no momento.
                </div>
              ) : (
                <div className="space-y-4">
                  {contracts.map((doc) => {
                    const canDownload = doc.status === 'concluido' || doc.status === 'assinado'
                    return (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors gap-4"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            {doc.tipo_documento?.replace(/_/g, ' ').toUpperCase() || 'DOCUMENTO'}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">
                            Status:{' '}
                            <span className="font-medium text-slate-700 uppercase">
                              {doc.status?.replace('_', ' ') || 'Rascunho'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-slate-600">
                                <History className="h-4 w-4 mr-2" />
                                Histórico
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Histórico do Documento</DialogTitle>
                              </DialogHeader>
                              <DocumentTimeline contractId={doc.id} />
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant={canDownload ? 'default' : 'secondary'}
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            disabled={!canDownload || !doc.arquivo_gerado}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
