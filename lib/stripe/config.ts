import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    if (!secretKey || secretKey === 'your_stripe_secret_key_here') {
      // During build time or when API key is not set, return a mock client
      console.warn('STRIPE_SECRET_KEY not configured, payment processing will be disabled')
      
      // Return a mock Stripe client that won't actually process payments
      return {
        checkout: {
          sessions: {
            create: async () => ({
              id: 'mock-session-id',
              url: 'https://checkout.stripe.com/mock',
            }),
            retrieve: async () => ({
              id: 'mock-session-id',
              payment_status: 'paid',
              metadata: {},
            }),
          },
        },
        paymentIntents: {
          create: async () => ({
            id: 'mock-payment-intent',
            status: 'succeeded',
          }),
          retrieve: async () => ({
            id: 'mock-payment-intent',
            status: 'succeeded',
          }),
        },
        webhookEndpoints: {
          create: async () => ({
            id: 'mock-webhook-id',
            url: 'https://example.com/webhook',
            secret: 'mock-secret',
          }),
        },
        webhooks: {
          constructEvent: () => ({
            type: 'mock-event',
            data: { object: {} },
          }),
        },
      } as any
    }
    
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    })
  }
  
  return stripeClient
}

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripeClient()
    return Reflect.get(client, prop, receiver)
  },
})

export const STRIPE_CONFIG = {
  APC_AMOUNT: 20000, // $200.00 in cents
  CURRENCY: 'usd',
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
} as const

export function formatCurrency(amountInCents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100)
}