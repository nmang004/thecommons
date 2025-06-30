import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  // Use placeholder values if environment variables are not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYyMzkwMjIsImV4cCI6MTk2MTgxNTAyMn0.placeholder'
  
  // Check if we have valid environment variables
  if (supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseUrl === 'your_supabase_project_url_here' ||
      !supabaseUrl.includes('supabase.co')) {
    if (typeof window !== 'undefined') {
      console.error('Supabase environment variables are not properly configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.')
    }
  }
  
  try {
    return createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return a mock client that won't crash the app
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYyMzkwMjIsImV4cCI6MTk2MTgxNTAyMn0.placeholder'
    )
  }
}

// Export the createBrowserClient for compatibility
export { createBrowserClient }