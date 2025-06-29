import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, securityMonitor } from './rate-limiting'
import { withApiCache } from '@/lib/middleware/api-cache'
import { createClient } from '@/lib/supabase/server'

// Input validation schemas
export const ValidationSchemas = {
  manuscriptSubmission: {
    title: { required: true, maxLength: 500, minLength: 10 },
    abstract: { required: true, maxLength: 5000, minLength: 100 },
    keywords: { required: true, maxItems: 10, minItems: 3 },
    field_of_study: { required: true, maxLength: 100 },
    authors: { required: true, maxItems: 50, minItems: 1 }
  },
  reviewSubmission: {
    recommendation: { required: true, enum: ['accept', 'minor_revisions', 'major_revisions', 'reject'] },
    summary: { required: true, maxLength: 2000, minLength: 100 },
    major_comments: { required: true, maxLength: 5000, minLength: 100 },
    confidence_level: { required: true, min: 1, max: 5 }
  },
  userProfile: {
    full_name: { required: true, maxLength: 100, minLength: 2 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    affiliation: { maxLength: 200 },
    bio: { maxLength: 1000 }
  }
} as const

// Input sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Validate input against schema
export function validateInput(data: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const [field, rules] of Object.entries(schema as any)) {
    const value = data[field]
    const fieldRules = rules as any
    
    // Required field check
    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }
    
    // Skip further validation if field is not provided and not required
    if (value === undefined || value === null) continue
    
    // String validations
    if (typeof value === 'string') {
      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors.push(`${field} must be at most ${fieldRules.maxLength} characters`)
      }
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors.push(`${field} must be at least ${fieldRules.minLength} characters`)
      }
      if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors.push(`${field} format is invalid`)
      }
    }
    
    // Number validations
    if (typeof value === 'number') {
      if (fieldRules.min && value < fieldRules.min) {
        errors.push(`${field} must be at least ${fieldRules.min}`)
      }
      if (fieldRules.max && value > fieldRules.max) {
        errors.push(`${field} must be at most ${fieldRules.max}`)
      }
    }
    
    // Array validations
    if (Array.isArray(value)) {
      if (fieldRules.maxItems && value.length > fieldRules.maxItems) {
        errors.push(`${field} must have at most ${fieldRules.maxItems} items`)
      }
      if (fieldRules.minItems && value.length < fieldRules.minItems) {
        errors.push(`${field} must have at least ${fieldRules.minItems} items`)
      }
    }
    
    // Enum validations
    if (fieldRules.enum && !fieldRules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${fieldRules.enum.join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Authentication middleware
export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async function(req: NextRequest): Promise<NextResponse> {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 403 }
        )
      }
      
      // Add user info to request
      const userWithProfile = { ...user, profile }
      
      return await handler(req, userWithProfile)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

// Role-based authorization
export function withRole(roles: string | string[], handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  
  return withAuth(async (req: NextRequest, user: any) => {
    if (!allowedRoles.includes(user.profile.role)) {
      await securityMonitor.recordFailedAttempt(
        `user:${user.id}`,
        'api'
      )
      
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return await handler(req, user)
  })
}

// Input validation middleware
export function withValidation(
  schema: any,
  handler: (req: NextRequest, data: any, user?: any) => Promise<NextResponse>
) {
  return async function(req: NextRequest, user?: any): Promise<NextResponse> {
    try {
      const data = await req.json()
      const sanitizedData = sanitizeInput(data)
      const validation = validateInput(sanitizedData, schema)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validation.errors
          },
          { status: 400 }
        )
      }
      
      return await handler(req, sanitizedData, user)
    } catch (error) {
      console.error('Validation error:', error)
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
  }
}

// File upload security
export function validateFileUpload(file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}): { valid: boolean; error?: string } {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ],
    allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.txt']
  } = options
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
    }
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    }
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`
    }
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.scr$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      valid: false,
      error: 'File type not allowed for security reasons'
    }
  }
  
  return { valid: true }
}

// Request logging for security monitoring
export function logSecurityEvent(
  type: 'auth_failure' | 'validation_failure' | 'rate_limit' | 'suspicious_activity',
  request: NextRequest,
  details: any
) {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    ip: clientIP,
    userAgent: request.headers.get('user-agent') || 'unknown',
    url: request.url,
    method: request.method,
    details
  }
  
  console.warn('🔐 Security Event:', logEntry)
  
  // Store in database for analysis
  // This could be enhanced to send to security monitoring service
}

// Comprehensive security middleware composer
export function withSecurity(options: {
  rateLimit?: any
  cache?: any
  auth?: boolean
  roles?: string | string[]
  validation?: any
}) {
  return function(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    let securedHandler = handler
    
    // Apply validation if specified
    if (options.validation) {
      securedHandler = withValidation(options.validation, securedHandler)
    }
    
    // Apply role-based auth if specified
    if (options.roles) {
      securedHandler = withRole(options.roles, securedHandler)
    } else if (options.auth) {
      securedHandler = withAuth(securedHandler)
    }
    
    // Apply caching if specified
    if (options.cache) {
      securedHandler = withApiCache(options.cache)(securedHandler)
    }
    
    // Apply rate limiting if specified
    if (options.rateLimit) {
      securedHandler = withRateLimit(options.rateLimit)(securedHandler)
    }
    
    return securedHandler
  }
}

// Request context for audit trails
export class RequestContext {
  constructor(
    public request: NextRequest,
    public user?: any,
    public startTime: number = Date.now()
  ) {}
  
  getClientInfo() {
    return {
      ip: this.request.headers.get('x-forwarded-for') || 
          this.request.headers.get('x-real-ip') || 'unknown',
      userAgent: this.request.headers.get('user-agent') || 'unknown',
      referer: this.request.headers.get('referer') || 'unknown'
    }
  }
  
  getDuration() {
    return Date.now() - this.startTime
  }
  
  createAuditLog(action: string, resource: string, success: boolean, details?: any) {
    return {
      timestamp: new Date().toISOString(),
      userId: this.user?.id,
      action,
      resource,
      success,
      duration: this.getDuration(),
      ...this.getClientInfo(),
      details
    }
  }
}