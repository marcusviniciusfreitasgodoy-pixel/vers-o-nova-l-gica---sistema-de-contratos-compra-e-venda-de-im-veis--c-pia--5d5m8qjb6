import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import {
  getLegalKnowledge,
  createLegalKnowledge,
  updateLegalKnowledge,
} from '@/services/legal_knowledge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function LegalKnowledgeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [record, setRecord] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'legislacao',
    version: 1,
    priority: 1,
    trigger_logic: '',
    code: '',
    source_file: '',
  })

  useEffect(() => {
    if (id) {
      getLegalKnowledge(id)
        .then((data) => {
          setRecord(data)
          setFormData({
            title: data.title || '',
            content: data.content || '',
            category: data.category || 'legislacao',
            version: data.version || 1,
            priority: data.priority || 1,
            trigger_logic: data.trigger_logic || '',
            code: data.code || '',
            source_file: data.source_file || '',
          })
        })
        .catch((error) => {
          toast.error('Erro ao carregar registro: ' + error.message)
          navigate('/admin/knowledge')
        })
        .finally(() => setLoading(false))
    }
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasFile = Boolean(sourceFile || formData.source_file)
    if (!formData.content && !hasFile) {
      toast.error('Por favor, insira o conteúdo do texto ou anexe um arquivo de modelo.')
      return
    }

    setSaving(true)
    try {
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('category', formData.category)
      submitData.append('version', String(formData.version))
      submitData.append('priority', String(formData.priority))
      submitData.append('trigger_logic', formData.trigger_logic)
      submitData.append('code', formData.code)
      submitData.append('content', formData.content)

      if (sourceFile) {
        submitData.append('source_file', sourceFile)
      }

      if (isEditing && id) {
        await updateLegalKnowledge(id, submitData)
        toast.success('Registro atualizado com sucesso')
      } else {
        await createLegalKnowledge(submitData)
        toast.success('Registro criado com sucesso')
      }
      navigate('/admin/knowledge')
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isEditing ? 'Editar Conhecimento Jurídico' : 'Novo Conhecimento Jurídico'}
          </h1>
          <p className="text-muted-foreground">Preencha os detalhes do registro para a IA.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/knowledge')} disabled={saving}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="legislacao">Legislação</SelectItem>
                <SelectItem value="jurisprudencia">Jurisprudência</SelectItem>
                <SelectItem value="boas_praticas">Boas Práticas</SelectItem>
                <SelectItem value="clausula_fixa">Cláusula Fixa</SelectItem>
                <SelectItem value="clausula_condicional">Cláusula Condicional</SelectItem>
                <SelectItem value="protecao_comercial">Proteção Comercial</SelectItem>
                <SelectItem value="distrato">Distrato</SelectItem>
                <SelectItem value="permuta">Permuta</SelectItem>
                <SelectItem value="checklist_documental">Checklist Documental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código (Identificador Único)</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="ex: CL-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Versão</Label>
            <Input
              id="version"
              type="number"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="trigger_logic">Lógica de Acionamento (Opcional)</Label>
            <Input
              id="trigger_logic"
              value={formData.trigger_logic}
              onChange={(e) => setFormData({ ...formData, trigger_logic: e.target.value })}
              placeholder="ex: if tipo_imovel == 'rural'"
            />
          </div>

          <div className="space-y-2 md:col-span-2 p-4 border rounded-md bg-muted/30">
            <Label htmlFor="source_file" className="font-semibold text-base">
              Documento Fonte (Opcional)
            </Label>
            <div className="mt-2">
              <Input
                id="source_file"
                type="file"
                className="bg-background cursor-pointer"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSourceFile(e.target.files[0])
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Envie o documento original como anexo para referência futura. Limite: 10MB.
              </p>
            </div>

            {formData.source_file && !sourceFile && record && (
              <div className="mt-3 text-sm flex items-center gap-2 bg-background p-2 rounded border">
                <span className="font-medium">Arquivo atual:</span>
                <a
                  href={pb.files.getURL(record, formData.source_file)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline truncate max-w-[300px]"
                  title={formData.source_file}
                >
                  {formData.source_file}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="content">
              Conteúdo (Texto ou Markdown){' '}
              {!sourceFile && !formData.source_file && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required={!sourceFile && !formData.source_file}
              placeholder="Digite ou cole o conteúdo da cláusula ou documento..."
              className="min-h-[200px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={saving}>
            {saving ? 'Processando...' : 'Salvar Registro'}
          </Button>
        </div>
      </form>
    </div>
  )
}
