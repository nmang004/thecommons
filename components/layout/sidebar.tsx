'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RoleBasedNav } from '@/components/layout/role-based-nav'
import { useAuth } from '@/hooks/useAuth'
import {
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  userRole: 'author' | 'editor' | 'reviewer' | 'admin'
}

export function Sidebar({ userRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  
  console.log('Sidebar rendered - User role:', userRole, 'User:', user?.name)

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

      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-t border-border">
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.metadata?.avatar_url} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              
              {/* Role Badge */}
              <Badge 
                variant="secondary" 
                className="w-fit text-xs bg-primary/10 text-primary"
              >
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              {/* Collapsed User Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.metadata?.avatar_url} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Collapsed Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}