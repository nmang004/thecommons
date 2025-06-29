'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, User, Home, BookOpen, Info, FileText, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useMediaQuery } from '@/hooks/use-responsive'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileNavProps {
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: 'author' | 'editor' | 'reviewer' | 'admin'
  } | null
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

const navigationItems = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    description: 'Back to homepage',
  },
  {
    href: '/articles',
    label: 'Articles',
    icon: BookOpen,
    description: 'Browse published research',
  },
  {
    href: '/about',
    label: 'About',
    icon: Info,
    description: 'Learn about our mission',
  },
  {
    href: '/guidelines',
    label: 'Guidelines',
    icon: FileText,
    description: 'Publishing guidelines',
  },
]

const roleColors = {
  author: 'bg-blue-100 text-blue-800',
  editor: 'bg-purple-100 text-purple-800',
  reviewer: 'bg-green-100 text-green-800',
  admin: 'bg-red-100 text-red-800',
}

export default function MobileNav({ user, isOpen, onToggle, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const isMobile = !useMediaQuery('md')

  // Close nav when switching to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      onClose()
    }
  }, [isMobile, isOpen, onClose])

  // Close nav on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
      onClose()
    }
  }

  if (!isMobile) return null

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] bg-background border-r border-border shadow-xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TC</span>
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-lg">The Commons</h2>
                    <p className="text-xs text-muted-foreground">Open Access Publishing</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={roleColors[user.role]} variant="secondary">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/${user.role}`}>Dashboard</Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="p-4 border-b border-border">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                  />
                </form>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto">
                <div className="p-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          flex items-center space-x-3 p-3 rounded-lg transition-colors
                          ${isActive 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs opacity-70">{item.description}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Quick Actions */}
                {user && (
                  <>
                    <Separator className="my-4" />
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Quick Actions
                      </p>
                      <Link
                        href="/submit"
                        className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span className="font-medium text-sm">Submit Article</span>
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium text-sm">Profile Settings</span>
                      </Link>
                    </div>
                  </>
                )}
              </nav>

              {/* Auth Actions */}
              {!user && (
                <div className="p-4 border-t border-border">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" asChild>
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Sign Out */}
              {user && (
                <div className="p-4 border-t border-border">
                  <form action="/auth/signout" method="post">
                    <Button type="submit" variant="outline" className="w-full">
                      Sign Out
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Mobile-specific header toggle button
interface MobileMenuButtonProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function MobileMenuButton({ isOpen, onToggle, className = '' }: MobileMenuButtonProps) {
  const isMobile = !useMediaQuery('md')

  if (!isMobile) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={`h-10 w-10 p-0 ${className}`}
      aria-label="Toggle navigation menu"
      aria-expanded={isOpen}
    >
      <motion.div
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </motion.div>
    </Button>
  )
}