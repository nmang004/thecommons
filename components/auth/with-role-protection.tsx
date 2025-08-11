'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getRouteConfig, hasRequiredRole } from '@/lib/auth/protected-routes'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface WithRoleProtectionOptions {
  requiredRoles?: string[]
  redirectTo?: string
  fallbackComponent?: React.ComponentType
}

export function withRoleProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithRoleProtectionOptions = {}
) {
  const ProtectedComponent = (props: P) => {
    const { user, isLoading } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
      if (isLoading) return

      // Get route config from pathname or options
      const routeConfig = getRouteConfig(pathname)
      const requiredRoles = options.requiredRoles || routeConfig?.requiredRoles
      const redirectTo = options.redirectTo || routeConfig?.redirectTo || '/api/auth/login'

      // Check authentication
      if ((routeConfig?.requireAuth || requiredRoles) && !user) {
        router.push(redirectTo)
        return
      }

      // Check role authorization
      if (requiredRoles && !hasRequiredRole(user?.role, requiredRoles)) {
        // Redirect to appropriate dashboard based on user role
        const dashboardRedirect = user?.role ? `/${user.role}` : '/author'
        router.push(dashboardRedirect)
        return
      }

      setIsAuthorized(true)
      setIsChecking(false)
    }, [user, isLoading, pathname, router, options])

    if (isLoading || isChecking) {
      return (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

    if (!isAuthorized) {
      if (options.fallbackComponent) {
        const FallbackComponent = options.fallbackComponent
        return <FallbackComponent />
      }

      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  ProtectedComponent.displayName = `withRoleProtection(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return ProtectedComponent
}

// Convenience HOCs for specific roles
export const withAuthorProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => withRoleProtection(WrappedComponent, { requiredRoles: ['author', 'admin'] })

export const withEditorProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => withRoleProtection(WrappedComponent, { requiredRoles: ['editor', 'admin'] })

export const withReviewerProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => withRoleProtection(WrappedComponent, { requiredRoles: ['reviewer', 'admin'] })

export const withAdminProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => withRoleProtection(WrappedComponent, { requiredRoles: ['admin'] })

export const withAuthProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => withRoleProtection(WrappedComponent, {})