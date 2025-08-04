'use client'

import { useState, useEffect } from 'react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Eye, Wand2, Variable, MessageSquare } from 'lucide-react'

interface AuthorLetterBuilderProps {
  manuscript: {
    id: string
    title: string
    profiles?: {
      full_name: string
      email: string
    }
  }
  reviews: Array<{
    id: string
    reviewer_id: string
    recommendation: string
    summary: string
    major_comments: string
    minor_comments?: string
    profiles?: {
      full_name: string
    }
  }>
  value: string
  onChange: (value: string) => void
  selectedTemplate?: any
  onTemplateSelect?: (template: any) => void
  className?: string
}

// Available variables for the letter
const LETTER_VARIABLES = [
  'author_name',
  'manuscript_title', 
  'editor_name',
  'journal_name',
  'submission_date',
  'current_date',
  'review_count',
  'decision_type'
]

export function AuthorLetterBuilder({
  manuscript,
  reviews,
  value,
  onChange,
  selectedTemplate,
  onTemplateSelect,
  className
}: AuthorLetterBuilderProps) {
  const [previewMode, setPreviewMode] = useState(false)
  const [processedContent, setProcessedContent] = useState('')

  // Process review comments for insertion
  const reviewComments = reviews.flatMap(review => [
    {
      id: `${review.id}-summary`,
      review_id: review.id,
      reviewer_name: review.profiles?.full_name || 'Anonymous Reviewer',
      comment_type: 'summary',
      content: review.summary,
      include_in_letter: true
    },
    {
      id: `${review.id}-major`,
      review_id: review.id,
      reviewer_name: review.profiles?.full_name || 'Anonymous Reviewer',
      comment_type: 'major',
      content: review.major_comments,
      include_in_letter: true
    },
    ...(review.minor_comments ? [{
      id: `${review.id}-minor`,
      review_id: review.id,
      reviewer_name: review.profiles?.full_name || 'Anonymous Reviewer',
      comment_type: 'minor',
      content: review.minor_comments,
      include_in_letter: true
    }] : [])
  ])

  // Process the content with variables for preview
  useEffect(() => {
    let processed = value
    
    // Replace variables with actual values
    const variables = {
      author_name: manuscript.profiles?.full_name || 'Author',
      manuscript_title: manuscript.title,
      editor_name: 'Editor Name', // This would come from context
      journal_name: 'The Commons',
      submission_date: new Date().toLocaleDateString(),
      current_date: new Date().toLocaleDateString(),
      review_count: reviews.length.toString(),
      decision_type: 'Editorial Decision'
    }

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processed = processed.replace(regex, value)
    })

    setProcessedContent(processed)
  }, [value, manuscript, reviews])

  const handleVariableInsert = (variable: string) => {
    console.log('Variable inserted:', variable)
  }

  const handleCommentInsert = (comment: any) => {
    console.log('Comment inserted:', comment)
  }

  const generateSampleLetter = () => {
    const sampleLetter = `Dear {{author_name}},

Thank you for submitting your manuscript "{{manuscript_title}}" to {{journal_name}}.

After careful consideration and peer review, I am writing to inform you of our editorial decision regarding your submission.

The manuscript was reviewed by {{review_count}} expert reviewer${reviews.length !== 1 ? 's' : ''} in your field. Based on their feedback and my own editorial assessment, I have reached the following decision:

[Your decision and reasoning will go here]

The reviewers provided the following feedback:

[Review comments will be inserted here]

Please feel free to contact me if you have any questions about this decision.

Best regards,
{{editor_name}}
Editor-in-Chief`

    onChange(sampleLetter)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Decision Letter to Author
              </CardTitle>
              <CardDescription>
                Craft the letter that will be sent to {manuscript.profiles?.full_name || 'the author'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedTemplate && (
                <Badge variant="outline" className="text-xs">
                  Template: {selectedTemplate.name}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="comments">Review Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              {!value && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Start with a template</h4>
                      <p className="text-sm text-blue-700">
                        Generate a sample letter structure to get started
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateSampleLetter}
                      className="text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Sample
                    </Button>
                  </div>
                </div>
              )}

              {previewMode ? (
                <div className="min-h-[400px] p-6 bg-white border rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: processedContent }} />
                  </div>
                </div>
              ) : (
                <RichTextEditor
                  content={value}
                  onChange={onChange}
                  placeholder="Begin composing your decision letter to the author..."
                  variables={LETTER_VARIABLES}
                  reviewComments={reviewComments}
                  onVariableInsert={handleVariableInsert}
                  onCommentInsert={handleCommentInsert}
                  className="min-h-[400px]"
                />
              )}
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Variable className="w-4 h-4 mr-2" />
                      Available Variables
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Click to copy or type @variable_name in the editor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {LETTER_VARIABLES.map(variable => (
                      <div key={variable} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <code className="text-xs font-mono">{{variable}}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${variable}}}`)
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Variable Preview</CardTitle>
                    <CardDescription className="text-xs">
                      How variables will appear in the final letter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div><strong>author_name:</strong> {manuscript.profiles?.full_name || 'Author'}</div>
                      <div><strong>manuscript_title:</strong> {manuscript.title}</div>
                      <div><strong>journal_name:</strong> The Commons</div>
                      <div><strong>review_count:</strong> {reviews.length}</div>
                      <div><strong>current_date:</strong> {new Date().toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Review Comments ({reviewComments.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select comments to include in your decision letter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {reviews.map((review, index) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">
                            {review.profiles?.full_name || `Reviewer ${index + 1}`}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {review.recommendation.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Summary</div>
                            <p className="text-sm text-gray-700 line-clamp-2">{review.summary}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs mt-1"
                              onClick={() => handleCommentInsert({
                                id: `${review.id}-summary`,
                                reviewer_name: review.profiles?.full_name || 'Anonymous Reviewer',
                                comment_type: 'summary',
                                content: review.summary,
                                include_in_letter: true
                              })}
                            >
                              Insert Summary
                            </Button>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Major Comments</div>
                            <p className="text-sm text-gray-700 line-clamp-2">{review.major_comments}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs mt-1"
                              onClick={() => handleCommentInsert({
                                id: `${review.id}-major`,
                                reviewer_name: review.profiles?.full_name || 'Anonymous Reviewer',
                                comment_type: 'major',
                                content: review.major_comments,
                                include_in_letter: true
                              })}
                            >
                              Insert Major Comments
                            </Button>
                          </div>

                          {review.minor_comments && (
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">Minor Comments</div>
                              <p className="text-sm text-gray-700 line-clamp-2">{review.minor_comments}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs mt-1"
                                onClick={() => handleCommentInsert({
                                  id: `${review.id}-minor`,
                                  reviewer_name: review.profiles?.full_name || 'Anonymous Reviewer',
                                  comment_type: 'minor',
                                  content: review.minor_comments,
                                  include_in_letter: true
                                })}
                              >
                                Insert Minor Comments
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}