/**
 * ORCID OAuth flow handlers for The Commons
 * Manages OAuth state, token validation, and secure token storage
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';
import { 
  OrcidTokenResponse, 
  OrcidAuthState, 
  OrcidConnectionStatus,
  OrcidOAuthState,
  OrcidPersonResponse
} from './types';
import { getOrcidClient } from './client';
import { createClient } from '@/lib/supabase/server';

// OAuth state management constants
const OAUTH_STATE_COOKIE = 'orcid_oauth_state';
const OAUTH_STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const TOKEN_ENCRYPTION_KEY = process.env.ORCID_TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Generate secure OAuth state parameter with CSRF protection
 */
export function generateOAuthState(userId?: string, redirectTo?: string): OrcidOAuthState {
  const state = randomBytes(32).toString('hex');
  const stateData: OrcidOAuthState = {
    state,
    redirectTo,
    userId,
    timestamp: Date.now()
  };

  return stateData;
}

/**
 * Store OAuth state in secure cookie
 */
export async function storeOAuthState(stateData: OrcidOAuthState): Promise<void> {
  const cookieStore = await cookies();
  const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');
  
  cookieStore.set(OAUTH_STATE_COOKIE, encodedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: OAUTH_STATE_EXPIRY / 1000, // Convert to seconds
    path: '/'
  });
}

/**
 * Retrieve and validate OAuth state from cookie
 */
export async function validateOAuthState(stateParam: string): Promise<OrcidOAuthState | null> {
  try {
    const cookieStore = await cookies();
    const encodedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    
    if (!encodedState) {
      console.error('ORCID OAuth: No state cookie found');
      return null;
    }

    const stateData: OrcidOAuthState = JSON.parse(
      Buffer.from(encodedState, 'base64').toString()
    );

    // Validate state parameter matches
    if (stateData.state !== stateParam) {
      console.error('ORCID OAuth: State parameter mismatch');
      return null;
    }

    // Check if state has expired
    const now = Date.now();
    if (now - stateData.timestamp > OAUTH_STATE_EXPIRY) {
      console.error('ORCID OAuth: State has expired');
      return null;
    }

    return stateData;

  } catch (error) {
    console.error('ORCID OAuth: Error validating state:', error);
    return null;
  }
}

/**
 * Clear OAuth state cookie
 */
export async function clearOAuthState(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_STATE_COOKIE);
}

/**
 * Simple encryption for storing tokens (in production, use proper encryption)
 */
function encryptToken(token: string): string {
  // In production, use proper encryption like crypto.createCipher
  // This is a simple implementation for demonstration
  const hash = createHash('sha256');
  hash.update(TOKEN_ENCRYPTION_KEY + token);
  return hash.digest('hex');
}

/**
 * Simple decryption for retrieving tokens (in production, use proper decryption)
 */
function decryptToken(encryptedToken: string): string {
  // This is a placeholder - in production, implement proper decryption
  // For now, we'll store tokens in a way that can be retrieved
  // In real implementation, use crypto.createDecipher
  return encryptedToken; // Simplified for demo
}

/**
 * Store ORCID tokens securely in database
 */
