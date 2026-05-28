import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

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

  if (allowedRoles && !allowedRoles.includes(user.role) && !user.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
