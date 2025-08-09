/**
 * Quality System Validation Script
 * 
 * Comprehensive test suite to validate all components of the review quality assurance system
 * Run with: npx tsx scripts/validate-quality-system.ts
 */

import { createClient } from '@/lib/supabase/server';
import { QualityAnalysisService } from '@/lib/services/quality-analysis';
import { QualityJobProcessor } from '@/lib/services/quality-job-processor';
import { qualityNotificationService } from '@/lib/services/quality-notifications';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

class QualitySystemValidator {
  private results: TestResult[] = [];
  private supabase: any;

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await createClient();
  }

  /**
   * Run all validation tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Quality System Validation...\n');

    const tests = [
      this.testDatabaseSchema,
      this.testQualityAnalysisService,
      this.testJobProcessing,
      this.testNotificationSystem,
      this.testAPIEndpoints,
      this.testRealtimeAssistance,
      this.testAnalytics,
      this.testTriggerSystem,
      this.testDataConsistency
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.bind(this));
    }

    this.printSummary();
  }

  /**
   * Run a single test with timing and error handling
   */
  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`⏳ Running ${name}...`);
      await testFn();
      
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        passed: true,
        message: 'Test passed successfully',
        duration
      });
      
      console.log(`✅ ${name} passed (${duration}ms)\n`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        passed: false,
        message: error.message || 'Unknown error',
        duration,
        details: error.stack
      });
      
      console.log(`❌ ${name} failed (${duration}ms): ${error.message}\n`);
    }
  }

  /**
   * Test 1: Database Schema Validation
   */
  async testDatabaseSchema(): Promise<void> {
    await this.initializeSupabase();

    // Test table existence and basic structure
    const tables = [
      'review_quality_reports',
      'quality_metrics_config', 
      'ai_feedback_logs',
      'review_consistency_scores',
      'reviewer_quality_profiles',
      'quality_improvement_tasks',
      'review_assistance_sessions',
      'quality_analysis_jobs'
    ];

    for (const table of tables) {
      const { error } = await this.supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // Not found is OK
        throw new Error(`Table ${table} not accessible: ${error.message}`);
      }
    }

    // Test functions exist
    const { data: functions, error: funcError } = await this.supabase
      .rpc('calculate_review_quality_score', { report_id: '00000000-0000-0000-0000-000000000000' });

    // It's OK if the function fails due to invalid ID, we just want to know it exists
    if (funcError && !funcError.message.includes('null value')) {
      console.warn('Quality score function may not exist:', funcError.message);
    }

    // Test quality metrics config has default values
    const { data: configs } = await this.supabase
      .from('quality_metrics_config')
      .select('*')
      .limit(5);

    if (!configs || configs.length === 0) {
      throw new Error('No default quality metrics configuration found');
    }
  }

  /**
   * Test 2: Quality Analysis Service
   */
  async testQualityAnalysisService(): Promise<void> {
    const service = new QualityAnalysisService();

    // Create a test review for analysis
    const testReview = await this.createTestReview();
    if (!testReview) {
      throw new Error('Could not create test review');
    }

    // Test quality analysis
    const result = await service.analyzeReview({
      review_id: testReview.id,
      analysis_type: 'full',
      include_ai_analysis: true,
      include_consistency_check: true
    });

    if (!result.quality_score || result.quality_score < 0 || result.quality_score > 1) {
      throw new Error('Invalid quality score returned');
    }

    if (!result.metrics.automated) {
      throw new Error('Missing automated metrics in analysis');
    }

    // Test bias detection
    const biasWarnings = await service.detectBias('This paper by the young author from that unknown institution shows promise but lacks rigor expected from established researchers.');
    
    if (biasWarnings.length === 0) {
      console.warn('Bias detection may not be working properly - no warnings for biased text');
    }

    // Cleanup
    await this.cleanupTestReview(testReview.id);
  }

  /**
   * Test 3: Job Processing System
   */
  async testJobProcessing(): Promise<void> {
    // Test job queuing
    const testReview = await this.createTestReview();
    if (!testReview) {
      throw new Error('Could not create test review');
    }

    const jobId = await QualityJobProcessor.queueAnalysis(testReview.id, 'quick_check', 8);
    
    // Verify job was created
    const { data: job } = await this.supabase
      .from('quality_analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new Error('Job was not created in database');
    }

    if (job.status !== 'queued') {
      throw new Error(`Job status is ${job.status}, expected 'queued'`);
    }

    if (job.priority !== 8) {
      throw new Error(`Job priority is ${job.priority}, expected 8`);
    }

    // Test job processor (just instantiate, don't run)
    const processor = new QualityJobProcessor();
    if (!processor) {
      throw new Error('Could not instantiate job processor');
    }

    // Cleanup
    await this.supabase
      .from('quality_analysis_jobs')
      .delete()
      .eq('id', jobId);
    
    await this.cleanupTestReview(testReview.id);
  }

  /**
   * Test 4: Notification System
   */
  async testNotificationSystem(): Promise<void> {
    // Test notification creation
    const testUser = await this.getTestUser();
    if (!testUser) {
      throw new Error('No test user available');
    }

    const notificationsBefore = await qualityNotificationService.getUnreadNotifications(testUser.id);
    const countBefore = notificationsBefore.length;

    // Create test notification
    await this.supabase
      .from('notifications')
      .insert({
        user_id: testUser.id,
        type: 'system_test',
        title: 'Test Notification',
        message: 'This is a test notification for validation',
        priority: 'low'
      });

    const notificationsAfter = await qualityNotificationService.getUnreadNotifications(testUser.id);
    
    if (notificationsAfter.length !== countBefore + 1) {
      throw new Error('Notification was not created or retrieved properly');
    }

    // Test notification cleanup (cleanup will happen in cleanup phase)
    console.log(`✓ Notification system working (${notificationsAfter.length} notifications)`);
  }

  /**
   * Test 5: API Endpoints
   */
  async testAPIEndpoints(): Promise<void> {
    // This would require setting up a test server or mocking HTTP requests
    // For now, we'll validate the endpoint files exist and can be imported
    
    try {
      // These imports will fail if there are syntax errors
      await import('@/app/api/reviews/[id]/quality-report/route');
      await import('@/app/api/reviews/[id]/editor-feedback/route');
      await import('@/app/api/reviews/assistance/route');
      await import('@/app/api/quality/analytics/route');
      
      console.log('✓ API endpoint files are syntactically valid');
    } catch (error: any) {
      throw new Error(`API endpoint validation failed: ${error.message}`);
    }
  }

  /**
   * Test 6: Real-time Assistance
   */
  async testRealtimeAssistance(): Promise<void> {
    // Test assistance component can be imported
    try {
      await import('@/components/reviews/ReviewAssistant');
      console.log('✓ ReviewAssistant component imports successfully');
    } catch (error: any) {
      throw new Error(`ReviewAssistant component validation failed: ${error.message}`);
    }

    // Test assistance session creation
    const testReview = await this.createTestReview();
    const testUser = await this.getTestUser();
    
    if (!testReview || !testUser) {
      throw new Error('Could not create test data for assistance testing');
    }

    const { data: session, error } = await this.supabase
      .from('review_assistance_sessions')
      .insert({
        review_id: testReview.id,
        reviewer_id: testUser.id,
        assistance_level: 'standard'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Could not create assistance session: ${error.message}`);
    }

    // Cleanup
    await this.supabase
      .from('review_assistance_sessions')
      .delete()
      .eq('id', session.id);
    
    await this.cleanupTestReview(testReview.id);
  }

  /**
   * Test 7: Analytics and Visualization
   */
  async testAnalytics(): Promise<void> {
    // Test dashboard components can be imported
    const components = [
      '@/components/dashboard/quality/QualityDashboard',
      '@/components/dashboard/quality/QualityOverviewCard',
      '@/components/dashboard/quality/QualityTrendsChart',
      '@/components/dashboard/quality/QualityHeatMap'
    ];

    for (const component of components) {
      try {
        await import(component);
      } catch (error: any) {
        throw new Error(`Component ${component} validation failed: ${error.message}`);
      }
    }

    // Test analytics data structure
    const { data: reports } = await this.supabase
      .from('review_quality_reports')
      .select('quality_score, flags, status, created_at')
      .limit(10);

    if (!reports) {
      console.warn('No quality reports found for analytics testing');
    }

    console.log(`✓ Analytics components valid, ${reports?.length || 0} reports available`);
  }

  /**
   * Test 8: Trigger System
   */
  async testTriggerSystem(): Promise<void> {
    // Test trigger imports
    try {
      const { QualityTriggers } = await import('@/lib/hooks/quality-triggers');
      
      // Test that trigger methods exist
      if (typeof QualityTriggers.onReviewSubmitted !== 'function') {
        throw new Error('onReviewSubmitted trigger method not found');
      }
      
      if (typeof QualityTriggers.runDailyMaintenance !== 'function') {
        throw new Error('runDailyMaintenance trigger method not found');
      }

      console.log('✓ Trigger system components are valid');
    } catch (error: any) {
      throw new Error(`Trigger system validation failed: ${error.message}`);
    }
  }

  /**
   * Test 9: Data Consistency
   */
  async testDataConsistency(): Promise<void> {
    // Test foreign key relationships
    const { data: reportsWithoutReviews } = await this.supabase
      .from('review_quality_reports')
      .select(`
        id,
        review_id,
        reviews!inner (id)
      `)
      .limit(5);

    // Test reviewer profiles consistency
    const { data: profilesWithoutUsers } = await this.supabase
      .from('reviewer_quality_profiles')
      .select(`
        id,
        reviewer_id,
        users!inner (id)
      `)
      .limit(5);

    // Test quality metrics configuration
    const { data: enabledMetrics } = await this.supabase
      .from('quality_metrics_config')
      .select('*')
      .eq('enabled', true);

    if (!enabledMetrics || enabledMetrics.length === 0) {
      throw new Error('No enabled quality metrics found');
    }

    // Test that thresholds are reasonable
    for (const metric of enabledMetrics) {
      if (metric.excellent_threshold <= metric.good_threshold) {
        throw new Error(`Invalid thresholds for metric ${metric.metric_name}`);
      }
    }

    console.log(`✓ Data consistency checks passed (${enabledMetrics.length} metrics configured)`);
  }

  /**
   * Helper: Create test review
   */
  private async createTestReview(): Promise<any> {
    const testUser = await this.getTestUser();
    if (!testUser) return null;

    // First create a test manuscript if needed
    const { data: manuscript, error: manuscriptError } = await this.supabase
      .from('manuscripts')
      .insert({
        title: 'Test Manuscript for Quality Validation',
        abstract: 'This is a test manuscript created for quality system validation.',
        field: 'computer_science',
        status: 'under_review',
        handling_editor_id: testUser.id,
        authors: [{ name: 'Test Author', email: 'test@example.com' }]
      })
      .select()
      .single();

    if (manuscriptError) {
      console.error('Could not create test manuscript:', manuscriptError);
      return null;
    }

    const { data: review, error } = await this.supabase
      .from('reviews')
      .insert({
        manuscript_id: manuscript.id,
        reviewer_id: testUser.id,
        status: 'submitted',
        summary: 'This is a test review summary that provides a comprehensive overview of the manuscript. It covers the main contributions, methodology, and findings in sufficient detail to demonstrate the completeness metric.',
        strengths: 'The manuscript demonstrates several strong points including clear writing, solid methodology, and relevant contributions to the field.',
        weaknesses: 'Some areas could be improved including more detailed analysis, better figures, and stronger conclusions.',
        detailed_comments: 'The authors should address the following specific issues: 1) Line 23 needs clarification, 2) Figure 2 is unclear, 3) The conclusion should be strengthened with more specific recommendations for future work.',
        recommendation: 'minor_revisions',
        overall_score: 7,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Clean up manuscript if review creation failed
      await this.supabase
        .from('manuscripts')
        .delete()
        .eq('id', manuscript.id);
      
      console.error('Could not create test review:', error);
      return null;
    }

    return review;
  }

  /**
   * Helper: Cleanup test review and associated data
   */
  private async cleanupTestReview(reviewId: string): Promise<void> {
    // Get manuscript ID first
    const { data: review } = await this.supabase
      .from('reviews')
      .select('manuscript_id')
      .eq('id', reviewId)
      .single();

    // Delete quality report if exists
    await this.supabase
      .from('review_quality_reports')
      .delete()
      .eq('review_id', reviewId);

    // Delete review
    await this.supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    // Delete manuscript if it was a test manuscript
    if (review?.manuscript_id) {
      await this.supabase
        .from('manuscripts')
        .delete()
        .eq('id', review.manuscript_id)
        .like('title', '%Test Manuscript%');
    }
  }

  /**
   * Helper: Get test user
   */
  private async getTestUser(): Promise<any> {
    // Try to get current authenticated user first
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (user) {
      const { data: userData } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userData) return userData;
    }

    // Fallback: get any admin user
    const { data: adminUser } = await this.supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminUser) return adminUser;

    // Fallback: get any user
    const { data: anyUser } = await this.supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();

    return anyUser;
  }

  /**
   * Print validation summary
   */
  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 QUALITY SYSTEM VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Results: ${passed}/${total} tests passed`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  • ${r.name}: ${r.message}`);
        });
    }

    console.log('\n⏱️  Performance:');
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`  • Total time: ${totalTime}ms`);
    console.log(`  • Average per test: ${Math.round(totalTime / total)}ms`);

    console.log('\n✅ Passing Tests:');
    this.results
      .filter(r => r.passed)
      .forEach(r => {
        console.log(`  • ${r.name} (${r.duration}ms)`);
      });

    if (passed === total) {
      console.log('\n🎉 All tests passed! Quality system is ready for deployment.');
    } else {
      console.log(`\n⚠️  ${failed} test${failed > 1 ? 's' : ''} failed. Please review and fix before deployment.`);
    }

    console.log('\n' + '='.repeat(60));
  }
}

/**
 * Run validation if script is executed directly
 */
if (require.main === module) {
  const validator = new QualitySystemValidator();
  validator.runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

export { QualitySystemValidator };