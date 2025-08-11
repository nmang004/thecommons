import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Re-export createServerClient for compatibility
export { createServerClient }

/**
 * Creates a Supabase server client for data access only (no authentication)
 * Authentication is handled by Auth0
 */
export async function createClient() {
  // Use placeholder values if environment variables are not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYyMzkwMjIsImV4cCI6MTk2MTgxNTAyMn0.placeholder'
  
  // Check if we have valid environment variables
  if (supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseUrl === 'your_supabase_project_url_here' ||
      !supabaseUrl ||
      !supabaseUrl.includes('supabase.co')) {
    console.warn('Supabase environment variables are not properly configured. Using placeholder values.')
    // Use valid placeholder values to prevent build errors
    return createServerClient<Database>(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYyMzkwMjIsImV4cCI6MTk2MTgxNTAyMn0.placeholder',
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op since we don't use Supabase auth cookies
          },
        },
      }
    )
  }

  // Create a simple server client without cookie handling for auth
  // since Auth0 handles authentication
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op since we don't use Supabase auth cookies
        },
      },
    }
  )
}

export async function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NjIzOTAyMiwiZXhwIjoxOTYxODE1MDIyfQ.placeholder'
  
  return createServerClient<Database>(
    supabaseUrl,
    serviceKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}