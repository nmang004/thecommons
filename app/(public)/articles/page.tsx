import { Metadata } from 'next'
import { Suspense } from 'react'
import ArticleArchive from '@/components/public/article-archive'
import { Skeleton } from '@/components/ui/skeleton'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Article Archive - The Commons',
  description: 'Browse and search our extensive collection of open access academic articles from researchers worldwide.',
  keywords: ['academic articles', 'research papers', 'open access', 'scholarly publications', 'peer reviewed'],
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Article Archive</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore our growing collection of open access academic articles from leading researchers worldwide. 
            All articles are freely available to read, download, and cite.
          </p>
        </div>

        <Suspense fallback={<ArticleArchiveSkeleton />}>
          <ArticleArchive searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}

function ArticleArchiveSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Filter Skeleton */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Articles Grid Skeleton */}
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