'use client'

import React, { useEffect, useRef } from 'react'

interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  atomic?: boolean
  relevant?: string // Allow any combination of aria-relevant values
  delay?: number
}

export default function LiveRegion({
  message,
  priority = 'polite',
  atomic = true,
  relevant = 'additions text',
  delay = 0,
}: LiveRegionProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!message) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Announce the message after delay
    timeoutRef.current = setTimeout(() => {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', priority)
      announcement.setAttribute('aria-atomic', atomic.toString())
      announcement.setAttribute('aria-relevant', relevant)
      announcement.className = 'sr-only'
      announcement.textContent = message

      document.body.appendChild(announcement)

      // Remove the announcement after a delay
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement)
        }
      }, 1000)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message, priority, atomic, relevant, delay])

  return null
}

// Hook for managing announcements
export function useAnnouncements() {
  const announce = (
    message: string,
    options: Omit<LiveRegionProps, 'message'> = {}
  ) => {
    const event = new CustomEvent('announce', {
      detail: { message, ...options },
    })
    window.dispatchEvent(event)
  }

  return { announce }
}

// Global announcement manager
export function AnnouncementManager() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleAnnounce = (event: CustomEvent) => {
      const { message, priority = 'polite', atomic = true, relevant = 'additions text' } = event.detail

      if (!containerRef.current || !message) return

      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', priority)
      announcement.setAttribute('aria-atomic', atomic.toString())
      announcement.setAttribute('aria-relevant', relevant)
      announcement.className = 'sr-only'
      announcement.textContent = message

      containerRef.current.appendChild(announcement)

      // Remove after announcement
      setTimeout(() => {
        if (containerRef.current?.contains(announcement)) {
          containerRef.current.removeChild(announcement)
        }
      }, 1000)
    }

    window.addEventListener('announce', handleAnnounce as EventListener)

    return () => {
      window.removeEventListener('announce', handleAnnounce as EventListener)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    />
  )
}

// Screen reader only text component
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  as?: keyof React.JSX.IntrinsicElements
  className?: string
}

export function ScreenReaderOnly({
  children,
  as: Component = 'span',
  className = '',
}: ScreenReaderOnlyProps) {
  return (
    <Component
      className={`
        absolute -m-px h-px w-px overflow-hidden 
        whitespace-nowrap border-0 p-0 
        [clip:rect(0,0,0,0)]
        ${className}
      `}
    >
      {children}
    </Component>
  )
}

// Component for describing complex UI elements
interface DescriptionProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function Description({ id, children, className = '' }: DescriptionProps) {
  return (
    <div id={id} className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </div>
  )
}

// Error announcement component
interface ErrorAnnouncementProps {
  errors: string[]
  title?: string
}

export function ErrorAnnouncement({ errors, title = 'Form errors' }: ErrorAnnouncementProps) {
  const errorMessage = errors.length > 0 
    ? `${title}: ${errors.join('. ')}`
    : ''

  return (
    <>
      <LiveRegion message={errorMessage} priority="assertive" />
      {errors.length > 0 && (
        <div role="alert" className="sr-only">
          <h2>{title}</h2>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}