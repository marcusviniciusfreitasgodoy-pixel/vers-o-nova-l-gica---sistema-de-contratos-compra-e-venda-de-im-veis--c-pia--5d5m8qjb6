import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Dashboard from '@/pages/Dashboard'
import NovaNegociacao from '@/pages/negociacao/NovaNegociacao'
import Fase1 from '@/pages/negociacao/Fase1'
import Fase2 from '@/pages/negociacao/Fase2'
import Fase3 from '@/pages/negociacao/Fase3'
import Fase4 from '@/pages/negociacao/Fase4'
import DistratoPage from '@/pages/negociacao/DistratoPage'
import Profile from '@/pages/Profile'
import Login from '@/pages/Login'
import AIAnalysis from '@/pages/AIAnalysis'
import AnalysisHistory from '@/pages/AnalysisHistory'
import MyContracts from '@/pages/MyContracts'
import ContractView from '@/pages/ContractView'
import SignUp from '@/pages/SignUp'
import NotFound from '@/pages/NotFound'
import SystemGuide from '@/pages/SystemGuide'
import SignatureManagement from '@/pages/signatures/SignatureManagement'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import LegalKnowledgeList from '@/pages/admin/LegalKnowledgeList'
import LegalKnowledgeForm from '@/pages/admin/LegalKnowledgeForm'
import AuditLogsList from '@/pages/admin/AuditLogsList'
import SystemErrorLogsList from '@/pages/admin/SystemErrorLogsList'
import ExpertSupportList from '@/pages/ExpertSupportList'
import ExpertSupportForm from '@/pages/ExpertSupportForm'
import ExpertSupportView from '@/pages/ExpertSupportView'
import ExpertDashboard from '@/pages/admin/ExpertDashboard'
import CasesList from '@/pages/cases/CasesList'
import CaseForm from '@/pages/cases/CaseForm'
import CaseView from '@/pages/cases/CaseView'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="negociacao/nova" element={<NovaNegociacao />} />
                <Route path="negociacao/:id/fase-1" element={<Fase1 />} />
                <Route path="negociacao/:id/fase-2" element={<Fase2 />} />
                <Route path="negociacao/:id/fase-3" element={<Fase3 />} />
                <Route path="negociacao/:id/fase-4" element={<Fase4 />} />
                <Route path="negociacao/:id/distrato" element={<DistratoPage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="analysis" element={<AIAnalysis />} />
                <Route path="history" element={<AnalysisHistory />} />
                <Route path="contratos" element={<MyContracts />} />
                <Route path="contratos/:id" element={<ContractView />} />
                <Route path="guia-do-sistema" element={<SystemGuide />} />
                <Route path="assinaturas" element={<SignatureManagement />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/knowledge" element={<LegalKnowledgeList />} />
                <Route path="admin/knowledge/new" element={<LegalKnowledgeForm />} />
                <Route path="admin/knowledge/:id" element={<LegalKnowledgeForm />} />
                <Route path="admin/audit-logs" element={<AuditLogsList />} />
                <Route path="admin/logs" element={<SystemErrorLogsList />} />
                <Route path="admin/expert-dashboard" element={<ExpertDashboard />} />
                <Route path="expert-support" element={<ExpertSupportList />} />
                <Route path="expert-support/new" element={<ExpertSupportForm />} />
                <Route path="expert-support/:id" element={<ExpertSupportView />} />
                <Route path="casos" element={<CasesList />} />
                <Route path="casos/novo" element={<CaseForm />} />
                <Route path="casos/:id" element={<CaseView />} />
                <Route path="casos/:id/edit" element={<CaseForm />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
