import type { Metadata } from 'next'
import { Inter, Playfair_Display, Crimson_Text, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import '@/lib/polyfills/server'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { AnnouncementManager } from '@/components/ui/live-region'
import SkipNav from '@/components/ui/skip-nav'
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/utils/schema-markup'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
})

const crimson = Crimson_Text({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'The Commons - Open Access Academic Publishing',
    template: '%s | The Commons',
  },
  description: 'A fair, transparent, and open access platform for academic publishing. Submit your research where it belongs—freely accessible to all.',
  keywords: [
    'academic publishing',
    'open access',
    'peer review',
    'scholarly articles',
    'research publication',
    'academic journal',
    'science',
    'research',
  ],
  authors: [{ name: 'The Commons Editorial Team' }],
  creator: 'The Commons',
  publisher: 'The Commons',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'The Commons',
    title: 'The Commons - Open Access Academic Publishing',
    description: 'A fair, transparent, and open access platform for academic publishing.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'The Commons - Open Access Academic Publishing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@thecommons',
    creator: '@thecommons',
    title: 'The Commons - Open Access Academic Publishing',
    description: 'A fair, transparent, and open access platform for academic publishing.',
    images: ['/images/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-token',
    // Add other verification tokens as needed
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* RSS Feeds */}
        <link rel="alternate" type="application/rss+xml" title="The Commons - Latest Articles" href="/feed.xml" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              generateOrganizationSchema(),
              generateWebsiteSchema()
            ])
          }}
        />
      </head>
      <body
        className={`
          ${inter.variable} 
          ${playfair.variable} 
          ${crimson.variable} 
          ${jetbrains.variable} 
          min-h-screen bg-background font-sans antialiased
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Skip navigation for accessibility */}
          <SkipNav />
          
          {/* Live region for dynamic announcements */}
          <AnnouncementManager />
          
          {/* Main content wrapper */}
          <div className="relative flex min-h-screen flex-col">
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}