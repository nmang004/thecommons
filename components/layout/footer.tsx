import Link from 'next/link'
import { Twitter, Github, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const footerLinks = {
  platform: {
    title: 'Platform',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/guidelines/authors', label: 'Author Guidelines' },
      { href: '/guidelines/reviewers', label: 'Reviewer Guidelines' },
      { href: '/editorial-board', label: 'Editorial Board' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  authors: {
    title: 'For Authors',
    links: [
      { href: '/submit', label: 'Submit Article' },
      { href: '/dashboard/author', label: 'Author Dashboard' },
      { href: '/guidelines/submission', label: 'Submission Guidelines' },
      { href: '/guidelines/formatting', label: 'Formatting Guide' },
      { href: '/faq/authors', label: 'Author FAQ' },
    ],
  },
  readers: {
    title: 'For Readers',
    links: [
      { href: '/articles', label: 'Browse Articles' },
      { href: '/search', label: 'Advanced Search' },
      { href: '/fields', label: 'Fields of Study' },
      { href: '/rss', label: 'RSS Feeds' },
      { href: '/alerts', label: 'Email Alerts' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { href: '/help', label: 'Help Center' },
      { href: '/contact', label: 'Contact Us' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/status', label: 'System Status' },
    ],
  },
}

const socialLinks = [
  { href: 'https://twitter.com/thecommons', icon: Twitter, label: 'Twitter' },
  { href: 'https://github.com/thecommons', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com/company/thecommons', icon: Linkedin, label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand and Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">TC</span>
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">The Commons</h3>
                <p className="text-sm text-muted-foreground">
                  Open Access Academic Publishing
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground max-w-md">
              Democratizing academic publishing with fair, transparent, and open access 
              to scholarly research. Every article published is immediately available to 
              all readers worldwide.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Stay Updated</h4>
              <p className="text-xs text-muted-foreground">
                Get notified about new articles and platform updates.
              </p>
              <form className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 text-sm"
                />
                <Button type="submit" size="sm">
                  Subscribe
                </Button>
              </form>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} The Commons. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>ISSN: 2789-1234</span>
              <span>•</span>
              <span>DOI: 10.12345/tc</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span>Powered by</span>
              <Link
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Vercel
              </Link>
              <span>•</span>
              <Link
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Supabase
              </Link>
            </div>
            
            <div className="flex items-center space-x-1">
              <span>Made with</span>
              <span className="text-red-500">♥</span>
              <span>for the academic community</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}