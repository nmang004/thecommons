"use client"

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SearchBar } from '@/components/ui/search-bar'
import { ActionMenu, ActionMenuItem } from '@/components/ui/action-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TablePagination,
} from '@/components/ui/table'
import { 
  FileText, 
  Download, 
  Filter, 
  Eye,
  Edit,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Send
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ManuscriptStatus = 'draft' | 'submitted' | 'with_editor' | 'under_review' | 'revisions_requested' | 'accepted' | 'rejected' | 'published'

interface Author {
  full_name: string
  email: string
  affiliation?: string
}

interface Editor {
  full_name: string
  email: string
  affiliation?: string
}

interface Manuscript {
  id: string
  title: string
  abstract: string
  keywords?: string[]
  field_of_study: string
  subfield?: string
  author_id: string
  corresponding_author_id?: string
  editor_id?: string
  status: ManuscriptStatus
  submission_number?: string
  submitted_at?: string
  accepted_at?: string
  published_at?: string
  doi?: string
  view_count: number
  download_count: number
  citation_count: number
  created_at: string
  updated_at: string
  author: Author
  editor?: Editor
  corresponding_author?: Author
}

interface ContentManagementProps {
  initialManuscripts: Manuscript[]
}

type SortField = 'title' | 'status' | 'submitted_at' | 'field_of_study' | 'view_count' | 'download_count' | 'citation_count'
type SortDirection = 'asc' | 'desc'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  with_editor: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-purple-100 text-purple-800',
  revisions_requested: 'bg-orange-100 text-orange-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-emerald-100 text-emerald-800'
}

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  with_editor: 'With Editor',
  under_review: 'Under Review',
  revisions_requested: 'Revisions Requested',
  accepted: 'Accepted',
  rejected: 'Rejected',
  published: 'Published'
}

export function ContentManagement({ initialManuscripts }: ContentManagementProps) {
  const [manuscripts] = useState<Manuscript[]>(initialManuscripts)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fieldFilter, setFieldFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('submitted_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Get unique fields for filtering
  const uniqueFields = useMemo(() => {
    const fields = manuscripts.map(m => m.field_of_study).filter(Boolean)
    return Array.from(new Set(fields)).sort()
  }, [manuscripts])

  // Filter and sort manuscripts
  const filteredAndSortedManuscripts = useMemo(() => {
    let filtered = manuscripts.filter((manuscript) => {
      const matchesSearch = manuscript.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           manuscript.author.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           manuscript.field_of_study.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (manuscript.submission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      const matchesStatus = statusFilter === 'all' || manuscript.status === statusFilter
      const matchesField = fieldFilter === 'all' || manuscript.field_of_study === fieldFilter
      
      return matchesSearch && matchesStatus && matchesField
    })

    // Sort manuscripts
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle null/undefined values
      if (aValue == null) aValue = ''
      if (bValue == null) bValue = ''

      // Handle date sorting
      if (sortField === 'submitted_at') {
        aValue = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        bValue = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
      }

      // Convert to string for comparison if needed
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [manuscripts, searchQuery, statusFilter, fieldFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedManuscripts.length / pageSize)
  const paginatedManuscripts = filteredAndSortedManuscripts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getActionMenuItems = (manuscript: Manuscript): ActionMenuItem[] => [
    {
      label: 'View Manuscript',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => {
        window.open(`/manuscript/${manuscript.id}`, '_blank')
      }
    },
    {
      label: 'Edit Details',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implement edit manuscript functionality
        console.log('Edit manuscript:', manuscript.id)
      }
    },
    {
      label: 'Assign Editor',
      icon: <Users className="h-4 w-4" />,
      disabled: manuscript.status === 'draft' || manuscript.editor_id !== null,
      onClick: () => {
        // TODO: Implement assign editor functionality
        console.log('Assign editor to manuscript:', manuscript.id)
      }
    },
    {
      label: 'Assign Reviewers',
      icon: <Users className="h-4 w-4" />,
      disabled: manuscript.status !== 'with_editor',
      onClick: () => {
        // TODO: Implement assign reviewers functionality
        console.log('Assign reviewers to manuscript:', manuscript.id)
      }
    },
    {
      label: 'Send Notification',
      icon: <Send className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implement notification functionality
        console.log('Send notification for manuscript:', manuscript.id)
      }
    },
    {
      label: manuscript.status === 'published' ? 'Unpublish' : 'Accept & Publish',
      icon: manuscript.status === 'published' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      disabled: manuscript.status !== 'accepted' && manuscript.status !== 'published',
      variant: manuscript.status === 'published' ? 'destructive' as const : undefined,
      onClick: () => {
        // TODO: Implement publish/unpublish functionality
        console.log('Toggle publish status for manuscript:', manuscript.id)
      }
    }
  ]

  const exportContent = () => {
    // TODO: Implement export functionality
    console.log('Exporting content...')
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <Card className="card-academic">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-heading font-semibold">Manuscripts</h2>
            <Badge variant="secondary" className="ml-2">
              {filteredAndSortedManuscripts.length} items
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportContent}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search manuscripts by title, author, field, or submission number..."
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="with_editor">With Editor</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="revisions_requested">Revisions Requested</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fieldFilter} onValueChange={setFieldFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  {uniqueFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Manuscripts Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                sortable 
                sorted={sortField === 'title' ? sortDirection : false}
                onSort={() => handleSort('title')}
              >
                Manuscript
              </TableHead>
              <TableHead>Author</TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'field_of_study' ? sortDirection : false}
                onSort={() => handleSort('field_of_study')}
              >
                Field
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'status' ? sortDirection : false}
                onSort={() => handleSort('status')}
              >
                Status
              </TableHead>
              <TableHead>Editor</TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'submitted_at' ? sortDirection : false}
                onSort={() => handleSort('submitted_at')}
              >
                Submitted
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'view_count' ? sortDirection : false}
                onSort={() => handleSort('view_count')}
                className="text-center"
              >
                Views
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'citation_count' ? sortDirection : false}
                onSort={() => handleSort('citation_count')}
                className="text-center"
              >
                Citations
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedManuscripts.map((manuscript) => (
              <TableRow key={manuscript.id}>
                <TableCell className="max-w-xs">
                  <div className="font-medium">
                    {truncateText(manuscript.title, 60)}
                  </div>
                  {manuscript.submission_number && (
                    <div className="text-sm text-muted-foreground font-mono">
                      #{manuscript.submission_number}
                    </div>
                  )}
                  {manuscript.doi && (
                    <div className="text-sm text-muted-foreground">
                      DOI: {manuscript.doi}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{manuscript.author.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {manuscript.author.affiliation || manuscript.author.email}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{manuscript.field_of_study}</div>
                  {manuscript.subfield && (
                    <div className="text-sm text-muted-foreground">{manuscript.subfield}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[manuscript.status]} variant="secondary">
                    {statusLabels[manuscript.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {manuscript.editor ? (
                    <div>
                      <div className="font-medium">{manuscript.editor.full_name}</div>
                      <div className="text-sm text-muted-foreground">{manuscript.editor.email}</div>
                    </div>
                  ) : (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Unassigned</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {formatDate(manuscript.submitted_at)}
                </TableCell>
                <TableCell className="text-center">
                  {manuscript.view_count.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {manuscript.citation_count.toLocaleString()}
                </TableCell>
                <TableCell>
                  <ActionMenu items={getActionMenuItems(manuscript)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </Card>
  )
}