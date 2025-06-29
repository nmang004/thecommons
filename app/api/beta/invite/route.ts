import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  institution: z.string().optional(),
  field_of_study: z.string().optional(),
  role: z.enum(['author', 'reviewer', 'editor']).optional(),
  custom_message: z.string().optional()
});

const bulkInviteSchema = z.object({
  invitations: z.array(inviteSchema).min(1).max(100)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle bulk invitations
    if (body.invitations) {
      const validatedData = bulkInviteSchema.parse(body);
      const results = [];
      
      for (const invitation of validatedData.invitations) {
        try {
          // Generate invitation code
          const { data: inviteCode, error: codeError } = await supabase
            .rpc('generate_beta_invitation', {
              p_email: invitation.email,
              p_institution: invitation.institution || null,
              p_field_of_study: invitation.field_of_study || null,
              p_invited_by: user.id
            });

          if (codeError) {
            throw codeError;
          }

          // Send invitation email
          const emailResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/beta-invitation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              email: invitation.email,
              invitation_code: inviteCode,
              institution: invitation.institution,
              field_of_study: invitation.field_of_study,
              custom_message: invitation.custom_message
            })
          });

          results.push({
            email: invitation.email,
            success: emailResult.ok,
            invitation_code: inviteCode,
            error: emailResult.ok ? null : await emailResult.text()
          });

        } catch (error) {
          results.push({
            email: invitation.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} invitations`,
        results
      });

    } else {
      // Handle single invitation
      const validatedData = inviteSchema.parse(body);
      
      // Generate invitation code
      const { data: inviteCode, error: codeError } = await supabase
        .rpc('generate_beta_invitation', {
          p_email: validatedData.email,
          p_institution: validatedData.institution || null,
          p_field_of_study: validatedData.field_of_study || null,
          p_invited_by: user.id
        });

      if (codeError) {
        throw codeError;
      }

      // Send invitation email
      const emailResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/beta-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          email: validatedData.email,
          invitation_code: inviteCode,
          institution: validatedData.institution,
          field_of_study: validatedData.field_of_study,
          custom_message: validatedData.custom_message
        })
      });

      if (!emailResult.ok) {
        throw new Error('Failed to send invitation email');
      }

      return NextResponse.json({
        success: true,
        message: 'Beta invitation sent successfully',
        invitation_code: inviteCode
      });
    }

  } catch (error) {
    console.error('Beta invitation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid invitation data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send beta invitation'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get beta invitations with filters
    const status = searchParams.get('status'); // 'pending', 'accepted'
    const institution = searchParams.get('institution');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('beta_invitations')
      .select(`
        *,
        inviter:profiles!beta_invitations_invited_by_fkey(full_name, email),
        user:profiles!beta_invitations_user_id_fkey(full_name, email)
      `)
      .order('invited_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status === 'pending') {
      query = query.is('accepted_at', null);
    } else if (status === 'accepted') {
      query = query.not('accepted_at', 'is', null);
    }

    if (institution) {
      query = query.ilike('institution', `%${institution}%`);
    }

    const { data: invitations, error } = await query;

    if (error) {
      throw error;
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('beta_invitations')
      .select('accepted_at, invited_at');

    const totalInvitations = stats?.length || 0;
    const acceptedInvitations = stats?.filter(s => s.accepted_at).length || 0;
    const acceptanceRate = totalInvitations > 0 ? acceptedInvitations / totalInvitations : 0;

    return NextResponse.json({
      invitations,
      pagination: {
        page,
        limit,
        total: totalInvitations
      },
      statistics: {
        total_invitations: totalInvitations,
        accepted_invitations: acceptedInvitations,
        pending_invitations: totalInvitations - acceptedInvitations,
        acceptance_rate: acceptanceRate
      }
    });

  } catch (error) {
    console.error('Beta invitations retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve beta invitations' },
      { status: 500 }
    );
  }
}