import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { logSystemError } from '@/services/system_error_logs'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children?: React.ReactNode
  allowedRoles?: string[]
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  const hasAccess =
    !loading && user && (allowedRoles ? allowedRoles.includes(user?.role) || user?.is_admin : true)

  useEffect(() => {
    if (!loading && user && !hasAccess) {
      logSystemError({
        error_message: `Unauthorized access attempt to route ${location.pathname}`,
        severity: 'warning',
        component: 'ProtectedRoute',
        route: location.pathname,
        context_data: {
          user_role: user?.role,
          is_admin: user?.is_admin,
          allowed_roles: allowedRoles,
        },
      }).catch(() => {})
    }
  }, [loading, user, hasAccess, location.pathname, allowedRoles])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#0C2340] mb-4" />
        <p className="text-slate-500 animate-pulse text-sm font-medium">Conectando ao sistema...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
