import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: manuscriptId } = await params
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify user owns the manuscript
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('*')
      .eq('id', manuscriptId)
      .eq('author_id', user.id)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json(
        { error: 'Manuscript not found or access denied' },
        { status: 404 }
      )
    }

    // Verify manuscript has required files
    const { data: files, error: filesError } = await supabase
      .from('manuscript_files')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .eq('file_type', 'manuscript_main')

    if (filesError || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Main manuscript file is required before payment' },
        { status: 400 }
      )
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .single()

    if (existingPayment && existingPayment.status === 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has already been completed for this manuscript' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.CURRENCY,
            product_data: {
              name: 'Article Processing Charge (APC)',
              description: `Publication fee for: ${manuscript.title}`,
              metadata: {
                manuscript_id: manuscriptId,
                submission_number: manuscript.submission_number || '',
              },
            },
            unit_amount: STRIPE_CONFIG.APC_AMOUNT,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: profile.email,
      metadata: {
        manuscript_id: manuscriptId,
        user_id: user.id,
        submission_number: manuscript.submission_number || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/author/submissions/${manuscriptId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/author/submit?step=6&manuscript=${manuscriptId}`,
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: false, // Enable if you need tax collection
      },
    })

    // Log the checkout session creation
    await supabase
      .from('activity_logs')
      .insert({
        manuscript_id: manuscriptId,
        user_id: user.id,
        action: 'checkout_session_created',
        details: {
          session_id: session.id,
          amount: STRIPE_CONFIG.APC_AMOUNT,
        },
      })

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    })

  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}