'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  // Auto-redirect to Auth0 password reset
  useEffect(() => {
    // Small delay to show the loading state
    const timer = setTimeout(() => {
      // Auth0 handles password reset through their Universal Login
      // We'll redirect to login with a password reset hint
      window.location.href = `/api/auth/auth0/login?screen_hint=reset-password`
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Password Reset
          </h1>
          <p className="text-gray-600 mb-6">
            Redirecting to password reset...
          </p>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              You will be redirected to reset your password
            </p>
            
            <Button
              onClick={() => window.location.href = `/api/auth/auth0/login?screen_hint=reset-password`}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Click here if not redirected
            </Button>
          </div>
          
          <div className="mt-8">
            <Link
              onClick={() => window.location.href = `/api/auth/auth0/login`}
              href="#"
              className="inline-flex items-center text-sm text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}