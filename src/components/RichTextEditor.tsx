import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline, List, ListOrdered, X, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  selectedOmission?: any
  onClearOmission?: () => void
  headerNode?: React.ReactNode
  footerNode?: React.ReactNode
}

export function RichTextEditor({
  value,
  onChange,
  selectedOmission,
  onClearOmission,
  headerNode,
  footerNode,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [overlay, setOverlay] = useState<any>(null)

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== value &&
      document.activeElement !== editorRef.current
    ) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    if (!selectedOmission || !editorRef.current) {
      setOverlay(null)
      return
    }

    const container = editorRef.current
    const elements = Array.from(container.children)
    if (elements.length === 0) {
      toast.error('O documento está vazio.')
      setOverlay(null)
      if (onClearOmission) onClearOmission()
      return
    }

    let targetEl: Element | null = null

    // Try AI Context if available
    if (selectedOmission.contexto || selectedOmission.ancora) {
      const anchor = (selectedOmission.contexto || selectedOmission.ancora).toLowerCase()
      targetEl = elements.find((el) => el.textContent?.toLowerCase().includes(anchor)) || null
    }

    // Fallback to title keywords
    if (!targetEl && selectedOmission.clausula) {
      const keywords = selectedOmission.clausula
        .toLowerCase()
        .split(' ')
        .filter((w: string) => w.length > 3)
      let maxMatches = 0
      for (const el of elements) {
        const text = el.textContent?.toLowerCase() || ''
        const matches = keywords.filter((k: string) => text.includes(k)).length
        if (matches > maxMatches) {
          maxMatches = matches
          targetEl = el
        }
      }
    }

    const isFallback = !targetEl
    if (isFallback) {
      targetEl = elements[elements.length - 1]
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })

      const elHtml = targetEl as HTMLElement
      setOverlay({
        top: elHtml.offsetTop,
        left: elHtml.offsetLeft,
        width: elHtml.offsetWidth,
        height: elHtml.offsetHeight,
        omission: selectedOmission,
        isFallback,
      })

      if (isFallback) {
        toast.info(
          'Não foi possível encontrar o local exato. Referência movida para o final do documento.',
        )
      }
    }
  }, [selectedOmission])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
      if (selectedOmission && onClearOmission) {
        onClearOmission()
      }
    }
  }

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg)
    if (editorRef.current) {
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="bg-slate-100 flex flex-col h-full rounded-b-md min-h-[500px] relative items-center pb-12 overflow-y-auto">
      <div className="w-full flex items-center justify-center gap-1 p-2 border-b bg-white sticky top-0 z-20 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          type="button"
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          type="button"
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          type="button"
          title="Sublinhado"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          type="button"
          title="Lista"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          type="button"
          title="Lista Numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>
      <div className="relative w-full max-w-[800px] bg-white shadow-md mt-8 min-h-[1131px] flex flex-col">
        {headerNode}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="px-12 py-8 focus:outline-none prose prose-slate max-w-none text-slate-800 leading-relaxed flex-1 prose-headings:font-bold prose-headings:text-slate-800 prose-a:text-blue-600 prose-table:border prose-table:border-slate-200 prose-td:border prose-td:border-slate-200 prose-td:p-2 prose-th:border prose-th:border-slate-200 prose-th:p-2 prose-th:bg-slate-50"
        />
        {footerNode}
        {overlay && (
          <div
            className="absolute pointer-events-none transition-all duration-500 ease-out border-2 border-purple-500 bg-purple-500/10 rounded-md z-20 flex flex-col justify-end items-center shadow-[0_0_0_2px_rgba(168,85,247,0.3)]"
            style={{
              top: overlay.top - 4,
              left: overlay.left - 4,
              width: overlay.width + 8,
              height: overlay.height + 8,
            }}
          >
            <div className="pointer-events-auto absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] bg-white rounded-lg shadow-xl border border-purple-200 p-4 z-30">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-purple-900 text-sm flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                  </span>
                  {overlay.isFallback ? 'Adicionar ao final:' : 'Sugestão de Inserção:'}
                </h4>
                <button
                  onClick={onClearOmission}
                  className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-full p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100 mb-3 max-h-48 overflow-y-auto">
                <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium">
                  {overlay.omission.redacaoPadrao}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                  onClick={() => {
                    navigator.clipboard.writeText(overlay.omission.redacaoPadrao)
                    toast.success('Sugestão copiada para a área de transferência!')
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copiar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
