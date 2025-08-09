'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Calendar,
  Settings,
  AlertCircle,
  Plus,
  X,
  Save,
  BarChart3,
  Target,
  Filter,
  RefreshCw
} from 'lucide-react'
import { ReviewerSettings, AutoDeclineRule, DateRange } from '@/types/database'

interface WorkloadManagementProps {
  workload: {
    currentAssignments: number
    monthlyCapacity: number
    blackoutDates: DateRange[]
    preferredDeadlines: number
    autoDeclineRules: AutoDeclineRule[]
  }
  reviewerSettings?: ReviewerSettings | null
  onSettingsUpdate: () => void
}

export function WorkloadManagement({ workload, reviewerSettings, onSettingsUpdate }: WorkloadManagementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState<ReviewerSettings>(
    reviewerSettings || {
      monthlyCapacity: workload.monthlyCapacity,
      preferredDeadlines: workload.preferredDeadlines,
      blackoutDates: workload.blackoutDates.map(d => d.startDate),
      autoDeclineRules: workload.autoDeclineRules,
      workloadPreferences: {
        maxConcurrentReviews: 3,
        preferredFields: [],
        availabilityStatus: 'available',
        notificationPreferences: {
          emailReminders: true,
          deadlineWarnings: true,
          achievementNotifications: true
        }
      }
    }
  )
  
  const [newBlackoutDate, setNewBlackoutDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/reviewers/me/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      setIsEditing(false)
      onSettingsUpdate()
    } catch (error) {
      console.error('Error saving settings:', error)
      // TODO: Show error toast
    } finally {
      setSaving(false)
    }
  }

  const addBlackoutDate = () => {
    if (newBlackoutDate) {
      setSettings(prev => ({
        ...prev,
        blackoutDates: [...prev.blackoutDates, newBlackoutDate]
      }))
      setNewBlackoutDate('')
    }
  }

  const removeBlackoutDate = (dateToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      blackoutDates: prev.blackoutDates.filter(date => date !== dateToRemove)
    }))
  }

  const addAutoDeclineRule = () => {
    const newRule: AutoDeclineRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      enabled: true,
      conditions: {}
    }
    
    setSettings(prev => ({
      ...prev,
      autoDeclineRules: [...prev.autoDeclineRules, newRule]
    }))
  }

  const updateAutoDeclineRule = (ruleId: string, updates: Partial<AutoDeclineRule>) => {
    setSettings(prev => ({
      ...prev,
      autoDeclineRules: prev.autoDeclineRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }))
  }

  const removeAutoDeclineRule = (ruleId: string) => {
    setSettings(prev => ({
      ...prev,
      autoDeclineRules: prev.autoDeclineRules.filter(rule => rule.id !== ruleId)
    }))
  }

  // Calculate workload percentage
  const workloadPercentage = Math.min((workload.currentAssignments / workload.monthlyCapacity) * 100, 100)
  const getWorkloadColor = () => {
    if (workloadPercentage >= 100) return 'bg-red-500'
    if (workloadPercentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">
            Workload Management
          </h2>
          <p className="text-gray-600">
            Manage your review capacity, availability, and automatic decline rules
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Current Workload Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Current Workload</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Reviews</span>
              <span className="font-medium">
                {workload.currentAssignments}/{workload.monthlyCapacity}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getWorkloadColor()}`}
                style={{ width: `${workloadPercentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {workload.currentAssignments >= workload.monthlyCapacity ? 
                  'At capacity' : 
                  `${workload.monthlyCapacity - workload.currentAssignments} slots available`
                }
              </span>
              <span className="text-gray-500">
                {Math.round(workloadPercentage)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Availability</h3>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                settings.workloadPreferences.availabilityStatus === 'available' ? 'bg-green-500' :
                settings.workloadPreferences.availabilityStatus === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm capitalize">
                {settings.workloadPreferences.availabilityStatus}
              </span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Preferred Deadline</span>
              <span>{settings.preferredDeadlines} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blackout Dates</span>
              <span>{settings.blackoutDates.length} set</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Auto Rules</span>
              <span>{settings.autoDeclineRules.filter(r => r.enabled).length} active</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Next 30 Days</h3>
            <Calendar className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Reviews</span>
              <span className="font-medium">2-3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Days</span>
              <span className="text-green-600 font-medium">28 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blackout Days</span>
              <span className="text-red-600">2 days</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity & Availability Settings */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Capacity & Availability
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthlyCapacity">Monthly Review Capacity</Label>
              <div className="mt-1">
                {isEditing ? (
                  <Input
                    id="monthlyCapacity"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.monthlyCapacity}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      monthlyCapacity: parseInt(e.target.value) || 1
                    }))}
                  />
                ) : (
                  <div className="text-lg font-medium">{settings.monthlyCapacity} reviews/month</div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="preferredDeadlines">Preferred Review Timeline</Label>
              <div className="mt-1">
                {isEditing ? (
                  <Input
                    id="preferredDeadlines"
                    type="number"
                    min="7"
                    max="60"
                    value={settings.preferredDeadlines}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      preferredDeadlines: parseInt(e.target.value) || 21
                    }))}
                  />
                ) : (
                  <div className="text-lg font-medium">{settings.preferredDeadlines} days</div>
                )}
              </div>
            </div>

            <div>
              <Label>Availability Status</Label>
              <div className="mt-2 space-y-2">
                {['available', 'busy', 'unavailable'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={status}
                      name="availability"
                      checked={settings.workloadPreferences.availabilityStatus === status}
                      onChange={() => isEditing && setSettings(prev => ({
                        ...prev,
                        workloadPreferences: {
                          ...prev.workloadPreferences,
                          availabilityStatus: status as 'available' | 'busy' | 'unavailable'
                        }
                      }))}
                      disabled={!isEditing}
                      className="text-blue-600"
                    />
                    <label htmlFor={status} className="capitalize text-sm">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Blackout Dates */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Blackout Dates
              </h3>
            </div>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={addBlackoutDate}
                disabled={!newBlackoutDate}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {isEditing && (
              <div>
                <Label htmlFor="newBlackoutDate">Add Blackout Date</Label>
                <Input
                  id="newBlackoutDate"
                  type="date"
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="space-y-2">
              {settings.blackoutDates.length > 0 ? (
                settings.blackoutDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm">
                      {new Date(date).toLocaleDateString()}
                    </span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlackoutDate(date)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No blackout dates set</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Auto-Decline Rules */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Auto-Decline Rules
              </h3>
              <p className="text-sm text-gray-600">
                Automatically decline invitations that meet certain criteria
              </p>
            </div>
          </div>
          {isEditing && (
            <Button variant="outline" onClick={addAutoDeclineRule}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {settings.autoDeclineRules.length > 0 ? (
            settings.autoDeclineRules.map((rule) => (
              <div
                key={rule.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {isEditing ? (
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => 
                          updateAutoDeclineRule(rule.id, { enabled })
                        }
                      />
                    ) : (
                      <div className={`w-3 h-3 rounded-full ${
                        rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                    
                    {isEditing ? (
                      <Input
                        value={rule.name}
                        onChange={(e) => 
                          updateAutoDeclineRule(rule.id, { name: e.target.value })
                        }
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">{rule.name}</span>
                    )}
                  </div>

                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAutoDeclineRule(rule.id)}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                {isEditing && (
                  <div className="space-y-3 ml-6">
                    <div>
                      <Label>Max Workload Percentage</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.conditions.maxWorkloadPercentage || ''}
                        onChange={(e) => 
                          updateAutoDeclineRule(rule.id, {
                            conditions: {
                              ...rule.conditions,
                              maxWorkloadPercentage: parseInt(e.target.value) || undefined
                            }
                          })
                        }
                        placeholder="e.g., 80"
                      />
                    </div>

                    <div>
                      <Label>Minimum Days to Deadline</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={rule.conditions.minDaysToDeadline || ''}
                        onChange={(e) => 
                          updateAutoDeclineRule(rule.id, {
                            conditions: {
                              ...rule.conditions,
                              minDaysToDeadline: parseInt(e.target.value) || undefined
                            }
                          })
                        }
                        placeholder="e.g., 14"
                      />
                    </div>
                  </div>
                )}

                {!isEditing && rule.conditions && (
                  <div className="ml-6 space-y-1 text-sm text-gray-600">
                    {rule.conditions.maxWorkloadPercentage && (
                      <div>Decline when workload &gt; {rule.conditions.maxWorkloadPercentage}%</div>
                    )}
                    {rule.conditions.minDaysToDeadline && (
                      <div>Decline when deadline &lt; {rule.conditions.minDaysToDeadline} days</div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No auto-decline rules configured</p>
              <p className="text-sm">Add rules to automatically manage your workload</p>
            </div>
          )}
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notification Preferences
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Reminders</Label>
              <p className="text-sm text-gray-600">
                Receive email reminders about approaching deadlines
              </p>
            </div>
            <Switch
              checked={settings.workloadPreferences.notificationPreferences.emailReminders}
              onCheckedChange={(checked) => 
                isEditing && setSettings(prev => ({
                  ...prev,
                  workloadPreferences: {
                    ...prev.workloadPreferences,
                    notificationPreferences: {
                      ...prev.workloadPreferences.notificationPreferences,
                      emailReminders: checked
                    }
                  }
                }))
              }
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Deadline Warnings</Label>
              <p className="text-sm text-gray-600">
                Get notified when reviews are approaching their due date
              </p>
            </div>
            <Switch
              checked={settings.workloadPreferences.notificationPreferences.deadlineWarnings}
              onCheckedChange={(checked) => 
                isEditing && setSettings(prev => ({
                  ...prev,
                  workloadPreferences: {
                    ...prev.workloadPreferences,
                    notificationPreferences: {
                      ...prev.workloadPreferences.notificationPreferences,
                      deadlineWarnings: checked
                    }
                  }
                }))
              }
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Achievement Notifications</Label>
              <p className="text-sm text-gray-600">
                Be notified when you earn new badges and achievements
              </p>
            </div>
            <Switch
              checked={settings.workloadPreferences.notificationPreferences.achievementNotifications}
              onCheckedChange={(checked) => 
                isEditing && setSettings(prev => ({
                  ...prev,
                  workloadPreferences: {
                    ...prev.workloadPreferences,
                    notificationPreferences: {
                      ...prev.workloadPreferences.notificationPreferences,
                      achievementNotifications: checked
                    }
                  }
                }))
              }
              disabled={!isEditing}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}