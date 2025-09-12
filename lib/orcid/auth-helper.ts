/**
 * ORCID Authentication Helper
 * Provides authentication utilities for ORCID API routes
 */

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  orcid?: string;
  orcid_verified?: boolean;
  [key: string]: any;
}

/**
 * Get the current authenticated user from the session cookie
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth-session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);
    if (!sessionData.user?.sub) {
      return null;
    }

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sessionData.user.email)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile as AuthenticatedUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication middleware for API routes
 */
export async function requireAuth(): Promise<{ user: AuthenticatedUser } | { error: Response }> {
  const user = await getCurrentUser();
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return { user };
}

/**
 * Check if user has ORCID connected
 */
export function hasOrcidConnected(user: AuthenticatedUser): boolean {
  return !!(user.orcid && user.orcid_verified);
}

/**
 * Require ORCID connection middleware
 */
export async function requireOrcidConnection(): Promise<
  { user: AuthenticatedUser } | { error: Response }
> {
  const authResult = await requireAuth();
  
  if ('error' in authResult) {
    return authResult;
  }

  if (!hasOrcidConnected(authResult.user)) {
    return {
      error: new Response(
        JSON.stringify({ error: 'ORCID account not connected' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return authResult;
}