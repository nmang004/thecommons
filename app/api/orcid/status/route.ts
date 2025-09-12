/**
 * ORCID Connection Status Route
 * Returns the current ORCID connection status for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrcidConnectionStatus } from '@/lib/orcid/oauth';
import { requireAuth } from '@/lib/orcid/auth-helper';

export async function GET(_request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Get ORCID connection status
    const status = await getOrcidConnectionStatus(user.id);

    return NextResponse.json({
      success: true,
      status: {
        is_connected: status.isConnected,
        orcid_id: status.orcidId,
        connected_at: status.connectedAt?.toISOString(),
        last_sync_at: status.lastSyncAt?.toISOString(),
        scope: status.scope,
        has_valid_token: status.hasValidToken,
        needs_reauth: status.needsReauth
      }
    });

  } catch (error) {
    console.error('ORCID Status: Error getting connection status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get ORCID connection status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}