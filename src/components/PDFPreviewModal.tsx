import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useDocumentName } from '@/contexts/DocumentContext'

interface PDFPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfUrl: string | null
  onDownload?: () => void
}

export function PDFPreviewModal({ open, onOpenChange, pdfUrl, onDownload }: PDFPreviewModalProps) {
  const contextDocumentName = useDocumentName()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between bg-white rounded-t-lg">
          <div>
            <DialogTitle>Prévia do Documento</DialogTitle>
            <DialogDescription className="sr-only">Visualização do PDF gerado.</DialogDescription>
          </div>
          <div className="flex items-center gap-2 pr-6">
            {onDownload && (
              <Button
                onClick={onDownload}
                size="sm"
                className="bg-primary text-white hidden sm:flex"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            )}
            {pdfUrl && (
              <a href={pdfUrl} download="previa_documento.pdf" className="sm:hidden">
                <Button size="sm" className="bg-primary text-white">
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 w-full bg-slate-100 relative overflow-hidden rounded-b-lg">
          {pdfUrl ? (
            <object
              data={`${pdfUrl}#toolbar=0`}
              type="application/pdf"
              className="w-full h-full border-0"
            >
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </object>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <span className="text-lg font-medium">
                {contextDocumentName ? `Gerando ${contextDocumentName}...` : 'Carregando prévia...'}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
