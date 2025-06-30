import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ManuscriptStatus } from '@/types/database'

interface StatusBadgeProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  status: ManuscriptStatus
  showIcon?: boolean
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  asChild?: boolean
}

const statusConfig = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: '📝',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '📤',
  },
  with_editor: {
    label: 'With Editor',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: '👨‍💼',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: '🔍',
  },
  revisions_requested: {
    label: 'Revisions Requested',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: '✏️',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: '✅',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: '❌',
  },
  published: {
    label: 'Published',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: '🚀',
  },
}

export default function StatusBadge({
  status,
  showIcon = false,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      className={cn(
        'font-medium text-xs border',
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  )
}