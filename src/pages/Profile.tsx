import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormValues } from '@/lib/schemas'
import { useAuth } from '@/hooks/use-auth'
import { updateUserProfile } from '@/services/users'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Save, Eye, EyeOff } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSavingBranding, setIsSavingBranding] = useState(false)
  const [brandingData, setBrandingData] = useState({
    header_content: user?.header_content || '',
    footer_content: user?.footer_content || '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setIsSavingBranding(true)
    try {
      const cleanHeader = brandingData.header_content.replace(
        /[\u25A0\u25FB\u25FC\u25FD\u25FE\u25AA\u25AB\u25A1]/g,
        '',
      )
      const cleanFooter = brandingData.footer_content.replace(
        /[\u25A0\u25FB\u25FC\u25FD\u25FE\u25AA\u25AB\u25A1]/g,
        '',
      )

      const formData = new FormData()
      formData.append('header_content', cleanHeader)
      formData.append('footer_content', cleanFooter)
      if (logoFile) {
        formData.append('imobiliaria_logo', logoFile)
      }
      await pb.collection('users').update(user.id, formData)
      toast.success('Configurações de marca atualizadas!')
    } catch (err) {
      toast.error('Erro ao atualizar marca.')
    } finally {
      setIsSavingBranding(false)
    }
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      imobiliaria_nome: user?.imobiliaria_nome || '',
      imobiliaria_documento: user?.imobiliaria_documento || '',
      creci: user?.creci || '',
      banco_nome: user?.banco_nome || '',
      agencia: user?.agencia || '',
      conta: user?.conta || '',
      chave_pix: user?.chave_pix || '',
      comissao_padrao_percentual: user?.comissao_padrao_percentual || 0,
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    const currentUserId = user?.id || pb.authStore.record?.id

    if (!currentUserId) {
      toast.error('Sessão inválida ou expirada. Faça login novamente.')
      return
    }

    setIsSaving(true)
    try {
      const cleanNome =
        data.imobiliaria_nome
          ?.replace(/[\u25A0\u25FB\u25FC\u25FD\u25FE\u25AA\u25AB\u25A1]/g, '')
          .trim() || ''
      const payload = {
        ...data,
        imobiliaria_nome: cleanNome,
        comissao_padrao_percentual: Number(data.comissao_padrao_percentual) || 0,
      }

      await updateUserProfile(currentUserId, payload)

      if (avatarFile) {
        const fd = new FormData()
        fd.append('avatar', avatarFile)
        await pb.collection('users').update(currentUserId, fd)
      }

      toast.success('Perfil atualizado com sucesso!')
    } catch (err: any) {
      if (err?.status === 404) {
        console.error(
          `Attempted to update user at: /api/collections/users/records/${currentUserId}`,
        )
        toast.error('Erro de permissão ou registro não encontrado. A sessão pode ser inválida.')
        setIsSaving(false)
        return
      }

      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          form.setError(field as keyof ProfileFormValues, { message })
        }
        toast.error('Verifique os erros no formulário.')
      } else {
        toast.error(err?.message || 'Erro ao atualizar perfil.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Perfil e Configurações</h1>
        <p className="text-slate-600 mt-2">Gerencie seus dados profissionais e bancários.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">
              Dados Profissionais / Imobiliária
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
              {user?.avatar && !avatarFile && (
                <img
                  src={pb.files.getURL(user, user.avatar)}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover border border-slate-200 bg-slate-50"
                />
              )}
              <div className="space-y-1.5 flex-1 w-full max-w-sm">
                <label className="text-sm font-medium leading-none text-slate-700">
                  Avatar (Foto de Perfil)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setAvatarFile(e.target.files[0])
                    }
                  }}
                  className="h-auto py-2 cursor-pointer file:cursor-pointer file:bg-slate-900 file:text-white file:border-0 file:rounded-md file:px-4 file:py-1.5 hover:file:bg-slate-800 file:font-medium file:transition-colors file:mr-4 border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imobiliaria_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Imobiliária ou Corretor</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imobiliaria_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF ou CNPJ</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creci"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRECI</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">
              Dados Bancários (Para Comissão)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="banco_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Ex: Itaú" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Ex: 0001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta Corrente/Poupança</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Ex: 12345-6" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chave_pix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave Pix</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="CPF, Email ou Celular"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comissao_padrao_percentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão Padrão (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === '' ? '' : Number(val))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={isSaving}
              className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 shadow-md font-semibold px-8 transition-all"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-8 mb-12">
        <form onSubmit={handleSaveBranding} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">
              Configurações de Marca (Header/Footer)
            </h2>
            <p className="text-sm text-slate-500">
              Personalize o cabeçalho e rodapé dos documentos exportados. Variáveis suportadas:{' '}
              <code className="bg-slate-100 px-1 rounded">{'{{ imobiliaria_nome }}'}</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">{'{{ creci }}'}</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">{'{{ imobiliaria_documento }}'}</code>.
            </p>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Logo da Imobiliária
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {user?.imobiliaria_logo && !logoFile && (
                    <img
                      src={pb.files.getURL(user, user.imobiliaria_logo)}
                      alt="Logo atual"
                      className="h-16 w-auto object-contain border border-slate-200 bg-slate-50 rounded p-1"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setLogoFile(e.target.files[0])
                      }
                    }}
                    className="flex-1 w-full max-w-sm h-auto py-2 cursor-pointer file:cursor-pointer file:bg-slate-900 file:text-white file:border-0 file:rounded-md file:px-4 file:py-1.5 hover:file:bg-slate-800 file:font-medium file:transition-colors file:mr-4 border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Cabeçalho (Header)</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={brandingData.header_content}
                  onChange={(e) =>
                    setBrandingData((prev) => ({ ...prev, header_content: e.target.value }))
                  }
                  placeholder="Texto do cabeçalho..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Rodapé (Footer)</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={brandingData.footer_content}
                  onChange={(e) =>
                    setBrandingData((prev) => ({ ...prev, footer_content: e.target.value }))
                  }
                  placeholder="Texto do rodapé..."
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSavingBranding}
                className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 shadow-md font-semibold px-8 transition-all"
              >
                {isSavingBranding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Marca
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
