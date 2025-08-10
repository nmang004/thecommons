import { Inter, Playfair_Display, Crimson_Text, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/theme-provider'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const crimson = Crimson_Text({ 
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-serif',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

interface RootLayoutProps {
  children: React.ReactNode
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: 'author' | 'editor' | 'reviewer' | 'admin'
  } | null
  showHeader?: boolean
  showFooter?: boolean
  className?: string
}

export default function RootLayout({
  children,
  user: _user,
  showHeader = true,
  showFooter = true,
  className = '',
}: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${crimson.variable} ${jetbrains.variable} min-h-screen bg-background font-sans antialiased ${className}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            {showHeader && <Header />}
            <main className="flex-1">{children}</main>
            {showFooter && <Footer />}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}