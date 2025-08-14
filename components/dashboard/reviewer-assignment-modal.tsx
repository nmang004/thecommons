'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  User, 
  Star, 
  Calendar, 
  X, 
  Send
} from 'lucide-react'

interface Reviewer {
  id: string
  full_name: string
  email: string
  affiliation?: string
  expertise: string[]
  h_index?: number
  availability?: 'available' | 'busy' | 'unavailable'
  recent_reviews: number
  average_turnaround: number
}

interface ReviewerAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  manuscript: any
  potentialReviewers: Reviewer[]
  onAssignReviewers: (reviewerIds: string[], customMessage?: string) => void
}

export function ReviewerAssignmentModal({
  isOpen,
  onClose,
  manuscript,
  potentialReviewers,
  onAssignReviewers
}: ReviewerAssignmentModalProps) {
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByExpertise, setFilterByExpertise] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [dueDate, setDueDate] = useState(() => {
    const future = new Date()
    future.setDate(future.getDate() + 21) // Default 21 days
    return future.toISOString().split('T')[0]
  })

  if (!isOpen) return null

  // Filter reviewers based on search and expertise matching
  const filteredReviewers = potentialReviewers.filter(reviewer => {
    const matchesSearch = reviewer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reviewer.affiliation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reviewer.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesExpertise = !filterByExpertise || 
                            reviewer.expertise.some(exp => 
                              exp.toLowerCase().includes(manuscript.field_of_study.toLowerCase()) ||
                              manuscript.keywords?.some((keyword: string) => 
                                exp.toLowerCase().includes(keyword.toLowerCase())
                              )
                            )
    
    return matchesSearch && matchesExpertise
  })

  const handleReviewerSelect = (reviewerId: string) => {
    setSelectedReviewers(prev => 
      prev.includes(reviewerId) 
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    )
  }

  const handleAssign = () => {
    if (selectedReviewers.length === 0) return
    onAssignReviewers(selectedReviewers, customMessage)
    onClose()
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900">
              Assign Reviewers
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Select reviewers for: {manuscript.title.substring(0, 80)}...
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Reviewer Selection Panel */}
          <div className="flex-1 p-6 border-r border-gray-200 max-h-[70vh] overflow-y-auto">
            {/* Search and Filters */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviewers by name, affiliation, or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="expertise-filter"
                    checked={filterByExpertise}
                    onCheckedChange={(checked) => setFilterByExpertise(checked as boolean)}
                  />
                  <label htmlFor="expertise-filter" className="text-sm text-gray-700">
                    Match field of study
                  </label>
                </div>
                
                <div className="text-sm text-gray-600">
                  {filteredReviewers.length} reviewers found
                </div>
              </div>
            </div>

            {/* Reviewers List */}
            <div className="space-y-3">
              {filteredReviewers.map((reviewer) => (
                <Card 
                  key={reviewer.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedReviewers.includes(reviewer.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleReviewerSelect(reviewer.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={selectedReviewers.includes(reviewer.id)}
                        onChange={() => {}} // Handled by card click
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{reviewer.full_name}</p>
                            <p className="text-sm text-gray-600">{reviewer.affiliation}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {/* Expertise */}
                          <div>
                            <div className="flex flex-wrap gap-1">
                              {reviewer.expertise.slice(0, 3).map((exp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {exp}
                                </Badge>
                              ))}
                              {reviewer.expertise.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{reviewer.expertise.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>H-index: {reviewer.h_index || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{reviewer.average_turnaround}d avg</span>
                            </div>
                            <div>
                              {reviewer.recent_reviews} recent reviews
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <Badge className={`${getAvailabilityColor(reviewer.availability || 'available')} border`}>
                      {reviewer.availability || 'available'}
                    </Badge>
                  </div>
                </Card>
              ))}

              {filteredReviewers.length === 0 && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No reviewers found</h4>
                  <p className="text-gray-600">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Configuration */}
          <div className="w-full lg:w-96 p-6 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-4">Assignment Details</h4>
            
            {/* Selected Reviewers */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selected Reviewers ({selectedReviewers.length})
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedReviewers.map(reviewerId => {
                  const reviewer = potentialReviewers.find(r => r.id === reviewerId)
                  return reviewer ? (
                    <div key={reviewerId} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm text-gray-900">{reviewer.full_name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleReviewerSelect(reviewerId)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : null
                })}
              </div>
            </div>

            {/* Due Date */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Review Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-600 mt-1">
                Standard review period: 21 days
              </p>
            </div>

            {/* Custom Message */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Custom Message (Optional)
              </label>
              <Textarea
                placeholder="Add a custom message to the invitation email..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleAssign}
                disabled={selectedReviewers.length === 0}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Assign {selectedReviewers.length} Reviewer{selectedReviewers.length !== 1 ? 's' : ''}
              </Button>
              
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">
                Recommendations
              </h5>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Assign 2-3 reviewers minimum</p>
                <p>• Consider reviewer availability</p>
                <p>• Match expertise to manuscript topic</p>
                <p>• Check for potential conflicts of interest</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}