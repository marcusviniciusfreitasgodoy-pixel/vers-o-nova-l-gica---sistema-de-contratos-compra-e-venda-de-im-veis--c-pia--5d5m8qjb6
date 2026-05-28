import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { logSystemError } from '@/services/system_error_logs'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
