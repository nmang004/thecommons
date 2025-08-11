import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Home, FileText, Upload, Settings, Search, BarChart3, Book, Bell, CreditCard, HelpCircle } from 'lucide-react'

interface AuthorNavProps {
  isCollapsed?: boolean
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/author',
    icon: Home,
    description: 'Overview and recent activity'
  },
  {
    label: 'Submit Manuscript',
    href: '/author/submit',
    icon: Upload,
    description: 'Submit a new manuscript'
  },
  {
    label: 'My Submissions',
    href: '/author/submissions',
    icon: FileText,
    description: 'View and manage submissions',
    badge: 'Active'
  },
  {
    label: 'Browse Articles',
    href: '/articles',
    icon: Search,
    description: 'Explore published articles'
  },
  {
    label: 'Analytics',
    href: '/author/analytics',
    icon: BarChart3,
    description: 'View publication metrics'
  },
  {
    label: 'Guidelines',
    href: '/guidelines',
    icon: Book,
    description: 'Submission guidelines and resources'
  },
  {
    label: 'Notifications',
    href: '/author/notifications',
    icon: Bell,
    description: 'Messages and updates',
    badge: '3'
  },
  {
    label: 'Payment History',
    href: '/author/payments',
    icon: CreditCard,
    description: 'View payment records'
  },
  {
    label: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
    description: 'FAQs and support'
  },
  {
    label: 'Profile Settings',
    href: '/profile',
    icon: Settings,
    description: 'Edit profile and preferences'
  }
]

export function AuthorNav({ isCollapsed = false }: AuthorNavProps) {
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
                  <Badge variant="secondary" className="ml-auto">
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