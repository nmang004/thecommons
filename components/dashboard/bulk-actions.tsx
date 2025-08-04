'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  UserPlus,
  Flag,
  Download,
  Mail,
  X,
  Check,
  AlertTriangle
} from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  selectedManuscripts: string[]
  onClearSelection: () => void
  onRefresh?: () => void
}

export function BulkActions({ 
  selectedCount, 
  selectedManuscripts, 
  onClearSelection,
  onRefresh 
}: BulkActionsProps) {
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [assignData, setAssignData] = useState({
    editorId: '',
    message: ''
  })
  const [priorityData, setPriorityData] = useState({
    priority: '',
    reason: ''
  })
  const [reminderData, setReminderData] = useState({
    subject: 'Review Reminder',
    message: 'This is a friendly reminder that your review is due soon. Please complete your review at your earliest convenience.'
  })

  const handleAssignEditor = async () => {
    if (!assignData.editorId) return

    setLoading(true)
    try {
      const response = await fetch('/api/manuscripts/bulk-assign-editor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptIds: selectedManuscripts,
          editorId: assignData.editorId,
          message: assignData.message || 'You have been assigned as editor for these manuscripts.'
        }),
      })

      if (response.ok) {
        setShowAssignModal(false)
        setAssignData({ editorId: '', message: '' })
        onClearSelection()
        onRefresh?.()
      } else {
        console.error('Failed to assign editor')
      }
    } catch (error) {
      console.error('Error assigning editor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPriority = async () => {
    if (!priorityData.priority) return

    setLoading(true)
    try {
      const response = await fetch('/api/manuscripts/bulk-set-priority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptIds: selectedManuscripts,
          priority: priorityData.priority,
          reason: priorityData.reason
        }),
      })

      if (response.ok) {
        setShowPriorityModal(false)
        setPriorityData({ priority: '', reason: '' })
        onClearSelection()
        onRefresh?.()
      } else {
        console.error('Failed to set priority')
      }
    } catch (error) {
      console.error('Error setting priority:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminders = async () => {
    if (!reminderData.subject || !reminderData.message) return

    setLoading(true)
    try {
      const response = await fetch('/api/manuscripts/bulk-send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptIds: selectedManuscripts,
          subject: reminderData.subject,
          message: reminderData.message
        }),
      })

      if (response.ok) {
        setShowReminderModal(false)
        onClearSelection()
        onRefresh?.()
      } else {
        console.error('Failed to send reminders')
      }
    } catch (error) {
      console.error('Error sending reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    setLoading(true)
    try {
      const response = await fetch('/api/manuscripts/bulk-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscriptIds: selectedManuscripts,
          format
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `manuscripts-export.${format === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        onClearSelection()
      } else {
        console.error('Failed to export manuscripts')
      }
    } catch (error) {
      console.error('Error exporting manuscripts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-blue-700">
              Bulk actions available
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignModal(true)}
              disabled={loading}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Assign Editor
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPriorityModal(true)}
              disabled={loading}
            >
              <Flag className="w-4 h-4 mr-1" />
              Set Priority
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-1" />
              Export Excel
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReminderModal(true)}
              disabled={loading}
            >
              <Mail className="w-4 h-4 mr-1" />
              Send Reminders
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Assign Editor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-semibold">Assign Editor</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssignModal(false)}
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editor">Editor *</Label>
                <select
                  id="editor"
                  value={assignData.editorId}
                  onChange={(e) => setAssignData({ ...assignData, editorId: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  disabled={loading}
                >
                  <option value="">Select an editor...</option>
                  {/* This would be populated with available editors */}
                  <option value="editor1">Dr. Sarah Johnson</option>
                  <option value="editor2">Prof. Michael Chen</option>
                  <option value="editor3">Dr. Emily Rodriguez</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="assign-message">Message (optional)</Label>
                <Textarea
                  id="assign-message"
                  value={assignData.message}
                  onChange={(e) => setAssignData({ ...assignData, message: e.target.value })}
                  placeholder="Optional message to include with the assignment..."
                  rows={3}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-md">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  This will assign {selectedCount} manuscript{selectedCount !== 1 ? 's' : ''} to the selected editor.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAssignModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignEditor}
                disabled={!assignData.editorId || loading}
              >
                {loading ? 'Assigning...' : 'Assign Editor'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Set Priority Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-semibold">Set Priority</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPriorityModal(false)}
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="priority">Priority Level *</Label>
                <select
                  id="priority"
                  value={priorityData.priority}
                  onChange={(e) => setPriorityData({ ...priorityData, priority: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  disabled={loading}
                >
                  <option value="">Select priority...</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="priority-reason">Reason (optional)</Label>
                <Textarea
                  id="priority-reason"
                  value={priorityData.reason}
                  onChange={(e) => setPriorityData({ ...priorityData, reason: e.target.value })}
                  placeholder="Reason for setting this priority level..."
                  rows={3}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
                <Flag className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  This will set priority for {selectedCount} manuscript{selectedCount !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPriorityModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetPriority}
                disabled={!priorityData.priority || loading}
              >
                {loading ? 'Setting...' : 'Set Priority'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Reminders Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-semibold">Send Reminders</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReminderModal(false)}
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reminder-subject">Subject *</Label>
                <input
                  id="reminder-subject"
                  type="text"
                  value={reminderData.subject}
                  onChange={(e) => setReminderData({ ...reminderData, subject: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="reminder-message">Message *</Label>
                <Textarea
                  id="reminder-message"
                  value={reminderData.message}
                  onChange={(e) => setReminderData({ ...reminderData, message: e.target.value })}
                  rows={4}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-md">
                <Mail className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  This will send reminders for {selectedCount} manuscript{selectedCount !== 1 ? 's' : ''} to their reviewers.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowReminderModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendReminders}
                disabled={!reminderData.subject || !reminderData.message || loading}
              >
                {loading ? 'Sending...' : 'Send Reminders'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}