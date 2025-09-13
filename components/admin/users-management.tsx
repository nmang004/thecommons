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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Users,
  Download,
  Filter,
  Mail,
  Shield,
  ShieldOff,
  Edit,
  Eye,
  UserX,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { OrcidProfileBadge } from '@/components/orcid/orcid-profile-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string
  full_name: string
  email: string
  role: 'author' | 'reviewer' | 'editor' | 'admin'
  affiliation?: string
  orcid?: string
  orcid_verified?: boolean
  orcid_last_sync?: string
  h_index?: number
  total_publications?: number
  created_at: string
  updated_at: string
}

interface UsersManagementProps {
  initialUsers: User[]
}

type SortField = 'full_name' | 'email' | 'role' | 'created_at' | 'h_index' | 'total_publications'
type SortDirection = 'asc' | 'desc'

const roleColors = {
  author: 'bg-blue-100 text-blue-800',
  reviewer: 'bg-green-100 text-green-800', 
  editor: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800'
}

const roleLabels = {
  author: 'Author',
  reviewer: 'Reviewer',
  editor: 'Editor',
  admin: 'Admin'
}

export function UsersManagement({ initialUsers }: UsersManagementProps) {
  // Enhance users with mock ORCID data for demonstration
  const usersWithOrcid = initialUsers.map((user, index) => ({
    ...user,
    orcid: index % 3 === 0 ? `0000-000${index + 1}-1825-009${index}` : undefined,
    orcid_verified: index % 3 === 0,
    orcid_last_sync: index % 3 === 0 ? '2024-09-12' : undefined,
  }))

  const [users] = useState<User[]>(usersWithOrcid)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Mock handlers for ORCID actions
  const handleBulkOrcidVerify = () => {
    console.log('Bulk ORCID verification initiated')
    alert('Bulk ORCID verification started! (Mock)')
  }

  const handleOrcidVerify = (userId: string) => {
    console.log(`ORCID verification for user ${userId}`)
    alert('ORCID verification invitation sent! (Mock)')
  }

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (user.affiliation?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      return matchesSearch && matchesRole
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle null/undefined values
      if (aValue == null) aValue = ''
      if (bValue == null) bValue = ''

      // Convert to string for comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [users, searchQuery, roleFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize)
  const paginatedUsers = filteredAndSortedUsers.slice(
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

  const getActionMenuItems = (user: User): ActionMenuItem[] => [
    {
      label: 'View Profile',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => {
        window.open(`/profile/${user.id}`, '_blank')
      }
    },
    {
      label: 'Edit User',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implement edit user functionality
        console.log('Edit user:', user.id)
      }
    },
    {
      label: 'Send Message',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implement messaging functionality
        window.location.href = `mailto:${user.email}`
      }
    },
    {
      label: user.role === 'admin' ? 'Remove Admin' : 'Make Admin',
      icon: user.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implement role change functionality
        console.log('Toggle admin for user:', user.id)
      }
    },
    {
      label: 'Suspend User',
      icon: <UserX className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: () => {
        // TODO: Implement suspend functionality
        console.log('Suspend user:', user.id)
      }
    }
  ]

  const exportUsers = () => {
    // TODO: Implement export functionality
    console.log('Exporting users...')
  }

  return (
    <Card className="card-academic">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-heading font-semibold">Users</h2>
            <Badge variant="secondary" className="ml-2">
              {filteredAndSortedUsers.length} users
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleBulkOrcidVerify}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Bulk ORCID Verify
            </Button>
            <Button variant="outline" size="sm" onClick={exportUsers}>
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
              placeholder="Search users by name, email, or affiliation..."
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="author">Authors</SelectItem>
                  <SelectItem value="reviewer">Reviewers</SelectItem>
                  <SelectItem value="editor">Editors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'full_name' ? sortDirection : false}
                onSort={() => handleSort('full_name')}
              >
                Name
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'email' ? sortDirection : false}
                onSort={() => handleSort('email')}
              >
                Email
              </TableHead>
              <TableHead
                sortable
                sorted={sortField === 'role' ? sortDirection : false}
                onSort={() => handleSort('role')}
              >
                Role
              </TableHead>
              <TableHead className="text-center">ORCID Verification</TableHead>
              <TableHead>Affiliation</TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'h_index' ? sortDirection : false}
                onSort={() => handleSort('h_index')}
                className="text-center"
              >
                H-Index
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'total_publications' ? sortDirection : false}
                onSort={() => handleSort('total_publications')}
                className="text-center"
              >
                Publications
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortField === 'created_at' ? sortDirection : false}
                onSort={() => handleSort('created_at')}
              >
                Joined
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.full_name}`} />
                    <AvatarFallback>
                      {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{user.full_name}</div>
                  {user.orcid && (
                    <div className="text-sm text-muted-foreground">
                      ORCID: {user.orcid}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{user.email}</TableCell>
                <TableCell>
                  <Badge className={roleColors[user.role]} variant="secondary">
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center space-y-1">
                    {user.orcid_verified ? (
                      <div className="flex items-center space-x-2">
                        <OrcidProfileBadge
                          orcidId={user.orcid!}
                          isVerified={true}
                          variant="compact"
                        />
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ) : user.orcid ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {user.orcid}
                        </Badge>
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOrcidVerify(user.id)}
                        className="text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Invite
                      </Button>
                    )}
                    {user.orcid_last_sync && (
                      <div className="text-xs text-gray-500">
                        Synced: {new Date(user.orcid_last_sync).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-48 truncate">
                    {user.affiliation || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {user.h_index ? user.h_index.toLocaleString() : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {user.total_publications ? user.total_publications.toLocaleString() : '-'}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <ActionMenu items={getActionMenuItems(user)} />
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