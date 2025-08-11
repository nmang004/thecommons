// Route protection configuration
export interface RouteConfig {
  pattern: string
  requiredRoles?: string[]
  requireAuth?: boolean
  redirectTo?: string
}

export const routeConfigs: RouteConfig[] = [
  // Author routes
  {
    pattern: '/author',
    requiredRoles: ['author', 'admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },
  {
    pattern: '/author/*',
    requiredRoles: ['author', 'admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },

  // Editor routes
  {
    pattern: '/editor',
    requiredRoles: ['editor', 'admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },
  {
    pattern: '/editor/*',
    requiredRoles: ['editor', 'admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },

  // Reviewer routes
  {
    pattern: '/reviewer',
    requiredRoles: ['reviewer', 'admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },
  {
    pattern: '/reviewer/*',
    requiredRoles: ['reviewer', 'admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },

  // Admin routes
  {
    pattern: '/admin',
    requiredRoles: ['admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },
  {
    pattern: '/admin/*',
    requiredRoles: ['admin'],
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },

  // Profile routes (authenticated users only)
  {
    pattern: '/profile',
    requireAuth: true,
    redirectTo: '/api/auth/login'
  },
  {
    pattern: '/profile/*',
    requireAuth: true,
    redirectTo: '/api/auth/login'
  }
]

/**
 * Check if a path matches a route pattern
 * Supports wildcards (*)
 */
export function matchesPattern(path: string, pattern: string): boolean {
  if (pattern === path) return true
  
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  }
  
  return false
}

/**
 * Get route configuration for a given path
 */
export function getRouteConfig(path: string): RouteConfig | null {
  return routeConfigs.find(config => matchesPattern(path, config.pattern)) || null
}

/**
 * Check if user has required role for a route
 */
export function hasRequiredRole(userRole: string | undefined, requiredRoles?: string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true
  if (!userRole) return false
  
  return requiredRoles.includes(userRole)
}