import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { GRSymbol } from '@/components/GRSymbol'

export default function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="bg-slate-900 text-white py-2 px-4 text-center text-sm font-medium tracking-wide shrink-0 z-50 shadow-sm relative">
        Assessoria Documental Imobiliária - Godoy Prime Realty
      </header>
      <div className="flex-1 flex flex-col w-full relative">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col min-h-screen bg-slate-50 font-sans w-full">
            <header className="bg-[#0C2340] border-b-4 border-[#D4AF37] sticky top-0 z-10 shadow-md">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="text-white hover:bg-white/20 md:hidden" />
                  <Link
                    to="/"
                    className="flex md:hidden items-center transition-transform hover:scale-105"
                  >
                    <GRSymbol className="h-8 w-8 object-contain" />
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-white hover:text-red-400 hover:bg-white/10 font-semibold"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline-block">Sair</span>
                  </Button>
                </div>
              </div>
            </header>
            <main className="flex-1">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
