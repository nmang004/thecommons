import { resend, EMAIL_CONFIG, EmailTemplate } from './config'
import { 
  createSubmissionConfirmationEmail, 
  createStatusUpdateEmail, 
  createPaymentConfirmationEmail 
} from './templates'

export class EmailService {
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const result = await resend.emails.send({
        from: EMAIL_CONFIG.FROM_EMAIL,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        reply_to: EMAIL_CONFIG.REPLY_TO,
      })

      console.log('Email sent successfully:', result.data?.id)
      return true
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  static async sendSubmissionConfirmation(data: {
    authorEmail: string
    authorName: string
    manuscriptTitle: string
    submissionNumber: string
    manuscriptId: string
  }) {
    const template = createSubmissionConfirmationEmail({
      authorName: data.authorName,
      manuscriptTitle: data.manuscriptTitle,
      submissionNumber: data.submissionNumber,
      manuscriptId: data.manuscriptId,
    })

    template.to = data.authorEmail
    return await this.sendEmail(template)
  }

  static async sendStatusUpdate(data: {
    authorEmail: string
    authorName: string
    manuscriptTitle: string
    submissionNumber: string
    manuscriptId: string
    newStatus: string
    statusMessage: string
    editorName?: string
    editorMessage?: string
  }) {
    const template = createStatusUpdateEmail(data)
    template.to = data.authorEmail
    return await this.sendEmail(template)
  }

  static async sendPaymentConfirmation(data: {
    authorEmail: string
    authorName: string
    manuscriptTitle: string
    submissionNumber: string
    amount: number
    paymentId: string
    receiptUrl?: string
  }) {
    const template = createPaymentConfirmationEmail(data)
    template.to = data.authorEmail
    return await this.sendEmail(template)
  }

  static async sendEditorAssignment(data: {
    editorEmail: string
    editorName: string
    manuscriptTitle: string
    submissionNumber: string
    manuscriptId: string
    authorName: string
  }) {
    const template: EmailTemplate = {
      to: data.editorEmail,
      subject: `New Manuscript Assignment: ${data.submissionNumber}`,
      html: `
        <h2>New Manuscript Assignment</h2>
        <p>Dear ${data.editorName},</p>
        <p>A new manuscript has been assigned to you for editorial review:</p>
        <ul>
          <li><strong>Title:</strong> ${data.manuscriptTitle}</li>
          <li><strong>Submission Number:</strong> ${data.submissionNumber}</li>
          <li><strong>Author:</strong> ${data.authorName}</li>
        </ul>
        <p><a href="${EMAIL_CONFIG.APP_URL}/editor/manuscripts/${data.manuscriptId}">Review Manuscript</a></p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.APP_NAME} Editorial System</p>
      `,
    }

    return await this.sendEmail(template)
  }

  static async sendReviewerInvitation(data: {
    reviewerEmail: string
    reviewerName: string
    manuscriptTitle: string
    submissionNumber: string
    assignmentId: string
    dueDate: string
  }) {
    const template: EmailTemplate = {
      to: data.reviewerEmail,
      subject: `Review Invitation: ${data.submissionNumber}`,
      html: `
        <h2>Peer Review Invitation</h2>
        <p>Dear ${data.reviewerName},</p>
        <p>You have been invited to review a manuscript for ${EMAIL_CONFIG.APP_NAME}:</p>
        <ul>
          <li><strong>Title:</strong> ${data.manuscriptTitle}</li>
          <li><strong>Submission Number:</strong> ${data.submissionNumber}</li>
          <li><strong>Due Date:</strong> ${data.dueDate}</li>
        </ul>
        <p>Please respond within 7 days to accept or decline this invitation.</p>
        <p><a href="${EMAIL_CONFIG.APP_URL}/reviewer/invitations/${data.assignmentId}">Respond to Invitation</a></p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.APP_NAME} Editorial Team</p>
      `,
    }

    return await this.sendEmail(template)
  }
}