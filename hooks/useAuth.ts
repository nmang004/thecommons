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
  const [forceRefresh, setForceRefresh] = useState(0)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        console.log('[useAuth] Checking authentication status...')
        
        // Check for logout completion in URL
        const urlParams = new URLSearchParams(window.location.search)
        const logoutParam = urlParams.get('logout')
        if (logoutParam === 'success') {
          console.log('[useAuth] Logout completion detected, clearing state')
          setUser(null)
          setError(null)
          setIsLoading(false)
          // Clean up URL without reload
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }
        
        const response = await fetch('/api/auth/profile', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        console.log('[useAuth] Profile API response status:', response.status)
        
        if (response.ok) {
          const { user: userData } = await response.json()
          console.log('[useAuth] User authenticated:', userData.email)
          
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
          console.log('[useAuth] User not authenticated')
          setUser(null)
        } else {
          console.error('[useAuth] Unexpected response status:', response.status)
          throw new Error('Failed to check authentication')
        }
      } catch (err) {
        console.error('[useAuth] Authentication check failed:', err)
        setError(err as Error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [forceRefresh])
  
  const login = useCallback((redirectTo?: string) => {
    const returnTo = redirectTo || window.location.pathname
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
  }, [])
  
  const logout = useCallback(async () => {
    try {
      console.log('[useAuth] Initiating logout...')
      
      // Don't clear client state immediately - let the server and Auth0 handle it
      // Just redirect to logout endpoint which will handle everything
      window.location.href = '/api/auth/logout'
    } catch (error) {
      console.error('[useAuth] Logout error:', error)
      // Fallback - force state refresh and redirect to home
      setUser(null)
      window.location.href = '/?logout=success'
    }
  }, [])
  
  // Add method to force refresh authentication state
  const refreshAuth = useCallback(() => {
    console.log('[useAuth] Forcing authentication refresh')
    setForceRefresh(prev => prev + 1)
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
    refreshAuth,
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