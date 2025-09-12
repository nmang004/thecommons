/**
 * ORCID OAuth Callback Route
 * Handles the OAuth callback from ORCID after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateOAuthCallback, 
  handleOrcidCallback, 
  handleOAuthError 
} from '@/lib/orcid/oauth';

export async function GET(request: NextRequest) {
  try {
    // Validate callback parameters
    const validation = validateOAuthCallback(request);
    
    if (!validation.isValid) {
      // Handle OAuth errors
      if (validation.error) {
        const errorMessage = handleOAuthError(validation.error, validation.errorDescription);
        
        // Redirect to profile page with error
        const errorUrl = new URL('/profile', request.url);
        errorUrl.searchParams.set('orcid_error', errorMessage);
        
        return NextResponse.redirect(errorUrl.toString());
      }
      
      // Invalid request
      return NextResponse.json(
        { error: 'Invalid OAuth callback request' },
        { status: 400 }
      );
    }

    // Handle the OAuth callback
    const result = await handleOrcidCallback(validation.code!, validation.state!);
    
    if (!result.success) {
      // Redirect with error message
      const errorUrl = new URL('/profile', request.url);
      errorUrl.searchParams.set('orcid_error', result.error || 'Unknown error occurred');
      
      return NextResponse.redirect(errorUrl.toString());
    }

    // Success! Redirect to the intended destination or profile page
    const successUrl = new URL(result.redirectTo || '/profile', request.url);
    successUrl.searchParams.set('orcid_connected', 'true');
    
    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('ORCID Callback: Unexpected error:', error);
    
    // Redirect to profile with generic error
    const errorUrl = new URL('/profile', request.url);
    errorUrl.searchParams.set(
      'orcid_error', 
      'An unexpected error occurred while connecting your ORCID account'
    );
    
    return NextResponse.redirect(errorUrl.toString());
  }
}

// Handle POST requests (for testing or alternative implementations)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Handle the OAuth callback
    const result = await handleOrcidCallback(code, state);
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      redirect_to: result.redirectTo,
      user_id: result.userId
    });

  } catch (error) {
    console.error('ORCID Callback: Error in POST handler:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process ORCID callback',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}