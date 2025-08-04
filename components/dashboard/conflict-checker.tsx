'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertTriangle, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  X,
  Info,
  FileText,
  Users,
  Building,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react'

export interface ConflictDetection {
  conflict_id: string
  author_id: string
  author_name: string
  conflict_type: string
  severity: 'low' | 'medium' | 'high' | 'blocking'
  description: string
  evidence: any
  is_blocking: boolean
}

export interface ReviewerEligibility {
  reviewer_id: string
  is_eligible: boolean
  conflicts: ConflictDetection[]
  risk_score: number
}

interface ConflictCheckerProps {
  reviewerEligibility: ReviewerEligibility[]
  onOverrideConflict: (reviewerId: string, reason: string) => void
  onRemoveReviewer: (reviewerId: string) => void
  showDetails?: boolean
}

export function ConflictChecker({ 
  reviewerEligibility, 
  onOverrideConflict, 
  onRemoveReviewer,
  showDetails = false 
}: ConflictCheckerProps) {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set())
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({})
  const [showAllDetails, setShowAllDetails] = useState(showDetails)

  const totalReviewers = reviewerEligibility.length
  const eligibleReviewers = reviewerEligibility.filter(r => r.is_eligible).length
  const blockedReviewers = reviewerEligibility.filter(r => !r.is_eligible).length
  const reviewersWithWarnings = reviewerEligibility.filter(r => 
    r.is_eligible && r.conflicts.length > 0
  ).length

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'blocking':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'institutional_current':
      case 'institutional_recent':
        return <Building className="w-4 h-4" />
      case 'coauthorship_recent':
      case 'coauthorship_frequent':
        return <Users className="w-4 h-4" />
      case 'financial_competing':
      case 'financial_collaboration':
        return <DollarSign className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const toggleConflictExpansion = (conflictId: string) => {
    const newExpanded = new Set(expandedConflicts)
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId)
    } else {
      newExpanded.add(conflictId)
    }
    setExpandedConflicts(newExpanded)
  }

  const handleOverrideSubmit = (reviewerId: string) => {
    const reason = overrideReasons[reviewerId]
    if (reason?.trim()) {
      onOverrideConflict(reviewerId, reason.trim())
      setOverrideReasons(prev => ({ ...prev, [reviewerId]: '' }))
    }
  }

  if (totalReviewers === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Conflict of Interest Check</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllDetails(!showAllDetails)}
          >
            {showAllDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="ml-1">{showAllDetails ? 'Hide' : 'Show'} Details</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalReviewers}</div>
            <div className="text-gray-600">Total Reviewers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{eligibleReviewers}</div>
            <div className="text-gray-600">Eligible</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{blockedReviewers}</div>
            <div className="text-gray-600">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{reviewersWithWarnings}</div>
            <div className="text-gray-600">With Warnings</div>
          </div>
        </div>
      </Card>

      {/* Detailed Conflicts */}
      {showAllDetails && (
        <div className="space-y-3">
          {reviewerEligibility.map((reviewer) => {
            if (reviewer.conflicts.length === 0) return null

            return (
              <Card key={reviewer.reviewer_id} className={`p-4 ${
                !reviewer.is_eligible ? 'border-red-200 bg-red-50' : 
                reviewer.conflicts.some(c => c.severity === 'high') ? 'border-orange-200 bg-orange-50' : 
                'border-yellow-200 bg-yellow-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {!reviewer.is_eligible ? (
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-yellow-600" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        Reviewer {reviewer.reviewer_id.slice(0, 8)}...
                        <span className={`ml-2 text-sm ${getRiskScoreColor(reviewer.risk_score)}`}>
                          Risk Score: {reviewer.risk_score}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {reviewer.conflicts.length} conflict{reviewer.conflicts.length !== 1 ? 's' : ''} detected
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!reviewer.is_eligible && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveReviewer(reviewer.reviewer_id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Conflicts List */}
                <div className="space-y-2 mb-4">
                  {reviewer.conflicts.map((conflict) => (
                    <div key={conflict.conflict_id} className="border rounded-lg p-3 bg-white">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleConflictExpansion(conflict.conflict_id)}
                      >
                        <div className="flex items-center space-x-3">
                          {getConflictIcon(conflict.conflict_type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {conflict.author_name}
                              </span>
                              <Badge className={`${getSeverityColor(conflict.severity)} border text-xs`}>
                                {conflict.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {conflict.description}
                            </div>
                          </div>
                        </div>
                        <Info className="w-4 h-4 text-gray-400" />
                      </div>

                      {expandedConflicts.has(conflict.conflict_id) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm text-gray-700">
                            <div className="mb-2">
                              <strong>Type:</strong> {conflict.conflict_type.replace(/_/g, ' ')}
                            </div>
                            {conflict.evidence && (
                              <div className="mb-2">
                                <strong>Evidence:</strong>
                                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(conflict.evidence, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Override Option for Blocked Reviewers */}
                {!reviewer.is_eligible && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Override Conflict (Admin Only)
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Provide a detailed justification for overriding this conflict..."
                        value={overrideReasons[reviewer.reviewer_id] || ''}
                        onChange={(e) => setOverrideReasons(prev => ({
                          ...prev,
                          [reviewer.reviewer_id]: e.target.value
                        }))}
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOverrideReasons(prev => ({
                            ...prev,
                            [reviewer.reviewer_id]: ''
                          }))}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleOverrideSubmit(reviewer.reviewer_id)}
                          disabled={!overrideReasons[reviewer.reviewer_id]?.trim()}
                        >
                          Override Conflict
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* No Conflicts Message */}
      {totalReviewers > 0 && blockedReviewers === 0 && reviewersWithWarnings === 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              All selected reviewers passed conflict of interest checks
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}