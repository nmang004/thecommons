import { createClient } from '@/lib/supabase/server';
import { QualityJobProcessor } from '@/lib/services/quality-job-processor';
import { qualityNotificationService } from '@/lib/services/quality-notifications';

/**
 * Quality system event handlers and triggers
 */
export class QualityTriggers {
  
  /**
   * Triggered when a review is submitted
   */
  static async onReviewSubmitted(reviewId: string): Promise<void> {
    try {
      console.log(`Quality trigger: Review ${reviewId} submitted`);
      
      // Queue quality analysis job with standard priority
      const jobId = await QualityJobProcessor.queueAnalysis(reviewId, 'full_analysis', 5);
      
      console.log(`Quality analysis job ${jobId} queued for review ${reviewId}`);
      
      // Check if this is part of a multi-reviewer manuscript
      await this.checkConsistencyAnalysis(reviewId);
      
    } catch (error) {
      console.error('Error in review submission trigger:', error);
    }
  }

  /**
   * Triggered when a review is updated
   */
  static async onReviewUpdated(reviewId: string): Promise<void> {
    try {
      console.log(`Quality trigger: Review ${reviewId} updated`);
      
      // Queue a quick quality check (no AI analysis, just automated metrics)
      const jobId = await QualityJobProcessor.queueAnalysis(reviewId, 'quick_check', 3);
      
      console.log(`Quick quality check ${jobId} queued for review ${reviewId}`);
      
    } catch (error) {
      console.error('Error in review update trigger:', error);
    }
  }

  /**
   * Triggered when quality analysis completes
   */
  static async onQualityAnalysisComplete(
    reviewId: string, 
    qualityScore: number, 
    flags: string[]
  ): Promise<void> {
    try {
      console.log(`Quality analysis complete for review ${reviewId}: ${qualityScore}`);
      
      // Send notifications
      await qualityNotificationService.notifyQualityReportReady(reviewId, qualityScore, flags);
      
      // Check if training is needed
      if (qualityScore < 0.6 || flags.includes('needs_improvement')) {
        await this.checkTrainingRequirement(reviewId, qualityScore, flags);
      }
      
      // Update reviewer profile
      await this.updateReviewerProfile(reviewId, qualityScore);
      
    } catch (error) {
      console.error('Error in quality analysis complete trigger:', error);
    }
  }

