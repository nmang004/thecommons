import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !STRIPE_CONFIG.WEBHOOK_SECRET) {
      console.error('Missing stripe signature or webhook secret')
      return NextResponse.json(
        { error: 'Missing stripe signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        const manuscriptId = session.metadata?.manuscript_id
        const userId = session.metadata?.user_id

        if (!manuscriptId || !userId) {
          console.error('Missing metadata in checkout session:', session.id)
          return NextResponse.json(
            { error: 'Missing required metadata' },
            { status: 400 }
          )
        }

        // Get the PaymentIntent to access payment details
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        )

        // Create payment record
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            manuscript_id: manuscriptId,
            stripe_charge_id: paymentIntent.latest_charge as string,
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            receipt_url: paymentIntent.charges.data[0]?.receipt_url,
            billing_details: session.customer_details,
          })
          .select()
          .single()

        if (paymentError) {
          console.error('Payment record creation error:', paymentError)
          return NextResponse.json(
            { error: 'Failed to create payment record' },
            { status: 500 }
          )
        }

        // Update manuscript status to submitted
        const { error: manuscriptError } = await supabase
          .from('manuscripts')
          .update({
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', manuscriptId)

        if (manuscriptError) {
          console.error('Manuscript status update error:', manuscriptError)
          // Don't return error as payment was successful
        }

        // Log the successful payment
        await supabase
          .from('activity_logs')
          .insert({
            manuscript_id: manuscriptId,
            user_id: userId,
            action: 'payment_completed',
            details: {
              payment_id: payment.id,
              amount: paymentIntent.amount,
              stripe_payment_intent_id: paymentIntent.id,
            },
          })

        // Create notification for the user
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'submission_success',
            title: 'Manuscript Submitted Successfully',
            message: 'Your manuscript has been submitted and payment processed. It will now undergo editorial review.',
            data: {
              manuscript_id: manuscriptId,
              payment_id: payment.id,
            },
          })

        // Send email notifications
        try {
          // Get manuscript and author details for email
          const { data: manuscriptDetails } = await supabase
            .from('manuscripts')
            .select(`
              *,
              profiles!manuscripts_author_id_fkey(full_name, email)
            `)
            .eq('id', manuscriptId)
            .single()

          if (manuscriptDetails) {
            const { EmailService } = await import('@/lib/email/service')
            
            // Send submission confirmation email
            await EmailService.sendSubmissionConfirmation({
              authorEmail: manuscriptDetails.profiles.email,
              authorName: manuscriptDetails.profiles.full_name,
              manuscriptTitle: manuscriptDetails.title,
              submissionNumber: manuscriptDetails.submission_number,
              manuscriptId: manuscriptId,
            })

            // Send payment confirmation email
            await EmailService.sendPaymentConfirmation({
              authorEmail: manuscriptDetails.profiles.email,
              authorName: manuscriptDetails.profiles.full_name,
              manuscriptTitle: manuscriptDetails.title,
              submissionNumber: manuscriptDetails.submission_number,
              amount: paymentIntent.amount,
              paymentId: payment.id,
              receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
            })
          }
        } catch (emailError) {
          console.error('Email notification error:', emailError)
          // Don't fail the webhook if email fails
        }

        console.log(`Payment completed for manuscript ${manuscriptId}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Log the failed payment
        await supabase
          .from('activity_logs')
          .insert({
            action: 'payment_failed',
            details: {
              payment_intent_id: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message,
            },
          })

        console.log(`Payment failed for PaymentIntent ${paymentIntent.id}`)
        break
      }

      case 'invoice.payment_succeeded': {
        // Handle subscription payments if needed in the future
        console.log('Invoice payment succeeded:', event.data.object.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook handling error:', error)
    return NextResponse.json(
      { error: 'Webhook handling failed' },
      { status: 500 }
    )
  }
}