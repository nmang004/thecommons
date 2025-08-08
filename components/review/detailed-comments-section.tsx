'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MessageSquare,
  AlertTriangle,
  Info,
  Lightbulb,
  ThumbsUp,
  HelpCircle,
  CheckCircle,
  Clock,
  Hash
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useReviewFormStore } from '@/lib/stores/review-form-store'
import type { Comment, CommentType } from '@/types/review'

interface DetailedCommentsSectionProps {
  className?: string
}

const COMMENT_CATEGORIES = {
  majorIssues: {
    label: 'Major Issues',
    description: 'Significant problems that affect the validity or impact of the work',
    icon: AlertTriangle,
    color: 'red',
    examples: [
      'Fundamental methodological flaws',
      'Missing critical controls or comparisons',
      'Unsupported conclusions',
      'Major gaps in literature review'
    ]
  },
  minorIssues: {
    label: 'Minor Issues',
    description: 'Smaller problems that should be addressed for improvement',
    icon: Info,
    color: 'amber',
    examples: [
      'Formatting inconsistencies',
      'Minor statistical concerns',
      'Small gaps in explanation',
      'Figure quality improvements'
    ]
  },
  suggestions: {
    label: 'Suggestions',
    description: 'Ideas for enhancing the manuscript',
    icon: Lightbulb,
    color: 'blue',
    examples: [
      'Additional analyses to consider',
      'Alternative interpretations',
      'Ways to strengthen conclusions',
      'Additional references to include'
    ]
  },
  positiveAspects: {
    label: 'Positive Aspects',
    description: 'Strengths and notable achievements of the work',
    icon: ThumbsUp,
    color: 'green',
    examples: [
      'Novel contributions to the field',
      'Rigorous methodology',
      'Clear presentation',
      'Comprehensive analysis'
    ]
  },
  questionsForAuthors: {
    label: 'Questions for Authors',
    description: 'Clarifications needed from the authors',
    icon: HelpCircle,
    color: 'purple',
    examples: [
      'Requests for additional information',
      'Clarification of methods',
      'Questions about data',
      'Requests for additional discussion'
    ]
  }
} as const

type CommentCategory = keyof typeof COMMENT_CATEGORIES

