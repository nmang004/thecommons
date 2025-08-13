'use client'

import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AuthorLayout } from '@/components/layout/author-layout'
import { EditorLayout } from '@/components/layout/editor-layout'
import { ReviewerLayout } from '@/components/layout/reviewer-layout'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Use AuthorLayout for all author routes
  if (pathname.startsWith('/author')) {
    return <AuthorLayout>{children}</AuthorLayout>
  }
  
  // Use EditorLayout for all editor routes
  if (pathname.startsWith('/editor')) {
    return <EditorLayout>{children}</EditorLayout>
  }
  
  // Use ReviewerLayout for all reviewer routes (no top navigation)
  if (pathname.startsWith('/reviewer')) {
    return <ReviewerLayout>{children}</ReviewerLayout>
  }
  
  // Use regular DashboardLayout for other role routes (admin)
  return <DashboardLayout>{children}</DashboardLayout>
}