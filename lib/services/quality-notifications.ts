import { createClient } from '@/lib/supabase/server';
import { QualityNotification } from '@/lib/types/quality';

export class QualityNotificationService {
  private supabase: any;

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await createClient();
  }

  /**
   * Send notification when quality analysis is complete
   */
  async notifyQualityReportReady(
    reviewId: string,
    qualityScore: number,
    flags: string[]
  ): Promise<void> {
    await this.initializeSupabase();

    // Get review and manuscript details
    const { data: review } = await this.supabase
      .from('reviews')
      .select(`
        id,
        reviewer_id,
        manuscripts (
          id,
          title,
          handling_editor_id,
          authors
        )
      `)
      .eq('id', reviewId)
      .single();

    if (!review) return;

    const notifications: Omit<QualityNotification, 'created_at'>[] = [];

    // Notify handling editor
    if (review.manuscripts?.handling_editor_id) {
      notifications.push({
        type: 'quality_report_ready',
        recipient_id: review.manuscripts.handling_editor_id,
        review_id: reviewId,
        manuscript_id: review.manuscripts.id,
        message: `Quality analysis complete for review of "${review.manuscripts.title}". Score: ${Math.round(qualityScore * 100)}%`,
        action_url: `/dashboard/editor/reviews/${reviewId}/quality`,
        priority: flags.length > 0 ? 'high' : 'medium'
      });
    }

    // Notify reviewer if excellent quality
    if (qualityScore >= 0.9 || flags.includes('excellent_quality')) {
      notifications.push({
        type: 'excellence_achieved',
        recipient_id: review.reviewer_id,
        review_id: reviewId,
        message: 'Congratulations! Your review has been rated as excellent quality.',
        priority: 'low'
      });
    }

    // Create notifications
    await this.createNotifications(notifications);
  }

  /**
   * Send urgent notification for flagged reviews
   */
  async notifyReviewFlagged(
    reviewId: string,
    flags: string[],
    _flaggedByUserId: string,
    reason?: string
  ): Promise<void> {
    await this.initializeSupabase();

    // Get review details
    const { data: review } = await this.supabase
      .from('reviews')
      .select(`
        id,
        reviewer_id,
        manuscripts (
          id,
          title,
          handling_editor_id
        )
      `)
      .eq('id', reviewId)
      .single();

    if (!review) return;

    const criticalFlags = ['bias_suspected', 'unprofessional_tone', 'ethical_concern'];
    const hasCriticalFlag = flags.some(f => criticalFlags.includes(f));

    // Notify handling editor
    if (review.manuscripts?.handling_editor_id) {
      await this.createNotifications([{
        type: 'review_flagged',
        recipient_id: review.manuscripts.handling_editor_id,
        review_id: reviewId,
        manuscript_id: review.manuscripts.id,
        message: `Review flagged for "${review.manuscripts.title}": ${flags.join(', ')}${reason ? `. Reason: ${reason}` : ''}`,
        action_url: `/dashboard/editor/reviews/${reviewId}`,
        priority: hasCriticalFlag ? 'high' : 'medium'
      }]);
    }

    // If critical, also notify admin
    if (hasCriticalFlag) {
      // Get admin users
      const { data: admins } = await this.supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        const adminNotifications = admins.map((admin: any) => ({
          type: 'review_flagged' as const,
          recipient_id: admin.id,
          review_id: reviewId,
          manuscript_id: review.manuscripts.id,
          message: `URGENT: Critical review flag detected - ${flags.join(', ')}`,
          action_url: `/dashboard/admin/reviews/${reviewId}`,
          priority: 'high' as const
        }));

        await this.createNotifications(adminNotifications);
      }
    }
  }

  /**
   * Send notification when training is assigned
   */
  async notifyTrainingAssigned(
    reviewerId: string,
    reviewId: string,
    taskId: string,
    trainingType: string,
    reason: string
  ): Promise<void> {
    await this.initializeSupabase();

    await this.createNotifications([{
      type: 'training_assigned',
      recipient_id: reviewerId,
      review_id: reviewId,
      message: `Training module assigned: ${trainingType}. Reason: ${reason}`,
      action_url: `/dashboard/reviewer/training/${taskId}`,
      priority: 'medium'
    }]);
  }

  /**
   * Send weekly quality summary to editors
   */
  async sendWeeklyQualitySummary(): Promise<void> {
    await this.initializeSupabase();

    // Get all editors
    const { data: editors } = await this.supabase
      .from('users')
      .select('id, email, full_name')
      .eq('role', 'editor');

    if (!editors) return;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get quality stats for the past week
    const { data: qualityStats } = await this.supabase
      .from('review_quality_reports')
      .select(`
        quality_score,
        flags,
        status,
        reviews (
          manuscripts (
            handling_editor_id
          )
        )
      `)
      .gte('created_at', oneWeekAgo.toISOString());

    if (!qualityStats) return;

    // Create summary for each editor
    for (const editor of editors) {
      const editorReports = qualityStats.filter(
        (report: any) => report.reviews?.manuscripts?.handling_editor_id === editor.id
      );

      if (editorReports.length === 0) continue;

      const avgQuality = editorReports.reduce((sum: number, report: any) => 
        sum + (report.quality_score || 0), 0
      ) / editorReports.length;

      const flaggedCount = editorReports.filter(
        (report: any) => report.flags && report.flags.length > 0
      ).length;

      const pendingCount = editorReports.filter(
        (report: any) => report.status === 'pending_editor_review'
      ).length;

      const summaryMessage = `Weekly Quality Summary: ${editorReports.length} reviews analyzed, ${Math.round(avgQuality * 100)}% avg quality, ${flaggedCount} flagged, ${pendingCount} awaiting your review.`;

      await this.createNotifications([{
        type: 'quality_report_ready',
        recipient_id: editor.id,
        message: summaryMessage,
        action_url: '/dashboard/editor/quality',
        priority: 'low'
      }]);
    }
  }

  /**
   * Send notification for consistency issues
   */
  async notifyConsistencyIssues(
    manuscriptId: string,
    consistencyScore: number,
    divergentAreas: string[]
  ): Promise<void> {
    await this.initializeSupabase();

    if (consistencyScore >= 0.7) return; // Only notify for low consistency

    // Get manuscript details
    const { data: manuscript } = await this.supabase
      .from('manuscripts')
      .select(`
        id,
        title,
        handling_editor_id,
        reviews (
          reviewer_id
        )
      `)
      .eq('id', manuscriptId)
      .single();

    if (!manuscript?.handling_editor_id) return;

    const message = `Low reviewer consistency detected for "${manuscript.title}". Score: ${Math.round(consistencyScore * 100)}%. Areas of disagreement: ${divergentAreas.join(', ')}.`;

    await this.createNotifications([{
      type: 'review_flagged',
      recipient_id: manuscript.handling_editor_id,
      manuscript_id: manuscriptId,
      message,
      action_url: `/dashboard/editor/manuscripts/${manuscriptId}/reviews`,
      priority: 'medium'
    }]);
  }

  /**
   * Send reminders for pending editor reviews
   */
  async sendPendingReviewReminders(): Promise<void> {
    await this.initializeSupabase();

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get quality reports pending editor review for more than 3 days
    const { data: pendingReports } = await this.supabase
      .from('review_quality_reports')
      .select(`
        id,
        review_id,
        created_at,
        reviews (
          manuscripts (
            id,
            title,
            handling_editor_id
          )
        )
      `)
      .eq('status', 'pending_editor_review')
      .lte('created_at', threeDaysAgo.toISOString());

    if (!pendingReports) return;

    // Group by editor
    const editorGroups: Record<string, any[]> = {};
    
    for (const report of pendingReports) {
      const editorId = report.reviews?.manuscripts?.handling_editor_id;
      if (editorId) {
        if (!editorGroups[editorId]) editorGroups[editorId] = [];
        editorGroups[editorId].push(report);
      }
    }

    // Send reminders to each editor
    for (const [editorId, reports] of Object.entries(editorGroups)) {
      const message = `You have ${reports.length} quality report${reports.length > 1 ? 's' : ''} pending your review (${reports.length > 3 ? 'more than 3 days old' : 'overdue'}).`;

      await this.createNotifications([{
        type: 'quality_report_ready',
        recipient_id: editorId,
        message,
        action_url: '/dashboard/editor/quality?filter=pending',
        priority: 'medium'
      }]);
    }
  }

  /**
   * Create multiple notifications
   */
  private async createNotifications(
    notifications: Omit<QualityNotification, 'created_at'>[]
  ): Promise<void> {
    if (notifications.length === 0) return;

    const notificationsWithTimestamp = notifications.map(notification => ({
      ...notification,
      created_at: new Date().toISOString()
    }));

    const { error } = await this.supabase
      .from('notifications')
      .insert(notificationsWithTimestamp);

    if (error) {
      console.error('Error creating notifications:', error);
    }

    // Also send real-time notifications if enabled
    await this.sendRealTimeNotifications(notificationsWithTimestamp);
  }

  /**
   * Send real-time notifications via WebSocket or Server-Sent Events
   */
  private async sendRealTimeNotifications(
    notifications: QualityNotification[]
  ): Promise<void> {
    // Implementation would depend on your real-time infrastructure
    // This could be WebSockets, Server-Sent Events, or push notifications
    
    for (const notification of notifications) {
      // Example: Send via WebSocket
      if (typeof window !== 'undefined' && (window as any).notificationWebSocket) {
        (window as any).notificationWebSocket.send(JSON.stringify({
          type: 'quality_notification',
          data: notification
        }));
      }

      // Example: Send push notification for high priority alerts
      if (notification.priority === 'high' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('Quality Alert', {
            body: notification.message,
            icon: '/icon-notification.png',
            badge: '/badge-icon.png',
            data: { url: notification.action_url }
          });
        } catch (error) {
          console.error('Push notification error:', error);
        }
      }
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.initializeSupabase();

    await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<QualityNotification[]> {
    await this.initializeSupabase();

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<void> {
    await this.initializeSupabase();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.supabase
      .from('notifications')
      .delete()
      .lte('created_at', thirtyDaysAgo.toISOString());
  }
}

// Export singleton instance
export const qualityNotificationService = new QualityNotificationService();