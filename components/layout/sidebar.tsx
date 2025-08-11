'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RoleBasedNav } from '@/components/layout/role-based-nav'
import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SidebarProps {
  userRole: 'author' | 'editor' | 'reviewer' | 'admin'
  currentPath: string
}

export function Sidebar({ userRole, currentPath }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      'flex flex-col h-full bg-card border-r border-border transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">TC</span>
            </div>
            <span className="font-semibold text-sm">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <RoleBasedNav userRole={userRole} isCollapsed={isCollapsed} />
        </div>
      </ScrollArea>
    </div>
  )
}