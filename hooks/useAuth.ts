import { useUser } from '@auth0/nextjs-auth0'
import { useCallback, useMemo } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'author' | 'editor' | 'reviewer' | 'admin'
  permissions: string[]
  metadata: {
    affiliation?: string
    orcid?: string
    expertise?: string[]
    bio?: string
    h_index?: number
    avatar_url?: string
  }
  emailVerified: boolean
}

export function useAuth() {
  const { user: auth0User, error, isLoading } = useUser()
  
  // Transform Auth0 user to app user format
  const user: User | null = useMemo(() => {
    if (!auth0User) return null
    
    return {
      id: auth0User.sub!,
      email: auth0User.email!,
      name: auth0User.name!,
      role: (auth0User['https://thecommons.org/role'] as User['role']) || 'author',
      permissions: auth0User['https://thecommons.org/permissions'] || [],
      emailVerified: auth0User.email_verified || false,
      metadata: {
        affiliation: auth0User.user_metadata?.affiliation,
        orcid: auth0User.user_metadata?.orcid,
        expertise: auth0User.user_metadata?.expertise,
        bio: auth0User.user_metadata?.bio,
        h_index: auth0User.user_metadata?.h_index,
        avatar_url: auth0User.picture
      }
    }
  }, [auth0User])
  
  const login = useCallback((redirectTo?: string) => {
    const returnTo = redirectTo || window.location.pathname
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
  }, [])
  
  const logout = useCallback(() => {
    window.location.href = '/api/auth/logout'
  }, [])
  
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false
    if (user.role === 'admin') return true // Admins have all permissions
    return user.permissions.includes(permission) || user.permissions.includes('*:*')
  }, [user])
  
  const hasRole = useCallback((role: string | string[]) => {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.role)
  }, [user])
  
  const hasAnyRole = useCallback((roles: string[]) => {
    if (!user) return false
    return roles.some(role => user.role === role)
  }, [user])
  
  const isAuthor = useMemo(() => user?.role === 'author', [user])
  const isEditor = useMemo(() => user?.role === 'editor', [user])
  const isReviewer = useMemo(() => user?.role === 'reviewer', [user])
  const isAdmin = useMemo(() => user?.role === 'admin', [user])
  
  return {
    user,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAuthor,
    isEditor,
    isReviewer,
    isAdmin,
    isAuthenticated: !!user
  }
}