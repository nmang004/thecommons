'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useErrorTracking } from '@/lib/monitoring/error-tracker'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Track the error
    if (typeof window !== 'undefined') {
      import('@/lib/monitoring/error-tracker').then(({ clientErrorMonitor }) => {
        if (clientErrorMonitor) {
          clientErrorMonitor.trackReactError(error, errorInfo)
        }
      })
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    console.error('React Error Boundary caught an error:', error)
    console.error('Error Info:', errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 max-w-lg w-full text-center">
        <div className="mb-6">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. This has been automatically reported to our team.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
            <h3 className="font-semibold text-red-800 mb-2">Error Details (Development)</h3>
            <pre className="text-sm text-red-700 overflow-x-auto whitespace-pre-wrap">
              {error.message}
            </pre>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-red-800 font-medium">
                  Stack Trace
                </summary>
                <pre className="text-xs text-red-600 mt-2 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetError} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={handleReload} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
          <Button onClick={handleGoHome}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact our support team.
          </p>
        </div>
      </Card>
    </div>
  )
}

// Hook for functional components
export function useErrorBoundary() {
  const { trackError } = useErrorTracking()
  
  return {
    captureError: (error: Error, context?: string) => {
      trackError(error, { componentStack: context || 'Manual error capture' })
    }
  }
}

// Main export
export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  )
}

// Page-level error boundary
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Additional page-level error handling
        console.error('Page-level error:', error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Component-level error boundary with custom fallback
export function ComponentErrorBoundary({ 
  children, 
  componentName = 'Component' 
}: { 
  children: React.ReactNode
  componentName?: string
}) {
  const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="flex items-center space-x-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold text-red-800">{componentName} Error</h3>
      </div>
      <p className="text-sm text-red-700 mb-4">
        This component encountered an error and couldn't render properly.
      </p>
      <Button onClick={resetError} size="sm" variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </Card>
  )

  return (
    <ErrorBoundary fallback={CustomFallback}>
      {children}
    </ErrorBoundary>
  )
}