import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

const signUpSchema = z
  .object({
    name: z.string().min(1, 'O nome é obrigatório'),
    email: z.string().min(1, 'O email é obrigatório').email('Email inválido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    passwordConfirm: z.string().min(1, 'A confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })

type SignUpFormValues = z.infer<typeof signUpSchema>

export default function SignUp() {
  const { user, signUp, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
  })

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true)
    const { error } = await signUp(data.name, data.email, data.password)
    setIsLoading(false)

    if (error) {
      const pbErrors = extractFieldErrors(error)
      if (pbErrors.email) {
        setError('email', { type: 'manual', message: 'Este e-mail já está em uso.' })
      } else {
        toast.error('Erro ao criar conta. Tente novamente mais tarde.')
      }
    } else {
      toast.success('Conta criada com sucesso!')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 animate-in fade-in py-12">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <FileText className="text-blue-600 h-8 w-8" />
          </div>
          <CardTitle className="text-3xl text-slate-800">Criar Conta</CardTitle>
          <CardDescription className="text-base mt-2">
            Preencha os dados abaixo para se cadastrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
              <Input
                {...register('name')}
                className={cn(
                  'bg-white h-12',
                  errors.name && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">E-mail</label>
              <Input
                type="email"
                {...register('email')}
                className={cn(
                  'bg-white h-12',
                  errors.email && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Senha</label>
              <Input
                type="password"
                {...register('password')}
                className={cn(
                  'bg-white h-12',
                  errors.password && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Confirmar Senha</label>
              <Input
                type="password"
                {...register('passwordConfirm')}
                className={cn(
                  'bg-white h-12',
                  errors.passwordConfirm && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
              {errors.passwordConfirm && (
                <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-base h-12 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </Button>

            <div className="text-center text-sm text-slate-600 mt-6">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Entre aqui
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
