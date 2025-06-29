'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Users, Globe, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HeroStats {
  articles: number
  authors: number
  downloads: number
  countries: number
}

interface HeroSectionProps {
  stats?: HeroStats
}

export default function HeroSection({ 
  stats = { articles: 1250, authors: 890, downloads: 45000, countries: 85 } 
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [animatedStats, setAnimatedStats] = useState({
    articles: 0,
    authors: 0,
    downloads: 0,
    countries: 0,
  })

  // Animate numbers on mount
  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const stepDuration = duration / steps

    const increment = {
      articles: stats.articles / steps,
      authors: stats.authors / steps,
      downloads: stats.downloads / steps,
      countries: stats.countries / steps,
    }

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setAnimatedStats({
        articles: Math.min(Math.floor(increment.articles * currentStep), stats.articles),
        authors: Math.min(Math.floor(increment.authors * currentStep), stats.authors),
        downloads: Math.min(Math.floor(increment.downloads * currentStep), stats.downloads),
        countries: Math.min(Math.floor(increment.countries * currentStep), stats.countries),
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        setAnimatedStats(stats)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [stats])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 lg:py-28">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/[0.03] bg-[length:60px_60px]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="heading-display mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-fade-in">
            The Future of Academic Publishing
          </h1>
          
          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            Open access, transparent peer review, and fair pricing. 
            Publish your research where it belongs—freely accessible to all.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search 1000+ open access articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-32 py-4 text-lg bg-background/80 backdrop-blur-sm border-2 focus:border-primary transition-all duration-300"
                />
                <Button 
                  type="submit" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto py-2 px-4"
                >
                  Search
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button asChild size="lg" className="btn-primary">
              <Link href="/submit">
                Submit Your Research
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="btn-outline">
              <Link href="/articles">Browse Articles</Link>
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-primary mr-2" />
                <span className="heading-2 text-primary">
                  {animatedStats.articles.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Articles Published
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-secondary mr-2" />
                <span className="heading-2 text-secondary">
                  {animatedStats.authors.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Researchers
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-accent mr-2" />
                <span className="heading-2 text-accent">
                  {animatedStats.downloads.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Downloads
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Globe className="h-6 w-6 text-info mr-2" />
                <span className="heading-2 text-info">
                  {animatedStats.countries}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Countries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-primary rounded-full animate-bounce-gentle opacity-60" />
      <div className="absolute top-32 right-16 w-3 h-3 bg-secondary rounded-full animate-bounce-gentle opacity-40" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-accent rounded-full animate-bounce-gentle opacity-50" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 right-1/3 w-4 h-4 bg-primary/30 rounded-full animate-bounce-gentle opacity-30" style={{ animationDelay: '1.5s' }} />
    </section>
  )
}