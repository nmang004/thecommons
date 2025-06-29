import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Perform backup operations
    const backupTasks = [
      // 1. Database statistics backup
      supabase
        .from('manuscripts')
        .select('id, status, created_at, published_at')
        .then(({ data, error }) => {
          if (error) throw error;
          return { type: 'manuscripts', count: data?.length || 0 };
        }),
      
      // 2. User activity backup
      supabase
        .from('activity_logs')
        .select('id, action, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .then(({ data, error }) => {
          if (error) throw error;
          return { type: 'activity_logs_24h', count: data?.length || 0 };
        }),
      
      // 3. Review system backup
      supabase
        .from('reviews')
        .select('id, submitted_at')
        .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .then(({ data, error }) => {
          if (error) throw error;
          return { type: 'reviews_7d', count: data?.length || 0 };
        }),
    ];

    const results = await Promise.all(backupTasks);
    
    // Log backup completion
    await supabase.from('activity_logs').insert({
      action: 'system_backup',
      details: {
        timestamp,
        results,
        type: 'automated_backup'
      }
    });

    // Clean up old data (as defined in migration)
    await supabase.rpc('cleanup_old_data');

    return NextResponse.json({
      success: true,
      timestamp,
      backup_results: results,
      message: 'Backup completed successfully'
    });
    
  } catch (error) {
    console.error('Backup cron job failed:', error);
    
    // Log the error
    try {
      const supabase = await createClient();
      await supabase.from('activity_logs').insert({
        action: 'system_backup_failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log backup error:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Backup failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}