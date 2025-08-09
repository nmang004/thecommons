import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { 
  ReviewQualityReport, 
  QualityFlag, 
  QualityAnalysisRequest,
  QualityAnalysisResponse,
  AIFeedbackLog,
  BiasWarning
} from '@/lib/types/quality';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class QualityAnalysisService {
  private supabase: any;

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await createClient();
  }

  /**
   * Perform complete quality analysis on a review
   */
  async analyzeReview(request: QualityAnalysisRequest): Promise<QualityAnalysisResponse> {
    await this.initializeSupabase();
    
    // Get the review data
    const { data: review, error: reviewError } = await this.supabase
      .from('reviews')
      .select(`
        *,
        manuscripts (
          id,
          title,
          abstract
        )
      `)
      .eq('id', request.review_id)
      .single();

    if (reviewError || !review) {
      throw new Error('Review not found');
    }

    // Create or get existing quality report
    let report = await this.getOrCreateQualityReport(request.review_id);

    // Perform different types of analysis based on request
    const analysisPromises = [];

    // Always calculate automated metrics
    analysisPromises.push(this.calculateAutomatedMetrics(review));

    // Optionally include AI analysis
    if (request.include_ai_analysis !== false) {
      analysisPromises.push(this.performNLPAnalysis(review));
    }

    // Optionally include consistency check
    if (request.include_consistency_check) {
      analysisPromises.push(this.analyzeConsistency(review));
    }

    const [automatedMetrics, nlpAnalysis, consistencyMetrics] = await Promise.all(analysisPromises);

    // Update the quality report
    const updatedReport = await this.updateQualityReport(report.id, {
      automated_metrics: automatedMetrics,
      nlp_analysis: nlpAnalysis || report.nlp_analysis,
      consistency_metrics: consistencyMetrics || report.consistency_metrics,
      status: 'analysis_complete',
      analysis_completed_at: new Date().toISOString()
    });

    // Calculate overall quality score
    const qualityScore = await this.calculateQualityScore(updatedReport);

    // Determine flags based on analysis
    const flags = this.determineQualityFlags(updatedReport, qualityScore);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(updatedReport, flags);

    return {
      report_id: updatedReport.id,
      review_id: request.review_id,
      quality_score: qualityScore,
      status: updatedReport.status,
      metrics: {
        automated: updatedReport.automated_metrics,
        nlp: updatedReport.nlp_analysis,
        consistency: updatedReport.consistency_metrics
      },
      flags,
      recommendations
    };
  }

  /**
   * Calculate automated metrics (completeness, timeliness, depth)
   */
  private async calculateAutomatedMetrics(review: any) {
    const metrics: any = {};

    // Completeness: Check if all required fields are filled
    const requiredFields = ['summary', 'strengths', 'weaknesses', 'detailed_comments', 'recommendation'];
    let filledFields = 0;
    let totalLength = 0;

    for (const field of requiredFields) {
      if (review[field] && review[field].trim().length > 10) {
        filledFields++;
        totalLength += review[field].length;
      }
    }

    metrics.completeness = filledFields / requiredFields.length;

    // Depth: Based on total word count
    const wordCount = totalLength / 5; // Rough estimate: 5 chars per word
    metrics.depth = Math.min(wordCount / 1000, 1.0); // Normalize to 0-1 (1000 words = perfect)

    // Timeliness: Based on submission relative to deadline
    if (review.deadline && review.submitted_at) {
      const deadline = new Date(review.deadline);
      const submitted = new Date(review.submitted_at);
      const daysEarly = (deadline.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysEarly >= 0) {
        metrics.timeliness = Math.min(1.0, 0.7 + (daysEarly / 7) * 0.3); // Early submission gets bonus
      } else {
        metrics.timeliness = Math.max(0, 0.7 + (daysEarly / 7) * 0.3); // Late submission penalty
      }
    } else {
      metrics.timeliness = 0.7; // Default if no deadline
    }

    // Specificity: Check for specific examples and citations
    const specificityMarkers = [
      'for example', 'specifically', 'page', 'line', 'section', 
      'figure', 'table', 'equation', 'citation', 'reference'
    ];
    
    let specificityCount = 0;
    const reviewText = `${review.summary} ${review.strengths} ${review.weaknesses} ${review.detailed_comments}`.toLowerCase();
    
    for (const marker of specificityMarkers) {
      specificityCount += (reviewText.match(new RegExp(marker, 'g')) || []).length;
    }
    
    metrics.specificity = Math.min(specificityCount / 20, 1.0); // Normalize to 0-1

    return metrics;
  }

  /**
   * Perform NLP analysis using OpenAI
   */
  private async performNLPAnalysis(review: any) {
    try {
      const reviewText = `
        Summary: ${review.summary}
        Strengths: ${review.strengths}
        Weaknesses: ${review.weaknesses}
        Detailed Comments: ${review.detailed_comments}
        Recommendation: ${review.recommendation}
      `;

      const prompt = `
        Analyze the following peer review for quality metrics. Return a JSON object with scores from 0 to 1 for:
        - constructiveness_score: How constructive and helpful is the feedback?
        - clarity: How clear and well-structured is the review?
        - professionalism: How professional is the tone and language?
        - sentiment: overall sentiment (positive, negative, neutral, or mixed)
        
        Also identify any potential bias indicators (return as array of strings).
        
        Review text:
        ${reviewText}
        
        Return only valid JSON.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert in analyzing academic peer reviews for quality and bias. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');

      // Log the AI analysis
      await this.logAIFeedback({
        review_id: review.id,
        analysis_type: 'quality',
        ai_provider: 'openai',
        ai_model: 'gpt-4o-mini',
        prompt: prompt,
        response: completion.choices[0].message.content,
        analysis_results: analysis,
        confidence_score: 0.85,
        processing_time_ms: 0,
        status: 'completed'
      });

      return {
        constructiveness_score: analysis.constructiveness_score || 0.7,
        sentiment: analysis.sentiment || 'neutral',
        clarity: analysis.clarity || 0.7,
        bias_indicators: analysis.bias_indicators || [],
        professionalism: analysis.professionalism || 0.8
      };
    } catch (error) {
      console.error('NLP analysis error:', error);
      // Return default values if AI analysis fails
      return {
        constructiveness_score: 0.7,
        sentiment: 'neutral',
        clarity: 0.7,
        bias_indicators: [],
        professionalism: 0.8
      };
    }
  }

  /**
   * Analyze consistency between review sections and recommendation
   */
  private async analyzeConsistency(review: any) {
    const metrics: any = {};

    // Check recommendation alignment with comments
    const negativeKeywords = ['major issues', 'significant problems', 'serious concerns', 'fundamental flaws', 'reject'];
    const positiveKeywords = ['excellent', 'outstanding', 'strong', 'well-written', 'accept', 'minor revisions'];
    
    const reviewText = `${review.strengths} ${review.weaknesses} ${review.detailed_comments}`.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const keyword of positiveKeywords) {
      positiveCount += (reviewText.match(new RegExp(keyword, 'g')) || []).length;
    }
    
    for (const keyword of negativeKeywords) {
      negativeCount += (reviewText.match(new RegExp(keyword, 'g')) || []).length;
    }
    
    const sentimentBalance = positiveCount - negativeCount;
    
    // Check if recommendation aligns with sentiment
    let alignmentScore = 0.5;
    
    if (review.recommendation === 'accept' && sentimentBalance > 0) {
      alignmentScore = 1.0;
    } else if (review.recommendation === 'reject' && sentimentBalance < 0) {
      alignmentScore = 1.0;
    } else if (review.recommendation === 'major_revisions' && Math.abs(sentimentBalance) < 5) {
      alignmentScore = 0.9;
    } else if (review.recommendation === 'minor_revisions' && sentimentBalance >= 0) {
      alignmentScore = 0.9;
    }
    
    metrics.recommendation_alignment = alignmentScore;
    
    // Check internal consistency between sections
    const strengthsLength = review.strengths?.length || 0;
    const weaknessesLength = review.weaknesses?.length || 0;
    
    // Balance between strengths and weaknesses
    const balance = 1 - Math.abs(strengthsLength - weaknessesLength) / (strengthsLength + weaknessesLength + 1);
    metrics.internal_consistency = balance;
    
    // Get cross-reviewer variance if multiple reviews exist
    const { data: otherReviews } = await this.supabase
      .from('reviews')
      .select('recommendation, overall_score')
      .eq('manuscript_id', review.manuscript_id)
      .neq('id', review.id);
    
    if (otherReviews && otherReviews.length > 0) {
      // Calculate variance in recommendations
      const recommendations = [review.recommendation, ...otherReviews.map((r: any) => r.recommendation)];
      const uniqueRecs = new Set(recommendations);
      metrics.cross_reviewer_variance = 1 - (uniqueRecs.size - 1) / 3; // Normalize to 0-1
    }
    
    return metrics;
  }

  /**
   * Calculate overall quality score
   */
  private async calculateQualityScore(report: ReviewQualityReport): Promise<number> {
    await this.initializeSupabase();
    
    // Get metric configurations
    const { data: configs } = await this.supabase
      .from('quality_metrics_config')
      .select('*')
      .eq('enabled', true);
    
    if (!configs || configs.length === 0) {
      return 0.7; // Default score
    }
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const config of configs) {
      let value = 0;
      
      // Get metric value based on type
      if (config.metric_type === 'automated' && report.automated_metrics) {
        value = (report.automated_metrics as any)[config.metric_name] || 0;
      } else if (config.metric_type === 'nlp' && report.nlp_analysis) {
        value = (report.nlp_analysis as any)[config.metric_name] || 0;
      }
      
      if (value > 0) {
        weightedSum += value * config.weight;
        totalWeight += config.weight;
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.7;
  }

  /**
   * Determine quality flags based on analysis
   */
  private determineQualityFlags(report: ReviewQualityReport, qualityScore: number): QualityFlag[] {
    const flags: QualityFlag[] = [];
    
    // Check for excellence
    if (qualityScore >= 0.9) {
      flags.push('excellent_quality');
    }
    
    // Check for poor quality
    if (qualityScore < 0.6) {
      flags.push('needs_improvement');
    }
    
    // Check for bias
    if (report.nlp_analysis?.bias_indicators && report.nlp_analysis.bias_indicators.length > 0) {
      flags.push('bias_suspected');
    }
    
    // Check for unprofessional tone
    if (report.nlp_analysis?.professionalism && report.nlp_analysis.professionalism < 0.6) {
      flags.push('unprofessional_tone');
    }
    
    // Check for incomplete review
    if (report.automated_metrics?.completeness && report.automated_metrics.completeness < 0.7) {
      flags.push('incomplete_review');
    }
    
    // Check for inconsistent recommendation
    if (report.consistency_metrics?.recommendation_alignment && 
        report.consistency_metrics.recommendation_alignment < 0.6) {
      flags.push('inconsistent_recommendation');
    }
    
    // Check for low constructiveness
    if (report.nlp_analysis?.constructiveness_score && 
        report.nlp_analysis.constructiveness_score < 0.5) {
      flags.push('low_constructiveness');
    }
    
    return flags;
  }

  /**
   * Generate recommendations based on quality analysis
   */
  private async generateRecommendations(
    report: ReviewQualityReport, 
    flags: QualityFlag[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Recommendations based on flags
    if (flags.includes('incomplete_review')) {
      recommendations.push('Complete all required review sections with detailed feedback');
    }
    
    if (flags.includes('bias_suspected')) {
      recommendations.push('Review for potential bias and ensure objective evaluation');
    }
    
    if (flags.includes('unprofessional_tone')) {
      recommendations.push('Maintain professional and constructive tone throughout');
    }
    
    if (flags.includes('inconsistent_recommendation')) {
      recommendations.push('Ensure recommendation aligns with the detailed feedback provided');
    }
    
    if (flags.includes('low_constructiveness')) {
      recommendations.push('Provide more specific, actionable suggestions for improvement');
    }
    
    // Recommendations based on low metrics
    if (report.automated_metrics?.specificity && report.automated_metrics.specificity < 0.5) {
      recommendations.push('Include specific examples and references to manuscript sections');
    }
    
    if (report.automated_metrics?.depth && report.automated_metrics.depth < 0.5) {
      recommendations.push('Provide more detailed analysis and comprehensive feedback');
    }
    
    if (report.nlp_analysis?.clarity && report.nlp_analysis.clarity < 0.6) {
      recommendations.push('Improve review structure and clarity of feedback');
    }
    
    return recommendations;
  }

  /**
   * Get or create quality report for a review
   */
  private async getOrCreateQualityReport(reviewId: string): Promise<ReviewQualityReport> {
    const { data: existing } = await this.supabase
      .from('review_quality_reports')
      .select('*')
      .eq('review_id', reviewId)
      .single();
    
    if (existing) {
      return existing;
    }
    
    // Create new report
    const { data: newReport, error } = await this.supabase
      .from('review_quality_reports')
      .insert({
        review_id: reviewId,
        status: 'pending_analysis',
        automated_metrics: {},
        nlp_analysis: {},
        consistency_metrics: {},
        flags: []
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return newReport;
  }

  /**
   * Update quality report
   */
  private async updateQualityReport(
    reportId: string, 
    updates: Partial<ReviewQualityReport>
  ): Promise<ReviewQualityReport> {
    const { data, error } = await this.supabase
      .from('review_quality_reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  }

  /**
   * Log AI feedback for auditing
   */
  private async logAIFeedback(log: Omit<AIFeedbackLog, 'id' | 'created_at'>): Promise<void> {
    await this.supabase
      .from('ai_feedback_logs')
      .insert(log);
  }

  /**
   * Detect bias in review text
   */
  async detectBias(reviewText: string): Promise<BiasWarning[]> {
    const warnings: BiasWarning[] = [];
    
    // Gender bias patterns
    const genderPatterns = [
      { pattern: /\b(he|his|him)\b/gi, type: 'gender' as const },
      { pattern: /\b(she|her|hers)\b/gi, type: 'gender' as const }
    ];
    
    // Check for gender bias
    for (const { pattern, type } of genderPatterns) {
      const matches = reviewText.match(pattern);
      if (matches && matches.length > 2) { // Allow some pronoun use
        warnings.push({
          type,
          detected_text: matches.join(', '),
          suggestion: 'Consider using gender-neutral language',
          severity: 'medium',
          addressed: false
        });
      }
    }
    
    // Geographic/institutional bias keywords
    const biasKeywords = {
      geographic: ['western', 'eastern', 'third-world', 'developing country'],
      institutional: ['ivy league', 'prestigious', 'unknown institution'],
      career_stage: ['junior', 'young researcher', 'established', 'veteran']
    };
    
    for (const [biasType, keywords] of Object.entries(biasKeywords)) {
      for (const keyword of keywords) {
        if (reviewText.toLowerCase().includes(keyword)) {
          warnings.push({
            type: biasType as any,
            detected_text: keyword,
            suggestion: `Avoid references to ${biasType.replace('_', ' ')} that may introduce bias`,
            severity: 'low',
            addressed: false
          });
        }
      }
    }
    
    return warnings;
  }
}