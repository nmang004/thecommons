'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'

type VerificationStatus = 'checking' | 'verified' | 'already-verified' | 'error'

function VerifyEmailContent() {
  const [status, setStatus] = useState<VerificationStatus>('checking')
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Auth0 handles email verification internally
  // This page is shown when users need to verify their email
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.emailVerified) {
          setStatus('already-verified')
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/author')
          }, 2000)
        } else {
          setStatus('verified')
        }
      } else {
        // Check if coming from Auth0 verification
        const message = searchParams.get('message')
        const success = searchParams.get('success')
        
        if (success === 'true') {
          setStatus('verified')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else if (message) {
          setStatus('error')
        } else {
          setStatus('error')
        }
      }
    }
  }, [user, isLoading, router, searchParams])

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Checking verification status...
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your email
            </p>
          </div>
        )

      case 'verified':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now access your account.
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to login...
            </div>
            <Button asChild className="w-full">
              <Link href="/login">
                Continue to Login
              </Link>
            </Button>
          </div>
        )

      case 'already-verified':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Already Verified
            </h1>
            <p className="text-gray-600 mb-6">
              Your email is already verified. Redirecting to your dashboard...
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting...
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              The verification link is invalid or has expired. Please request a new verification email.
            </p>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Check your email for a verification link from Auth0
              </p>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  <Mail className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
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
        
        {status === 'error' && (
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

export default function VerifyEmailPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <Card className="w-full max-w-md p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                Loading...
              </h1>
            </div>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}