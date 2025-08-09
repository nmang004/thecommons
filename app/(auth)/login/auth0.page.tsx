'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'

function LoginContent() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/author'

  useEffect(() => {
    // Redirect to Auth0 Universal Login
    const loginUrl = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    window.location.href = loginUrl
  }, [returnTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-8 h-8 mx-auto mb-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
          Redirecting to Login
        </h1>
        <p className="text-gray-600">
          Taking you to our secure login page...
        </p>
      </Card>
    </div>
  )
}

export default function Auth0LoginPage() {
  return <LoginContent />
}