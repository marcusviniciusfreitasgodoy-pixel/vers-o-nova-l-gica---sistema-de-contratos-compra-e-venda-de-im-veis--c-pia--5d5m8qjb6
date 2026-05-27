import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, LayoutDashboard, FileText, Briefcase, Sparkles, X } from 'lucide-react'
import { documentPhases } from '@/components/dashboard/dashboard-data'
import { PhaseCard } from '@/components/dashboard/phase-card'

export default function Index() {
  const [isBannerVisible, setIsBannerVisible] = useState(() => {
    return localStorage.getItem('hidePhaseBanner') !== 'true'
  })

  const dismissBanner = () => {
    setIsBannerVisible(false)
    localStorage.setItem('hidePhaseBanner', 'true')
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-in fade-in space-y-8">
      {/* New Flow Banner */}
      {isBannerVisible && (
        <section className="bg-primary/5 border border-primary/20 rounded-xl p-5 md:p-6 shadow-sm relative pr-10">
          <button
            onClick={dismissBanner}
            className="absolute top-3 right-3 text-primary/60 hover:text-primary transition-colors"
            aria-label="Dispensar aviso"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Novo: experimente o fluxo de negociação por fase
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  Estamos migrando para um novo fluxo de trabalho automatizado e integrado. A
                  geração de documentos baseada no estágio da negociação oferece mais segurança
                  jurídica.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row shrink-0 items-center gap-3 w-full md:w-auto">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to="#help">Como funciona o novo fluxo</Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/negociacao/nova">Acessar Novo Fluxo</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Welcome Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="max-w-4xl space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Bem-vindo. Do primeiro contato ao fechamento, com segurança e profissionalismo.
          </h1>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Acompanhe e gere os instrumentos legais certos em cada uma das 4 fases da transação
            imobiliária para garantir segurança jurídica e uma experiência profissional para os seus
            clientes.
          </p>
        </div>

        <div className="mt-8 bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
              <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-1">
                Regra de Ouro
              </h3>
              <p className="text-amber-900/90 text-sm md:text-base">
                A Promessa de Compra e Venda é o único instrumento que nunca deve ser pulado. É a
                sua principal garantia jurídica e o documento do qual todos os outros derivam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/dashboard" className="block group">
          <Card className="hover:shadow-md transition-all hover:border-primary/30 h-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                <LayoutDashboard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Painel Operacional</h3>
                <p className="text-sm text-slate-600 mt-2">Visão geral dos casos e gargalos</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/casos" className="block group">
          <Card className="hover:shadow-md transition-all hover:border-indigo-500/30 h-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-indigo-500/10 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                <Briefcase className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Meus Casos</h3>
                <p className="text-sm text-slate-600 mt-2">Acompanhe suas negociações ativas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/contratos/novo" className="block group">
          <Card className="hover:shadow-md transition-all hover:border-emerald-500/30 h-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                <FileText className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Novo Contrato</h3>
                <p className="text-sm text-slate-600 mt-2">Gere um novo instrumento legal</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Phases Section */}
      <section className="space-y-8 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            As 4 Fases da Transação
          </h2>
          <p className="text-slate-600 mt-1">
            Conheça os documentos recomendados para cada etapa do negócio imobiliário.
          </p>
        </div>

        <div className="space-y-12">
          {documentPhases.map((phase) => (
            <div key={phase.id} className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-xl font-bold text-slate-800">{phase.title}</h3>
                <p className="text-slate-600 mt-1">{phase.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phase.docs.map((doc) => (
                  <PhaseCard key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
