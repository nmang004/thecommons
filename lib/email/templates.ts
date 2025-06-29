import { EMAIL_CONFIG, EmailTemplate } from './config'

interface SubmissionConfirmationData {
  authorName: string
  manuscriptTitle: string
  submissionNumber: string
  manuscriptId: string
}

interface StatusUpdateData {
  authorName: string
  manuscriptTitle: string
  submissionNumber: string
  manuscriptId: string
  newStatus: string
  statusMessage: string
  editorName?: string
  editorMessage?: string
}

interface PaymentConfirmationData {
  authorName: string
  manuscriptTitle: string
  submissionNumber: string
  amount: number
  paymentId: string
  receiptUrl?: string
}

interface ReviewInvitationData {
  reviewerName: string
  manuscriptTitle: string
  abstract: string
  fieldOfStudy: string
  editorName: string
  dueDate: string
  estimatedHours: string
  acceptUrl: string
  declineUrl: string
}

interface EditorialDecisionData {
  authorName: string
  manuscriptTitle: string
  submissionNumber: string
  manuscriptId: string
  decision: string
  decisionLetter: string
  editorName: string
}

export function createSubmissionConfirmationEmail(data: SubmissionConfirmationData): EmailTemplate {
  const { authorName, manuscriptTitle, submissionNumber, manuscriptId } = data
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Submission Confirmation - ${EMAIL_CONFIG.APP_NAME}</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #1e3a8a; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700;">
            ${EMAIL_CONFIG.APP_NAME}
          </h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Academic Publishing Platform</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 style="color: #059669; margin: 0; font-size: 20px; font-weight: 600;">Submission Successful!</h2>
          </div>
          
          <p style="margin-bottom: 24px;">Dear ${authorName},</p>
          
          <p style="margin-bottom: 24px;">
            Thank you for submitting your manuscript to ${EMAIL_CONFIG.APP_NAME}. We have successfully received your submission and payment.
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Submission Details</h3>
            <div style="display: grid; gap: 8px;">
              <div><strong>Title:</strong> ${manuscriptTitle}</div>
              <div><strong>Submission Number:</strong> ${submissionNumber}</div>
              <div><strong>Status:</strong> <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Submitted</span></div>
            </div>
          </div>
          
          <h3 style="color: #374151; margin: 24px 0 16px 0;">Next Steps</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Your manuscript will be assigned to an editor within 3-5 business days</li>
            <li style="margin-bottom: 8px;">The editor will conduct an initial review and may send it for peer review</li>
            <li style="margin-bottom: 8px;">You will receive email updates at each stage of the process</li>
            <li style="margin-bottom: 8px;">The typical review process takes 4-8 weeks</li>
          </ol>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.APP_URL}/author/submissions/${manuscriptId}" 
               style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              View Submission Status
            </a>
          </div>
          
          <p style="margin-bottom: 8px;">
            If you have any questions, please don't hesitate to contact our editorial team at 
            <a href="mailto:${EMAIL_CONFIG.REPLY_TO}" style="color: #1e3a8a;">${EMAIL_CONFIG.REPLY_TO}</a>.
          </p>
          
          <p style="margin-bottom: 0;">
            Best regards,<br>
            The ${EMAIL_CONFIG.APP_NAME} Editorial Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © 2024 ${EMAIL_CONFIG.APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Submission Confirmation - ${EMAIL_CONFIG.APP_NAME}
    
    Dear ${authorName},
    
    Thank you for submitting your manuscript to ${EMAIL_CONFIG.APP_NAME}. We have successfully received your submission and payment.
    
    Submission Details:
    - Title: ${manuscriptTitle}
    - Submission Number: ${submissionNumber}
    - Status: Submitted
    
    Next Steps:
    1. Your manuscript will be assigned to an editor within 3-5 business days
    2. The editor will conduct an initial review and may send it for peer review
    3. You will receive email updates at each stage of the process
    4. The typical review process takes 4-8 weeks
    
    View your submission status: ${EMAIL_CONFIG.APP_URL}/author/submissions/${manuscriptId}
    
    If you have any questions, please contact us at ${EMAIL_CONFIG.REPLY_TO}.
    
    Best regards,
    The ${EMAIL_CONFIG.APP_NAME} Editorial Team
  `

  return {
    to: data.authorName,
    subject: `Submission Confirmed: ${submissionNumber}`,
    html,
    text,
  }
}

export function createStatusUpdateEmail(data: StatusUpdateData): EmailTemplate {
  const { authorName, manuscriptTitle, submissionNumber, manuscriptId, newStatus, statusMessage } = data
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'with_editor': return { bg: '#dbeafe', color: '#1e40af' }
      case 'under_review': return { bg: '#fef3c7', color: '#d97706' }
      case 'revisions_requested': return { bg: '#fed7aa', color: '#ea580c' }
      case 'accepted': return { bg: '#d1fae5', color: '#059669' }
      case 'published': return { bg: '#dcfce7', color: '#16a34a' }
      case 'rejected': return { bg: '#fee2e2', color: '#dc2626' }
      default: return { bg: '#f3f4f6', color: '#374151' }
    }
  }
  
  const statusStyle = getStatusColor(newStatus)
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Status Update - ${EMAIL_CONFIG.APP_NAME}</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #1e3a8a; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700;">
            ${EMAIL_CONFIG.APP_NAME}
          </h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Submission Status Update</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="margin-bottom: 24px;">Dear ${authorName},</p>
          
          <p style="margin-bottom: 24px;">
            We have an update regarding your manuscript submission:
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Submission Details</h3>
            <div style="display: grid; gap: 8px;">
              <div><strong>Title:</strong> ${manuscriptTitle}</div>
              <div><strong>Submission Number:</strong> ${submissionNumber}</div>
              <div>
                <strong>New Status:</strong> 
                <span style="background-color: ${statusStyle.bg}; color: ${statusStyle.color}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                  ${newStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <h4 style="margin: 0 0 8px 0; color: #92400e;">Status Update</h4>
            <p style="margin: 0; color: #78350f;">${statusMessage}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.APP_URL}/author/submissions/${manuscriptId}" 
               style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              View Full Details
            </a>
          </div>
          
          <p style="margin-bottom: 8px;">
            If you have any questions about this update, please contact us at 
            <a href="mailto:${EMAIL_CONFIG.REPLY_TO}" style="color: #1e3a8a;">${EMAIL_CONFIG.REPLY_TO}</a>.
          </p>
          
          <p style="margin-bottom: 0;">
            Best regards,<br>
            The ${EMAIL_CONFIG.APP_NAME} Editorial Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © 2024 ${EMAIL_CONFIG.APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Status Update - ${EMAIL_CONFIG.APP_NAME}
    
    Dear ${authorName},
    
    We have an update regarding your manuscript submission:
    
    Submission Details:
    - Title: ${manuscriptTitle}
    - Submission Number: ${submissionNumber}
    - New Status: ${newStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    
    Status Update: ${statusMessage}
    
    View full details: ${EMAIL_CONFIG.APP_URL}/author/submissions/${manuscriptId}
    
    If you have any questions, please contact us at ${EMAIL_CONFIG.REPLY_TO}.
    
    Best regards,
    The ${EMAIL_CONFIG.APP_NAME} Editorial Team
  `

  return {
    to: data.authorName,
    subject: `Status Update: ${submissionNumber} - ${newStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    html,
    text,
  }
}

export function createPaymentConfirmationEmail(data: PaymentConfirmationData): EmailTemplate {
  const { authorName, manuscriptTitle, submissionNumber, amount, paymentId, receiptUrl } = data
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation - ${EMAIL_CONFIG.APP_NAME}</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #1e3a8a; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700;">
            ${EMAIL_CONFIG.APP_NAME}
          </h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Payment Confirmation</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <h2 style="color: #059669; margin: 0; font-size: 20px; font-weight: 600;">Payment Received!</h2>
          </div>
          
          <p style="margin-bottom: 24px;">Dear ${authorName},</p>
          
          <p style="margin-bottom: 24px;">
            Thank you for your payment. We have successfully processed your Article Processing Charge (APC) for your manuscript submission.
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Payment Details</h3>
            <div style="display: grid; gap: 8px;">
              <div><strong>Manuscript:</strong> ${manuscriptTitle}</div>
              <div><strong>Submission Number:</strong> ${submissionNumber}</div>
              <div><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)} USD</div>
              <div><strong>Payment ID:</strong> ${paymentId}</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          
          ${receiptUrl ? `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${receiptUrl}" 
               style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Download Receipt
            </a>
          </div>
          ` : ''}
          
          <p style="margin-bottom: 24px;">
            Your manuscript is now officially submitted and will enter our editorial review process. You will receive updates as it progresses through peer review.
          </p>
          
          <p style="margin-bottom: 8px;">
            For any billing questions, please contact us at 
            <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: #1e3a8a;">${EMAIL_CONFIG.SUPPORT_EMAIL}</a>.
          </p>
          
          <p style="margin-bottom: 0;">
            Best regards,<br>
            The ${EMAIL_CONFIG.APP_NAME} Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © 2024 ${EMAIL_CONFIG.APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    to: data.authorName,
    subject: `Payment Confirmed: ${submissionNumber}`,
    html,
    text: `Payment Confirmation - ${EMAIL_CONFIG.APP_NAME}\n\nDear ${authorName},\n\nThank you for your payment. We have successfully processed your Article Processing Charge (APC) of $${(amount / 100).toFixed(2)} for submission ${submissionNumber}.\n\nYour manuscript "${manuscriptTitle}" is now officially submitted and will enter our editorial review process.\n\nPayment ID: ${paymentId}\n\nBest regards,\nThe ${EMAIL_CONFIG.APP_NAME} Team`,
  }
}

export function createReviewInvitationEmail(data: ReviewInvitationData): EmailTemplate {
  const { reviewerName, manuscriptTitle, abstract, fieldOfStudy, editorName, dueDate, estimatedHours, acceptUrl, declineUrl } = data
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Review Invitation - ${EMAIL_CONFIG.APP_NAME}</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #1e3a8a; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700;">
            ${EMAIL_CONFIG.APP_NAME}
          </h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Peer Review Invitation</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background-color: #8b5cf6; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h2 style="color: #7c3aed; margin: 0; font-size: 20px; font-weight: 600;">Review Invitation</h2>
          </div>
          
          <p style="margin-bottom: 24px;">Dear Dr. ${reviewerName},</p>
          
          <p style="margin-bottom: 24px;">
            You have been invited by <strong>${editorName}</strong> to review a manuscript for ${EMAIL_CONFIG.APP_NAME}. 
            We believe your expertise in <strong>${fieldOfStudy}</strong> makes you an ideal reviewer for this submission.
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Manuscript Details</h3>
            <div style="display: grid; gap: 12px;">
              <div><strong>Title:</strong> ${manuscriptTitle}</div>
              <div><strong>Field:</strong> ${fieldOfStudy}</div>
              <div><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</div>
              <div><strong>Estimated Time:</strong> ${estimatedHours} hours</div>
            </div>
          </div>
          
          <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 24px 0;">
            <h4 style="margin: 0 0 8px 0; color: #a16207;">Abstract</h4>
            <p style="margin: 0; color: #713f12; font-style: italic; line-height: 1.5;">${abstract}</p>
          </div>
          
          <h3 style="color: #374151; margin: 24px 0 16px 0;">Review Process</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">This is a double-blind peer review (your identity will remain anonymous)</li>
            <li style="margin-bottom: 8px;">You will have ${Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days to complete the review</li>
            <li style="margin-bottom: 8px;">Our online platform makes the review process simple and efficient</li>
            <li style="margin-bottom: 8px;">You will receive recognition for your contribution to scholarly publishing</li>
          </ul>
          
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-flex; gap: 12px;">
              <a href="${acceptUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Accept Invitation
              </a>
              <a href="${declineUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Decline
              </a>
            </div>
          </div>
          
          <p style="margin-bottom: 8px; font-size: 14px; color: #6b7280;">
            Please respond within 48 hours. If you cannot review this manuscript, we would appreciate a brief reason 
            to help us improve our reviewer matching process.
          </p>
          
          <p style="margin-bottom: 8px;">
            If you have any questions, please contact the editor ${editorName} at 
            <a href="mailto:${EMAIL_CONFIG.REPLY_TO}" style="color: #1e3a8a;">${EMAIL_CONFIG.REPLY_TO}</a>.
          </p>
          
          <p style="margin-bottom: 0;">
            Thank you for your contribution to scholarly publishing,<br>
            The ${EMAIL_CONFIG.APP_NAME} Editorial Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © 2024 ${EMAIL_CONFIG.APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Review Invitation - ${EMAIL_CONFIG.APP_NAME}
    
    Dear Dr. ${reviewerName},
    
    You have been invited by ${editorName} to review a manuscript for ${EMAIL_CONFIG.APP_NAME}.
    
    Manuscript Details:
    - Title: ${manuscriptTitle}
    - Field: ${fieldOfStudy}
    - Due Date: ${new Date(dueDate).toLocaleDateString()}
    - Estimated Time: ${estimatedHours} hours
    
    Abstract: ${abstract}
    
    To accept this invitation: ${acceptUrl}
    To decline this invitation: ${declineUrl}
    
    Please respond within 48 hours.
    
    Thank you for your contribution to scholarly publishing,
    The ${EMAIL_CONFIG.APP_NAME} Editorial Team
  `

  return {
    to: reviewerName,
    subject: `Review Invitation: ${manuscriptTitle.substring(0, 50)}${manuscriptTitle.length > 50 ? '...' : ''}`,
    html,
    text,
  }
}

export function createEditorialDecisionEmail(data: EditorialDecisionData): EmailTemplate {
  const { authorName, manuscriptTitle, submissionNumber, manuscriptId, decision, decisionLetter, editorName } = data
  
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'accepted': return { bg: '#d1fae5', color: '#059669', icon: '✓' }
      case 'revisions_requested': return { bg: '#fed7aa', color: '#ea580c', icon: '↻' }
      case 'rejected': return { bg: '#fee2e2', color: '#dc2626', icon: '✗' }
      default: return { bg: '#f3f4f6', color: '#374151', icon: '•' }
    }
  }
  
  const decisionStyle = getDecisionColor(decision)
  const decisionTitle = decision.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Editorial Decision - ${EMAIL_CONFIG.APP_NAME}</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #1e3a8a; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700;">
            ${EMAIL_CONFIG.APP_NAME}
          </h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Editorial Decision</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background-color: ${decisionStyle.color}; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; font-weight: bold;">
              ${decisionStyle.icon}
            </div>
            <h2 style="color: ${decisionStyle.color}; margin: 0; font-size: 20px; font-weight: 600;">${decisionTitle}</h2>
          </div>
          
          <p style="margin-bottom: 24px;">Dear ${authorName},</p>
          
          <p style="margin-bottom: 24px;">
            We have completed the editorial review of your manuscript and are writing to inform you of our decision.
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Submission Details</h3>
            <div style="display: grid; gap: 8px;">
              <div><strong>Title:</strong> ${manuscriptTitle}</div>
              <div><strong>Submission Number:</strong> ${submissionNumber}</div>
              <div><strong>Decision:</strong> 
                <span style="background-color: ${decisionStyle.bg}; color: ${decisionStyle.color}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                  ${decisionTitle}
                </span>
              </div>
              <div><strong>Editor:</strong> ${editorName}</div>
            </div>
          </div>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
            <h4 style="margin: 0 0 12px 0; color: #92400e;">Decision Letter</h4>
            <div style="color: #78350f; white-space: pre-line; line-height: 1.6;">${decisionLetter}</div>
          </div>
          
          ${decision === 'revisions_requested' ? `
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">Next Steps</h4>
            <p style="margin: 0; color: #1e3a8a;">
              Please address the reviewers' comments and resubmit your revised manuscript through our online system. 
              You will have 60 days to submit your revision.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.APP_URL}/author/submissions/${manuscriptId}" 
               style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              View Full Details
            </a>
          </div>
          
          <p style="margin-bottom: 8px;">
            If you have any questions about this decision, please contact the editor at 
            <a href="mailto:${EMAIL_CONFIG.REPLY_TO}" style="color: #1e3a8a;">${EMAIL_CONFIG.REPLY_TO}</a>.
          </p>
          
          <p style="margin-bottom: 0;">
            Thank you for submitting your work to ${EMAIL_CONFIG.APP_NAME},<br>
            ${editorName}<br>
            Editor, ${EMAIL_CONFIG.APP_NAME}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © 2024 ${EMAIL_CONFIG.APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Editorial Decision - ${EMAIL_CONFIG.APP_NAME}
    
    Dear ${authorName},
    
    We have completed the editorial review of your manuscript and are writing to inform you of our decision.
    
    Submission Details:
    - Title: ${manuscriptTitle}
    - Submission Number: ${submissionNumber}
    - Decision: ${decisionTitle}
    - Editor: ${editorName}
    
    Decision Letter:
    ${decisionLetter}
    
    View full details: ${EMAIL_CONFIG.APP_URL}/author/submissions/${manuscriptId}
    
    If you have any questions, please contact us at ${EMAIL_CONFIG.REPLY_TO}.
    
    Thank you for submitting your work to ${EMAIL_CONFIG.APP_NAME},
    ${editorName}
    Editor, ${EMAIL_CONFIG.APP_NAME}
  `

  return {
    to: authorName,
    subject: `Editorial Decision: ${submissionNumber} - ${decisionTitle}`,
    html,
    text,
  }
}