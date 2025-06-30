import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey || apiKey === 'your_resend_api_key_here') {
      // During build time or when API key is not set, return a mock client
      console.warn('RESEND_API_KEY not configured, email sending will be disabled')
      
      // Return a mock Resend client that won't actually send emails
      return {
        emails: {
          send: async () => ({
            data: { id: 'mock-email-id' },
            error: null
          }),
          sendBatch: async () => ({
            data: [{ id: 'mock-email-id' }],
            error: null
          })
        }
      } as any
    }
    
    resendClient = new Resend(apiKey)
  }
  
  return resendClient
}

// For backward compatibility
export const resend = {
  emails: {
    send: async (params: any) => {
      const client = getResendClient()
      return client.emails.send(params)
    }
  }
}

export const EMAIL_CONFIG = {
  FROM_EMAIL: 'The Commons <noreply@thecommons.org>',
  REPLY_TO: 'editorial@thecommons.org',
  SUPPORT_EMAIL: 'support@thecommons.org',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  APP_NAME: 'The Commons',
} as const

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}