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
  BookOpen,
  CheckCircle2,
  Circle,
  PenTool,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { GodoyLogo } from '@/components/GodoyLogo'
import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

export function AppSidebar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const negotiationMatch = pathname.match(/^\/negociacao\/([a-zA-Z0-9]+)\//)
  const negotiationId = negotiationMatch ? negotiationMatch[1] : null
  const [negociacao, setNegociacao] = useState<any>(null)

  useEffect(() => {
    if (negotiationId) {
      pb.collection('gp_negociacoes')
        .getOne(negotiationId, { expand: 'case_id' })
        .then(setNegociacao)
        .catch(() => {})
    } else {
      setNegociacao(null)
    }
  }, [negotiationId])

  useRealtime(
    'gp_negociacoes',
    (e) => {
      if (e.record.id === negotiationId) {
        setNegociacao(e.record)
      }
    },
    !!negotiationId,
  )

  const estagio = negociacao?.estagio

  const isInternal = user?.is_admin || ['admin', 'gestor', 'operador'].includes(user?.role)

  if (!isInternal) {
    return (
      <Sidebar>
        <SidebarHeader className="h-16 flex justify-center items-center px-4 border-b border-sidebar-border bg-sidebar text-white">
          <Link to="/" className="flex items-center justify-center w-full py-2">
            <GodoyLogo className="h-8 max-w-[180px] object-contain" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1 mt-4">
              Área do Cliente
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard' || pathname.startsWith('/casos')}
                  >
                    <Link to="/dashboard">
                      <Briefcase />
                      <span>Minhas Negociações</span>
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
                  <SidebarMenuButton asChild isActive={pathname === '/profile'}>
                    <Link to="/profile">
                      <UserCircle />
                      <span>Meu Perfil</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

  const fase1Done = [
    'proposta',
    'preliminar',
    'promessa',
    'definitivo',
    'finalizacao',
    'concluido',
  ].includes(estagio)
  const fase2Done = ['preliminar', 'promessa', 'definitivo', 'finalizacao', 'concluido'].includes(
    estagio,
  )
  const fase3Done = ['definitivo', 'finalizacao', 'concluido'].includes(estagio)
  const fase4Done = ['concluido'].includes(estagio)

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex justify-center items-center px-4 border-b border-sidebar-border bg-sidebar text-white">
        <Link to="/" className="flex items-center justify-center w-full py-2">
          <GodoyLogo className="h-8 max-w-[180px] object-contain" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {negotiationId && negociacao?.expand?.case_id && (
          <SidebarGroup className="pb-0">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1 mt-2">
              Contexto do Caso
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 mx-2 mb-2 rounded-md bg-white/10 border border-white/20 text-sm">
                <p
                  className="font-semibold text-white truncate"
                  title={negociacao.expand.case_id.title}
                >
                  {negociacao.expand.case_id.title}
                </p>
                <p className="text-[10px] text-white/70 uppercase tracking-wider mt-1 font-mono">
                  ID: {negociacao.expand.case_id.id.slice(0, 8)}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {negotiationId && (
          <SidebarGroup className="pt-0">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1 mt-2">
              Progresso da Negociação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/fase-1')}>
                    <Link to={`/negociacao/${negotiationId}/fase-1`}>
                      {fase1Done ? (
                        <CheckCircle2 className="text-green-500 h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span>Fase 1: Captação</span>
                    </Link>
                  </SidebarMenuButton>
                  {fase1Done && (
                    <SidebarMenuBadge className="bg-green-500/20 text-green-400">
                      Concluída
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/fase-2')}>
                    <Link to={`/negociacao/${negotiationId}/fase-2`}>
                      {fase2Done ? (
                        <CheckCircle2 className="text-green-500 h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span>Fase 2: Propostas</span>
                    </Link>
                  </SidebarMenuButton>
                  {fase2Done && (
                    <SidebarMenuBadge className="bg-green-500/20 text-green-400">
                      Concluída
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/fase-3')}>
                    <Link to={`/negociacao/${negotiationId}/fase-3`}>
                      {fase3Done ? (
                        <CheckCircle2 className="text-green-500 h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span>Fase 3: Contratos</span>
                    </Link>
                  </SidebarMenuButton>
                  {fase3Done && (
                    <SidebarMenuBadge className="bg-green-500/20 text-green-400">
                      Concluída
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/fase-4')}>
                    <Link to={`/negociacao/${negotiationId}/fase-4`}>
                      {fase4Done ? (
                        <CheckCircle2 className="text-green-500 h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span>Fase 4: Fechamento</span>
                    </Link>
                  </SidebarMenuButton>
                  {fase4Done && (
                    <SidebarMenuBadge className="bg-green-500/20 text-green-400">
                      Concluída
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Operacional */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1">
            Operacional
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/casos')}>
                  <Link to="/casos">
                    <Briefcase />
                    <span>Gestão de Casos</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge className="bg-amber-500 text-white hover:bg-amber-600 rounded px-1.5">
                  Recomendado
                </SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/negociacao/nova'}>
                  <Link to="/negociacao/nova">
                    <Sparkles />
                    <span>Negociações por fase</span>
                  </Link>
                </SidebarMenuButton>
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
                <SidebarMenuButton asChild isActive={pathname === '/assinaturas'}>
                  <Link to="/assinaturas">
                    <PenTool />
                    <span>Gestão de Assinaturas</span>
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
                <SidebarMenuButton asChild isActive={pathname === '/history'}>
                  <Link to="/history">
                    <History />
                    <span>Histórico de Análises</span>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ajuda & Documentação */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-1 mt-4">
            Ajuda & Documentação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/guia-do-sistema'}>
                  <Link to="/guia-do-sistema">
                    <BookOpen />
                    <span>Guia do Sistema</span>
                  </Link>
                </SidebarMenuButton>
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
