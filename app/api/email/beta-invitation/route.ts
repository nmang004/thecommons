import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BETA_INVITATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Commons Beta Invitation</title>
  <style>
    body { 
      font-family: 'Georgia', serif; 
      line-height: 1.6; 
      color: #2d3748; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #1e3a8a; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .logo { 
      font-size: 28px; 
      font-weight: bold; 
      color: #1e3a8a; 
      margin-bottom: 10px; 
    }
    .tagline { 
      font-style: italic; 
      color: #6b7280; 
      font-size: 16px; 
    }
    .content { 
      margin-bottom: 30px; 
    }
    .invitation-code { 
      background: #f3f4f6; 
      border: 2px solid #d97706; 
      border-radius: 8px; 
      padding: 20px; 
      text-align: center; 
      margin: 25px 0; 
    }
    .code { 
      font-family: 'Courier New', monospace; 
      font-size: 24px; 
      font-weight: bold; 
      color: #d97706; 
      letter-spacing: 2px; 
    }
    .cta-button { 
      display: inline-block; 
      background: #1e3a8a; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: bold; 
      margin: 20px 0; 
    }
    .features { 
      background: #f9fafb; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 25px 0; 
    }
    .feature { 
      margin-bottom: 15px; 
    }
    .feature-icon { 
      color: #16a34a; 
      font-weight: bold; 
      margin-right: 10px; 
    }
    .footer { 
      border-top: 1px solid #e5e7eb; 
      padding-top: 20px; 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px; 
    }
    .academic-note { 
      background: #eff6ff; 
      border-left: 4px solid #3b82f6; 
      padding: 15px; 
      margin: 20px 0; 
      font-style: italic; 
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">The Commons</div>
    <div class="tagline">Revolutionizing Academic Publishing</div>
  </div>

  <div class="content">
    <h2>You're Invited to Join The Commons Beta!</h2>
    
    <p>Dear {{INSTITUTION_GREETING}},</p>
    
    <p>We are excited to invite you to participate in the beta launch of <strong>The Commons</strong>, a revolutionary academic publishing platform designed to democratize scholarly communication and provide fair, transparent, and open-access publishing for researchers worldwide.</p>

    {{CUSTOM_MESSAGE}}

    <div class="academic-note">
      <strong>Why The Commons?</strong> We believe academic knowledge should be accessible to all. Our platform offers fair pricing, rapid peer review, and 100% open access to ensure your research reaches the global academic community.
    </div>

    <div class="invitation-code">
      <p><strong>Your Beta Invitation Code:</strong></p>
      <div class="code">{{INVITATION_CODE}}</div>
      <p>Use this code during registration to access the beta platform</p>
    </div>

    <div style="text-align: center;">
      <a href="{{REGISTRATION_URL}}" class="cta-button">Join The Commons Beta</a>
    </div>

    <div class="features">
      <h3>What You'll Experience:</h3>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <strong>Streamlined Submission:</strong> Intuitive manuscript submission with LaTeX support
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <strong>Transparent Review:</strong> Track your manuscript through every stage
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <strong>Fair Pricing:</strong> No hidden fees, transparent article processing charges
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <strong>Open Access:</strong> All published articles freely available worldwide
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <strong>Academic Focus:</strong> Built by researchers, for researchers
      </div>
    </div>

    <p>As a beta participant, your feedback will directly shape the future of academic publishing. We're particularly interested in insights from {{FIELD_OF_STUDY}} researchers like yourself.</p>

    <p>The beta platform includes:</p>
    <ul>
      <li>Full manuscript submission and review workflow</li>
      <li>Editorial dashboard for managing submissions</li>
      <li>Reviewer interface with modern tools</li>
      <li>Author dashboard with real-time status updates</li>
      <li>Payment processing for article processing charges</li>
    </ul>

    <p><strong>Getting Started:</strong></p>
    <ol>
      <li>Click the registration link above</li>
      <li>Enter your beta invitation code: <strong>{{INVITATION_CODE}}</strong></li>
      <li>Complete your academic profile</li>
      <li>Start exploring or submit your first manuscript</li>
    </ol>

    <p>We're committed to supporting the academic community, and your participation in this beta will help us build a platform that truly serves researchers' needs.</p>
  </div>

  <div class="footer">
    <p><strong>The Commons Team</strong><br>
    Building the future of academic publishing</p>
    
    <p>Questions? Contact us at <a href="mailto:beta@thecommons.org">beta@thecommons.org</a></p>
    
    <p>This invitation is valid for 30 days. If you have any technical issues during registration, please don't hesitate to reach out to our support team.</p>
    
    <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
      The Commons | Academic Publishing Platform<br>
      <a href="{{APP_URL}}">{{APP_URL}}</a>
    </p>
  </div>
</body>
</html>
`;

interface BetaInvitationRequest {
  email: string;
  invitation_code: string;
  institution?: string;
  field_of_study?: string;
  custom_message?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate service request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BetaInvitationRequest = await request.json();
    const { email, invitation_code, institution, field_of_study, custom_message } = body;

    // Generate personalized content
    const institutionGreeting = institution 
      ? `Colleague from ${institution}`
      : 'Esteemed Researcher';

    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?beta=${invitation_code}`;

    const customMessageSection = custom_message 
      ? `<div class="academic-note"><strong>Personal Message:</strong><br>${custom_message}</div>`
      : '';

    // Replace template variables
    const emailContent = BETA_INVITATION_TEMPLATE
      .replace(/\{\{INVITATION_CODE\}\}/g, invitation_code)
      .replace(/\{\{REGISTRATION_URL\}\}/g, registrationUrl)
      .replace(/\{\{INSTITUTION_GREETING\}\}/g, institutionGreeting)
      .replace(/\{\{FIELD_OF_STUDY\}\}/g, field_of_study || 'your field')
      .replace(/\{\{CUSTOM_MESSAGE\}\}/g, customMessageSection)
      .replace(/\{\{APP_URL\}\}/g, process.env.NEXT_PUBLIC_APP_URL || 'https://thecommons.org');

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@thecommons.org',
      to: [email],
      subject: `Your Invitation to The Commons Beta - Academic Publishing Revolution`,
      html: emailContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      tags: [
        { name: 'category', value: 'beta_invitation' },
        { name: 'institution', value: institution || 'unknown' },
        { name: 'field', value: field_of_study || 'unknown' }
      ]
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    // Log the invitation
    console.log(`Beta invitation sent to ${email} with code ${invitation_code}`);

    return NextResponse.json({
      success: true,
      message: 'Beta invitation sent successfully',
      email_id: data?.id
    });

  } catch (error) {
    console.error('Beta invitation email error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send beta invitation'
      },
      { status: 500 }
    );
  }
}