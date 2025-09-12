/**
 * ORCID Disconnect Route
 * Allows users to disconnect their ORCID account
 */

import { NextRequest, NextResponse } from 'next/server';
import { disconnectOrcidAccount } from '@/lib/orcid/oauth';
import { requireAuth } from '@/lib/orcid/auth-helper';

export async function POST(_request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Disconnect ORCID account
    const result = await disconnectOrcidAccount(user.id);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to disconnect ORCID account',
          message: result.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ORCID account disconnected successfully'
    });

  } catch (error) {
    console.error('ORCID Disconnect: Error disconnecting account:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to disconnect ORCID account',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle DELETE requests as well
export async function DELETE(request: NextRequest) {
  return POST(request);
}