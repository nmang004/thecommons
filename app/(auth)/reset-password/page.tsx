'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    // This page is shown after a successful password reset from Auth0
    // Auth0 handles the actual password reset, this is just a success page
    const timer = setTimeout(() => {
      router.push('/login')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Password Reset Successful
          </h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to login...
            </div>
            
            <Button asChild className="w-full">
              <Link href="/login">
                Continue to Login
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}