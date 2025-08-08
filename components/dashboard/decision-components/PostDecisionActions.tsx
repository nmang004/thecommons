'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { 
  Bell, 
  Users, 
  Calendar as CalendarIcon, 
  User, 
  FileText, 
  Send,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface PostDecisionActionsProps {
  decision: string
  actions: {
    notifyAuthor: boolean
    notifyReviewers: boolean
    schedulePublication?: string | null
    assignProductionEditor?: string | null
    generateDOI?: boolean
    sendToProduction?: boolean
    followUpDate?: string | null
  }
  onChange: (actions: any) => void
  availableEditors?: Array<{
    id: string
    full_name: string
    role: string
  }>
  className?: string
}

export function PostDecisionActions({
  decision,
  actions,
  onChange,
  availableEditors = [],
  className
}: PostDecisionActionsProps) {
  const [publicationDate, setPublicationDate] = useState<Date | undefined>(
    actions.schedulePublication ? new Date(actions.schedulePublication) : undefined
  )
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    actions.followUpDate ? new Date(actions.followUpDate) : undefined
  )

  const updateAction = (key: string, value: any) => {
    onChange({
      ...actions,
      [key]: value
    })
  }

  const getActionsByDecision = () => {
    switch (decision) {
      case 'accepted':
        return {
          required: ['notifyAuthor', 'generateDOI', 'sendToProduction'],
          optional: ['notifyReviewers', 'schedulePublication', 'assignProductionEditor'],
          disabled: []
        }
      case 'revisions_requested':
        return {
          required: ['notifyAuthor'],
          optional: ['notifyReviewers', 'followUpDate'],
          disabled: ['generateDOI', 'sendToProduction', 'schedulePublication']
        }
      case 'rejected':
        return {
          required: ['notifyAuthor'],
          optional: ['notifyReviewers'],
          disabled: ['generateDOI', 'sendToProduction', 'schedulePublication', 'assignProductionEditor']
        }
      default:
        return {
          required: ['notifyAuthor'],
          optional: ['notifyReviewers'],
          disabled: []
        }
    }
  }

  const actionConfig = getActionsByDecision()

  const ActionCard = ({ 
    icon: Icon, 
    title, 
    description, 
    actionKey, 
    required = false, 
    disabled = false,
    children 
  }: {
    icon: any
    title: string
    description: string
    actionKey: string
    required?: boolean
    disabled?: boolean
    children?: React.ReactNode
  }) => {
    const isEnabled = actions[actionKey as keyof typeof actions]
    
    return (
      <Card className={cn(
        'transition-colors',
        disabled && 'opacity-50 bg-gray-50',
        required && 'border-blue-200 bg-blue-50/30'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-2 rounded-lg',
                disabled ? 'bg-gray-200' : isEnabled ? 'bg-green-100' : 'bg-gray-100'
              )}>
                <Icon className={cn(
                  'w-4 h-4',
                  disabled ? 'text-gray-400' : isEnabled ? 'text-green-600' : 'text-gray-600'
                )} />
              </div>
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  {title}
                  {required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                  {disabled && <Badge variant="outline" className="text-xs">Not Available</Badge>}
                </CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </div>
            </div>
            <Switch
              checked={isEnabled as boolean}
              onCheckedChange={(checked) => updateAction(actionKey, checked)}
              disabled={disabled || required}
            />
          </div>
        </CardHeader>
        {isEnabled && children && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Post-Decision Actions
          </CardTitle>
          <CardDescription>
            Configure automated actions that will be triggered after the decision is submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Decision Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">
                  Decision: {decision.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="text-sm text-blue-700">
                  The following actions will be available based on your decision
                </p>
              </div>
            </div>
          </div>

          {/* Notification Actions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </h4>

            <ActionCard
              icon={Send}
              title="Notify Author"
              description="Send decision letter to the corresponding author"
              actionKey="notifyAuthor"
              required={actionConfig.required.includes('notifyAuthor')}
              disabled={actionConfig.disabled.includes('notifyAuthor')}
            />

            <ActionCard
              icon={Users}
              title="Notify Reviewers"
              description="Inform reviewers that a decision has been made"
              actionKey="notifyReviewers"
              required={actionConfig.required.includes('notifyReviewers')}
              disabled={actionConfig.disabled.includes('notifyReviewers')}
            />
          </div>

          {/* Publication Actions */}
          {decision === 'accepted' && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Publication Workflow
              </h4>

              <ActionCard
                icon={FileText}
                title="Generate DOI"
                description="Automatically generate a DOI for the accepted manuscript"
                actionKey="generateDOI"
                required={actionConfig.required.includes('generateDOI')}
                disabled={actionConfig.disabled.includes('generateDOI')}
              />

              <ActionCard
                icon={Settings}
                title="Send to Production"
                description="Move manuscript to production queue for copyediting"
                actionKey="sendToProduction"
                required={actionConfig.required.includes('sendToProduction')}
                disabled={actionConfig.disabled.includes('sendToProduction')}
              />

              <ActionCard
                icon={CalendarIcon}
                title="Schedule Publication"
                description="Set a target publication date"
                actionKey="schedulePublication"
                disabled={actionConfig.disabled.includes('schedulePublication')}
              >
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Publication Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !publicationDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {publicationDate ? format(publicationDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={publicationDate}
                        onSelect={(date) => {
                          setPublicationDate(date)
                          updateAction('schedulePublication', date?.toISOString() || null)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </ActionCard>

              <ActionCard
                icon={User}
                title="Assign Production Editor"
                description="Assign a production editor to handle copyediting"
                actionKey="assignProductionEditor"
                disabled={actionConfig.disabled.includes('assignProductionEditor')}
              >
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Production Editor</Label>
                  <Select
                    value={actions.assignProductionEditor || ''}
                    onValueChange={(value) => updateAction('assignProductionEditor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a production editor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEditors
                        .filter(editor => editor.role === 'editor' || editor.role === 'admin')
                        .map(editor => (
                        <SelectItem key={editor.id} value={editor.id}>
                          {editor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </ActionCard>
            </div>
          )}

          {/* Follow-up Actions */}
          {(decision === 'revisions_requested' || decision === 'accepted') && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Follow-up
              </h4>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <AlertCircle className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Follow-up Reminder</CardTitle>
                        <CardDescription className="text-xs">
                          Set a reminder to follow up on this decision
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label className="text-sm font-medium">Reminder Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !followUpDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpDate ? format(followUpDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={followUpDate}
                        onSelect={(date) => {
                          setFollowUpDate(date)
                          updateAction('followUpDate', date?.toISOString() || null)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Summary */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Action Summary</h4>
            <div className="space-y-1 text-sm text-gray-700">
              {Object.entries(actions)
                .filter(([_, value]) => value === true)
                .map(([key, _]) => (
                <div key={key} className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                </div>
              ))}
              {Object.keys(actions).filter(key => actions[key as keyof typeof actions] === true).length === 0 && (
                <div className="text-gray-500 italic">No actions selected</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}