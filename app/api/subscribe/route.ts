import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const subscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fields: z.array(z.string()).optional().default([]),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = subscriptionSchema.parse(body)
    
    const supabase = createServerClient()

    // Check if email already exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from('email_subscriptions')
      .select('id, email, fields, frequency, active')
      .eq('email', validatedData.email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError
    }

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('email_subscriptions')
        .update({
          fields: validatedData.fields,
          frequency: validatedData.frequency,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully!',
        subscription: {
          email: validatedData.email,
          fields: validatedData.fields,
          frequency: validatedData.frequency,
        }
      })
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('email_subscriptions')
        .insert({
          email: validatedData.email,
          name: validatedData.name,
          fields: validatedData.fields,
          frequency: validatedData.frequency,
          active: true,
          confirmed: false, // Will be confirmed via email
        })

      if (insertError) {
        throw insertError
      }

      // TODO: Send confirmation email
      // await sendConfirmationEmail(validatedData.email)

      return NextResponse.json({
        success: true,
        message: 'Subscription created! Please check your email to confirm.',
        subscription: {
          email: validatedData.email,
          fields: validatedData.fields,
          frequency: validatedData.frequency,
        }
      })
    }
  } catch (error) {
    console.error('Subscription error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid data provided',
        errors: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to create subscription. Please try again.',
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    searchParams.get('token') // TODO: Use for token validation

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email address is required',
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // Deactivate subscription
    const { error } = await supabase
      .from('email_subscriptions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('email', email)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from email alerts.',
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to unsubscribe. Please try again.',
    }, { status: 500 })
  }
}