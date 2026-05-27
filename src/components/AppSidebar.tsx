import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  FileText,
  History,
  Bot,
  UserCircle,
  Settings,
  Files,
  Scale,
  ShieldAlert,
  Bug,
  UserCheck,
  Briefcase,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { GodoyLogo } from '@/components/GodoyLogo'

export function AppSidebar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex justify-center items-center px-4 border-b border-sidebar-border bg-sidebar text-white">
        <Link to="/" className="flex items-center justify-center w-full py-2">
          <GodoyLogo className="h-8 max-w-[180px] object-contain" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* Operacional */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1">
            Operacional
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/negociacao/nova'}>
                  <Link to="/negociacao/nova">
                    <Sparkles />
                    <span>Negociações por fase</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge className="bg-amber-500 text-white hover:bg-amber-600 rounded px-1.5">
                  Recomendado
                </SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                  <Link to="/dashboard">
                    <LayoutDashboard />
                    <span>Painel Operacional</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/casos')}>
                  <Link to="/casos">
                    <Briefcase />
                    <span>Gestão de Casos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/contratos'}>
                  <Link to="/contratos">
                    <Files />
                    <span>Meus Documentos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/analysis'}>
                  <Link to="/analysis">
                    <Bot />
                    <span>Análise de documentos IA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/expert-support')}>
                  <Link to="/expert-support">
                    <UserCheck />
                    <span>Fale com um Especialista</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Compliance & Gestão */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1 mt-4">
            Compliance & Gestão
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin/knowledge'}>
                  <Link to="/admin/knowledge">
                    <Scale />
                    <span>Base Jurídica</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin/audit-logs'}>
                  <Link to="/admin/audit-logs">
                    <ShieldAlert />
                    <span>Histórico de Auditoria</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin/logs'}>
                  <Link to="/admin/logs">
                    <Bug />
                    <span>Logs de Erro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/history'}>
                  <Link to="/history">
                    <History />
                    <span>Histórico de Análises</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ferramentas Legadas */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1 mt-4">
            Ferramentas Legadas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild isActive={pathname === '/contratos/novo'}>
                      <Link to="/contratos/novo" className="text-white/70">
                        <FileText />
                        <span>Gerar Documento</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Será desativado em breve. Use o novo fluxo de Negociações por fase.</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1 mt-4">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/profile'}>
                  <Link to="/profile">
                    <UserCircle />
                    <span>Perfil & Branding</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                  <Link to="/admin">
                    <Settings />
                    <span>Painel Administrativo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.is_admin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin/expert-dashboard')}
                  >
                    <Link to="/admin/expert-dashboard">
                      <Briefcase />
                      <span>Painel do Especialista</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <UserCircle className="w-4 h-4" />
          <span className="truncate font-medium">{user?.name || user?.email}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
