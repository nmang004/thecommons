import { createClient } from '@/lib/supabase/server';
import { QualityAnalysisService } from './quality-analysis';
import { QualityAnalysisJob } from '@/lib/types/quality';
import Redis from 'ioredis';

// Initialize Redis for job queue
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

export class QualityJobProcessor {
  private supabase: any;
  private qualityService: QualityAnalysisService;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.qualityService = new QualityAnalysisService();
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await createClient();
  }

  /**
   * Start the job processor
   */
  async start() {
    if (this.isProcessing) {
      console.log('Quality job processor already running');
      return;
    }

    this.isProcessing = true;
    console.log('Starting quality job processor...');

    // Process jobs every 10 seconds
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 10000);

    // Process immediately on start
    this.processNextJob();
  }

  /**
   * Stop the job processor
   */
  stop() {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('Quality job processor stopped');
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob() {
    if (!this.isProcessing) return;

    await this.initializeSupabase();

    try {
      // Get next job from queue
      const job = await this.getNextJob();
      if (!job) {
        return; // No jobs to process
      }

      console.log(`Processing quality job ${job.id} for review ${job.review_id}`);

      // Update job status to processing
      await this.updateJobStatus(job.id, 'processing');

      // Process the job based on type
      const result = await this.executeJob(job);

      // Update job as completed
      await this.updateJobStatus(job.id, 'completed', result);

      // Send notifications if needed
      await this.sendNotifications(job, result);

      console.log(`Completed quality job ${job.id}`);
    } catch (error) {
      console.error('Error processing quality job:', error);
    }
  }

  /**
   * Get the next job from the queue
   */
  private async getNextJob(): Promise<QualityAnalysisJob | null> {
    const { data, error } = await this.supabase
      .from('quality_analysis_jobs')
      .select('*')
      .eq('status', 'queued')
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Execute a quality analysis job
   */
  private async executeJob(job: QualityAnalysisJob): Promise<any> {
    const startTime = Date.now();

    try {
      let result;

      switch (job.job_type) {
        case 'full_analysis':
          result = await this.qualityService.analyzeReview({
            review_id: job.review_id,
            analysis_type: 'full',
            include_ai_analysis: true,
            include_consistency_check: true
          });
          break;

        case 'quick_check':
          result = await this.qualityService.analyzeReview({
            review_id: job.review_id,
            analysis_type: 'quick',
            include_ai_analysis: false,
            include_consistency_check: false
          });
          break;

        case 'consistency_analysis':
          result = await this.performConsistencyAnalysis(job.review_id);
          break;

        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      const processingTime = Date.now() - startTime;

      // Update job with processing time
      await this.supabase
        .from('quality_analysis_jobs')
        .update({
          processing_time_ms: processingTime
        })
        .eq('id', job.id);

      return result;
    } catch (error) {
      // Handle job failure
      await this.handleJobFailure(job, error);
      throw error;
    }
  }

  /**
   * Perform consistency analysis across reviewers
   */
  private async performConsistencyAnalysis(reviewId: string): Promise<any> {
    // Get the review and its manuscript
    const { data: review } = await this.supabase
      .from('reviews')
      .select('*, manuscripts(*)')
      .eq('id', reviewId)
      .single();

    if (!review) {
      throw new Error('Review not found');
    }

    // Get all reviews for the same manuscript
    const { data: allReviews } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('manuscript_id', review.manuscript_id)
      .eq('status', 'submitted');

    if (!allReviews || allReviews.length < 2) {
      return { message: 'Not enough reviews for consistency analysis' };
    }

    // Calculate consistency metrics
    const recommendations = allReviews.map((r: any) => r.recommendation);
    const scores = allReviews.map((r: any) => r.overall_score).filter((s: any) => s != null);

    // Calculate variance in recommendations
    const uniqueRecs = new Set(recommendations);
    const recommendationVariance = (uniqueRecs.size - 1) / (recommendations.length - 1);

    // Calculate score variance
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    const scoreVariance = scores.reduce((sum: number, score: number) => {
      return sum + Math.pow(score - avgScore, 2);
    }, 0) / scores.length;

    // Calculate pairwise agreement
    const agreementMatrix: any = {};
    for (let i = 0; i < allReviews.length; i++) {
      for (let j = i + 1; j < allReviews.length; j++) {
        const reviewer1 = allReviews[i].reviewer_id;
        const reviewer2 = allReviews[j].reviewer_id;
        const agreement = this.calculateAgreement(allReviews[i], allReviews[j]);
        
        if (!agreementMatrix[reviewer1]) agreementMatrix[reviewer1] = {};
        agreementMatrix[reviewer1][reviewer2] = agreement;
      }
    }

    // Identify areas of agreement and disagreement
    const divergentAreas = this.identifyDivergentAreas(allReviews);
    const consensusAreas = this.identifyConsensusAreas(allReviews);

    // Store consistency analysis
    const consistencyData = {
      manuscript_id: review.manuscript_id,
      overall_consistency: 1 - recommendationVariance,
      recommendation_variance: recommendationVariance,
      score_variance: scoreVariance,
      reviewer_agreement_matrix: agreementMatrix,
      divergent_areas: divergentAreas,
      consensus_areas: consensusAreas,
      inter_rater_reliability: this.calculateInterRaterReliability(allReviews),
      cohens_kappa: this.calculateCohensKappa(allReviews)
    };

    const { data, error } = await this.supabase
      .from('review_consistency_scores')
      .upsert(consistencyData, {
        onConflict: 'manuscript_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Calculate agreement between two reviews
   */
  private calculateAgreement(review1: any, review2: any): number {
    let agreementScore = 0;
    let totalFactors = 0;

    // Compare recommendations
    if (review1.recommendation === review2.recommendation) {
      agreementScore += 1;
    } else if (
      (review1.recommendation === 'accept' && review2.recommendation === 'minor_revisions') ||
      (review1.recommendation === 'minor_revisions' && review2.recommendation === 'accept')
    ) {
      agreementScore += 0.7;
    } else if (
      (review1.recommendation === 'major_revisions' && review2.recommendation === 'minor_revisions') ||
      (review1.recommendation === 'minor_revisions' && review2.recommendation === 'major_revisions')
    ) {
      agreementScore += 0.5;
    }
    totalFactors++;

    // Compare overall scores if available
    if (review1.overall_score != null && review2.overall_score != null) {
      const scoreDiff = Math.abs(review1.overall_score - review2.overall_score);
      agreementScore += Math.max(0, 1 - scoreDiff / 10);
      totalFactors++;
    }

    return totalFactors > 0 ? agreementScore / totalFactors : 0;
  }

  /**
   * Identify areas where reviewers disagree
   */
  private identifyDivergentAreas(reviews: any[]): string[] {
    const areas: string[] = [];

    // Check for disagreement in recommendations
    const recommendations = new Set(reviews.map(r => r.recommendation));
    if (recommendations.size > 2) {
      areas.push('Overall recommendation');
    }

    // Check for large variance in scores
    const scores = reviews.map(r => r.overall_score).filter(s => s != null);
    if (scores.length > 1) {
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      if (maxScore - minScore > 3) {
        areas.push('Overall quality assessment');
      }
    }

    // Analyze sentiment differences in text fields
    const sentiments = reviews.map(r => this.analyzeSentiment(r.detailed_comments || ''));
    const uniqueSentiments = new Set(sentiments);
    if (uniqueSentiments.size > 1 && uniqueSentiments.has('positive') && uniqueSentiments.has('negative')) {
      areas.push('Tone and perspective');
    }

    return areas;
  }

  /**
   * Identify areas where reviewers agree
   */
  private identifyConsensusAreas(reviews: any[]): string[] {
    const areas: string[] = [];

    // Check for agreement in recommendations
    const recommendations = new Set(reviews.map(r => r.recommendation));
    if (recommendations.size === 1) {
      areas.push('Overall recommendation');
    }

    // Check for similar scores
    const scores = reviews.map(r => r.overall_score).filter(s => s != null);
    if (scores.length > 1) {
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      if (maxScore - minScore <= 1) {
        areas.push('Overall quality assessment');
      }
    }

    return areas;
  }

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['excellent', 'strong', 'good', 'well', 'clear', 'innovative'];
    const negativeWords = ['poor', 'weak', 'unclear', 'problematic', 'insufficient', 'lacking'];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount + 2) return 'positive';
    if (negativeCount > positiveCount + 2) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate inter-rater reliability
   */
  private calculateInterRaterReliability(reviews: any[]): number {
    // Simplified IRR calculation based on recommendation agreement
    const recommendations = reviews.map(r => r.recommendation);
    const uniqueRecs = new Set(recommendations);
    
    if (uniqueRecs.size === 1) return 1.0;
    if (uniqueRecs.size === recommendations.length) return 0.0;
    
    return 1 - (uniqueRecs.size - 1) / (recommendations.length - 1);
  }

  /**
   * Calculate Cohen's Kappa for agreement
   */
  private calculateCohensKappa(reviews: any[]): number {
    // Simplified Cohen's Kappa for recommendation agreement
    // This is a placeholder - real implementation would be more complex
    return this.calculateInterRaterReliability(reviews) * 0.8;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: string, result?: any) {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'processing') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      if (result) {
        updates.result = result;
      }
    }

    await this.supabase
      .from('quality_analysis_jobs')
      .update(updates)
      .eq('id', jobId);
  }

  /**
   * Handle job failure
   */
  private async handleJobFailure(job: QualityAnalysisJob, error: any) {
    const errorMessage = error.message || 'Unknown error';
    const retryCount = (job.retry_count || 0) + 1;

    if (retryCount < (job.max_retries || 3)) {
      // Retry the job
      await this.supabase
        .from('quality_analysis_jobs')
        .update({
          status: 'queued',
          retry_count: retryCount,
          error_message: errorMessage,
          scheduled_for: new Date(Date.now() + 60000 * retryCount).toISOString() // Exponential backoff
        })
        .eq('id', job.id);
    } else {
      // Mark as failed
      await this.supabase
        .from('quality_analysis_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          error_details: { error: error.toString(), stack: error.stack }
        })
        .eq('id', job.id);
    }
  }

  /**
   * Send notifications based on job results
   */
  private async sendNotifications(job: QualityAnalysisJob, result: any) {
    // Get the review and manuscript details
    const { data: review } = await this.supabase
      .from('reviews')
      .select(`
        *,
        manuscripts (
          id,
          title,
          handling_editor_id
        )
      `)
      .eq('id', job.review_id)
      .single();

    if (!review) return;

    // Notify handling editor if quality report is ready
    if (result.quality_score !== undefined && review.manuscripts?.handling_editor_id) {
      await this.createNotification({
        user_id: review.manuscripts.handling_editor_id,
        type: 'quality_report_ready',
        title: 'Review Quality Report Ready',
        message: `Quality analysis complete for review of "${review.manuscripts.title}"`,
        data: {
          review_id: job.review_id,
          manuscript_id: review.manuscript_id,
          quality_score: result.quality_score
        }
      });
    }

    // Notify if review is flagged
    if (result.flags && result.flags.length > 0) {
      const criticalFlags = ['bias_suspected', 'unprofessional_tone', 'inconsistent_recommendation'];
      const hasCriticalFlag = result.flags.some((f: string) => criticalFlags.includes(f));

      if (hasCriticalFlag && review.manuscripts?.handling_editor_id) {
        await this.createNotification({
          user_id: review.manuscripts.handling_editor_id,
          type: 'review_flagged',
          title: 'Review Flagged for Attention',
          message: `Review requires attention: ${result.flags.join(', ')}`,
          data: {
            review_id: job.review_id,
            manuscript_id: review.manuscript_id,
            flags: result.flags
          }
        });
      }
    }

    // Notify reviewer if quality is excellent
    if (result.flags && result.flags.includes('excellent_quality')) {
      await this.createNotification({
        user_id: review.reviewer_id,
        type: 'excellence_achieved',
        title: 'Excellent Review Quality!',
        message: 'Your review has been rated as excellent quality. Thank you for your thorough work!',
        data: {
          review_id: job.review_id,
          quality_score: result.quality_score
        }
      });
    }
  }

  /**
   * Create a notification
   */
  private async createNotification(notification: any) {
    await this.supabase
      .from('notifications')
      .insert(notification);
  }

  /**
   * Queue a new quality analysis job
   */
  static async queueAnalysis(
    reviewId: string, 
    jobType: 'full_analysis' | 'quick_check' | 'consistency_analysis' = 'full_analysis',
    priority: number = 5
  ): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('quality_analysis_jobs')
      .insert({
        review_id: reviewId,
        job_type: jobType,
        status: 'queued',
        priority
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    // Also add to Redis queue for real-time processing
    await redis.lpush('quality_jobs', JSON.stringify({
      job_id: data.id,
      review_id: reviewId,
      job_type: jobType,
      priority
    }));

    return data.id;
  }
}