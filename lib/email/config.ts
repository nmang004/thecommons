import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

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