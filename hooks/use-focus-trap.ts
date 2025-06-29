'use client'

import { useEffect, useRef } from 'react'

export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (!firstElement) return

    // Focus the first element
    firstElement.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let parent component handle escape
        container.dispatchEvent(new CustomEvent('escape-key'))
      }
    }

    document.addEventListener('keydown', handleTabKey)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isActive])

  return containerRef
}

// Hook for managing focus restoration
export function useFocusRestore() {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const storeFocus = () => {
    previousActiveElement.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }

  return { storeFocus, restoreFocus }
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  items: HTMLElement[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical'
    onSelect?: (index: number) => void
  } = {}
) {
  const { loop = true, orientation = 'vertical', onSelect } = options
  const currentIndex = useRef(0)

  const navigate = (direction: 'next' | 'prev' | 'first' | 'last') => {
    if (items.length === 0) return

    let newIndex = currentIndex.current

    switch (direction) {
      case 'next':
        newIndex = loop 
          ? (currentIndex.current + 1) % items.length
          : Math.min(currentIndex.current + 1, items.length - 1)
        break
      case 'prev':
        newIndex = loop
          ? (currentIndex.current - 1 + items.length) % items.length
          : Math.max(currentIndex.current - 1, 0)
        break
      case 'first':
        newIndex = 0
        break
      case 'last':
        newIndex = items.length - 1
        break
    }

    currentIndex.current = newIndex
    items[newIndex]?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key

    if (orientation === 'vertical') {
      switch (key) {
        case 'ArrowDown':
          e.preventDefault()
          navigate('next')
          break
        case 'ArrowUp':
          e.preventDefault()
          navigate('prev')
          break
        case 'Home':
          e.preventDefault()
          navigate('first')
          break
        case 'End':
          e.preventDefault()
          navigate('last')
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect?.(currentIndex.current)
          break
      }
    } else {
      switch (key) {
        case 'ArrowRight':
          e.preventDefault()
          navigate('next')
          break
        case 'ArrowLeft':
          e.preventDefault()
          navigate('prev')
          break
        case 'Home':
          e.preventDefault()
          navigate('first')
          break
        case 'End':
          e.preventDefault()
          navigate('last')
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect?.(currentIndex.current)
          break
      }
    }
  }

  return {
    navigate,
    handleKeyDown,
    currentIndex: currentIndex.current,
    setCurrentIndex: (index: number) => {
      currentIndex.current = Math.max(0, Math.min(index, items.length - 1))
    },
  }
}