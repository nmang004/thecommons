import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

const sizeClasses = {
  sm: 'max-w-3xl',      // ~768px
  md: 'max-w-5xl',      // ~1024px  
  lg: 'max-w-7xl',      // ~1280px
  xl: 'max-w-[1440px]', // ~1440px
  full: 'max-w-none',   // No max width
}

const paddingClasses = {
  none: '',
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-4 sm:px-6 lg:px-8 xl:px-12',
}

export default function ResponsiveContainer({
  children,
  size = 'lg',
  padding = 'md',
  className = '',
  as: Component = 'div',
}: ResponsiveContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  )
}

// Grid container with responsive columns
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  const getGridCols = () => {
    let classes = `grid-cols-${cols.default || 1}`
    
    if (cols.sm) classes += ` sm:grid-cols-${cols.sm}`
    if (cols.md) classes += ` md:grid-cols-${cols.md}`
    if (cols.lg) classes += ` lg:grid-cols-${cols.lg}`
    if (cols.xl) classes += ` xl:grid-cols-${cols.xl}`
    
    return classes
  }

  return (
    <div
      className={cn(
        'grid',
        getGridCols(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive stack component
interface ResponsiveStackProps {
  children: React.ReactNode
  direction?: {
    default?: 'row' | 'col'
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  className?: string
}

export function ResponsiveStack({
  children,
  direction = { default: 'col', md: 'row' },
  gap = 'md',
  align = 'start',
  justify = 'start',
  className = '',
}: ResponsiveStackProps) {
  const getFlexDirection = () => {
    let classes = direction.default === 'row' ? 'flex-row' : 'flex-col'
    
    if (direction.sm) {
      classes += direction.sm === 'row' ? ' sm:flex-row' : ' sm:flex-col'
    }
    if (direction.md) {
      classes += direction.md === 'row' ? ' md:flex-row' : ' md:flex-col'
    }
    if (direction.lg) {
      classes += direction.lg === 'row' ? ' lg:flex-row' : ' lg:flex-col'
    }
    
    return classes
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }

  return (
    <div
      className={cn(
        'flex',
        getFlexDirection(),
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode
  size?: {
    default?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  }
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  align?: {
    default?: 'left' | 'center' | 'right'
    sm?: 'left' | 'center' | 'right'
    md?: 'left' | 'center' | 'right'
    lg?: 'left' | 'center' | 'right'
  }
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

export function ResponsiveText({
  children,
  size = { default: 'base' },
  weight = 'normal',
  align = { default: 'left' },
  className = '',
  as: Component = 'p',
}: ResponsiveTextProps) {
  const getSizeClasses = () => {
    let classes = `text-${size.default}`
    
    if (size.sm) classes += ` sm:text-${size.sm}`
    if (size.md) classes += ` md:text-${size.md}`
    if (size.lg) classes += ` lg:text-${size.lg}`
    
    return classes
  }

  const getAlignClasses = () => {
    let classes = `text-${align.default}`
    
    if (align.sm) classes += ` sm:text-${align.sm}`
    if (align.md) classes += ` md:text-${align.md}`
    if (align.lg) classes += ` lg:text-${align.lg}`
    
    return classes
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  return (
    <Component
      className={cn(
        getSizeClasses(),
        getAlignClasses(),
        weightClasses[weight],
        className
      )}
    >
      {children}
    </Component>
  )
}

// Responsive spacing component
interface ResponsiveSpacingProps {
  children: React.ReactNode
  p?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  m?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  className?: string
}

export function ResponsiveSpacing({
  children,
  p,
  m,
  className = '',
}: ResponsiveSpacingProps) {
  const getPaddingClasses = () => {
    if (!p) return ''
    
    let classes = p.default ? `p-${p.default}` : ''
    
    if (p.sm) classes += ` sm:p-${p.sm}`
    if (p.md) classes += ` md:p-${p.md}`
    if (p.lg) classes += ` lg:p-${p.lg}`
    
    return classes
  }

  const getMarginClasses = () => {
    if (!m) return ''
    
    let classes = m.default ? `m-${m.default}` : ''
    
    if (m.sm) classes += ` sm:m-${m.sm}`
    if (m.md) classes += ` md:m-${m.md}`
    if (m.lg) classes += ` lg:m-${m.lg}`
    
    return classes
  }

  return (
    <div
      className={cn(
        getPaddingClasses(),
        getMarginClasses(),
        className
      )}
    >
      {children}
    </div>
  )
}