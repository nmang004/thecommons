'use client'

import { useState } from 'react'

interface SkipNavProps {
  links?: Array<{ href: string; label: string }>
  className?: string
}

const defaultLinks = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
]

export default function SkipNav({ links = defaultLinks, className = '' }: SkipNavProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`fixed top-0 left-0 z-[9999] ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className={`
            absolute top-0 left-0 
            transform transition-transform duration-200 ease-in-out
            ${isFocused ? 'translate-y-0' : '-translate-y-full'}
            bg-primary text-primary-foreground 
            px-4 py-2 rounded-br-md
            font-medium text-sm
            focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            hover:bg-primary/90
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ top: `${index * 40}px` }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}