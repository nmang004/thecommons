import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Home, Clock, CheckCircle, Settings } from 'lucide-react'

interface ReviewerNavProps {
  isCollapsed?: boolean
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/reviewer',
    icon: Home,
    description: 'Review assignments'
  },
  {
    label: 'Pending Reviews',
    href: '/reviewer/reviews/pending',
    icon: Clock,
    description: 'Reviews awaiting completion',
    badge: 3
  },
  {
    label: 'Completed Reviews',
    href: '/reviewer/reviews/completed',
    icon: CheckCircle,
    description: 'Previously completed reviews'
  },
  {
    label: 'Profile Settings',
    href: '/profile',
    icon: Settings,
    description: 'Edit profile and expertise'
  }
]

export function ReviewerNav({ isCollapsed = false }: ReviewerNavProps) {
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
                  <Badge variant="destructive" className="ml-auto">
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