'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

function LoginContent() {
  const { user, login, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnTo = searchParams.get('returnTo') || searchParams.get('redirect') || '/author'

  useEffect(() => {
    // If user is already logged in, redirect to their intended destination
    if (!isLoading && user) {
      router.push(returnTo)
    }
  }, [user, isLoading, router, returnTo])

  // Auto-redirect to Auth0 login
  useEffect(() => {
    if (!isLoading && !user) {
      // Small delay to show the loading state
      const timer = setTimeout(() => {
        login(returnTo)
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isLoading, user, login, returnTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Signing you in...
          </h1>
          <p className="text-gray-600 mb-6">
            Redirecting to secure authentication
          </p>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              You will be redirected to our secure login page
            </p>
            
            <Button
              onClick={() => login(returnTo)}
              variant="outline"
              className="w-full"
            >
              Click here if not redirected
            </Button>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-8 h-8 mx-auto mb-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-gray-600">Loading...</p>
          </Card>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}