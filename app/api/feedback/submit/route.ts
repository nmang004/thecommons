import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'general', 'academic']),
  category: z.enum(['submission', 'review', 'editorial', 'ui_ux', 'performance', 'other']),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  page_url: z.string().url().optional(),
  user_agent: z.string().optional(),
  screenshot_url: z.string().url().optional(),
  steps_to_reproduce: z.string().max(1000).optional(),
  expected_behavior: z.string().max(500).optional(),
  actual_behavior: z.string().max(500).optional(),
  academic_context: z.object({
    institution: z.string().optional(),
    field_of_study: z.string().optional(),
    role: z.enum(['author', 'reviewer', 'editor', 'reader']).optional(),
    experience_level: z.enum(['novice', 'intermediate', 'expert']).optional()
  }).optional(),
  contact_email: z.string().email().optional(),
  allow_follow_up: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    const supabase = createClient();
    
    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create feedback entry
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .insert({
        user_id: user?.id || null,
        type: validatedData.type,
        category: validatedData.category,
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity || 'medium',
        metadata: {
          page_url: validatedData.page_url,
          user_agent: validatedData.user_agent,
          screenshot_url: validatedData.screenshot_url,
          steps_to_reproduce: validatedData.steps_to_reproduce,
          expected_behavior: validatedData.expected_behavior,
          actual_behavior: validatedData.actual_behavior,
          academic_context: validatedData.academic_context,
          contact_email: validatedData.contact_email,
          allow_follow_up: validatedData.allow_follow_up,
          submitted_from_ip: request.ip,
          timestamp: new Date().toISOString()
        },
        status: 'open'
      })
      .select()
      .single();

    if (feedbackError) {
      throw feedbackError;
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user?.id || null,
      action: 'feedback_submitted',
      details: {
        feedback_id: feedback.id,
        type: validatedData.type,
        category: validatedData.category,
        severity: validatedData.severity
      }
    });

    // Send notification to admin team (if critical or high severity)
    if (validatedData.severity === 'critical' || validatedData.severity === 'high') {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          type: 'urgent_feedback',
          title: `${validatedData.severity.toUpperCase()}: ${validatedData.title}`,
          message: validatedData.description,
          metadata: {
            feedback_id: feedback.id,
            user_id: user?.id,
            category: validatedData.category
          }
        })
      });
    }

    // Auto-assign to appropriate team based on category
    const assignmentRules = {
      'submission': 'technical_team',
      'review': 'editorial_team', 
      'editorial': 'editorial_team',
      'ui_ux': 'design_team',
      'performance': 'technical_team',
      'other': 'general_team'
    };

    await supabase
      .from('user_feedback')
      .update({
        assigned_to: assignmentRules[validatedData.category] || 'general_team'
      })
      .eq('id', feedback.id);

    return NextResponse.json({
      success: true,
      feedback_id: feedback.id,
      message: 'Thank you for your feedback! We appreciate your input in improving The Commons.',
      estimated_response_time: validatedData.severity === 'critical' ? '2-4 hours' : 
                              validatedData.severity === 'high' ? '1-2 days' : '3-5 days'
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid feedback data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit feedback. Please try again or contact support.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get feedback with filters
    const status = searchParams.get('status') || 'open';
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('user_feedback')
      .select(`
        *,
        user:profiles(full_name, email, affiliation)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);

    const { data: feedback, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (type) countQuery = countQuery.eq('type', type);
    if (category) countQuery = countQuery.eq('category', category);
    if (severity) countQuery = countQuery.eq('severity', severity);

    const { count } = await countQuery;

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}