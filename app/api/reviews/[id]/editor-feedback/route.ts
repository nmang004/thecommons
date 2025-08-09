import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/reviews/:id/editor-feedback
 * Allow editor to submit manual rating and feedback on a review
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role - only editors and admins can provide feedback
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'editor' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { rating, notes, flags } = body;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get or create quality report
    const { data: existingReport } = await supabase
      .from('review_quality_reports')
      .select('id')
      .eq('review_id', params.id)
      .single();

    let reportId;

    if (existingReport) {
      // Update existing report
      const { data: updatedReport, error: updateError } = await supabase
        .from('review_quality_reports')
        .update({
          editor_rating: rating,
          editor_notes: notes,
          editor_reviewed_at: new Date().toISOString(),
          editor_reviewed_by: user.id,
          flags: flags || [],
          status: 'editor_reviewed',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReport.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      reportId = updatedReport.id;
    } else {
      // Create new report with editor feedback
      const { data: newReport, error: createError } = await supabase
        .from('review_quality_reports')
        .insert({
          review_id: params.id,
          editor_rating: rating,
          editor_notes: notes,
          editor_reviewed_at: new Date().toISOString(),
          editor_reviewed_by: user.id,
          flags: flags || [],
          status: 'editor_reviewed'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      reportId = newReport.id;
    }

    // Check if we need to trigger training or improvements
    if (rating && rating <= 2) {
      // Low quality review - check if training needed
      const { data: review } = await supabase
        .from('reviews')
        .select('reviewer_id')
        .eq('id', params.id)
        .single();

      if (review) {
        // Check reviewer's overall performance
        const { data: profile } = await supabase
          .from('reviewer_quality_profiles')
          .select('average_quality_score, low_quality_reviews')
          .eq('reviewer_id', review.reviewer_id)
          .single();

        if (profile && (profile.average_quality_score < 0.6 || profile.low_quality_reviews >= 3)) {
          // Create improvement task
          await supabase
            .from('quality_improvement_tasks')
            .insert({
              reviewer_id: review.reviewer_id,
              review_id: params.id,
              task_type: 'training',
              title: 'Review Quality Improvement Training',
              description: 'Your recent reviews have been flagged for quality concerns. Please complete this training to improve your review skills.',
              learning_objectives: [
                'Provide constructive and specific feedback',
                'Maintain professional tone',
                'Ensure consistency between comments and recommendations',
                'Include actionable suggestions for improvement'
              ],
              resources: [
                {
                  type: 'link',
                  title: 'Guide to Writing Effective Peer Reviews',
                  url: '/resources/peer-review-guide'
                },
                {
                  type: 'video',
                  title: 'Constructive Feedback Workshop',
                  url: '/resources/feedback-workshop',
                  duration: '45 minutes'
                }
              ]
            });

          // Send notification to reviewer
          await supabase
            .from('notifications')
            .insert({
              user_id: review.reviewer_id,
              type: 'training_assigned',
              title: 'Training Module Assigned',
              message: 'A training module has been assigned to help improve your review quality.',
              data: {
                review_id: params.id,
                reason: 'low_quality_review'
              }
            });
        }
      }
    }

    // If excellent quality, award badge
    if (rating === 5 && flags?.includes('excellent_quality')) {
      const { data: review } = await supabase
        .from('reviews')
        .select('reviewer_id')
        .eq('id', params.id)
        .single();

      if (review) {
        // Update reviewer profile with excellence
        const { data: profile } = await supabase
          .from('reviewer_quality_profiles')
          .select('*')
          .eq('reviewer_id', review.reviewer_id)
          .single();

        if (profile) {
          const badges = profile.quality_badges || [];
          badges.push({
            type: 'quality_excellence',
            earned_at: new Date().toISOString(),
            description: 'Awarded for exceptional review quality'
          });

          await supabase
            .from('reviewer_quality_profiles')
            .update({
              quality_badges: badges,
              excellence_count: (profile.excellence_count || 0) + 1
            })
            .eq('reviewer_id', review.reviewer_id);
        }
      }
    }

    return NextResponse.json({
      message: 'Editor feedback submitted successfully',
      report_id: reportId
    });

  } catch (error) {
    console.error('Error submitting editor feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit editor feedback' },
      { status: 500 }
    );
  }
}