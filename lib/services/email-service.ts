import { Resend } from 'resend'

export interface EmailRequest {
  to: string
  from?: string
  subject: string
  body: string
  templateId?: string
  trackingId?: string
  metadata?: Record<string, unknown>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailService {
  private resend: Resend
  private defaultFrom: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }

    this.resend = new Resend(apiKey)
    this.defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'noreply@thecommons.org'
  }

  /**
   * Send an email using Resend
   */
  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    try {
      // Add tracking pixel for open tracking
      const bodyWithTracking = this.addTrackingPixel(request.body, request.trackingId)
      
      // Add click tracking to links
      const bodyWithClickTracking = this.addClickTracking(bodyWithTracking, request.trackingId)

      const result = await this.resend.emails.send({
        from: request.from || this.defaultFrom,
        to: request.to,
        subject: request.subject,
        html: bodyWithClickTracking,
        headers: {
          'X-Entity-Ref-ID': request.trackingId || '',
          'X-Template-ID': request.templateId || ''
        },
        tags: [
          { name: 'category', value: 'reviewer-invitation' },
          { name: 'template', value: request.templateId || 'default' }
        ]
      })

      if (result.error) {
        console.error('Resend email error:', result.error)
        return {
          success: false,
          error: result.error.message
        }
      }

      return {
        success: true,
        messageId: result.data?.id
      }
    } catch (error) {
      console.error('Email service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      }
    }
  }

  /**
   * Send bulk emails (for multiple reviewers)
   */
  async sendBulkEmails(requests: EmailRequest[]): Promise<EmailResult[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.sendEmail(request))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Bulk email ${index} failed:`, result.reason)
        return {
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Bulk email failed'
        }
      }
    })
  }

  /**
   * Add tracking pixel for email opens
   */
  private addTrackingPixel(htmlBody: string, trackingId?: string): string {
    if (!trackingId) return htmlBody

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const trackingPixel = `<img src="${baseUrl}/api/track/email-open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`
    
    // Try to insert before closing body tag, otherwise append
    if (htmlBody.includes('</body>')) {
      return htmlBody.replace('</body>', `${trackingPixel}</body>`)
    }
    
    return `${htmlBody}${trackingPixel}`
  }

  /**
   * Add click tracking to links
   */
  private addClickTracking(htmlBody: string, trackingId?: string): string {
    if (!trackingId) return htmlBody

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Replace all href attributes with tracking URLs
    return htmlBody.replace(/href="([^"]+)"/g, (match, originalUrl) => {
      // Skip tracking for tracking pixels and internal tracking links
      if (originalUrl.includes('/api/track/') || originalUrl.includes('width="1"')) {
        return match
      }

      const trackingUrl = `${baseUrl}/api/track/email-click/${trackingId}?url=${encodeURIComponent(originalUrl)}`
      return `href="${trackingUrl}"`
    })
  }

  /**
   * Send review invitation email with academic styling
   */
  async sendReviewInvitation({
    to,
    reviewerName,
    manuscriptTitle,
    fieldOfStudy,
    dueDate,
    acceptUrl,
    declineUrl,
    editorName,
    customMessage,
    trackingId
  }: {
    to: string
    reviewerName: string
    manuscriptTitle: string
    fieldOfStudy: string
    dueDate: string
    acceptUrl: string
    declineUrl: string
    editorName: string
    customMessage?: string
    trackingId?: string
  }): Promise<EmailResult> {
    const subject = `Invitation to Review: ${manuscriptTitle}`
    
    const htmlBody = this.generateInvitationHTML({
      reviewerName,
      manuscriptTitle,
      fieldOfStudy,
      dueDate,
      acceptUrl,
      declineUrl,
      editorName,
      customMessage
    })

    return await this.sendEmail({
      to,
      subject,
      body: htmlBody,
      templateId: 'review-invitation',
      trackingId
    })
  }

  /**
   * Send review reminder email
   */
  async sendReviewReminder({
    to,
    reviewerName,
    manuscriptTitle,
    daysRemaining,
    responseUrl,
    reminderType,
    trackingId
  }: {
    to: string
    reviewerName: string
    manuscriptTitle: string
    daysRemaining: number
    responseUrl: string
    reminderType: 'first' | 'second' | 'final'
    trackingId?: string
  }): Promise<EmailResult> {
    const urgencyPrefix = reminderType === 'final' ? 'FINAL REMINDER: ' : 'Reminder: '
    const subject = `${urgencyPrefix}Review Invitation - ${manuscriptTitle}`
    
    const htmlBody = this.generateReminderHTML({
      reviewerName,
      manuscriptTitle,
      daysRemaining,
      responseUrl,
      reminderType
    })

    return await this.sendEmail({
      to,
      subject,
      body: htmlBody,
      templateId: 'review-reminder',
      trackingId
    })
  }

  /**
   * Generate HTML for invitation email with academic styling
   */
  private generateInvitationHTML({
    reviewerName,
    manuscriptTitle,
    fieldOfStudy,
    dueDate,
    acceptUrl,
    declineUrl,
    editorName,
    customMessage
  }: {
    reviewerName: string
    manuscriptTitle: string
    fieldOfStudy: string
    dueDate: string
    acceptUrl: string
    declineUrl: string
    editorName: string
    customMessage?: string
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review Invitation</title>
  <style>
    body { 
      font-family: 'Crimson Text', 'Times New Roman', serif; 
      line-height: 1.6; 
      color: #1e3a8a; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
      background-color: #f8fafc;
    }
    .header { 
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white; 
      padding: 30px; 
      text-align: center; 
      border-radius: 8px 8px 0 0;
    }
    .header h1 { 
      margin: 0; 
      font-family: 'Playfair Display', serif; 
      font-size: 24px; 
      font-weight: 700;
    }
    .content { 
      background: white; 
      padding: 40px 30px; 
      border-radius: 0 0 8px 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .manuscript-details {
      background: #f1f5f9;
      border-left: 4px solid #d97706;
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .action-buttons {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      margin: 0 10px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .btn-accept {
      background: #16a34a;
      color: white;
    }
    .btn-decline {
      background: #dc2626;
      color: white;
    }
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
      margin-top: 30px;
    }
    .custom-message {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
      font-style: italic;
    }
    @media (max-width: 600px) {
      .content { padding: 20px; }
      .btn { display: block; margin: 10px 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 The Commons</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Academic Publishing Platform</p>
  </div>
  
  <div class="content">
    <h2 style="color: #1e3a8a; font-family: 'Playfair Display', serif; margin-top: 0;">Review Invitation</h2>
    
    <p>Dear ${reviewerName},</p>
    
    <p>I hope this message finds you well. I am writing to invite you to serve as a reviewer for a manuscript submitted to The Commons.</p>
    
    <div class="manuscript-details">
      <h3 style="margin-top: 0; color: #d97706;">📄 Manuscript Details</h3>
      <p><strong>Title:</strong> ${manuscriptTitle}</p>
      <p><strong>Field of Study:</strong> ${fieldOfStudy}</p>
      <p><strong>Review Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    </div>

    ${customMessage ? `
    <div class="custom-message">
      <h4 style="margin-top: 0; color: #92400e;">✉️ Personal Message</h4>
      <p style="margin-bottom: 0;">${customMessage}</p>
    </div>
    ` : ''}
    
    <p>Your expertise in this field makes you an ideal candidate to evaluate this scholarly work. The review process is double-blind, ensuring confidentiality for both authors and reviewers.</p>
    
    <p>Please confirm your availability by responding to this invitation. You can accept or decline using the buttons below:</p>
    
    <div class="action-buttons">
      <a href="${acceptUrl}" class="btn btn-accept">✓ Accept Review</a>
      <a href="${declineUrl}" class="btn btn-decline">✗ Decline Review</a>
    </div>
    
    <p>If you have any questions about the manuscript or the review process, please don't hesitate to contact me directly.</p>
    
    <p>Thank you for considering this request and for your continued contribution to scholarly publishing.</p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>${editorName}</strong><br>
      <em>Editorial Team</em><br>
      The Commons
    </p>
  </div>
  
  <div class="footer">
    <p>This email was sent by The Commons Academic Publishing Platform.</p>
    <p>If you believe this email was sent in error, please contact our support team.</p>
  </div>
</body>
</html>`
  }

  /**
   * Generate HTML for reminder email
   */
  private generateReminderHTML({
    reviewerName,
    manuscriptTitle,
    daysRemaining,
    responseUrl,
    reminderType
  }: {
    reviewerName: string
    manuscriptTitle: string
    daysRemaining: number
    responseUrl: string
    reminderType: 'first' | 'second' | 'final'
  }): string {
    const urgencyColor = reminderType === 'final' ? '#dc2626' : '#d97706'
    const urgencyBg = reminderType === 'final' ? '#fee2e2' : '#fef3c7'
    const icon = reminderType === 'final' ? '⚠️' : '⏰'
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review Reminder</title>
  <style>
    body { 
      font-family: 'Crimson Text', 'Times New Roman', serif; 
      line-height: 1.6; 
      color: #1e3a8a; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
      background-color: #f8fafc;
    }
    .header { 
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white; 
      padding: 30px; 
      text-align: center; 
      border-radius: 8px 8px 0 0;
    }
    .header h1 { 
      margin: 0; 
      font-family: 'Playfair Display', serif; 
      font-size: 24px; 
      font-weight: 700;
    }
    .content { 
      background: white; 
      padding: 40px 30px; 
      border-radius: 0 0 8px 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .urgency-notice {
      background: ${urgencyBg};
      border: 2px solid ${urgencyColor};
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .urgency-notice h3 {
      color: ${urgencyColor};
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #1e3a8a;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 The Commons</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Academic Publishing Platform</p>
  </div>
  
  <div class="content">
    <h2 style="color: #1e3a8a; font-family: 'Playfair Display', serif; margin-top: 0;">Review Reminder</h2>
    
    <p>Dear ${reviewerName},</p>
    
    <p>I hope this message finds you well. This is a ${reminderType === 'final' ? 'final' : 'friendly'} reminder about the review invitation for the manuscript "<strong>${manuscriptTitle}</strong>".</p>
    
    <div class="urgency-notice">
      <h3>${icon} ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining</h3>
      <p style="margin: 0; font-size: 16px;">
        ${reminderType === 'final' 
          ? 'This is your final reminder. Please respond as soon as possible.'
          : 'We would greatly appreciate your response at your earliest convenience.'
        }
      </p>
    </div>
    
    <p>Your expertise in this field would be invaluable for this manuscript evaluation. If you haven't had a chance to review the invitation yet, please take a moment to consider your availability.</p>
    
    <div style="text-align: center;">
      <a href="${responseUrl}" class="btn">📝 Respond to Invitation</a>
    </div>
    
    <p>If you have any questions or need additional information about the manuscript, please don't hesitate to contact me directly.</p>
    
    <p>Thank you for your time and consideration.</p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>Editorial Team</strong><br>
      The Commons
    </p>
  </div>
  
  <div class="footer">
    <p>This email was sent by The Commons Academic Publishing Platform.</p>
  </div>
</body>
</html>`
  }
}