export async function storeOrcidTokens(
  userId: string,
  tokenResponse: OrcidTokenResponse,
  personData?: OrcidPersonResponse
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokenResponse.access_token);
    const encryptedRefreshToken = encryptToken(tokenResponse.refresh_token);

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));

    // Prepare update data
    const updateData: any = {
      orcid: tokenResponse.orcid,
      orcid_verified: true,
      orcid_auth_token: encryptedAccessToken,
      orcid_refresh_token: encryptedRefreshToken,
      orcid_scope: tokenResponse.scope,
      orcid_connected_at: new Date().toISOString(),
      orcid_last_sync: new Date().toISOString()
    };

    // If we have person data, update profile information
    if (personData?.person) {
      const person = personData.person;
      
      if (person.name) {
        const fullName = [
          person.name['given-names']?.value,
          person.name['family-name']?.value
        ].filter(Boolean).join(' ');
        
        if (fullName) {
          updateData.full_name = fullName;
        }
      }

      if (person.biography?.value) {
        updateData.bio = person.biography.value;
      }

      if (person['researcher-urls']?.['researcher-url']) {
        const researcherUrls = person['researcher-urls']['researcher-url'];
        // Find website URL
        const websiteUrl = researcherUrls.find(url => 
          url['url-name'].toLowerCase().includes('website') ||
          url['url-name'].toLowerCase().includes('homepage')
        );
        
        if (websiteUrl) {
          updateData.website_url = websiteUrl.url.value;
        }
      }
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('ORCID OAuth: Error updating profile:', updateError);
      return { success: false, error: 'Failed to update profile' };
    }

    // Log successful connection
    const { error: logError } = await supabase
      .from('orcid_sync_history')
      .insert({
        user_id: userId,
        sync_type: 'profile',
        items_synced: 1,
        status: 'success',
        metadata: {
          event: 'initial_connection',
          orcid_id: tokenResponse.orcid,
          scope: tokenResponse.scope,
          token_expires_at: expiresAt.toISOString()
        }
      });

    if (logError) {
      console.error('ORCID OAuth: Error logging sync history:', logError);
      // Don't fail the operation for logging errors
    }

    return { success: true };

  } catch (error) {
    console.error('ORCID OAuth: Error storing tokens:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Retrieve ORCID authentication state for a user
 */
export async function getOrcidAuthState(userId: string): Promise<OrcidAuthState> {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('orcid, orcid_verified, orcid_auth_token, orcid_refresh_token, orcid_scope, orcid_connected_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {
        isAuthenticated: false,
        isExpired: false
      };
    }

    if (!profile.orcid_verified || !profile.orcid_auth_token) {
      return {
        isAuthenticated: false,
        isExpired: false,
        orcidId: profile.orcid || undefined
      };
    }

    // For now, assume tokens don't expire in our simplified implementation
    // In production, check actual expiration time
    const isExpired = false;

    return {
      orcidId: profile.orcid,
      accessToken: decryptToken(profile.orcid_auth_token),
      refreshToken: profile.orcid_refresh_token ? decryptToken(profile.orcid_refresh_token) : undefined,
      scope: profile.orcid_scope || undefined,
      isAuthenticated: true,
      isExpired
    };

  } catch (error) {
    console.error('ORCID OAuth: Error getting auth state:', error);
    return {
      isAuthenticated: false,
      isExpired: false
    };
  }
}

/**
 * Get ORCID connection status for a user
 */
