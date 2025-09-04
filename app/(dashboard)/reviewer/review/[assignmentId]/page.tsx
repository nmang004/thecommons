import { Suspense } from 'react'
import { DemoReviewInterface } from '@/components/dashboard/reviewer/demo-review-interface'

interface PageProps {
  params: Promise<{
    assignmentId: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

export default async function ReviewSubmissionPage({ params, searchParams }: PageProps) {
  const { assignmentId } = await params
  const { mode } = await searchParams
  
  // For demo purposes, we'll show a simplified review interface
  // In production, this would authenticate users and fetch real data
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading review interface...</p>
          </div>
        }>
          <DemoReviewInterface 
            assignmentId={assignmentId}
            mode={mode === 'view' ? 'view' : 'review'}
          />
        </Suspense>
      </div>
    </div>
  )
}