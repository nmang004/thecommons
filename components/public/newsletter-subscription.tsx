'use client'

import { useState } from 'react'
import { Mail, Check, AlertCircle, Rss } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface NewsletterSubscriptionProps {
  title?: string
  description?: string
  defaultFields?: string[]
  showFieldFilter?: boolean
  compact?: boolean
}

const FIELDS_OF_STUDY = [
  'Biology',
  'Chemistry',
  'Computer Science',
  'Environmental Science',
  'Mathematics',
  'Medicine',
  'Physics',
  'Psychology',
  'Engineering',
  'Social Sciences',
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Get notified about new articles every day' },
  { value: 'weekly', label: 'Weekly', description: 'Weekly digest of new publications' },
  { value: 'monthly', label: 'Monthly', description: 'Monthly summary of research highlights' },
]

export default function NewsletterSubscription({
  title = 'Stay Updated',
  description = 'Get notified when new articles are published in your fields of interest.',
  defaultFields = [],
  showFieldFilter = true,
  compact = false
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(defaultFields)
  const [frequency, setFrequency] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          fields: selectedFields,
          frequency,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setEmail('')
        setName('')
      } else {
        setError(data.message || 'Failed to subscribe. Please try again.')
      }
    } catch (err) {
      setError('Failed to subscribe. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRssUrl = (fields?: string[]) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    if (fields && fields.length === 1) {
      return `${baseUrl}/feed.xml?field=${encodeURIComponent(fields[0])}`
    }
    return `${baseUrl}/feed.xml`
  }

  if (compact) {
    return (
      <Card className="card-academic">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="heading-4">{title}</h3>
          </div>
          
          {success ? (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully subscribed! Check your email for confirmation.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-academic max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2 text-primary" />
          {title}
        </CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully subscribed to email alerts! Please check your email for confirmation.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Name (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Frequency Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                How often would you like to receive updates?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FREQUENCY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      frequency === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setFrequency(option.value)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        frequency === option.value 
                          ? 'border-primary bg-primary' 
                          : 'border-border'
                      }`} />
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Selection */}
            {showFieldFilter && (
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Fields of Interest (Optional)
                </label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select specific fields to receive targeted updates, or leave empty for all fields.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FIELDS_OF_STUDY.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field}`}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => handleFieldToggle(field)}
                        disabled={loading}
                      />
                      <label 
                        htmlFor={`field-${field}`}
                        className="text-sm cursor-pointer"
                      >
                        {field}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedFields.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedFields.map((field) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Subscribing...' : 'Subscribe to Email Alerts'}
            </Button>
          </form>
        )}

        {/* RSS Alternative */}
        <div>
          <Separator />
          <div className="pt-6">
            <div className="flex items-center space-x-2 mb-3">
              <Rss className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Prefer RSS?</span>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="w-full justify-start"
              >
                <a 
                  href={getRssUrl()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Rss className="h-3 w-3 mr-2" />
                  All Articles RSS Feed
                </a>
              </Button>
              {selectedFields.length === 1 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="w-full justify-start"
                >
                  <a 
                    href={getRssUrl(selectedFields)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Rss className="h-3 w-3 mr-2" />
                    {selectedFields[0]} RSS Feed
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}