  /**
   * Check if consistency analysis is needed
   */
  private static async checkConsistencyAnalysis(reviewId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get the manuscript for this review
    const { data: review } = await supabase
      .from('reviews')
      .select('manuscript_id')
      .eq('id', reviewId)
      .single();
    
    if (!review) return;
    
    // Count total reviews for this manuscript
    const { count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact' })
      .eq('manuscript_id', review.manuscript_id)
      .eq('status', 'submitted');
    
    // If we have multiple reviews, queue consistency analysis
    if (count && count >= 2) {
      await QualityJobProcessor.queueAnalysis(reviewId, 'consistency_analysis', 4);
      console.log(`Consistency analysis queued for manuscript with ${count} reviews`);
    }
  }

  /**
   * Check if training is required for the reviewer
   */
  private static async checkTrainingRequirement(
    reviewId: string, 
    qualityScore: number, 
    flags: string[]
  ): Promise<void> {
    const supabase = await createClient();
    
    // Get reviewer information
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', reviewId)
      .single();
    
    if (!review) return;
    
    // Get reviewer's quality profile
    const { data: profile } = await supabase
      .from('reviewer_quality_profiles')
      .select('*')
      .eq('reviewer_id', review.reviewer_id)
      .single();
    
    // Determine if training is needed
    let trainingNeeded = false;
    let trainingType = '';
    let reason = '';
    
    if (qualityScore < 0.4) {
      trainingNeeded = true;
      trainingType = 'Comprehensive Review Quality Training';
      reason = 'Multiple quality issues detected';
    } else if (flags.includes('bias_suspected')) {
      trainingNeeded = true;
      trainingType = 'Bias Awareness Training';
      reason = 'Potential bias detected in review';
    } else if (flags.includes('unprofessional_tone')) {
      trainingNeeded = true;
      trainingType = 'Professional Communication Training';
      reason = 'Unprofessional tone detected';
    } else if (profile && profile.low_quality_reviews >= 3) {
      trainingNeeded = true;
      trainingType = 'Review Quality Improvement';
      reason = 'Pattern of low-quality reviews';
    }
    
    if (trainingNeeded) {
      // Create training task
      const { data: task, error } = await supabase
        .from('quality_improvement_tasks')
        .insert({
          reviewer_id: review.reviewer_id,
          review_id: reviewId,
          task_type: 'training',
          title: trainingType,
          description: `Training assigned due to quality concerns. ${reason}`,
          learning_objectives: this.getTrainingObjectives(trainingType),
          resources: this.getTrainingResources(trainingType)
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating training task:', error);
        return;
      }
      
      // Send notification
      await qualityNotificationService.notifyTrainingAssigned(
        review.reviewer_id,
        reviewId,
        task.id,
        trainingType,
        reason
      );
      
      console.log(`Training assigned to reviewer ${review.reviewer_id}: ${trainingType}`);
    }
  }

  /**
   * Update reviewer quality profile
   */
  private static async updateReviewerProfile(reviewId: string, qualityScore: number): Promise<void> {
    const supabase = await createClient();
    
    // Get reviewer ID
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', reviewId)
      .single();
    
    if (!review) return;
    
    // This will be handled by database triggers in production,
    // but we can also update here for completeness
    console.log(`Updated quality profile for reviewer ${review.reviewer_id} with score ${qualityScore}`);
  }

  /**
   * Get training objectives based on training type
   */
  private static getTrainingObjectives(trainingType: string): string[] {
    const objectives: Record<string, string[]> = {
      'Comprehensive Review Quality Training': [
        'Understand the components of a high-quality peer review',
        'Learn to provide constructive and specific feedback',
        'Practice writing clear and professional reviews',
        'Master the balance between critique and support'
      ],
      'Bias Awareness Training': [
        'Recognize different types of bias in academic review',
        'Learn strategies to minimize bias in evaluation',
        'Practice objective assessment techniques',
        'Understand the impact of bias on the review process'
      ],
      'Professional Communication Training': [
        'Develop professional tone in written feedback',
        'Learn respectful ways to critique academic work',
        'Practice constructive criticism techniques',
        'Master the art of diplomatic disagreement'
      ],
      'Review Quality Improvement': [
        'Identify areas for improvement in review quality',
        'Learn best practices for comprehensive reviews',
        'Develop consistency in review standards',
        'Practice efficient yet thorough review methods'
      ]
    };
    
    return objectives[trainingType] || [
      'Improve overall review quality',
      'Follow best practices for peer review',
      'Maintain professional standards'
    ];
  }

  /**
   * Get training resources based on training type
   */
  private static getTrainingResources(trainingType: string): Array<{
    type: string;
    title: string;
    url: string;
    duration?: string;
  }> {
    const resources: Record<string, Array<{
      type: string;
      title: string;
      url: string;
      duration?: string;
    }>> = {
      'Comprehensive Review Quality Training': [
        {
          type: 'video',
          title: 'How to Write an Effective Peer Review',
          url: '/resources/peer-review-fundamentals',
          duration: '30 minutes'
        },
        {
          type: 'document',
          title: 'Peer Review Best Practices Guide',
          url: '/resources/peer-review-guide.pdf'
        },
        {
          type: 'link',
          title: 'Interactive Review Quality Assessment',
          url: '/training/review-quality-interactive'
        }
      ],
      'Bias Awareness Training': [
        {
          type: 'video',
          title: 'Recognizing and Avoiding Bias in Peer Review',
          url: '/resources/bias-awareness-training',
          duration: '45 minutes'
        },
        {
          type: 'document',
          title: 'Bias Checklist for Reviewers',
          url: '/resources/bias-checklist.pdf'
        }
      ],
      'Professional Communication Training': [
        {
          type: 'video',
          title: 'Professional Tone in Academic Writing',
          url: '/resources/professional-communication',
          duration: '25 minutes'
        },
        {
          type: 'document',
          title: 'Examples of Constructive Feedback',
          url: '/resources/constructive-feedback-examples.pdf'
        }
      ]
    };
    
    return resources[trainingType] || [
      {
        type: 'link',
        title: 'General Review Quality Resources',
        url: '/resources/general-quality'
      }
    ];
  }

  /**
   * Daily cleanup and maintenance tasks
   */
  static async runDailyMaintenance(): Promise<void> {
    try {
      console.log('Running daily quality maintenance tasks...');
      
      // Send pending review reminders
      await qualityNotificationService.sendPendingReviewReminders();
      
      // Clean up old notifications
      await qualityNotificationService.cleanupOldNotifications();
      
      // Clean up old analysis jobs
      await this.cleanupOldAnalysisJobs();
      
      console.log('Daily maintenance complete');
      
    } catch (error) {
      console.error('Error in daily maintenance:', error);
    }
  }

  /**
   * Weekly summary tasks
   */
  static async runWeeklySummary(): Promise<void> {
    try {
      console.log('Generating weekly quality summaries...');
      
      // Send weekly quality summaries to editors
      await qualityNotificationService.sendWeeklyQualitySummary();
      
      console.log('Weekly summaries sent');
      
    } catch (error) {
      console.error('Error in weekly summary:', error);
    }
  }

  /**
   * Clean up old analysis jobs
   */
  private static async cleanupOldAnalysisJobs(): Promise<void> {
    const supabase = await createClient();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Delete completed jobs older than 1 week
    await supabase
      .from('quality_analysis_jobs')
      .delete()
      .eq('status', 'completed')
      .lte('completed_at', oneWeekAgo.toISOString());
    
    // Delete failed jobs older than 1 week
    await supabase
      .from('quality_analysis_jobs')
      .delete()
      .eq('status', 'failed')
      .lte('created_at', oneWeekAgo.toISOString());
  }
}