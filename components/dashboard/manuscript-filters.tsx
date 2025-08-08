'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface QueueFilters {
  status?: string[]
  field?: string[]
  editor?: string
  priority?: string
  search?: string
  dateRange?: {
    from?: Date
    to?: Date
  }
}

interface ManuscriptFiltersProps {
  filters: QueueFilters
  onFiltersChange: (filters: QueueFilters) => void
  manuscripts: Array<{
    status: string
    field_of_study: string
    editor_id?: string
    priority?: string
    profiles?: {
      full_name: string
    }
  }>
}

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'with_editor', label: 'With Editor', color: 'bg-purple-100 text-purple-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'revisions_requested', label: 'Revisions Requested', color: 'bg-orange-100 text-orange-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'published', label: 'Published', color: 'bg-emerald-100 text-emerald-800' }
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low Priority', color: 'bg-gray-100 text-gray-800' }
]

const DATE_PRESETS = [
  { 
    label: 'Last 7 days', 
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  },
  { 
    label: 'Last 30 days', 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  },
  { 
    label: 'Last 3 months', 
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date()
  },
  { 
    label: 'This year', 
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  }
]

export function ManuscriptFilters({ filters, onFiltersChange, manuscripts }: ManuscriptFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    field: false,
    priority: false,
    date: false
  })

  // Get unique values from manuscripts
  const uniqueFields = [...new Set(manuscripts.map(m => m.field_of_study))].sort()

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue || undefined })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatus = filters.status || []
    let newStatus: string[]

    if (checked) {
      newStatus = [...currentStatus, status]
    } else {
      newStatus = currentStatus.filter(s => s !== status)
    }

    onFiltersChange({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined
    })
  }

  const handleFieldChange = (field: string, checked: boolean) => {
    const currentFields = filters.field || []
    let newFields: string[]

    if (checked) {
      newFields = [...currentFields, field]
    } else {
      newFields = currentFields.filter(f => f !== field)
    }

    onFiltersChange({
      ...filters,
      field: newFields.length > 0 ? newFields : undefined
    })
  }

  const handlePriorityChange = (priority: string) => {
    onFiltersChange({
      ...filters,
      priority: filters.priority === priority ? undefined : priority
    })
  }

  const handleDatePreset = (preset: { from: Date; to: Date }) => {
    onFiltersChange({
      ...filters,
      dateRange: { from: preset.from, to: preset.to }
    })
  }

  const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
    if (!value) {
      const newDateRange = { ...(filters.dateRange || {}) }
      delete newDateRange[type]
      onFiltersChange({
        ...filters,
        dateRange: Object.keys(newDateRange).length > 0 ? newDateRange : undefined
      })
      return
    }

    const date = new Date(value)
    if (isNaN(date.getTime())) return

    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: date
      }
    })
  }

  const clearDateFilter = () => {
    onFiltersChange({
      ...filters,
      dateRange: undefined
    })
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.status?.length) count++
    if (filters.field?.length) count++
    if (filters.priority) count++
    if (filters.search) count++
    if (filters.dateRange) count++
    return count
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
          Search manuscripts
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search"
            placeholder="Search by title, abstract, or author..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchValue('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <button
          onClick={() => toggleSection('status')}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
        >
          <span>Status {filters.status?.length && `(${filters.status.length})`}</span>
          {expandedSections.status ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
          }
        </button>
        
        {expandedSections.status && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {STATUS_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${option.value}`}
                  checked={filters.status?.includes(option.value) || false}
                  onCheckedChange={(checked) => handleStatusChange(option.value, checked as boolean)}
                />
                <label 
                  htmlFor={`status-${option.value}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  {option.label}
                </label>
                <Badge className={`${option.color} text-xs`}>
                  {manuscripts.filter(m => m.status === option.value).length}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {filters.status?.length && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.status.map(status => (
              <Badge 
                key={status} 
                variant="secondary" 
                className="text-xs"
              >
                {STATUS_OPTIONS.find(s => s.value === status)?.label}
                <button
                  onClick={() => handleStatusChange(status, false)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-2 h-2" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Field of Study Filter */}
      <div>
        <button
          onClick={() => toggleSection('field')}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
        >
          <span>Field of Study {filters.field?.length && `(${filters.field.length})`}</span>
          {expandedSections.field ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
          }
        </button>
        
        {expandedSections.field && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uniqueFields.map(field => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${field}`}
                  checked={filters.field?.includes(field) || false}
                  onCheckedChange={(checked) => handleFieldChange(field, checked as boolean)}
                />
                <label 
                  htmlFor={`field-${field}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  {field}
                </label>
                <Badge variant="outline" className="text-xs">
                  {manuscripts.filter(m => m.field_of_study === field).length}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {filters.field?.length && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.field.map(field => (
              <Badge 
                key={field} 
                variant="secondary" 
                className="text-xs"
              >
                {field}
                <button
                  onClick={() => handleFieldChange(field, false)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-2 h-2" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Priority Filter */}
      <div>
        <button
          onClick={() => toggleSection('priority')}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
        >
          <span>Priority {filters.priority && '(1)'}</span>
          {expandedSections.priority ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
          }
        </button>
        
        {expandedSections.priority && (
          <div className="space-y-2">
            {PRIORITY_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${option.value}`}
                  checked={filters.priority === option.value}
                  onCheckedChange={() => handlePriorityChange(option.value)}
                />
                <label 
                  htmlFor={`priority-${option.value}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  {option.label}
                </label>
                <Badge className={`${option.color} text-xs`}>
                  {manuscripts.filter(m => m.priority === option.value).length}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {filters.priority && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {PRIORITY_OPTIONS.find(p => p.value === filters.priority)?.label}
              <button
                onClick={() => handlePriorityChange(filters.priority!)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-2 h-2" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div>
        <button
          onClick={() => toggleSection('date')}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
        >
          <span>Submission Date {filters.dateRange && '(1)'}</span>
          {expandedSections.date ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
          }
        </button>
        
        {expandedSections.date && (
          <div className="space-y-4">
            {/* Date Presets */}
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Quick select</Label>
              <div className="grid grid-cols-2 gap-2">
                {DATE_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDatePreset(preset)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Custom range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="date-from" className="text-xs text-gray-500">From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateRange?.from ? formatDate(filters.dateRange.from) : ''}
                    onChange={(e) => handleCustomDateChange('from', e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="text-xs text-gray-500">To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateRange?.to ? formatDate(filters.dateRange.to) : ''}
                    onChange={(e) => handleCustomDateChange('to', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {filters.dateRange && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {filters.dateRange.from && formatDate(filters.dateRange.from)} - {filters.dateRange.to && formatDate(filters.dateRange.to)}
              <button
                onClick={clearDateFilter}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-2 h-2" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {getActiveFilterCount() > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchValue('')
                onFiltersChange({})
              }}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}