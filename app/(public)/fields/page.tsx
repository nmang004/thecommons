import { Metadata } from 'next'
import { Suspense } from 'react'
import FieldsBrowser from '@/components/public/fields-browser'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Browse by Field - The Commons',
  description: 'Explore research articles organized by academic fields and disciplines. Discover the latest publications in your area of interest.',
  keywords: ['academic fields', 'research disciplines', 'browse articles', 'field of study', 'academic categories'],
}

export default async function FieldsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Browse by Field of Study</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore research articles organized by academic fields and disciplines. 
            Discover groundbreaking research in your area of interest and related fields.
          </p>
        </div>

        <Suspense fallback={<FieldsBrowserSkeleton />}>
          <FieldsBrowser searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  )
}

function FieldsBrowserSkeleton() {
  return (
    <div className="space-y-8">
      {/* Fields Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6 border">
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}