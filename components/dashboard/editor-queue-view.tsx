'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  UserPlus,
  Users,
  Mail,
  MoreHorizontal,
  AlertTriangle,
  Clock,
  CheckCircle,
  Download,
  X
} from 'lucide-react'
import { ManuscriptFilters } from './manuscript-filters'
import { BulkActions } from './bulk-actions'
import { PriorityIndicator, Priority, usePrioritySorting } from './priority-indicator'

export interface QueueFilters {
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

interface ManuscriptWithDetails {
  id: string
  title: string
  abstract: string
  field_of_study: string
  subfield?: string
  status: string
  submitted_at: string
  created_at: string
  editor_id?: string
  priority?: Priority
  profiles?: {
    full_name: string
    affiliation?: string
    email: string
  }
  review_assignments?: Array<{
    id: string
    status: string
    due_date: string
    profiles?: {
      full_name: string
    }
  }>
}

interface EditorQueueViewProps {
  manuscripts: ManuscriptWithDetails[]
  currentEditor: {
    id: string
    full_name: string
    role: string
  }
  onRefresh?: () => void
}

const QUEUE_VIEWS = {
  all: { label: 'All Manuscripts', icon: FileText },
  new_submissions: { label: 'New Submissions', icon: AlertTriangle },
  my_manuscripts: { label: 'My Manuscripts', icon: UserPlus },
  in_review: { label: 'In Review', icon: Clock },
  awaiting_decision: { label: 'Awaiting Decision', icon: CheckCircle },
  revisions: { label: 'Revisions', icon: FileText }
}

export function EditorQueueView({ manuscripts, currentEditor, onRefresh }: EditorQueueViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<QueueFilters>({})
  const [sortBy, setSortBy] = useState<'submitted_at' | 'title' | 'status' | 'priority'>('submitted_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeView, setActiveView] = useState(searchParams.get('view') || 'all')

  // Filter manuscripts based on active view and filters
  const filteredManuscripts = useMemo(() => {
    let filtered = manuscripts

    // Apply view-specific filtering
    switch (activeView) {
      case 'new_submissions':
        filtered = manuscripts.filter(m => !m.editor_id && m.status === 'submitted')
        break
      case 'my_manuscripts':
        filtered = manuscripts.filter(m => m.editor_id === currentEditor.id)
        break
      case 'in_review':
        filtered = manuscripts.filter(m => m.status === 'under_review')
        break
      case 'awaiting_decision':
        filtered = manuscripts.filter(m => 
          m.status === 'with_editor' && 
          m.review_assignments?.every(ra => ra.status === 'completed')
        )
        break
      case 'revisions':
        filtered = manuscripts.filter(m => m.status === 'revisions_requested')
        break
      default:
        filtered = manuscripts
    }

    // Apply additional filters
    if (filters.status?.length) {
      filtered = filtered.filter(m => filters.status!.includes(m.status))
    }
    if (filters.field?.length) {
      filtered = filtered.filter(m => filters.field!.includes(m.field_of_study))
    }
    if (filters.editor) {
      filtered = filtered.filter(m => m.editor_id === filters.editor)
    }
    if (filters.priority) {
      filtered = filtered.filter(m => m.priority === filters.priority)
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchTerm) ||
        m.abstract.toLowerCase().includes(searchTerm) ||
        m.profiles?.full_name.toLowerCase().includes(searchTerm)
      )
    }
    if (filters.dateRange?.from && filters.dateRange?.to) {
      const from = filters.dateRange.from
      const to = filters.dateRange.to
      filtered = filtered.filter(m => {
        const date = new Date(m.submitted_at || m.created_at)
        return date >= from && date <= to
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          aValue = priorityOrder[a.priority || 'normal']
          bValue = priorityOrder[b.priority || 'normal']
          break
        default:
          aValue = new Date(a.submitted_at || a.created_at)
          bValue = new Date(b.submitted_at || b.created_at)
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [manuscripts, activeView, filters, sortBy, sortOrder, currentEditor.id])

  // Calculate counts for each view
  const viewCounts = useMemo(() => {
    return {
      all: manuscripts.length,
      new_submissions: manuscripts.filter(m => !m.editor_id && m.status === 'submitted').length,
      my_manuscripts: manuscripts.filter(m => m.editor_id === currentEditor.id).length,
      in_review: manuscripts.filter(m => m.status === 'under_review').length,
      awaiting_decision: manuscripts.filter(m => 
        m.status === 'with_editor' && 
        m.review_assignments?.every(ra => ra.status === 'completed')
      ).length,
      revisions: manuscripts.filter(m => m.status === 'revisions_requested').length
    }
  }, [manuscripts, currentEditor.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'with_editor':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'revisions_requested':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'published':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }


  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedManuscripts(filteredManuscripts.map(m => m.id))
    } else {
      setSelectedManuscripts([])
    }
  }

  const handleSelectManuscript = (manuscriptId: string, checked: boolean) => {
    if (checked) {
      setSelectedManuscripts([...selectedManuscripts, manuscriptId])
    } else {
      setSelectedManuscripts(selectedManuscripts.filter(id => id !== manuscriptId))
    }
  }

  const handleViewChange = (view: string) => {
    setActiveView(view)
    const url = new URL(window.location.href)
    url.searchParams.set('view', view)
    router.push(url.pathname + url.search)
  }

  const clearFilters = () => {
    setFilters({})
    setShowFilters(false)
  }

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof QueueFilters]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
    return value !== undefined && value !== ''
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Editorial Queue
          </h1>
          <p className="text-gray-600 mt-1">
            Manage submissions and coordinate the peer review process
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={() => setSortBy(sortBy === 'submitted_at' ? 'title' : 'submitted_at')}>
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Sort
          </Button>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-heading font-semibold">Filters</h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <ManuscriptFilters 
            filters={filters}
            onFiltersChange={setFilters}
            manuscripts={manuscripts}
          />
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedManuscripts.length > 0 && (
        <BulkActions
          selectedCount={selectedManuscripts.length}
          selectedManuscripts={selectedManuscripts}
          onClearSelection={() => setSelectedManuscripts([])}
          onRefresh={onRefresh}
        />
      )}

      {/* Queue Views Tabs */}
      <Tabs value={activeView} onValueChange={handleViewChange}>
        <TabsList className="grid w-full grid-cols-6">
          {Object.entries(QUEUE_VIEWS).map(([key, { label, icon: Icon }]) => (
            <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <Badge variant="secondary" className="ml-1">
                {viewCounts[key as keyof typeof viewCounts]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(QUEUE_VIEWS).map(view => (
          <TabsContent key={view} value={view} className="mt-6">
            <Card className="overflow-hidden">
              {filteredManuscripts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <Checkbox
                            checked={selectedManuscripts.length === filteredManuscripts.length && filteredManuscripts.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manuscript
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reviewers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timeline
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredManuscripts.map((manuscript) => {
                        const reviewerCount = manuscript.review_assignments?.length || 0
                        const daysSinceSubmission = Math.floor(
                          (new Date().getTime() - new Date(manuscript.submitted_at || manuscript.created_at).getTime()) / (1000 * 60 * 60 * 24)
                        )
                        
                        return (
                          <tr key={manuscript.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <Checkbox
                                checked={selectedManuscripts.includes(manuscript.id)}
                                onCheckedChange={(checked) => handleSelectManuscript(manuscript.id, checked as boolean)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {manuscript.title}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {manuscript.profiles?.full_name}
                                  {manuscript.profiles?.affiliation && (
                                    <span className="ml-1">• {manuscript.profiles.affiliation}</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {manuscript.field_of_study}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <PriorityIndicator 
                                priority={manuscript.priority || 'normal'} 
                                size="sm"
                                variant="badge"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`${getStatusColor(manuscript.status)} border`}>
                                {formatStatus(manuscript.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                {reviewerCount > 0 ? (
                                  <div>
                                    <span className="text-gray-900 font-medium">
                                      {reviewerCount} assigned
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {manuscript.review_assignments?.map((assignment, idx) => (
                                        <div key={assignment.id}>
                                          {assignment.profiles?.full_name} 
                                          <span className={`ml-1 ${
                                            assignment.status === 'completed' ? 'text-green-600' :
                                            assignment.status === 'accepted' ? 'text-blue-600' :
                                            assignment.status === 'declined' ? 'text-red-600' :
                                            'text-gray-600'
                                          }`}>
                                            ({assignment.status})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No reviewers</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {daysSinceSubmission} days
                              </div>
                              <div className="text-xs text-gray-500">
                                Since {new Date(manuscript.submitted_at || manuscript.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => router.push(`/editor/manuscripts/${manuscript.id}`)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                {!manuscript.editor_id && (
                                  <Button size="sm" variant="outline">
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Assign
                                  </Button>
                                )}
                                {manuscript.editor_id === currentEditor.id && (
                                  <Button size="sm" variant="outline">
                                    <Users className="w-3 h-3 mr-1" />
                                    Reviewers
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No manuscripts found
                  </h3>
                  <p className="text-gray-600">
                    {hasActiveFilters ? 'Try adjusting your filters' : 'No manuscripts match this view'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}