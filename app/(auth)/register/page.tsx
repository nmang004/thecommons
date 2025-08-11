'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isLoading && user) {
      router.push('/author')
    }
  }, [user, isLoading, router])

  // Auto-redirect to Auth0 signup
  useEffect(() => {
    if (!isLoading && !user) {
      // Small delay to show the loading state
      const timer = setTimeout(() => {
        // Redirect to Auth0 with signup hint
        window.location.href = `/api/auth/auth0/login?screen_hint=signup&returnTo=${encodeURIComponent('/author')}`
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isLoading, user])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Creating your account...
          </h1>
          <p className="text-gray-600 mb-6">
            Redirecting to secure registration
          </p>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              You will be redirected to create your account
            </p>
            
            <Button
              onClick={() => window.location.href = `/api/auth/auth0/login?screen_hint=signup&returnTo=${encodeURIComponent('/author')}`}
              variant="outline"
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Click here if not redirected
            </Button>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => window.location.href = `/api/auth/auth0/login`}
                className="text-primary hover:text-primary/80 font-medium underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}