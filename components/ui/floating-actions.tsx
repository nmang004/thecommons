'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Share2, Bookmark, Download, MessageCircle, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  color?: string
}

interface FloatingActionButtonProps {
  actions: FloatingAction[]
  className?: string
}

export function FloatingActionButton({ actions, className = '' }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = () => setIsOpen(!isOpen)

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 space-y-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 20, x: 20 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex items-center justify-end space-x-3"
              >
                <motion.span
                  className="bg-background border border-border text-foreground px-3 py-1 rounded-lg text-sm font-medium shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.label}
                </motion.span>
                <Button
                  size="sm"
                  onClick={action.onClick}
                  className={`h-12 w-12 rounded-full shadow-lg ${
                    action.color || 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  <action.icon className="h-5 w-5" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          size="lg"
          onClick={toggleOpen}
          className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  )
}

// Scroll to top button
interface ScrollToTopProps {
  threshold?: number
  className?: string
}

export function ScrollToTop({ threshold = 300, className = '' }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Show button when page is scrolled beyond threshold
  const toggleVisibility = () => {
    if (window.pageYOffset > threshold) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Add scroll event listener
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', toggleVisibility)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-6 left-6 z-50 ${className}`}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={scrollToTop}
            size="sm"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Article action buttons
interface ArticleActionsProps {
  onShare?: () => void
  onBookmark?: () => void
  onDownload?: () => void
  onComment?: () => void
  isBookmarked?: boolean
  className?: string
}

export function ArticleActions({
  onShare,
  onBookmark,
  onDownload,
  onComment,
  isBookmarked = false,
  className = '',
}: ArticleActionsProps) {
  const actions: FloatingAction[] = []

  if (onComment) {
    actions.push({
      icon: MessageCircle,
      label: 'Comments',
      onClick: onComment,
      color: 'bg-blue-600 hover:bg-blue-700',
    })
  }

  if (onDownload) {
    actions.push({
      icon: Download,
      label: 'Download PDF',
      onClick: onDownload,
      color: 'bg-green-600 hover:bg-green-700',
    })
  }

  if (onBookmark) {
    actions.push({
      icon: Bookmark,
      label: isBookmarked ? 'Remove Bookmark' : 'Bookmark',
      onClick: onBookmark,
      color: isBookmarked ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700',
    })
  }

  if (onShare) {
    actions.push({
      icon: Share2,
      label: 'Share',
      onClick: onShare,
      color: 'bg-purple-600 hover:bg-purple-700',
    })
  }

  if (actions.length === 0) return null

  return <FloatingActionButton actions={actions} className={className} />
}

// Hover card animation
interface HoverCardProps {
  children: React.ReactNode
  hoverContent?: React.ReactNode
  className?: string
}

export function HoverCard({ children, hoverContent, className = '' }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`relative ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      
      <AnimatePresence>
        {isHovered && hoverContent && (
          <motion.div
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-max">
              {hoverContent}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-background border-r border-b border-border rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}