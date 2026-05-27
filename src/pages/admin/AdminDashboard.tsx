import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Administração</h1>
      <p className="text-muted-foreground mb-8">
        Gerencie as configurações e a inteligência do sistema.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/knowledge" className="block group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Base de Conhecimento</CardTitle>
              <CardDescription>
                Gerencie leis, jurisprudência, cláusulas e boas práticas.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
