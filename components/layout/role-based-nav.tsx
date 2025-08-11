'use client'

import { AuthorNav } from '@/components/dashboard/navigation/author-nav'
import { EditorNav } from '@/components/dashboard/navigation/editor-nav'
import { ReviewerNav } from '@/components/dashboard/navigation/reviewer-nav'
import { AdminNav } from '@/components/dashboard/navigation/admin-nav'

interface RoleBasedNavProps {
  userRole: 'author' | 'editor' | 'reviewer' | 'admin'
  isCollapsed?: boolean
}

export function RoleBasedNav({ userRole, isCollapsed = false }: RoleBasedNavProps) {
  switch (userRole) {
    case 'author':
      return <AuthorNav isCollapsed={isCollapsed} />
    case 'editor':
      return <EditorNav isCollapsed={isCollapsed} />
    case 'reviewer':
      return <ReviewerNav isCollapsed={isCollapsed} />
    case 'admin':
      return <AdminNav isCollapsed={isCollapsed} />
    default:
      return <AuthorNav isCollapsed={isCollapsed} />
  }
}