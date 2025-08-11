'use client'

import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AuthorLayout } from '@/components/layout/author-layout'

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
  
  // Use regular DashboardLayout for other role routes
  return <DashboardLayout>{children}</DashboardLayout>
}