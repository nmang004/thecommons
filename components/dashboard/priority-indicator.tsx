'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  AlertTriangle, 
  ArrowUp, 
  Minus, 
  ArrowDown,
  Clock,
  Zap
} from 'lucide-react'

export type Priority = 'low' | 'normal' | 'high' | 'urgent'

interface PriorityIndicatorProps {
  priority: Priority
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showIcon?: boolean
  variant?: 'badge' | 'dot' | 'full'
  className?: string
}

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    icon: Zap,
    colors: {
      badge: 'bg-red-100 text-red-800 border-red-200',
      dot: 'bg-red-500',
      text: 'text-red-600'
    },
    weight: 4
  },
  high: {
    label: 'High',
    icon: ArrowUp,
    colors: {
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      dot: 'bg-orange-500',
      text: 'text-orange-600'
    },
    weight: 3
  },
  normal: {
    label: 'Normal',
    icon: Minus,
    colors: {
      badge: 'bg-gray-100 text-gray-800 border-gray-200',
      dot: 'bg-gray-400',
      text: 'text-gray-600'
    },
    weight: 2
  },
  low: {
    label: 'Low',
    icon: ArrowDown,
    colors: {
      badge: 'bg-green-100 text-green-800 border-green-200',
      dot: 'bg-green-500',
      text: 'text-green-600'
    },
    weight: 1
  }
}

const SIZE_CONFIG = {
  sm: {
    badge: 'text-xs px-1.5 py-0.5',
    icon: 'w-3 h-3',
    dot: 'w-2 h-2'
  },
  md: {
    badge: 'text-sm px-2 py-1',
    icon: 'w-4 h-4',
    dot: 'w-3 h-3'
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    icon: 'w-5 h-5',
    dot: 'w-4 h-4'
  }
}

export function PriorityIndicator({
  priority,
  size = 'md',
  showLabel = true,
  showIcon = true,
  variant = 'badge',
  className
}: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  if (variant === 'dot') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div 
          className={cn(
            'rounded-full',
            config.colors.dot,
            sizeConfig.dot
          )}
          title={`Priority: ${config.label}`}
        />
        {showLabel && (
          <span className={cn('font-medium', config.colors.text, sizeConfig.badge)}>
            {config.label}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showIcon && (
          <Icon className={cn(sizeConfig.icon, config.colors.text)} />
        )}
        <span className={cn('font-medium', config.colors.text)}>
          {showLabel ? config.label : priority.toUpperCase()}
        </span>
      </div>
    )
  }

  // Default badge variant
  return (
    <Badge 
      variant="outline"
      className={cn(
        'flex items-center space-x-1 border',
        config.colors.badge,
        sizeConfig.badge,
        className
      )}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  )
}

// Utility function to compare priorities
export function comparePriorities(a: Priority, b: Priority): number {
  return PRIORITY_CONFIG[b].weight - PRIORITY_CONFIG[a].weight
}

// Utility function to get priority from urgency factors
export function calculatePriority(manuscript: {
  status: string
  created_at: string
  updated_at: string
  review_assignments?: any[]
}): Priority {
  const now = new Date()
  const createdAt = new Date(manuscript.created_at)
  const updatedAt = new Date(manuscript.updated_at)
  const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const daysSinceUpdated = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))

  // Urgent conditions
  if (manuscript.status === 'revisions_requested' && daysSinceUpdated > 60) {
    return 'urgent'
  }
  
  if (manuscript.status === 'awaiting_decision' && daysSinceCreated > 45) {
    return 'urgent'
  }

  // High priority conditions
  if (manuscript.status === 'revisions_requested' && daysSinceUpdated > 45) {
    return 'high'
  }
  
  if (manuscript.status === 'awaiting_decision' && daysSinceCreated > 30) {
    return 'high'
  }
  
  if (manuscript.status === 'in_review' && daysSinceCreated > 45) {
    return 'high'
  }

  // Check for overdue reviews
  if (manuscript.review_assignments && manuscript.review_assignments.length > 0) {
    const overdueReviews = manuscript.review_assignments.filter(ra => {
      if (ra.status === 'invited' && ra.due_date) {
        return new Date(ra.due_date) < now
      }
      return false
    })
    
    if (overdueReviews.length > 1) {
      return 'high'
    }
  }

  // Normal priority for recent submissions
  if (manuscript.status === 'submitted' && daysSinceCreated <= 7) {
    return 'normal'
  }

  // Default to normal for most cases
  return 'normal'
}

// Hook for priority-based sorting
export function usePrioritySorting<T extends { priority?: Priority }>(
  items: T[], 
  secondarySort?: (a: T, b: T) => number
) {
  return items.sort((a, b) => {
    const priorityA = a.priority || 'normal'
    const priorityB = b.priority || 'normal'
    
    const priorityComparison = comparePriorities(priorityA, priorityB)
    
    if (priorityComparison === 0 && secondarySort) {
      return secondarySort(a, b)
    }
    
    return priorityComparison
  })
}