export function DetailedCommentsSection({ className }: DetailedCommentsSectionProps) {
  const { 
    form, 
    addComment, 
    updateComment, 
    deleteComment,
    validationErrors 
  } = useReviewFormStore()

  const [activeCategory, setActiveCategory] = useState<CommentCategory>('majorIssues')
  const [editingComment, setEditingComment] = useState<{category: CommentCategory, id: string} | null>(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [newCommentType, setNewCommentType] = useState<CommentType>('major')
  const [showAddDialog, setShowAddDialog] = useState(false)

  if (!form) return null

  const detailedComments = form.sections.detailedComments
  const sectionErrors = validationErrors.detailedComments || []

  if (!detailedComments) return null

  // Calculate completion
  const calculateCompletion = () => {
    const requiredCategories = ['majorIssues', 'minorIssues'] as CommentCategory[]
    const hasRequiredComments = requiredCategories.some(category => 
      (detailedComments as any)[category]?.length > 0
    )
    
    const totalCategories = Object.keys(COMMENT_CATEGORIES).length
    const categoriesWithComments = (Object.keys(COMMENT_CATEGORIES) as CommentCategory[])
      .filter(category => (detailedComments as any)[category]?.length > 0).length
    
    // Base score for meeting minimum requirement
    let score = hasRequiredComments ? 40 : 0
    
    // Additional points for comprehensive coverage
    score += (categoriesWithComments / totalCategories) * 60
    
    return Math.round(score)
  }

  const completion = calculateCompletion()

  // Get total comment count
  const getTotalComments = () => {
    return (Object.keys(COMMENT_CATEGORIES) as CommentCategory[])
      .reduce((total, category) => total + (detailedComments[category]?.length || 0), 0)
  }

  const handleAddComment = () => {
    if (!newCommentText.trim()) return
    
    const commentData = {
      text: newCommentText.trim(),
      type: newCommentType,
      resolved: false,
    }
    
    addComment(activeCategory, commentData)
    setNewCommentText('')
    setNewCommentType('major')
    setShowAddDialog(false)
  }

  const handleUpdateComment = (category: CommentCategory, commentId: string, updates: Partial<Comment>) => {
    updateComment(category, commentId, {
      ...updates,
      updatedAt: new Date()
    })
    setEditingComment(null)
  }

  const handleDeleteComment = (category: CommentCategory, commentId: string) => {
    deleteComment(category, commentId)
  }

  const CategoryIcon = COMMENT_CATEGORIES[activeCategory].icon

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Detailed Comments
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Provide specific feedback organized by category
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Completion</div>
              <div className="text-lg font-semibold">{completion}%</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Comments</div>
              <div className="text-lg font-semibold text-blue-600">
                {getTotalComments()}
              </div>
            </div>
          </div>
        </div>
        
        <Progress value={completion} className="h-2" />
        
        {sectionErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Please address the following issues:
                </h4>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {sectionErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Navigation */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex bg-gray-50 border-b border-gray-200">
          {(Object.keys(COMMENT_CATEGORIES) as CommentCategory[]).map((category) => {
            const config = COMMENT_CATEGORIES[category]
            const count = (detailedComments as any)[category]?.length || 0
            const isActive = activeCategory === category
            const Icon = config.icon
            
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                  {count > 0 && (
                    <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                      {count}
                    </Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Active Category Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Category Description */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CategoryIcon className={`w-5 h-5 text-${COMMENT_CATEGORIES[activeCategory].color}-600`} />
                <h3 className="text-lg font-medium text-gray-900">
                  {COMMENT_CATEGORIES[activeCategory].label}
                </h3>
              </div>
              
              <p className="text-sm text-gray-600">
                {COMMENT_CATEGORIES[activeCategory].description}
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  Examples of {COMMENT_CATEGORIES[activeCategory].label.toLowerCase()}:
                </h4>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  {COMMENT_CATEGORIES[activeCategory].examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Add Comment Button */}
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium text-gray-900">
                Comments ({(detailedComments as any)[activeCategory]?.length || 0})
              </h4>
              
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Comment</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Add New Comment</DialogTitle>
                    <DialogDescription>
                      Add a comment to the {COMMENT_CATEGORIES[activeCategory].label.toLowerCase()} category.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="comment-type">Comment Type</Label>
                      <Select value={newCommentType} onValueChange={(value: CommentType) => setNewCommentType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="suggestion">Suggestion</SelectItem>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comment-text">Comment</Label>
                      <Textarea
                        id="comment-text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Enter your detailed comment here..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddComment} disabled={!newCommentText.trim()}>
                      Add Comment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {(detailedComments as any)[activeCategory]?.length || 0 === 0 ? (
                <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
                  <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    No {COMMENT_CATEGORIES[activeCategory].label.toLowerCase()} added yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click "Add Comment" to get started.
                  </p>
                </div>
              ) : (
                (detailedComments as any)[activeCategory]?.map((comment: any, index: number) => (
                  <Card key={comment.id} className="p-4">
                    <div className="space-y-3">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {comment.type}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Hash className="w-3 h-3" />
                            <span>{index + 1}</span>
                          </div>
                          {comment.resolved && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {comment.updatedAt && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>Updated {comment.updatedAt.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingComment({category: activeCategory, id: comment.id})}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(activeCategory, comment.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Comment Content */}
                      {editingComment?.category === activeCategory && editingComment?.id === comment.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={comment.text}
                            onChange={(e) => 
                              handleUpdateComment(activeCategory, comment.id, { text: e.target.value })
                            }
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingComment(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setEditingComment(null)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-800 text-sm leading-relaxed">
                          {comment.text}
                        </p>
                      )}

                      {/* Comment Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          {comment.text.length} characters
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => 
                            handleUpdateComment(activeCategory, comment.id, { 
                              resolved: !comment.resolved 
                            })
                          }
                          className={comment.resolved ? 'text-green-600' : 'text-gray-600'}
                        >
                          {comment.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Comments Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(Object.keys(COMMENT_CATEGORIES) as CommentCategory[]).map((category) => {
              const config = COMMENT_CATEGORIES[category]
              const count = (detailedComments as any)[category]?.length || 0
              const Icon = config.icon
              
              return (
                <div key={category} className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-${config.color}-100 mb-2`}>
                    <Icon className={`w-5 h-5 text-${config.color}-600`} />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {count}
                  </div>
                  <div className="text-xs text-gray-600">
                    {config.label}
                  </div>
                </div>
              )
            })}
          </div>
          
          {completion === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">
                  Detailed comments section completed!
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}