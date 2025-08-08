'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  Lock, 
  AlertTriangle, 
  Shield, 
  FileSearch,
  CheckCircle,
  Info,
  UserX,
  Flag,
  MessageSquareMore
} from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useReviewFormStore } from '@/lib/stores/review-form-store'
import type { PlagiarismReport } from '@/types/review'

interface ConfidentialCommentsSectionProps {
  className?: string
}

const ETHICAL_CONCERN_TYPES = [
  'Research misconduct',
  'Data fabrication/falsification',
  'Plagiarism',
  'Authorship disputes',
  'Conflicts of interest not disclosed',
  'Human subjects violations',
  'Animal welfare concerns',
  'Environmental safety issues',
  'Dual use concerns',
  'Other'
] as const

const RECOMMENDED_ACTIONS = [
  'Accept as is',
  'Accept with minor revisions',
  'Major revision required',
  'Reject - quality issues',
  'Reject - ethical concerns', 
  'Desk reject - out of scope',
  'Require additional review',
  'Consult ethics committee',
  'Other'
] as const

export function ConfidentialCommentsSection({ className }: ConfidentialCommentsSectionProps) {
  const { form, updateSection, validationErrors } = useReviewFormStore()
  
  // const [showPlagiarismDetails, setShowPlagiarismDetails] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['editor']))

  if (!form) return null

  const confidentialComments = form.sections.confidentialComments
  const sectionErrors = validationErrors.confidentialComments || []

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completedFields = 0
    let totalFields = 1 // Editor comments are required
    
    // Editor comments
    if (confidentialComments.editorOnly?.trim()) {
      completedFields++
    }
    
    // Optional fields count toward completion if present
    if (confidentialComments.ethicalConcerns?.trim()) {
      totalFields++
      completedFields++
    }
    
    if (confidentialComments.suspectedPlagiarism) {
      totalFields++
      completedFields++
    }
    
    if (confidentialComments.recommendedAction?.trim()) {
      totalFields++
      completedFields++
    }
    
    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
  }

  const completion = calculateCompletion()

  const updateConfidential = (updates: any) => {
    updateSection('confidentialComments', {
      ...confidentialComments,
      ...updates
    })
  }

  const updatePlagiarismReport = (updates: Partial<PlagiarismReport>) => {
    const currentReport = confidentialComments.suspectedPlagiarism || {
      detected: false,
      similarity: 0,
      sources: []
    }
    
    updateConfidential({
      suspectedPlagiarism: {
        ...currentReport,
        ...updates
      }
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Lock className="w-6 h-6 text-red-600" />
              <span>Confidential Comments</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Private feedback for the editorial team only
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Completion</div>
              <div className="text-lg font-semibold">{completion}%</div>
            </div>
          </div>
        </div>
        
        <Progress value={completion} className="h-2" />
        
        <Alert className="border-red-200 bg-red-50">
          <Shield className="w-4 h-4" />
          <AlertTitle className="text-red-800">Confidential Information</AlertTitle>
          <AlertDescription className="text-red-700">
            This section is only visible to editors and will not be shared with authors. 
            Use this space for sensitive feedback, ethical concerns, and editorial recommendations.
          </AlertDescription>
        </Alert>
        
        {sectionErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Please address the following issues:
                </h4>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {sectionErrors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor-Only Comments */}
      <Collapsible open={expandedSections.has('editor')} onOpenChange={() => toggleSection('editor')}>
        <Card className="border-2 border-red-200">
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-red-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquareMore className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Editorial Comments
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Required
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Private feedback and recommendations for the editor
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {confidentialComments.editorOnly?.trim() && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('editor') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-red-200">
              <div className="space-y-4 mt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Guidelines for Editor-Only Comments:
                  </h4>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>Overall assessment of manuscript quality and fit</li>
                    <li>Concerns about methodology or interpretation</li>
                    <li>Suggestions for handling author responses</li>
                    <li>Recommendations for additional reviewers if needed</li>
                    <li>Any sensitive issues requiring editorial attention</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editor-comments" className="text-sm font-medium">
                    Confidential Comments for Editor <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="editor-comments"
                    value={confidentialComments.editorOnly}
                    onChange={(e) => updateConfidential({ editorOnly: e.target.value })}
                    placeholder="Provide your confidential assessment and recommendations for the editor. This will not be shared with the authors..."
                    rows={8}
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {confidentialComments.editorOnly?.length || 0} characters
                    </span>
                    {confidentialComments.editorOnly && confidentialComments.editorOnly.length < 100 && (
                      <span className="text-amber-600">
                        Consider providing more detailed feedback
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Ethical Concerns */}
      <Collapsible open={expandedSections.has('ethics')} onOpenChange={() => toggleSection('ethics')}>
        <Card className="border-amber-200">
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-amber-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Flag className="w-6 h-6 text-amber-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Ethical Concerns
                      <Badge variant="outline" className="ml-2 text-xs">
                        Optional
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Report any ethical issues or research misconduct
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {confidentialComments.ethicalConcerns?.trim() && (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('ethics') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-amber-200">
              <div className="space-y-4 mt-4">
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle className="text-amber-800">Important</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Only fill this section if you have specific ethical concerns about the research, 
                    methodology, or reporting. Serious allegations will trigger additional editorial review.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={!!confidentialComments.ethicalConcerns?.trim()}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          updateConfidential({ ethicalConcerns: '' })
                        }
                      }}
                    />
                    <Label>I have identified potential ethical concerns</Label>
                  </div>
                  
                  {confidentialComments.ethicalConcerns !== undefined && (
                    <div className="space-y-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="ethical-concerns" className="text-sm font-medium">
                          Describe the Ethical Concerns
                        </Label>
                        <Textarea
                          id="ethical-concerns"
                          value={confidentialComments.ethicalConcerns}
                          onChange={(e) => updateConfidential({ ethicalConcerns: e.target.value })}
                          placeholder="Provide detailed description of the ethical concerns, including specific evidence and references to relevant sections of the manuscript..."
                          rows={6}
                        />
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-amber-800 mb-2">
                          Common Ethical Concerns:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {ETHICAL_CONCERN_TYPES.map(type => (
                            <div key={type} className="text-sm text-amber-700">
                              • {type}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Suspected Plagiarism */}
      <Collapsible open={expandedSections.has('plagiarism')} onOpenChange={() => toggleSection('plagiarism')}>
        <Card className="border-orange-200">
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-orange-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileSearch className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Plagiarism Check
                      <Badge variant="outline" className="ml-2 text-xs">
                        Optional
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Report suspected plagiarism or text similarity
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {confidentialComments.suspectedPlagiarism?.detected && (
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('plagiarism') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-orange-200">
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={confidentialComments.suspectedPlagiarism?.detected || false}
                    onCheckedChange={(checked) => {
                      updatePlagiarismReport({ detected: checked as boolean })
                    }}
                  />
                  <Label>I suspect plagiarism or inappropriate text similarity</Label>
                </div>
                
                {confidentialComments.suspectedPlagiarism?.detected && (
                  <div className="space-y-4 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="similarity-percentage" className="text-sm font-medium">
                        Estimated Similarity Percentage (%)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="similarity-percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={confidentialComments.suspectedPlagiarism?.similarity || ''}
                          onChange={(e) => updatePlagiarismReport({ 
                            similarity: parseFloat(e.target.value) || 0 
                          })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Suspected Sources
                      </Label>
                      
                      {confidentialComments.suspectedPlagiarism?.sources?.map((source, index) => (
                        <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-orange-800">
                              Source {index + 1}
                            </h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newSources = confidentialComments.suspectedPlagiarism!.sources.filter((_, i) => i !== index)
                                updatePlagiarismReport({ sources: newSources })
                              }}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Source title"
                              value={source.title}
                              onChange={(e) => {
                                const newSources = [...confidentialComments.suspectedPlagiarism!.sources]
                                newSources[index] = { ...source, title: e.target.value }
                                updatePlagiarismReport({ sources: newSources })
                              }}
                              className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm"
                            />
                            
                            <input
                              type="url"
                              placeholder="Source URL"
                              value={source.url}
                              onChange={(e) => {
                                const newSources = [...confidentialComments.suspectedPlagiarism!.sources]
                                newSources[index] = { ...source, url: e.target.value }
                                updatePlagiarismReport({ sources: newSources })
                              }}
                              className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm"
                            />
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Similarity %"
                                value={source.similarity || ''}
                                onChange={(e) => {
                                  const newSources = [...confidentialComments.suspectedPlagiarism!.sources]
                                  newSources[index] = { ...source, similarity: parseFloat(e.target.value) || 0 }
                                  updatePlagiarismReport({ sources: newSources })
                                }}
                                className="w-24 px-3 py-2 border border-orange-300 rounded-md text-sm"
                              />
                              <span className="text-sm text-gray-600">% similarity</span>
                            </div>
                          </div>
                        </div>
                      )) || []}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const currentSources = confidentialComments.suspectedPlagiarism?.sources || []
                          updatePlagiarismReport({
                            sources: [...currentSources, { title: '', url: '', similarity: 0 }]
                          })
                        }}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        Add Source
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="plagiarism-report" className="text-sm font-medium">
                        Detailed Report
                      </Label>
                      <Textarea
                        id="plagiarism-report"
                        value={confidentialComments.suspectedPlagiarism?.report || ''}
                        onChange={(e) => updatePlagiarismReport({ report: e.target.value })}
                        placeholder="Provide detailed description of the suspected plagiarism, including specific sections, sentences, or paragraphs..."
                        rows={6}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Editorial Recommendation */}
      <Collapsible open={expandedSections.has('recommendation')} onOpenChange={() => toggleSection('recommendation')}>
        <Card className="border-blue-200">
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-blue-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserX className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Editorial Recommendation
                      <Badge variant="outline" className="ml-2 text-xs">
                        Optional
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Specific action recommendations for the editor
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {confidentialComments.recommendedAction && (
                    <Info className="w-5 h-5 text-blue-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('recommendation') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-blue-200">
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="recommended-action" className="text-sm font-medium">
                    Recommended Editorial Action
                  </Label>
                  <Select
                    value={confidentialComments.recommendedAction || ''}
                    onValueChange={(value) => updateConfidential({ recommendedAction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommended action" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECOMMENDED_ACTIONS.map(action => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Editorial Action Guidelines:
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Accept as is:</strong> No changes needed</p>
                    <p>• <strong>Minor revisions:</strong> Small fixes, no re-review needed</p>
                    <p>• <strong>Major revisions:</strong> Significant changes, requires re-review</p>
                    <p>• <strong>Reject:</strong> Manuscript does not meet publication standards</p>
                    <p>• <strong>Desk reject:</strong> Out of scope or clearly unsuitable</p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Summary */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-600" />
            <span>Confidential Section Summary</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {confidentialComments.editorOnly?.trim() ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-600">
                Editor Comments
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600">
                {confidentialComments.ethicalConcerns?.trim() ? '⚠' : '-'}
              </div>
              <div className="text-xs text-gray-600">
                Ethical Concerns
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {confidentialComments.suspectedPlagiarism?.detected ? '⚠' : '-'}
              </div>
              <div className="text-xs text-gray-600">
                Plagiarism
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {confidentialComments.recommendedAction ? '✓' : '-'}
              </div>
              <div className="text-xs text-gray-600">
                Recommendation
              </div>
            </div>
          </div>
          
          {completion === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">
                  Confidential comments section completed!
                </span>
              </div>
            </div>
          )}
          
          <Alert className="border-red-200 bg-red-50">
            <Lock className="w-4 h-4" />
            <AlertDescription className="text-red-700">
              <strong>Reminder:</strong> All information in this section will remain strictly confidential 
              and will not be shared with the authors under any circumstances.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    </div>
  )
}