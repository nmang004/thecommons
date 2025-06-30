'use client'

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
  return (
    <div className={`fixed top-0 left-0 z-[9999] ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="
            absolute top-0 left-0 
            transform -translate-y-full
            transition-transform duration-200 ease-in-out
            bg-primary text-primary-foreground 
            px-4 py-2 rounded-br-md
            font-medium text-sm
            focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            hover:bg-primary/90
            sr-only focus:not-sr-only
          "
          style={{ top: `${index * 40}px` }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}