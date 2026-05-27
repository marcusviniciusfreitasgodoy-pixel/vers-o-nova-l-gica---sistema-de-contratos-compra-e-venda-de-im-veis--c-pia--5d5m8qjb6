import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

type Provider = 'anthropic' | 'openai' | 'gemini'

export function IntegrationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Provider>('anthropic')

  const [keys, setKeys] = useState<Record<Provider, string>>({
    anthropic: '',
    openai: '',
    gemini: '',
  })

  const [showKeys, setShowKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    openai: false,
    gemini: false,
  })

  const [testStatus, setTestStatus] = useState<
    Record<Provider, 'idle' | 'testing' | 'success' | 'error'>
  >({
    anthropic: 'idle',
    openai: 'idle',
    gemini: 'idle',
  })

  const [testMessages, setTestMessages] = useState<Record<Provider, string>>({
    anthropic: '',
    openai: '',
    gemini: '',
  })

  const [activeSources, setActiveSources] = useState<Record<Provider, string | null>>({
    anthropic: null,
    openai: null,
    gemini: null,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleKeyChange = (provider: Provider, value: string) => {
    setKeys((prev) => ({ ...prev, [provider]: value.trim() }))
    setTestStatus((prev) => ({ ...prev, [provider]: 'idle' }))
    setTestMessages((prev) => ({ ...prev, [provider]: '' }))
  }

  const handleTestConnection = async (provider: Provider) => {
    const rawKey = keys[provider]
    const cleanedKey = rawKey.replace(/[^\x21-\x7E]/g, '')
    if (cleanedKey !== rawKey) {
      handleKeyChange(provider, cleanedKey)
    }

    setTestStatus((prev) => ({ ...prev, [provider]: 'testing' }))
    setActiveSources((prev) => ({ ...prev, [provider]: null }))
    setTestMessages((prev) => ({ ...prev, [provider]: '' }))

    try {
      const res = await pb.send('/backend/v1/testar_conexao_ia', {
        method: 'POST',
        body: JSON.stringify({ apiKey: cleanedKey, provider }),
      })

      setTestStatus((prev) => ({ ...prev, [provider]: 'success' }))
      setActiveSources((prev) => ({ ...prev, [provider]: res.source }))

      const sourceLabel =
        res.source === 'Secret'
          ? 'Segredos do Sistema'
          : res.source === 'Database'
            ? 'Banco de Dados'
            : 'Chave Fornecida'

      const providerName =
        provider === 'anthropic' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : 'Google Gemini'
      toast.success(`Conexão com ${providerName} estabelecida com sucesso! (Fonte: ${sourceLabel})`)
    } catch (err: any) {
      setTestStatus((prev) => ({ ...prev, [provider]: 'error' }))
      const msg =
        err.response?.message || err.message || `Erro ao validar a chave de API do ${provider}.`
      setTestMessages((prev) => ({ ...prev, [provider]: msg }))
      toast.error('Erro na Validação', { description: msg })
    }
  }

  const handleSave = async () => {
    toast.info('As chaves de API agora são gerenciadas através dos Segredos do Sistema globais.')
    setIsOpen(false)
  }

  const renderProviderFields = (
    provider: Provider,
    name: string,
    placeholder: string,
    docsUrl: string,
  ) => {
    const status = testStatus[provider]
    const message = testMessages[provider]
    const source = activeSources[provider]
    const isTesting = status === 'testing'

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm space-y-2">
          <p className="font-semibold">Como obter sua chave {name}:</p>
          <ol className="list-decimal list-inside space-y-1 ml-1 text-blue-700/90">
            <li>
              Acesse o{' '}
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline inline-flex items-center gap-1"
              >
                Painel do Desenvolvedor <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Gere uma nova chave de API.</li>
            <li>Copie e cole a chave no campo abaixo.</li>
          </ol>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`apiKey-${provider}`}>Chave da API ({name})</Label>
          <div className="relative">
            <Input
              id={`apiKey-${provider}`}
              type={showKeys[provider] ? 'text' : 'password'}
              placeholder={placeholder}
              value={keys[provider]}
              onChange={(e) => handleKeyChange(provider, e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKeys[provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between pt-2">
          <div className="flex items-start gap-2">
            {status === 'success' && (
              <div className="flex flex-col text-sm text-green-600 font-medium">
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Conexão estabelecida
                </span>
                {source && (
                  <span className="text-xs text-green-700 ml-5 font-normal">
                    Fonte:{' '}
                    {source === 'Secret'
                      ? 'Segredos'
                      : source === 'Database'
                        ? 'Banco de Dados'
                        : 'Chave Fornecida'}
                  </span>
                )}
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col text-sm text-red-600 font-medium max-w-[280px]">
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 shrink-0" /> Erro na Validação
                </span>
                {message && (
                  <span className="text-xs font-normal mt-1 leading-tight text-red-500 break-words">
                    {message}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="pt-0.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleTestConnection(provider)}
              disabled={isTesting || !keys[provider]}
            >
              {isTesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
          title="Painel de Integração"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Configurações de Integração de IA
          </DialogTitle>
          <DialogDescription>
            Configure suas chaves de API para os provedores de inteligência artificial.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Provider)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="gemini">Google Gemini</TabsTrigger>
          </TabsList>

          <div className="py-4">
            <TabsContent value="anthropic" className="mt-0">
              {renderProviderFields(
                'anthropic',
                'Anthropic (Claude)',
                'sk-ant-...',
                'https://console.anthropic.com/settings/keys',
              )}
            </TabsContent>

            <TabsContent value="openai" className="mt-0">
              {renderProviderFields(
                'openai',
                'OpenAI (GPT-4)',
                'sk-...',
                'https://platform.openai.com/api-keys',
              )}
            </TabsContent>

            <TabsContent value="gemini" className="mt-0">
              {renderProviderFields(
                'gemini',
                'Google Gemini',
                'AIza...',
                'https://aistudio.google.com/app/apikey',
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
