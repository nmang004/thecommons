'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Mail, Loader2, ArrowRight } from 'lucide-react'

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const email = searchParams.get('email')
  
  const supabase = createClient()

  const verifyToken = useCallback(async () => {
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token!,
          type: 'signup',
        })
        
        if (error) {
          console.error('Verification error:', error)
          setStatus('error')
        } else {
          setStatus('success')
          // Redirect to dashboard after successful verification
          setTimeout(() => {
            router.push('/author')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
    }
  }, [type, token, supabase.auth, router])

  const checkVerificationStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        if (user.email_confirmed_at) {
          setStatus('success')
          setUserEmail(user.email || '')
        } else {
          setStatus('loading')
          setUserEmail(user.email || '')
        }
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Status check error:', error)
      setStatus('error')
    }
  }, [supabase.auth])

  useEffect(() => {
    if (email) {
      setUserEmail(email)
    }
    
    // If we have a token and type, this is likely a verification callback
    if (token && type) {
      verifyToken()
    } else {
      // Otherwise, show the verification status page
      setStatus('loading')
      checkVerificationStatus()
    }
  }, [token, type, email, checkVerificationStatus, verifyToken])

  const handleResendVerification = async () => {
    if (!userEmail) return
    
    setIsResending(true)
    setResendSuccess(false)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Resend error:', error)
      } else {
        setResendSuccess(true)
      }
    } catch (error) {
      console.error('Resend error:', error)
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Verifying your email
            </h1>
            <p className="text-gray-600 mb-6">
              Please wait while we verify your email address...
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Email verified successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your email address has been verified. You can now access your account.
            </p>
            <Button onClick={() => router.push('/author')} className="w-full">
              Continue to dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Verification failed
            </h1>
            <p className="text-gray-600 mb-6">
              The verification link is invalid or has expired. 
              {userEmail && ' Please request a new verification email.'}
            </p>
            
            {userEmail && (
              <div className="space-y-4">
                {resendSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      Verification email sent to {userEmail}
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend verification email
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <div className="mt-6">
              <Link
                href="/login"
                className="text-sm text-primary hover:text-primary/80"
              >
                Back to login
              </Link>
            </div>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Link expired
            </h1>
            <p className="text-gray-600 mb-6">
              This verification link has expired. Please request a new one.
            </p>
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send new verification email
                </>
              )}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8">
        {renderContent()}
        
        {status !== 'success' && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link
                href="/contact"
                className="text-primary hover:text-primary/80"
              >
                Contact support
              </Link>
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}