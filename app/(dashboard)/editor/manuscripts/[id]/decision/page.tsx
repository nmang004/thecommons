'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EditorialDecisionForm } from '@/components/dashboard/editorial-decision-form'
import { TemplateManager } from '@/components/dashboard/template-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface Manuscript {
  id: string
  title: string
  abstract: string
  field: string
  field_of_study: string
  status: string
  created_at: string
  submitted_at?: string
  profiles?: {
    full_name: string
    email: string
    affiliation?: string
  }
  reviews?: Review[]
  editorial_decisions?: EditorialDecision[]
}

interface Review {
  id: string
  reviewer_id: string
  recommendation: 'accept' | 'minor_revisions' | 'major_revisions' | 'reject'
  summary: string
  major_comments: string
  minor_comments?: string
  completed_at: string
  confidence_level: number
  submitted_at: string
  profiles?: {
    full_name: string
  }
}

interface EditorialDecision {
  id: string
  decision: string
  decision_letter: string
  created_at: string
  profiles?: {
    full_name: string
  }
}

export default function EditorialDecisionPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [manuscript, setManuscript] = useState<Manuscript | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!user || authLoading || !id) return

    const fetchManuscript = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data: manuscriptData, error: manuscriptError } = await supabase
          .from('manuscripts')
          .select(`
            *,
            profiles!author_id(full_name, email, affiliation),
            reviews(
              *,
              profiles!reviewer_id(full_name)
            ),
            editorial_decisions(
              *,
              profiles!editor_id(full_name)
            )
          `)
          .eq('id', id)
          .single()

        if (manuscriptError) throw manuscriptError
        if (!manuscriptData) throw new Error('Manuscript not found')

        setManuscript(manuscriptData)
      } catch (err) {
        console.error('Error fetching manuscript:', err)
        setError(err instanceof Error ? err.message : 'Failed to load manuscript')
      } finally {
        setIsLoading(false)
      }
    }

    fetchManuscript()
  }, [user, authLoading, id])

  const handleDecisionSubmit = async (decision: any) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('editorial_decisions')
        .insert({
          manuscript_id: id,
          editor_id: user?.id,
          decision: decision.decision,
          decision_letter: decision.decisionLetter,
          internal_notes: decision.internalNotes,
          public_comments: decision.publicComments
        })

      if (error) throw error

      // Update manuscript status based on decision
      const statusMap = {
        accept: 'accepted',
        reject: 'rejected',
        major_revisions: 'major_revision_required',
        minor_revisions: 'minor_revision_required'
      }

      await supabase
        .from('manuscripts')
        .update({ status: statusMap[decision.decision as keyof typeof statusMap] })
        .eq('id', id)

      router.push(`/editor/manuscripts/${id}?decision=submitted`)
    } catch (err) {
      console.error('Error submitting decision:', err)
      setError('Failed to submit decision')
    }
  }

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
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Manuscript</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/editor/manuscripts">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Manuscripts
          </Link>
        </Button>
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

  if (!manuscript) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Manuscript Not Found</h3>
        <p className="text-gray-600">The manuscript you're looking for doesn't exist.</p>
      </div>
    )
  }

  // Check if manuscript is ready for decision
  const completedReviews = manuscript.reviews?.filter(r => r.completed_at) || []
  const hasExistingDecision = manuscript.editorial_decisions && manuscript.editorial_decisions.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href={`/editor/manuscripts/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Manuscript
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Editorial Decision
            </h1>
            <p className="text-muted-foreground">
              Make a decision for manuscript #{manuscript.id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={hasExistingDecision ? "default" : "secondary"}>
            {hasExistingDecision ? 'Decision Made' : 'Pending Decision'}
          </Badge>
        </div>
      </div>

      {/* Manuscript Overview */}
      <Card className="card-academic">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {manuscript.title}
          </CardTitle>
          <CardDescription>
            by {manuscript.profiles?.full_name} • {manuscript.field} • 
            Submitted {new Date(manuscript.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <Badge variant="outline">{manuscript.status.replace('_', ' ')}</Badge>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reviews</h4>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {completedReviews.length} completed
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Time Since Submission</h4>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {Math.floor((Date.now() - new Date(manuscript.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Workflow */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="decision">Make Decision</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="card-academic">
            <CardHeader>
              <CardTitle>Abstract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{manuscript.abstract}</p>
            </CardContent>
          </Card>

          {hasExistingDecision && (
            <Card className="card-academic">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Previous Decision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {manuscript.editorial_decisions?.map((decision) => (
                    <div key={decision.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{decision.decision.replace('_', ' ')}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(decision.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {decision.decision_letter}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        by {decision.profiles?.full_name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {completedReviews.length === 0 ? (
            <Card className="card-academic">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600">
                  This manuscript doesn't have any completed reviews. Consider waiting for reviews before making a decision.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedReviews.map((review, index) => (
                <Card key={review.id} className="card-academic">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Review {index + 1} - {review.profiles?.full_name || 'Anonymous Reviewer'}
                    </CardTitle>
                    <CardDescription>
                      Recommendation: <Badge variant="outline">{review.recommendation.replace('_', ' ')}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{review.summary}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Major Comments</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{review.major_comments}</p>
                    </div>
                    {review.minor_comments && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Minor Comments</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{review.minor_comments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="decision" className="space-y-6">
          <Card className="card-academic">
            <CardHeader>
              <CardTitle>Make Editorial Decision</CardTitle>
              <CardDescription>
                Review all information and make your decision on this manuscript
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditorialDecisionForm
                manuscript={manuscript}
                reviews={completedReviews}
                onSubmit={handleDecisionSubmit}
                onCancel={() => router.push(`/editor/manuscripts/${id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplateManager
            onTemplateSelect={(template) => {
              console.log('Template selected:', template)
              // TODO: Apply template to decision form
            }}
            readOnly={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}