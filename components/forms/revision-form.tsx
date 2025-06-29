'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  Eye, 
  Star,
  AlertCircle,
  ArrowLeft,
  Send
} from 'lucide-react'

const revisionSchema = z.object({
  responseToReviewers: z.string().min(50, 'Response must be at least 50 characters'),
  changesDescription: z.string().min(50, 'Please describe the changes made'),
  coverLetter: z.string().optional(),
})

type RevisionFormData = z.infer<typeof revisionSchema>

interface RevisionFormProps {
  manuscript: any
}

export default function RevisionForm({ manuscript }: RevisionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<RevisionFormData>({
    resolver: zodResolver(revisionSchema),
    defaultValues: {
      responseToReviewers: '',
      changesDescription: '',
      coverLetter: '',
    },
  })

  const onDrop = (acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: RevisionFormData) => {
    setIsSubmitting(true)
    try {
      // Upload files first
      const fileUploadPromises = uploadedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'revision')

        const response = await fetch(`/api/manuscripts/${manuscript.id}/files`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return response.json()
      })

      await Promise.all(fileUploadPromises)

      // Submit revision
      const response = await fetch(`/api/manuscripts/${manuscript.id}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Revision submission failed')
      }

      // Redirect to submission page with success message
      window.location.href = `/author/submissions/${manuscript.id}?revision=submitted`

    } catch (error) {
      console.error('Revision submission error:', error)
      alert(error instanceof Error ? error.message : 'Revision submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <a href={`/author/submissions/${manuscript.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submission
          </a>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Reviewer Comments */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Reviewer Comments
          </h3>
          
          <div className="space-y-6">
            {manuscript.reviews?.map((review: any, index: number) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Reviewer {index + 1}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        review.recommendation === 'accept' ? 'bg-green-100 text-green-800' :
                        review.recommendation === 'minor_revisions' ? 'bg-yellow-100 text-yellow-800' :
                        review.recommendation === 'major_revisions' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {review.recommendation.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                    {review.confidence_level && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          Confidence: {review.confidence_level}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Summary</Label>
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded">
                      {review.summary}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Major Comments</Label>
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {review.major_comments}
                    </p>
                  </div>

                  {review.minor_comments && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Minor Comments</Label>
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                        {review.minor_comments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Editorial Decision */}
        {manuscript.editorial_decisions && manuscript.editorial_decisions.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Editorial Decision
            </h3>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Editor's Letter</h4>
              <p className="text-sm text-purple-800 whitespace-pre-wrap">
                {manuscript.editorial_decisions[manuscript.editorial_decisions.length - 1].decision_letter}
              </p>
            </div>
          </Card>
        )}

        {/* Response to Reviewers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Response to Reviewers *
          </h3>
          
          <div>
            <Label htmlFor="responseToReviewers" className="text-sm font-medium text-gray-700">
              Point-by-point response to reviewer comments
            </Label>
            <p className="text-xs text-gray-600 mb-2">
              Address each reviewer comment systematically. Use clear headings like "Reviewer 1, Comment 1:"
            </p>
            <Textarea
              id="responseToReviewers"
              {...register('responseToReviewers')}
              placeholder="Reviewer 1, Comment 1: [Quote the comment]&#10;&#10;Response: [Your detailed response explaining how you addressed this concern]&#10;&#10;Reviewer 1, Comment 2: [Quote the comment]&#10;&#10;Response: [Your response]..."
              rows={15}
              className="text-sm font-mono"
            />
            {errors.responseToReviewers && (
              <p className="text-red-600 text-sm mt-1">{errors.responseToReviewers.message}</p>
            )}
          </div>
        </Card>

        {/* Description of Changes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Description of Changes Made *
          </h3>
          
          <div>
            <Label htmlFor="changesDescription" className="text-sm font-medium text-gray-700">
              Summarize the key changes made to your manuscript
            </Label>
            <Textarea
              id="changesDescription"
              {...register('changesDescription')}
              placeholder="1. Revised methodology section to address Reviewer 1's concerns about sample size...&#10;2. Added additional analysis as suggested by Reviewer 2...&#10;3. Clarified the discussion section to better explain the implications..."
              rows={8}
              className="text-sm"
            />
            {errors.changesDescription && (
              <p className="text-red-600 text-sm mt-1">{errors.changesDescription.message}</p>
            )}
          </div>
        </Card>

        {/* Updated Cover Letter */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Updated Cover Letter (Optional)
          </h3>
          
          <div>
            <Label htmlFor="coverLetter" className="text-sm font-medium text-gray-700">
              Additional comments for the editor
            </Label>
            <Textarea
              id="coverLetter"
              {...register('coverLetter')}
              placeholder="Dear Editor,&#10;&#10;Thank you for the constructive feedback on our manuscript. We have carefully addressed all reviewer comments and believe the manuscript is now significantly improved...&#10;&#10;Sincerely,&#10;[Your name]"
              rows={8}
              className="text-sm"
            />
          </div>
        </Card>

        {/* File Upload */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Revised Manuscript *
          </h3>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              {isDragActive
                ? 'Drop files here...'
                : 'Drag and drop revised manuscript files here, or click to browse'
              }
            </p>
            <p className="text-xs text-gray-500">
              PDF, DOC, DOCX accepted • Max 50MB per file
            </p>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {uploadedFiles.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Please upload your revised manuscript file
              </span>
            </div>
          )}
        </Card>

        {/* Submit Button */}
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Submit Revision?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your revision will be sent back to the editor for review
            </p>
            
            <Button
              type="submit"
              disabled={isSubmitting || uploadedFiles.length === 0}
              size="lg"
              className="px-8 py-3"
            >
              {isSubmitting ? (
                'Submitting Revision...'
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Revised Manuscript
                </>
              )}
            </Button>
            
            {uploadedFiles.length === 0 && (
              <p className="text-red-600 text-sm mt-2">
                Please upload at least one revised manuscript file
              </p>
            )}
          </div>
        </Card>
      </form>
    </div>
  )
}