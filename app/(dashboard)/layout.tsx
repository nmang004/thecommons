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
  
  console.log('DashboardGroupLayout - pathname:', pathname)
  
  // Use AuthorLayout for all author routes
  if (pathname.startsWith('/author')) {
    console.log('Using AuthorLayout for', pathname)
    return <AuthorLayout>{children}</AuthorLayout>
  }
  
  // Use EditorLayout for all editor routes
  if (pathname.startsWith('/editor')) {
    console.log('Using EditorLayout for', pathname)
    return <EditorLayout>{children}</EditorLayout>
  }
  
  // Use regular DashboardLayout for other role routes (reviewer, admin)
  console.log('Using DashboardLayout for', pathname)
  return <DashboardLayout>{children}</DashboardLayout>
}