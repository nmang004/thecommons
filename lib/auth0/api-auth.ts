import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'

interface AuthorizedRequest extends NextRequest {
  user: {
    id: string
    email: string
    name: string
    role: string
    permissions: string[]
    emailVerified: boolean
  }
}

interface WithAuthOptions {
  requiredRole?: string | string[]
  requiredPermission?: string
  requireEmailVerification?: boolean
}

export function withAuth(
  handler: (req: AuthorizedRequest) => Promise<NextResponse>,
  options: WithAuthOptions = {}
) {
  return withApiAuthRequired(async (req: NextRequest) => {
    try {
      const session = await getSession(req)
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Check email verification if required (default: true)
      const requireEmailVerification = options.requireEmailVerification !== false
      const emailVerified = session.user.email_verified
      
      if (requireEmailVerification && !emailVerified) {
        return NextResponse.json(
          { error: 'Email verification required' },
          { status: 403 }
        )
      }

      // Extract user role and permissions from token
      const userRole = session.user['https://thecommons.org/role'] || 'author'
      const userPermissions = session.user['https://thecommons.org/permissions'] || []

      // Check role requirement
      if (options.requiredRole) {
        const roles = Array.isArray(options.requiredRole) 
          ? options.requiredRole 
          : [options.requiredRole]
        
        if (!roles.includes(userRole) && userRole !== 'admin') {
          return NextResponse.json(
            { error: 'Insufficient role' },
            { status: 403 }
          )
        }
      }

      // Check permission requirement
      if (options.requiredPermission) {
        const hasPermission = userRole === 'admin' || 
          userPermissions.includes(options.requiredPermission) ||
          userPermissions.includes('*:*')
        
        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      // Add user context to request
      (req as AuthorizedRequest).user = {
        id: session.user.sub!,
        email: session.user.email!,
        name: session.user.name!,
        role: userRole,
        permissions: userPermissions,
        emailVerified
      }

      return handler(req as AuthorizedRequest)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }
  })
}

// Convenience wrappers for common role checks
export function withAuthorAuth(handler: (req: AuthorizedRequest) => Promise<NextResponse>) {
  return withAuth(handler, { requiredRole: 'author' })
}

export function withEditorAuth(handler: (req: AuthorizedRequest) => Promise<NextResponse>) {
  return withAuth(handler, { requiredRole: 'editor' })
}

export function withReviewerAuth(handler: (req: AuthorizedRequest) => Promise<NextResponse>) {
  return withAuth(handler, { requiredRole: 'reviewer' })
}

export function withAdminAuth(handler: (req: AuthorizedRequest) => Promise<NextResponse>) {
  return withAuth(handler, { requiredRole: 'admin' })
}

export function withStaffAuth(handler: (req: AuthorizedRequest) => Promise<NextResponse>) {
  return withAuth(handler, { requiredRole: ['editor', 'admin'] })
}

// Permission-based wrappers
export function withManuscriptPermission(
  handler: (req: AuthorizedRequest) => Promise<NextResponse>,
  permission: string
) {
  return withAuth(handler, { requiredPermission: `manuscripts:${permission}` })
}

export function withReviewPermission(
  handler: (req: AuthorizedRequest) => Promise<NextResponse>,
  permission: string
) {
  return withAuth(handler, { requiredPermission: `reviews:${permission}` })
}

export function withEditorialPermission(
  handler: (req: AuthorizedRequest) => Promise<NextResponse>,
  permission: string
) {
  return withAuth(handler, { requiredPermission: `decisions:${permission}` })
}