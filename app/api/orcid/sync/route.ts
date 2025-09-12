/**
 * ORCID Data Sync Route
 * Synchronizes data between ORCID and local profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrcidAuthState, refreshOrcidTokenIfNeeded } from '@/lib/orcid/oauth';
import { getOrcidClient } from '@/lib/orcid/client';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/orcid/auth-helper';
import { OrcidSyncOptions, OrcidSyncResult } from '@/lib/orcid/types';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Parse sync options
    const body = await request.json();
    const options: OrcidSyncOptions = {
      syncProfile: body.sync_profile !== false, // Default to true
      syncWorks: body.sync_works !== false, // Default to true
      syncEmployments: body.sync_employments !== false, // Default to true
      syncEducations: body.sync_educations !== false, // Default to true
      overwriteLocal: body.overwrite_local === true, // Default to false
      dryRun: body.dry_run === true // Default to false
    };

    // Get ORCID auth state
    const authState = await getOrcidAuthState(user.id);
    
    if (!authState.isAuthenticated) {
      return NextResponse.json(
        { error: 'ORCID account not connected' },
        { status: 400 }
      );
    }

    // Refresh token if needed
    if (authState.isExpired) {
      const refreshResult = await refreshOrcidTokenIfNeeded(user.id);
      if (!refreshResult.success) {
        return NextResponse.json(
          { 
            error: 'ORCID token expired and could not be refreshed',
            message: refreshResult.error
          },
          { status: 401 }
        );
      }
    }

    // Perform sync operations
    const syncResults: OrcidSyncResult[] = [];
    const orcidClient = getOrcidClient();
    const supabase = await createClient();

    // Sync profile data
    if (options.syncProfile && authState.orcidId && authState.accessToken) {
      try {
        const profileResponse = await orcidClient.getPersonProfile(
          authState.orcidId,
          authState.accessToken
        );

        if (profileResponse.success && profileResponse.data) {
          const person = profileResponse.data.person;
          const updateData: any = {};
          let itemsUpdated = 0;

          // Extract name information
          if (person.name) {
            const fullName = [
              person.name['given-names']?.value,
              person.name['family-name']?.value
            ].filter(Boolean).join(' ');
            
            if (fullName && (options.overwriteLocal || !user.full_name)) {
              updateData.full_name = fullName;
              itemsUpdated++;
            }
          }

          // Extract biography
          if (person.biography?.value && (options.overwriteLocal || !user.bio)) {
            updateData.bio = person.biography.value;
            itemsUpdated++;
          }

          // Extract website URLs
          if (person['researcher-urls']?.['researcher-url']) {
            const urls = person['researcher-urls']['researcher-url'];
            const websiteUrl = urls.find(url => 
              url['url-name'].toLowerCase().includes('website') ||
              url['url-name'].toLowerCase().includes('homepage')
            );
            
            if (websiteUrl && (options.overwriteLocal || !user.website_url)) {
              updateData.website_url = websiteUrl.url.value;
              itemsUpdated++;
            }
          }

          // Update profile if not dry run
          if (!options.dryRun && Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                ...updateData,
                orcid_last_sync: new Date().toISOString()
              })
              .eq('id', user.id);

            if (updateError) {
              throw new Error(`Failed to update profile: ${updateError.message}`);
            }
          }

          syncResults.push({
            success: true,
            syncType: 'profile',
            itemsSynced: itemsUpdated,
            data: options.dryRun ? updateData : undefined
          });

        } else {
          syncResults.push({
            success: false,
            syncType: 'profile',
            itemsSynced: 0,
            errors: [profileResponse.error?.['user-message'] || 'Failed to fetch profile']
          });
        }

      } catch (error) {
        syncResults.push({
          success: false,
          syncType: 'profile',
          itemsSynced: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    // Sync works/publications
    if (options.syncWorks && authState.orcidId && authState.accessToken) {
      try {
        const worksResponse = await orcidClient.getWorks(
          authState.orcidId,
          authState.accessToken
        );

        if (worksResponse.success && worksResponse.data) {
          const works = worksResponse.data.group || [];
          let publicationsImported = 0;

          if (!options.dryRun) {
            // Process each work group
            for (const group of works) {
              for (const workSummary of group['work-summary']) {
                // Check if publication already exists
                const { data: existingImport } = await supabase
                  .from('orcid_publication_imports')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('orcid_put_code', workSummary['put-code'].toString())
                  .single();

                if (!existingImport) {
                  // Import new publication
                  const { error: importError } = await supabase
                    .from('orcid_publication_imports')
                    .insert({
                      user_id: user.id,
                      orcid_put_code: workSummary['put-code'].toString(),
                      title: workSummary.title.title.value,
                      journal: workSummary['journal-title']?.value,
                      doi: workSummary['external-ids']?.['external-id']?.find(
                        id => id['external-id-type'] === 'doi'
                      )?.['external-id-value'],
                      publication_date: workSummary['publication-date'] ? 
                        `${workSummary['publication-date'].year?.value || ''}-${
                          workSummary['publication-date'].month?.value || '01'}-${
                          workSummary['publication-date'].day?.value || '01'}` : null,
                      status: 'imported'
                    });

                  if (!importError) {
                    publicationsImported++;
                  }
                }
              }
            }
          }

          syncResults.push({
            success: true,
            syncType: 'publications',
            itemsSynced: options.dryRun ? works.length : publicationsImported,
            data: options.dryRun ? { available_works: works.length } : undefined
          });

        } else {
          syncResults.push({
            success: false,
            syncType: 'publications',
            itemsSynced: 0,
            errors: [worksResponse.error?.['user-message'] || 'Failed to fetch works']
          });
        }

      } catch (error) {
        syncResults.push({
          success: false,
          syncType: 'publications',
          itemsSynced: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    // Log sync operation
    if (!options.dryRun) {
      const totalItemsSynced = syncResults.reduce((sum, result) => sum + result.itemsSynced, 0);
      const hasErrors = syncResults.some(result => !result.success);

      const { error: logError } = await supabase
        .from('orcid_sync_history')
        .insert({
          user_id: user.id,
          sync_type: 'comprehensive',
          items_synced: totalItemsSynced,
          status: hasErrors ? 'partial' : 'success',
          metadata: {
            sync_options: options,
            sync_results: syncResults.map(result => ({
              sync_type: result.syncType,
              success: result.success,
              items_synced: result.itemsSynced,
              errors: result.errors
            }))
          }
        });

      if (logError) {
        console.error('ORCID Sync: Error logging sync operation:', logError);
      }
    }

    return NextResponse.json({
      success: true,
      dry_run: options.dryRun,
      sync_results: syncResults,
      total_items_synced: syncResults.reduce((sum, result) => sum + result.itemsSynced, 0)
    });

  } catch (error) {
    console.error('ORCID Sync: Error during sync operation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync ORCID data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}