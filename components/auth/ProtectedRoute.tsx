'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string | string[]
  requiredPermission?: string
  redirectTo?: string
  fallback?: React.ReactNode
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="p-8 text-center">
        <div className="w-8 h-8 mx-auto mb-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-gray-600">Authenticating...</p>
      </Card>
    </div>
  )
}

function UnauthorizedMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="p-8 text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-heading font-bold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-4">{message}</p>
        <button 
          onClick={() => window.history.back()}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Go Back
        </button>
      </Card>
    </div>
  )
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole, hasPermission } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading) {
      // Check authentication
      if (!user) {
        const currentPath = window.location.pathname + window.location.search
        router.push(`${redirectTo}?returnTo=${encodeURIComponent(currentPath)}`)
        return
      }
      
      // Check email verification
      if (!user.emailVerified) {
        router.push('/verify-email')
        return
      }
    }
  }, [user, isLoading, router, redirectTo])
  
  if (isLoading) {
    return fallback || <LoadingSpinner />
  }
  
  if (!user) {
    return null // Will redirect in useEffect
  }
  
  if (!user.emailVerified) {
    return null // Will redirect in useEffect
  }
  
  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    const roleText = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole
    return <UnauthorizedMessage message={`This page requires ${roleText} access.`} />
  }
  
  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <UnauthorizedMessage message="You don't have permission to access this page." />
  }
  
  return <>{children}</>
}

// Convenience components for common role checks
export function AuthorOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="author" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function EditorOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="editor" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function ReviewerOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="reviewer" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function AdminOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function StaffOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole={['editor', 'admin']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}