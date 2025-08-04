'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search,
  User,
  Award,
  BookOpen,
  MapPin,
  Mail,
  AlertTriangle,
  Star,
  TrendingUp,
  Clock,
  X,
  Filter,
  Users,
  Send
} from 'lucide-react'
import type { ConflictEvidence, SuggestedReviewers, ExcludedReviewers } from '@/types/database'

interface InvitationData {
  message?: string
  dueDate: string
  templateId?: string
  staggered?: boolean
  staggerHours?: number
}

interface Reviewer {
  id: string
  full_name: string
  email: string
  affiliation?: string
  expertise: string[]
  h_index?: number
  total_publications: number
  recent_reviews?: number
  avg_review_time?: number // in days
  availability_score?: number // 0-100
  conflicts?: string[]
  bio?: string
  orcid?: string
  // Enhanced matching scores
  relevance_score?: number
  quality_score?: number
  overall_score?: number
  match_reasons?: string[]
  // COI information
  coi_eligible?: boolean
  coi_conflicts?: ConflictEvidence[]
  coi_risk_score?: number
}

interface ReviewerFinderProps {
  manuscript: {
    id: string
    title: string
    abstract: string
    field_of_study: string
    subfield?: string
    keywords?: string[]
    author_id: string
    suggested_reviewers?: SuggestedReviewers
    excluded_reviewers?: ExcludedReviewers
  }
  onAssign: (reviewerIds: string[], invitationData: InvitationData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ReviewerFinder({ manuscript, onAssign, onCancel, isLoading = false }: ReviewerFinderProps) {
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'relevance' | 'h_index' | 'availability' | 'recent_activity'>('relevance')
  const [filterBy, setFilterBy] = useState({
    minHIndex: '',
    minPublications: '',
    availabilityThreshold: 70,
    excludeConflicts: true
  })
  const [invitationData, setInvitationData] = useState({
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks from now
    message: `Dear Colleague,

I would like to invite you to review the manuscript "${manuscript.title}" for our journal. 

The manuscript falls within the field of ${manuscript.field_of_study}${manuscript.subfield ? ` (${manuscript.subfield})` : ''} and your expertise would be valuable in evaluating this work.

Please let me know if you are available to complete this review by the specified deadline.

Thank you for your consideration.

Best regards,`
  })

  // Calculate expertise matching score
  const calculateRelevanceScore = (reviewer: Reviewer) => {
    let score = 0
    const manuscriptTerms = [
      manuscript.field_of_study.toLowerCase(),
      manuscript.subfield?.toLowerCase(),
      ...(manuscript.keywords?.map(k => k.toLowerCase()) || [])
    ].filter(Boolean)

    const reviewerExpertise = reviewer.expertise.map(e => e.toLowerCase())

    // Exact field match
    if (reviewerExpertise.some(exp => exp.includes(manuscript.field_of_study.toLowerCase()))) {
      score += 40
    }

    // Subfield match
    if (manuscript.subfield && reviewerExpertise.some(exp => exp.includes(manuscript.subfield.toLowerCase()))) {
      score += 30
    }

    // Keyword matches
    manuscriptTerms.forEach(term => {
      if (reviewerExpertise.some(exp => exp.includes(term))) {
        score += 10
      }
    })

    // Boost for high h-index
    if (reviewer.h_index) {
      score += Math.min(reviewer.h_index, 20) // Max 20 points for h-index
    }

    // Boost for availability
    if (reviewer.availability_score) {
      score += reviewer.availability_score * 0.1 // Max 10 points for availability
    }

    return Math.min(score, 100)
  }

  // Filter and sort reviewers
  const filteredAndSortedReviewers = useMemo(() => {
    let filtered = reviewers.filter(reviewer => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch = 
          reviewer.full_name.toLowerCase().includes(search) ||
          reviewer.affiliation?.toLowerCase().includes(search) ||
          reviewer.expertise.some(exp => exp.toLowerCase().includes(search))
        
        if (!matchesSearch) return false
      }

      // H-index filter
      if (filterBy.minHIndex && reviewer.h_index && reviewer.h_index < parseInt(filterBy.minHIndex)) {
        return false
      }

      // Publications filter
      if (filterBy.minPublications && reviewer.total_publications < parseInt(filterBy.minPublications)) {
        return false
      }

      // Availability filter
      if (reviewer.availability_score && reviewer.availability_score < filterBy.availabilityThreshold) {
        return false
      }

      // Conflict filter
      if (filterBy.excludeConflicts && reviewer.conflicts?.includes(manuscript.author_id)) {
        return false
      }

      return true
    })

    // Sort reviewers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return calculateRelevanceScore(b) - calculateRelevanceScore(a)
        case 'h_index':
          return (b.h_index || 0) - (a.h_index || 0)
        case 'availability':
          return (b.availability_score || 0) - (a.availability_score || 0)
        case 'recent_activity':
          return (a.avg_review_time || 999) - (b.avg_review_time || 999)
        default:
          return 0
      }
    })

    return filtered
  }, [reviewers, searchTerm, sortBy, filterBy, manuscript])

  // Fetch potential reviewers
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const response = await fetch(`/api/reviewers/find?manuscriptId=${manuscript.id}`)
        if (response.ok) {
          const data = await response.json()
          setReviewers(data.reviewers || [])
        }
      } catch (error) {
        console.error('Error fetching reviewers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviewers()
  }, [manuscript.id])

  const handleReviewerToggle = (reviewerId: string) => {
    setSelectedReviewers(prev => 
      prev.includes(reviewerId) 
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    )
  }

  const handleAssign = () => {
    if (selectedReviewers.length === 0) return

    onAssign(selectedReviewers, {
      dueDate: invitationData.dueDate,
      message: invitationData.message
    })
  }

  const getAvailabilityColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900">
            Find Reviewers
          </h3>
          <p className="text-sm text-gray-600">
            {manuscript.field_of_study}{manuscript.subfield && ` • ${manuscript.subfield}`}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, affiliation, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="h_index">Sort by H-Index</option>
            <option value="availability">Sort by Availability</option>
            <option value="recent_activity">Sort by Response Time</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="minHIndex" className="text-xs">Min H-Index</Label>
            <Input
              id="minHIndex"
              type="number"
              placeholder="e.g., 10"
              value={filterBy.minHIndex}
              onChange={(e) => setFilterBy(prev => ({ ...prev, minHIndex: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="minPubs" className="text-xs">Min Publications</Label>
            <Input
              id="minPubs"
              type="number"
              placeholder="e.g., 20"
              value={filterBy.minPublications}
              onChange={(e) => setFilterBy(prev => ({ ...prev, minPublications: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="availability" className="text-xs">Min Availability (%)</Label>
            <Input
              id="availability"
              type="number"
              min="0"
              max="100"
              value={filterBy.availabilityThreshold}
              onChange={(e) => setFilterBy(prev => ({ ...prev, availabilityThreshold: parseInt(e.target.value) || 0 }))}
              className="text-sm"
            />
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="excludeConflicts"
              checked={filterBy.excludeConflicts}
              onCheckedChange={(checked) => setFilterBy(prev => ({ ...prev, excludeConflicts: checked as boolean }))}
            />
            <Label htmlFor="excludeConflicts" className="text-xs">Exclude conflicts</Label>
          </div>
        </div>
      </Card>

      {/* Reviewer List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAndSortedReviewers.length > 0 ? (
          filteredAndSortedReviewers.map(reviewer => {
            const relevanceScore = calculateRelevanceScore(reviewer)
            const isSelected = selectedReviewers.includes(reviewer.id)
            
            return (
              <Card 
                key={reviewer.id} 
                className={`p-4 transition-colors ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleReviewerToggle(reviewer.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{reviewer.full_name}</span>
                          <div className="flex items-center space-x-1">
                            <Star className={`w-3 h-3 ${getRelevanceColor(relevanceScore)}`} />
                            <span className={`text-xs ${getRelevanceColor(relevanceScore)}`}>
                              {relevanceScore}%
                            </span>
                          </div>
                        </h4>
                        
                        {reviewer.affiliation && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {reviewer.affiliation}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {reviewer.email}
                        </p>
                      </div>
                      
                      <div className="text-right text-sm">
                        <div className="flex items-center space-x-4">
                          {reviewer.h_index && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">H-Index</div>
                              <div className="font-medium">{reviewer.h_index}</div>
                            </div>
                          )}
                          
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Publications</div>
                            <div className="font-medium">{reviewer.total_publications}</div>
                          </div>
                          
                          {reviewer.availability_score && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">Availability</div>
                              <div className={`font-medium ${getAvailabilityColor(reviewer.availability_score)}`}>
                                {reviewer.availability_score}%
                              </div>
                            </div>
                          )}

                          {reviewer.overall_score && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">Overall</div>
                              <div className={`font-medium ${getRelevanceColor(reviewer.overall_score)}`}>
                                {reviewer.overall_score}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {reviewer.expertise.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {reviewer.expertise.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {reviewer.expertise.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{reviewer.expertise.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Match Reasons */}
                    {reviewer.match_reasons && reviewer.match_reasons.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Match Reasons:</div>
                        <div className="flex flex-wrap gap-1">
                          {reviewer.match_reasons.slice(0, 3).map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {reason}
                            </Badge>
                          ))}
                          {reviewer.match_reasons.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{reviewer.match_reasons.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* COI Status */}
                    {reviewer.coi_eligible !== undefined && (
                      <div className="mt-2">
                        {!reviewer.coi_eligible ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Conflict of Interest
                          </Badge>
                        ) : reviewer.coi_conflicts && reviewer.coi_conflicts.length > 0 ? (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {reviewer.coi_conflicts.length} COI Warning{reviewer.coi_conflicts.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : null}
                      </div>
                    )}

                    {reviewer.recent_reviews !== undefined && reviewer.avg_review_time && (
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Recent reviews: {reviewer.recent_reviews}</span>
                        <span>Avg. review time: {reviewer.avg_review_time} days</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Reviewers Found</h4>
            <p className="text-gray-600">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedReviewers.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedReviewers.length} reviewer{selectedReviewers.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedReviewers([])}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear selection
            </Button>
          </div>
        </Card>
      )}

      {/* Invitation Settings */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Invitation Details</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dueDate">Review Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={invitationData.dueDate}
              onChange={(e) => setInvitationData(prev => ({ ...prev, dueDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <Label htmlFor="message">Invitation Message</Label>
            <Textarea
              id="message"
              value={invitationData.message}
              onChange={(e) => setInvitationData(prev => ({ ...prev, message: e.target.value }))}
              rows={6}
              placeholder="Customize the invitation message..."
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleAssign}
          disabled={selectedReviewers.length === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Sending Invitations...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Invite {selectedReviewers.length} Reviewer{selectedReviewers.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}