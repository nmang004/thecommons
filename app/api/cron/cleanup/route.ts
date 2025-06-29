import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    const timestamp = new Date().toISOString();
    const cleanupResults = [];

    // 1. Clean up old activity logs (older than 1 year)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activityLogsDeleted } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', oneYearAgo);
    
    cleanupResults.push({
      type: 'activity_logs',
      deleted: activityLogsDeleted || 0,
      cutoff: oneYearAgo
    });

    // 2. Clean up read notifications (older than 6 months)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const { count: notificationsDeleted } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true)
      .lt('created_at', sixMonthsAgo);
    
    cleanupResults.push({
      type: 'read_notifications',
      deleted: notificationsDeleted || 0,
      cutoff: sixMonthsAgo
    });

    // 3. Clean up expired review assignments (older than 3 months)
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: expiredAssignmentsDeleted } = await supabase
      .from('review_assignments')
      .delete()
      .eq('status', 'expired')
      .lt('created_at', threeMonthsAgo);
    
    cleanupResults.push({
      type: 'expired_review_assignments',
      deleted: expiredAssignmentsDeleted || 0,
      cutoff: threeMonthsAgo
    });

    // 4. Clean up orphaned manuscript files (files without corresponding manuscripts)
    const { data: orphanedFiles } = await supabase
      .from('manuscript_files')
      .select('id')
      .not('manuscript_id', 'in', 
        supabase.from('manuscripts').select('id')
      );

    if (orphanedFiles && orphanedFiles.length > 0) {
      const orphanedFileIds = orphanedFiles.map(f => f.id);
      const { count: orphanedFilesDeleted } = await supabase
        .from('manuscript_files')
        .delete()
        .in('id', orphanedFileIds);
      
      cleanupResults.push({
        type: 'orphaned_manuscript_files',
        deleted: orphanedFilesDeleted || 0
      });
    }

    // 5. Update manuscript statistics
    const { data: manuscripts } = await supabase
      .from('manuscripts')
      .select('id, view_count, download_count')
      .eq('status', 'published');

    if (manuscripts) {
      cleanupResults.push({
        type: 'published_manuscripts_updated',
        count: manuscripts.length
      });
    }

    // Log cleanup completion
    await supabase.from('activity_logs').insert({
      action: 'system_cleanup',
      details: {
        timestamp,
        cleanup_results: cleanupResults,
        type: 'weekly_cleanup'
      }
    });

    return NextResponse.json({
      success: true,
      timestamp,
      cleanup_results: cleanupResults,
      message: 'Cleanup completed successfully'
    });
    
  } catch (error) {
    console.error('Cleanup cron job failed:', error);
    
    // Log the error
    try {
      const supabase = createClient();
      await supabase.from('activity_logs').insert({
        action: 'system_cleanup_failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log cleanup error:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cleanup failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}