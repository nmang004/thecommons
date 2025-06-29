'use client'

import { useState, useEffect } from 'react'

// Breakpoint values that match our design system
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

type Breakpoint = keyof typeof breakpoints

// Hook to get current breakpoint
export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('xs')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl')
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl')
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg')
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md')
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm')
      } else {
        setCurrentBreakpoint('xs')
      }
    }

    // Set initial breakpoint
    updateBreakpoint()

    // Add event listener
    window.addEventListener('resize', updateBreakpoint)

    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return currentBreakpoint
}

// Hook to check if screen is at least a certain breakpoint
export function useMediaQuery(breakpoint: Breakpoint) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpoint]}px)`
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Add listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [breakpoint])

  return matches
}

// Hook for responsive values
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>) {
  const currentBreakpoint = useBreakpoint()

  // Find the appropriate value by checking breakpoints in descending order
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]
    }
  }

  return values.xs
}

// Hook to detect mobile devices
export function useIsMobile() {
  return useMediaQuery('md') === false
}

// Hook to detect tablet devices
export function useIsTablet() {
  const isMd = useMediaQuery('md')
  const isLg = useMediaQuery('lg')
  return isMd && !isLg
}

// Hook to detect desktop devices
export function useIsDesktop() {
  return useMediaQuery('lg')
}

// Hook for responsive grid columns
export function useResponsiveColumns(
  mobileColumns: number = 1,
  tabletColumns: number = 2,
  desktopColumns: number = 3
) {
  return useResponsiveValue({
    xs: mobileColumns,
    md: tabletColumns,
    lg: desktopColumns,
  })
}

// Hook for viewport dimensions
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial values
    updateViewport()

    // Add event listener
    window.addEventListener('resize', updateViewport)

    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return viewport
}

// Hook for orientation detection
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    // Set initial orientation
    updateOrientation()

    // Add event listener
    window.addEventListener('resize', updateOrientation)
    
    // Also listen for orientation change events on mobile
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}

// Utility to get responsive class names
export function getResponsiveClassName(
  base: string,
  responsive: Partial<Record<Breakpoint, string>>
): string {
  let className = base

  Object.entries(responsive).forEach(([breakpoint, value]) => {
    if (breakpoint === 'xs') {
      className += ` ${value}`
    } else {
      className += ` ${breakpoint}:${value}`
    }
  })

  return className
}