/**
 * ORCID OAuth Authorization Route
 * Initiates the ORCID OAuth flow by redirecting to ORCID authorization server
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrcidAuthorizationUrl } from '@/lib/orcid/oauth';
import { requireAuth } from '@/lib/orcid/auth-helper';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const redirectTo = searchParams.get('redirect_to') || undefined;
    const scope = searchParams.get('scope') || '/authenticate';

    // Generate ORCID authorization URL
    const authUrl = await getOrcidAuthorizationUrl(user.id, redirectTo, scope);

    // Redirect to ORCID
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('ORCID Auth: Error initiating OAuth flow:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initiate ORCID authentication',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Parse request body
    const body = await request.json();
    const { redirect_to, scope } = body;

    // Generate ORCID authorization URL
    const authUrl = await getOrcidAuthorizationUrl(
      user.id, 
      redirect_to, 
      scope || '/authenticate'
    );

    return NextResponse.json({
      success: true,
      authorization_url: authUrl
    });

  } catch (error) {
    console.error('ORCID Auth: Error generating authorization URL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate ORCID authorization URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}