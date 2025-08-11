import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Home, Users, FileText, Database, BarChart3, Settings, Shield } from 'lucide-react'

interface AdminNavProps {
  isCollapsed?: boolean
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'System overview'
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage user accounts',
    badge: 'New'
  },
  {
    label: 'Content',
    href: '/admin/content',
    icon: FileText,
    description: 'Manage manuscripts and articles'
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform analytics'
  },
  {
    label: 'System',
    href: '/admin/system',
    icon: Database,
    description: 'System configuration'
  },
  {
    label: 'Settings',
    href: '/profile',
    icon: Settings,
    description: 'Admin settings'
  }
]

export function AdminNav({ isCollapsed = false }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="default" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}