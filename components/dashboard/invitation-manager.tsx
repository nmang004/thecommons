'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConflictChecker, ReviewerEligibility } from './conflict-checker'
import { 
  Send, 
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  FileText
} from 'lucide-react'

interface InvitationTemplate {
  id: string
  name: string
  subject: string
  body: string
}

interface BulkInvitationResult {
  reviewer_id: string
  success: boolean
  assignment_id?: string
  error?: string
  conflicts?: any[]
  scheduled_for?: string
}

interface InvitationManagerProps {
  manuscript: {
    id: string
    title: string
    abstract: string
    field_of_study: string
    subfield?: string
    author_name: string
  }
  selectedReviewers: any[]
  reviewerEligibility: ReviewerEligibility[]
  onInvitationsSent: (results: BulkInvitationResult[]) => void
  onCancel: () => void
}

export function InvitationManager({
  manuscript,
  selectedReviewers,
  reviewerEligibility,
  onInvitationsSent,
  onCancel
}: InvitationManagerProps) {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<InvitationTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [staggered, setStaggered] = useState<boolean>(false)
  const [staggerHours, setStaggerHours] = useState<number>(24)
  const [overrideConflicts, setOverrideConflicts] = useState<{ [key: string]: string }>({})
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('compose')

  const eligibleReviewers = selectedReviewers.filter(r => 
    reviewerEligibility.find(e => e.reviewer_id === r.id)?.is_eligible !== false
  )
  const blockedReviewers = selectedReviewers.filter(r => 
    reviewerEligibility.find(e => e.reviewer_id === r.id)?.is_eligible === false
  )
  const reviewersWithWarnings = selectedReviewers.filter(r => {
    const eligibility = reviewerEligibility.find(e => e.reviewer_id === r.id)
    return eligibility?.is_eligible === true && eligibility.conflicts.length > 0
  })

  // Load invitation templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/invitations/bulk')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || [])
        }
      } catch (error) {
        console.error('Error loading templates:', error)
      }
    }
    loadTemplates()
  }, [])

  const handleSendInvitations = async () => {
    setLoading(true)
    try {
      // Prepare reviewer IDs (only eligible + overridden)
      const reviewerIdsToInvite = [
        ...eligibleReviewers.map(r => r.id),
        ...blockedReviewers
          .filter(r => overrideConflicts[r.id]?.trim())
          .map(r => r.id)
      ]

      if (reviewerIdsToInvite.length === 0) {
        alert('No eligible reviewers to invite')
        return
      }

      const requestBody = {
        manuscript_id: manuscript.id,
        reviewer_ids: reviewerIdsToInvite,
        due_date: dueDate,
        message: customMessage,
        template_id: selectedTemplate,
        staggered: staggered,
        stagger_hours: staggerHours,
        override_conflicts: overrideConflicts
      }

      const response = await fetch('/api/invitations/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (response.ok) {
        onInvitationsSent(result.results)
      } else {
        throw new Error(result.error || 'Failed to send invitations')
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      alert(`Error sending invitations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleOverrideConflict = (reviewerId: string, reason: string) => {
    setOverrideConflicts(prev => ({
      ...prev,
      [reviewerId]: reason
    }))
  }

  const renderTemplate = (template: InvitationTemplate, reviewer?: any) => {
    if (!template) return ''

    const variables = {
      '{{reviewer_name}}': reviewer?.full_name || '[Reviewer Name]',
      '{{manuscript_title}}': manuscript.title,
      '{{field_of_study}}': manuscript.field_of_study,
      '{{abstract_preview}}': manuscript.abstract.substring(0, 200) + '...',
      '{{due_date}}': new Date(dueDate).toLocaleDateString(),
      '{{reviewer_expertise}}': reviewer?.expertise?.slice(0, 3).join(', ') || '[Expertise Areas]',
      '{{response_deadline}}': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      '{{editor_name}}': '[Editor Name]',
      '{{journal_name}}': 'The Commons',
      '{{revision_round}}': '1'
    }

    let renderedTemplate = template.body
    Object.entries(variables).forEach(([variable, value]) => {
      renderedTemplate = renderedTemplate.replace(new RegExp(variable, 'g'), value)
    })

    return renderedTemplate
  }

  const selectedTemplate_obj = templates.find(t => t.id === selectedTemplate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900">
            Send Reviewer Invitations
          </h3>
          <p className="text-sm text-gray-600">
            {manuscript.title}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{selectedReviewers.length}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{eligibleReviewers.length}</div>
            <div className="text-sm text-gray-600">Eligible</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{reviewersWithWarnings.length}</div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{blockedReviewers.length}</div>
            <div className="text-sm text-gray-600">Blocked</div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">
            <FileText className="w-4 h-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="conflicts">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Conflicts ({blockedReviewers.length + reviewersWithWarnings.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          {/* Template Selection */}
          <Card className="p-4">
            <Label htmlFor="template" className="text-sm font-medium">
              Invitation Template
            </Label>
            <select
              id="template"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </Card>

          {/* Due Date */}
          <Card className="p-4">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Review Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </Card>

          {/* Custom Message */}
          <Card className="p-4">
            <Label htmlFor="customMessage" className="text-sm font-medium">
              Additional Message (Optional)
            </Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any additional context or special instructions for reviewers..."
              rows={4}
              className="mt-1"
            />
          </Card>

          {/* Preview */}
          {showPreview && selectedTemplate_obj && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Email Preview</h4>
                <Badge variant="outline">{selectedTemplate_obj.name}</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Subject:</div>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTemplate_obj.subject.replace('{{manuscript_title}}', manuscript.title)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Body:</div>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">
                      {renderTemplate(selectedTemplate_obj, eligibleReviewers[0])}
                      {customMessage && (
                        <>
                          {'\n\n---\n\n'}
                          {customMessage}
                        </>
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="conflicts">
          <ConflictChecker
            reviewerEligibility={reviewerEligibility}
            onOverrideConflict={handleOverrideConflict}
            onRemoveReviewer={() => {}} // Not implemented in this context
            showDetails={true}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Staggered Invitations */}
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="staggered"
                checked={staggered}
                onCheckedChange={(checked) => setStaggered(checked as boolean)}
              />
              <Label htmlFor="staggered" className="text-sm font-medium">
                Staggered Invitations
              </Label>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Send invitations in waves to optimize response rates
            </p>
            
            {staggered && (
              <div className="mt-3">
                <Label htmlFor="staggerHours" className="text-sm font-medium">
                  Hours between invitations
                </Label>
                <Input
                  id="staggerHours"
                  type="number"
                  min="1"
                  max="72"
                  value={staggerHours}
                  onChange={(e) => setStaggerHours(parseInt(e.target.value) || 24)}
                  className="mt-1 w-32"
                />
              </div>
            )}
          </Card>

          {/* Invitation Summary */}
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Invitation Timeline</h4>
            <div className="space-y-2 text-sm">
              {eligibleReviewers.slice(0, 3).map((reviewer, index) => (
                <div key={reviewer.id} className="flex items-center justify-between">
                  <span>{reviewer.full_name}</span>
                  <span className="text-gray-500">
                    {staggered 
                      ? new Date(Date.now() + index * staggerHours * 60 * 60 * 1000).toLocaleString()
                      : 'Immediate'
                    }
                  </span>
                </div>
              ))}
              {eligibleReviewers.length > 3 && (
                <div className="text-gray-500">
                  ... and {eligibleReviewers.length - 3} more
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSendInvitations}
          disabled={loading || (eligibleReviewers.length === 0 && blockedReviewers.filter(r => overrideConflicts[r.id]?.trim()).length === 0)}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sending Invitations...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send {eligibleReviewers.length + blockedReviewers.filter(r => overrideConflicts[r.id]?.trim()).length} Invitation{eligibleReviewers.length + blockedReviewers.filter(r => overrideConflicts[r.id]?.trim()).length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}