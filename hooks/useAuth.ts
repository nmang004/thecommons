import { useCallback, useMemo, useEffect, useState } from 'react'

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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/auth/profile')
        
        if (response.ok) {
          const { user: userData } = await response.json()
          
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.email,
            role: userData.role || 'author',
            permissions: userData.permissions || [],
            emailVerified: userData.email_verified || true,
            metadata: {
              affiliation: userData.affiliation,
              orcid: userData.orcid,
              expertise: userData.expertise,
              bio: userData.bio,
              h_index: userData.h_index,
              avatar_url: userData.avatar_url
            }
          })
        } else if (response.status === 401) {
          // Not authenticated
          setUser(null)
        } else {
          throw new Error('Failed to check authentication')
        }
      } catch (err) {
        setError(err as Error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])
  
  const login = useCallback((redirectTo?: string) => {
    const returnTo = redirectTo || window.location.pathname
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
  }, [])
  
  const logout = useCallback(async () => {
    try {
      // Clear session cookie
      document.cookie = 'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      
      // Redirect to Auth0 logout
      window.location.href = '/api/auth/logout'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback - just redirect to home
      window.location.href = '/'
    }
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