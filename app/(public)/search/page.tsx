import { Metadata } from 'next'
import { Suspense } from 'react'
import AdvancedSearch from '@/components/public/advanced-search'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Advanced Search - The Commons',
  description: 'Search our comprehensive database of open access academic articles with advanced filtering options. Find research by field, author, keywords, and more.',
  keywords: ['academic search', 'research database', 'scholarly articles', 'advanced search', 'academic papers'],
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="heading-1 mb-4">Advanced Search</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Search our comprehensive database of open access academic articles. 
            Use advanced filters to find exactly what you're looking for.
          </p>
        </div>

        <Suspense fallback={<SearchSkeleton />}>
          <AdvancedSearch searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Form Skeleton */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Results Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6 border">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}