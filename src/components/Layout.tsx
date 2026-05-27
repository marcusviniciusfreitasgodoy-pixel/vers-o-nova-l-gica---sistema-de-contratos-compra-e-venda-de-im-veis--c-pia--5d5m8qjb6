import { useState, useEffect } from 'react'
import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { GRSymbol } from '@/components/GRSymbol'

export default function Layout() {
  const { user, signOut, loading } = useAuth()
  const [isLongLoading, setIsLongLoading] = useState(false)
  const [forceReady, setForceReady] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    let forceTimer: NodeJS.Timeout

    if (loading) {
      timer = setTimeout(() => setIsLongLoading(true), 800)
      forceTimer = setTimeout(() => setForceReady(true), 6000)
    } else {
      setIsLongLoading(false)
    }

    return () => {
      clearTimeout(timer)
      clearTimeout(forceTimer)
    }
  }, [loading])

  const isLoadingState = loading && !forceReady

  if (isLoadingState) {
    if (!isLongLoading) return null
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#0C2340] mb-4" />
        <p className="text-slate-500 animate-pulse text-sm font-medium">Conectando ao sistema...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
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
  )
}
