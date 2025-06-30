'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components for better performance
export const LazyArticleArchive = lazy(() => import('@/components/public/article-archive'))
export const LazyAdvancedSearch = lazy(() => import('@/components/public/advanced-search'))
export const LazyFieldsBrowser = lazy(() => import('@/components/public/fields-browser'))
export const LazyManuscriptSubmissionWizard = lazy(() => import('@/components/forms/manuscript-submission-wizard'))
export const LazyReviewSubmissionForm = lazy(() => import('@/components/forms/review-submission-form').then(module => ({ default: module.ReviewSubmissionForm })))
export const LazyRevisionForm = lazy(() => import('@/components/forms/revision-form'))
export const LazyManuscriptDetailView = lazy(() => import('@/components/dashboard/manuscript-detail-view').then(module => ({ default: module.ManuscriptDetailView })))

// Loading skeletons for different component types
const ArticleArchiveSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const SearchSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <Skeleton className="h-8 w-32" />
  </div>
)

const FormSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6">
    <Skeleton className="h-8 w-64" />
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
)

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <Skeleton className="h-8 w-8 mb-3" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="border rounded-lg">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded">
            <div className="space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Higher-order component for lazy loading with appropriate skeleton
function withLazyLoading<T extends object>(
  LazyComponent: ComponentType<T>,
  SkeletonComponent: ComponentType
) {
  return function WrappedComponent(props: T) {
    return (
      <Suspense fallback={<SkeletonComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Export wrapped components with skeletons
export const ArticleArchive = withLazyLoading(LazyArticleArchive, ArticleArchiveSkeleton)
export const AdvancedSearch = withLazyLoading(LazyAdvancedSearch, SearchSkeleton)
export const FieldsBrowser = withLazyLoading(LazyFieldsBrowser, SearchSkeleton)
export const ManuscriptSubmissionWizard = withLazyLoading(LazyManuscriptSubmissionWizard, FormSkeleton)
export const ReviewSubmissionForm = withLazyLoading(LazyReviewSubmissionForm, FormSkeleton)
export const RevisionForm = withLazyLoading(LazyRevisionForm, FormSkeleton)
export const ManuscriptDetailView = withLazyLoading(LazyManuscriptDetailView, DashboardSkeleton)

// Route-based code splitting helpers
export const loadPageComponent = {
  articleArchive: () => import('@/app/(public)/articles/page'),
  searchPage: () => import('@/app/(public)/search/page'),
  authorDashboard: () => import('@/app/(dashboard)/author/page'),
  editorDashboard: () => import('@/app/(dashboard)/editor/page'),
  reviewerDashboard: () => import('@/app/(dashboard)/reviewer/page'),
  manuscriptSubmission: () => import('@/app/(dashboard)/author/submit/page'),
}

// Preload critical components
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload components that are likely to be needed soon
    const criticalComponents = [
      LazyArticleArchive,
      LazyAdvancedSearch,
    ]
    
    criticalComponents.forEach(component => {
      // This triggers the dynamic import by calling the lazy function
      void component
    })
  }
}

// Component importance levels for loading priority
export const ComponentPriority = {
  CRITICAL: 'critical', // Load immediately
  HIGH: 'high',        // Load when idle
  MEDIUM: 'medium',    // Load on interaction
  LOW: 'low'          // Load on demand
} as const

// Priority loading helper
export const loadComponentByPriority = (priority: string, loader: () => Promise<any>) => {
  switch (priority) {
    case ComponentPriority.CRITICAL:
      return loader()
    case ComponentPriority.HIGH:
      if ('requestIdleCallback' in window) {
        return new Promise(resolve => {
          (window as any).requestIdleCallback(() => resolve(loader()))
        })
      }
      return loader()
    case ComponentPriority.MEDIUM:
    case ComponentPriority.LOW:
    default:
      return loader()
  }
}