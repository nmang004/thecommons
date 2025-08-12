'use client'

import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AuthorLayout } from '@/components/layout/author-layout'
import { EditorLayout } from '@/components/layout/editor-layout'

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
  
  // Use regular DashboardLayout for other role routes (reviewer, admin)
  return <DashboardLayout>{children}</DashboardLayout>
}