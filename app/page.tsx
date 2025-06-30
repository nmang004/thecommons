import { Metadata } from 'next'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import HeroSection from '@/components/public/hero-section'
import FeaturesSection from '@/components/public/features-section'
import RecentArticlesSection from '@/components/public/recent-articles-section'

export const metadata: Metadata = {
  title: 'The Commons - Open Access Academic Publishing',
  description: 'Democratizing access to scholarly knowledge through fair, transparent, and sustainable academic publishing. Open access articles, rigorous peer review, and global reach.',
  keywords: ['academic publishing', 'open access', 'peer review', 'research', 'scholarly articles', 'academia'],
  openGraph: {
    title: 'The Commons - Open Access Academic Publishing',
    description: 'Democratizing access to scholarly knowledge through fair, transparent, and sustainable academic publishing.',
    url: 'https://thecommons.org',
    siteName: 'The Commons',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'The Commons - Open Access Academic Publishing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Commons - Open Access Academic Publishing',
    description: 'Democratizing access to scholarly knowledge through fair, transparent, and sustainable academic publishing.',
    images: ['/images/og-image.jpg'],
  },
}

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <FeaturesSection />
      <RecentArticlesSection />
      <Footer />
    </>
  )
}