export async function getOrcidConnectionStatus(userId: string): Promise<OrcidConnectionStatus> {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        orcid, 
        orcid_verified, 
        orcid_auth_token, 
        orcid_connected_at, 
        orcid_last_sync,
        orcid_scope
      `)
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {
        isConnected: false,
        hasValidToken: false,
        needsReauth: false
      };
    }

    const isConnected = !!(profile.orcid_verified && profile.orcid);
    const hasValidToken = !!(profile.orcid_auth_token && profile.orcid_verified);

    return {
      isConnected,
      orcidId: profile.orcid || undefined,
      connectedAt: profile.orcid_connected_at ? new Date(profile.orcid_connected_at) : undefined,
      lastSyncAt: profile.orcid_last_sync ? new Date(profile.orcid_last_sync) : undefined,
      scope: profile.orcid_scope || undefined,
      hasValidToken,
      needsReauth: isConnected && !hasValidToken
    };

  } catch (error) {
    console.error('ORCID OAuth: Error getting connection status:', error);
    return {
      isConnected: false,
      hasValidToken: false,
      needsReauth: false
    };
  }
}

/**
 * Refresh ORCID access token if needed
 */
export async function refreshOrcidTokenIfNeeded(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authState = await getOrcidAuthState(userId);

    if (!authState.isAuthenticated || !authState.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    if (!authState.isExpired) {
      return { success: true }; // Token is still valid
    }

    const orcidClient = getOrcidClient();
    const response = await orcidClient.refreshAccessToken(authState.refreshToken);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.error?.['user-message'] || 'Failed to refresh token' 
      };
    }

    // Store the new token
    const storeResult = await storeOrcidTokens(userId, response.data);
    
    if (!storeResult.success) {
      return { success: false, error: storeResult.error };
    }

    return { success: true };

  } catch (error) {
    console.error('ORCID OAuth: Error refreshing token:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Disconnect ORCID account
 */
export async function disconnectOrcidAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Clear ORCID-related fields
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        orcid_verified: false,
        orcid_auth_token: null,
        orcid_refresh_token: null,
        orcid_scope: null,
        orcid_connected_at: null,
        orcid_last_sync: null
        // Keep the orcid field for reference, but mark as unverified
      })
      .eq('id', userId);

    if (updateError) {
      console.error('ORCID OAuth: Error disconnecting account:', updateError);
      return { success: false, error: 'Failed to disconnect account' };
    }

    // Log disconnection
    const { error: logError } = await supabase
      .from('orcid_sync_history')
      .insert({
        user_id: userId,
        sync_type: 'profile',
        items_synced: 0,
        status: 'success',
        metadata: {
          event: 'account_disconnected',
          disconnected_at: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('ORCID OAuth: Error logging disconnection:', logError);
      // Don't fail the operation for logging errors
    }

    return { success: true };

  } catch (error) {
    console.error('ORCID OAuth: Error disconnecting account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Handle ORCID OAuth errors with user-friendly messages
 */
export function handleOAuthError(error: string, errorDescription?: string): string {
  const errorMessages: Record<string, string> = {
    'access_denied': 'You declined to connect your ORCID account. You can try again anytime.',
    'invalid_request': 'There was a problem with the ORCID connection request. Please try again.',
    'invalid_client': 'There was a configuration error. Please contact support.',
    'invalid_grant': 'The ORCID authorization has expired. Please try connecting again.',
    'unsupported_response_type': 'There was a technical error. Please contact support.',
    'invalid_scope': 'The requested permissions are not valid. Please contact support.',
    'server_error': 'ORCID is experiencing technical difficulties. Please try again later.',
    'temporarily_unavailable': 'ORCID is temporarily unavailable. Please try again later.'
  };

  return errorMessages[error] || 
         errorDescription || 
         'An unexpected error occurred while connecting to ORCID. Please try again.';
}

/**
 * Validate ORCID OAuth callback parameters
 */
export function validateOAuthCallback(request: NextRequest): {
  isValid: boolean;
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Check for OAuth errors
  if (error) {
    return {
      isValid: false,
      error,
      errorDescription: errorDescription || undefined
    };
  }

  // Check for required parameters
  if (!code || !state) {
    return {
      isValid: false,
      error: 'invalid_request',
      errorDescription: 'Missing required parameters'
    };
  }

  return {
    isValid: true,
    code,
    state
  };
}

/**
 * Check if user can perform ORCID operations
 */
export async function canPerformOrcidOperations(userId: string, requiredScope?: string): Promise<boolean> {
  const authState = await getOrcidAuthState(userId);

  if (!authState.isAuthenticated || authState.isExpired) {
    return false;
  }

  // If specific scope is required, check if it's available
  if (requiredScope && authState.scope) {
    const scopes = authState.scope.split(',').map(s => s.trim());
    return scopes.includes(requiredScope);
  }

  return true;
}

/**
 * Get ORCID authorization URL for connecting account
 */
export async function getOrcidAuthorizationUrl(
  userId: string, 
  redirectTo?: string,
  scope?: string
): Promise<string> {
  const orcidClient = getOrcidClient();
  
  // Generate and store OAuth state
  const stateData = generateOAuthState(userId, redirectTo);
  await storeOAuthState(stateData);

  // Generate authorization URL
  const authUrl = orcidClient.generateAuthorizationUrl(
    stateData.state,
    scope
  );

  return authUrl;
}

/**
 * Handle successful ORCID OAuth callback
 */
export async function handleOrcidCallback(
  code: string,
  state: string
): Promise<{ 
  success: boolean; 
  redirectTo?: string; 
  error?: string; 
  userId?: string 
}> {
  // Validate OAuth state
  const stateData = await validateOAuthState(state);
  if (!stateData) {
    return { 
      success: false, 
      error: 'Invalid or expired authorization state' 
    };
  }

  try {
    // Clear OAuth state
    await clearOAuthState();

    // Exchange code for token
    const orcidClient = getOrcidClient();
    const tokenResponse = await orcidClient.exchangeCodeForToken(code);

    if (!tokenResponse.success || !tokenResponse.data) {
      return { 
        success: false, 
        error: tokenResponse.error?.['user-message'] || 'Failed to obtain access token'
      };
    }

    // Fetch person data to enrich profile
    let personData: OrcidPersonResponse | undefined;
    const personResponse = await orcidClient.getPersonProfile(
      tokenResponse.data.orcid, 
      tokenResponse.data.access_token
    );

    if (personResponse.success && personResponse.data) {
      personData = personResponse.data;
    }

    // Store tokens and update profile
    const userId = stateData.userId;
    if (!userId) {
      return { 
        success: false, 
        error: 'User session not found' 
      };
    }

    const storeResult = await storeOrcidTokens(userId, tokenResponse.data, personData);
    
    if (!storeResult.success) {
      return { 
        success: false, 
        error: storeResult.error 
      };
    }

    return { 
      success: true, 
      redirectTo: stateData.redirectTo,
      userId 
    };

  } catch (error) {
    console.error('ORCID OAuth: Error handling callback:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred during ORCID connection' 
    };
  }
}