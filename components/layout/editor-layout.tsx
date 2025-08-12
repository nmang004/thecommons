'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/sidebar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface EditorLayoutProps {
  children: ReactNode
  className?: string
}

export function EditorLayout({ children, className }: EditorLayoutProps) {
  const { user, isLoading } = useAuth()
  
  console.log('EditorLayout rendering for user:', user?.role)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You must be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Only */}
      <Sidebar userRole={user.role} />
      
      {/* Main Content - No Header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content - Full height without header */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6",
          className
        )}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}