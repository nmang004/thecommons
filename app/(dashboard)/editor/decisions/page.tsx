'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DecisionAnalytics } from '@/components/dashboard/decision-analytics'
import { 
  Gavel,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  Calendar,
  Users,
  Eye,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface EditorialDecision {
  id: string
  manuscript_id: string
  decision: string
  decision_letter: string
  created_at: string
  sent_at?: string
  manuscripts: {
    title: string
    field_of_study: string
    profiles: {
      full_name: string
      email: string
    }
  }
  profiles: {
    full_name: string
  }
}

interface DecisionStats {
  total: number
  pending: number
  sent: number
  thisMonth: number
  averageTime: number
}

const DECISION_ICONS = {
  accepted: CheckCircle,
  rejected: XCircle,
  revisions_requested: RotateCcw,
  with_editor: Clock,
  under_review: Clock,
}

const DECISION_COLORS = {
  accepted: 'text-green-600 bg-green-50 border-green-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
  revisions_requested: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  with_editor: 'text-blue-600 bg-blue-50 border-blue-200',
  under_review: 'text-purple-600 bg-purple-50 border-purple-200',
}

export default function EditorialDecisionsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [decisions, setDecisions] = useState<EditorialDecision[]>([])
  const [stats, setStats] = useState<DecisionStats>({
    total: 0,
    pending: 0,
    sent: 0,
    thisMonth: 0,
    averageTime: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!user || authLoading) return

    const fetchDecisions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const supabase = createClient()

        // Try to fetch editorial decisions with relationships
        let { data: decisionsData, error: decisionsError } = await supabase
          .from('editorial_decisions')
          .select(`
            *,
            manuscripts!inner(
              title,
              field_of_study,
              profiles!author_id(full_name, email)
            ),
            profiles!editor_id(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        // If the complex query fails, try a simpler one
        if (decisionsError) {
          console.warn('Complex query failed, trying simpler query:', decisionsError)
          const { data: simpleData, error: simpleError } = await supabase
            .from('editorial_decisions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
          
          if (simpleError) {
            console.error('Simple query also failed:', simpleError)
            throw new Error(`Database error: ${simpleError.message}`)
          }
          
          // Set decisions with limited data
          decisionsData = simpleData?.map(decision => ({
            ...decision,
            manuscripts: {
              title: 'Unknown Title',
              field_of_study: 'Unknown Field',
              profiles: {
                full_name: 'Unknown Author',
                email: 'unknown@email.com'
              }
            },
            profiles: {
              full_name: 'Unknown Editor'
            }
          })) || []
        }

        setDecisions(decisionsData || [])

        // Calculate stats
        const total = decisionsData?.length || 0
        const pending = decisionsData?.filter(d => !d.sent_at).length || 0
        const sent = decisionsData?.filter(d => d.sent_at).length || 0
        const thisMonth = decisionsData?.filter(d => {
          const decisionDate = new Date(d.created_at)
          const now = new Date()
          return decisionDate.getMonth() === now.getMonth() && 
                 decisionDate.getFullYear() === now.getFullYear()
        }).length || 0

        setStats({
          total,
          pending,
          sent,
          thisMonth,
          averageTime: 0 // TODO: Calculate average time
        })

      } catch (err) {
        console.error('Error fetching decisions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load decisions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDecisions()
  }, [user, authLoading])

  const filteredDecisions = decisions.filter(decision => {
    if (filter === 'all') return true
    if (filter === 'pending') return !decision.sent_at
    if (filter === 'sent') return decision.sent_at
    return decision.decision === filter
  })

  if (authLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Decisions</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!user || (user.role !== 'editor' && user.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You need editor privileges to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Editorial Decisions
        </h1>
        <p className="text-muted-foreground">
          Manage and track editorial decisions across all manuscripts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Gavel className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Decisions</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sent This Month</p>
                <p className="text-2xl font-bold text-green-600">{stats.thisMonth}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-academic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="decisions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-6">
          {/* Filters */}
          <Card className="card-academic">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Decisions' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'sent', label: 'Sent' },
                    { key: 'accepted', label: 'Accepted' },
                    { key: 'rejected', label: 'Rejected' },
                    { key: 'revisions_requested', label: 'Revisions Requested' }
                  ].map((filterOption) => (
                    <Button
                      key={filterOption.key}
                      variant={filter === filterOption.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(filterOption.key)}
                    >
                      {filterOption.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decisions List */}
          <Card className="card-academic">
            <CardHeader>
              <CardTitle>Editorial Decisions ({filteredDecisions.length})</CardTitle>
              <CardDescription>
                Recent editorial decisions made on manuscripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDecisions.length === 0 ? (
                <div className="text-center py-12">
                  <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Decisions Found</h3>
                  <p className="text-gray-600">
                    {filter === 'all' 
                      ? 'No editorial decisions have been made yet.' 
                      : `No decisions found for filter: ${filter}`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDecisions.map((decision) => {
                    const DecisionIcon = DECISION_ICONS[decision.decision as keyof typeof DECISION_ICONS] || Gavel
                    const colorClass = DECISION_COLORS[decision.decision as keyof typeof DECISION_COLORS] || 'text-gray-600 bg-gray-50 border-gray-200'
                    
                    return (
                      <div key={decision.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${colorClass}`}>
                                <DecisionIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {decision.manuscripts.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  by {decision.manuscripts.profiles.full_name} • {decision.manuscripts.field_of_study}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>Editor: {decision.profiles.full_name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(decision.created_at).toLocaleDateString()}</span>
                              </div>
                              {decision.sent_at ? (
                                <Badge variant="outline" className="text-green-600 border-green-200">
                                  Sent
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                  Pending
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-700 line-clamp-2">
                              {decision.decision_letter.substring(0, 200)}...
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="outline" className={colorClass}>
                              {decision.decision.replace('_', ' ')}
                            </Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/editor/manuscripts/${decision.manuscript_id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <DecisionAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}