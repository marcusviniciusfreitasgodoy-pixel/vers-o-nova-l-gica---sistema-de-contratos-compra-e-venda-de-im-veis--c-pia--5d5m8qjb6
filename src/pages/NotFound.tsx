import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-50 space-y-6 text-center px-4">
      <h1 className="text-6xl font-extrabold text-slate-800">404</h1>
      <p className="text-xl text-slate-600">A página que você está procurando não existe.</p>
      <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
        <Link to="/">Voltar para Início</Link>
      </Button>
    </div>
  )
}
