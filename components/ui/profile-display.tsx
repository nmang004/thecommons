'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Building, 
  Globe, 
  ExternalLink, 
  Mail, 
  Calendar,
  Users,
  FileText
} from 'lucide-react'
import type { Profile } from '@/types/database'

interface ProfileDisplayProps {
  profile: Profile
  isOwnProfile?: boolean
  onEdit?: () => void
}

export function ProfileDisplay({ profile, isOwnProfile = false, onEdit }: ProfileDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'author':
        return 'bg-blue-100 text-blue-800'
      case 'reviewer':
        return 'bg-green-100 text-green-800'
      case 'editor':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex-shrink-0">
            <Avatar className="w-24 h-24">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </Avatar>
          </div>

          {/* Profile Details */}
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">
                  {profile.full_name}
                </h1>
                {profile.affiliation && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{profile.affiliation}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600 mt-1">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 sm:mt-0">
                <Badge className={getRoleColor(profile.role)}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
                {isOwnProfile && (
                  <Button onClick={onEdit} variant="outline" size="sm">
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Member Since */}
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Member since {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
            Academic Information
          </h2>
          
          <div className="space-y-3">
            {profile.orcid && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">ORCID ID:</span>
                <Link
                  href={`https://orcid.org/${profile.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary/80 flex items-center"
                >
                  {profile.orcid}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
            )}

            {profile.h_index !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">H-Index:</span>
                <span className="text-sm text-gray-900">{profile.h_index}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Publications:</span>
              <span className="text-sm text-gray-900">{profile.total_publications}</span>
            </div>
          </div>

          {/* Expertise */}
          {profile.expertise && profile.expertise.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profile.expertise.map((exp, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {exp}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Links and Contact */}
        <Card className="p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
            Links & Contact
          </h2>
          
          <div className="space-y-3">
            {profile.website_url && (
              <Link
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-primary hover:text-primary/80"
              >
                <Globe className="w-4 h-4 mr-2" />
                Personal Website
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            )}

            {profile.linkedin_url && (
              <Link
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-primary hover:text-primary/80"
              >
                <Users className="w-4 h-4 mr-2" />
                LinkedIn Profile
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            )}

            {!profile.website_url && !profile.linkedin_url && (
              <p className="text-sm text-gray-500">No external links provided</p>
            )}
          </div>

          {/* Role-specific Statistics */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              {profile.role === 'author' && (
                <>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {profile.total_publications}
                    </div>
                    <div className="text-xs text-gray-500">Publications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Submissions</div>
                  </div>
                </>
              )}
              
              {profile.role === 'reviewer' && (
                <>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                </>
              )}
              
              {profile.role === 'editor' && (
                <>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Handled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity - Placeholder for future implementation */}
      <Card className="p-6">
        <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No recent activity to display</p>
        </div>
      </Card>
    </div>
  )
}