'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileForm } from '@/components/forms/profile-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Edit3, 
  ArrowLeft,
  Mail,
  Building,
  Link as LinkIcon,
  Globe,
  Star,
  BookOpen,
  Settings,
  Shield,
  Key,
  Bell,
  Trash2,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Hash
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'

export default function ProfilePage() {
  const { user, isLoading: authLoading, login } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Statistics based on role
  const [stats, setStats] = useState({
    manuscripts: 0,
    reviews: 0,
    citations: 0,
    hIndex: 0,
    editorialWork: 0
  })

  useEffect(() => {
    if (!authLoading && !user) {
      login('/profile')
      return
    }

    if (user) {
      fetchProfile()
      fetchStatistics()
    }
  }, [user, authLoading])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStatistics = async () => {
    // Mock statistics - replace with actual API calls
    setStats({
      manuscripts: user?.role === 'author' ? 12 : 0,
      reviews: user?.role === 'reviewer' ? 45 : 0,
      citations: 234,
      hIndex: profile?.h_index || 8,
      editorialWork: user?.role === 'editor' ? 28 : 0
    })
  }

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile)
    setIsEditMode(false)
  }

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'author':
        return '/author'
      case 'editor':
        return '/editor'
      case 'reviewer':
        return '/reviewer'
      case 'admin':
        return '/admin'
      default:
        return '/'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      author: 'bg-blue-100 text-blue-800',
      editor: 'bg-purple-100 text-purple-800',
      reviewer: 'bg-green-100 text-green-800',
      admin: 'bg-red-100 text-red-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load your profile information.</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Return to Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link 
                href={getDashboardLink()}
                className="text-gray-500 hover:text-gray-700 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">Profile</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Avatar className="w-20 h-20">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.full_name || user.name}
                  </h1>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {profile.email}
                  </p>
                  {profile.affiliation && (
                    <p className="text-gray-600 flex items-center mt-1">
                      <Building className="w-4 h-4 mr-2" />
                      {profile.affiliation}
                    </p>
                  )}
                  <div className="mt-3 flex items-center space-x-2">
                    <Badge className={getRoleBadgeColor(profile.role)}>
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </Badge>
                    {profile.orcid && (
                      <Badge variant="outline" className="flex items-center">
                        <Hash className="w-3 h-3 mr-1" />
                        ORCID: {profile.orcid}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {!isEditMode && (
                <Button
                  onClick={() => setIsEditMode(true)}
                  variant="outline"
                  className="flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
              {user.role === 'author' && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.manuscripts}</div>
                    <div className="text-sm text-gray-600">Manuscripts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.citations}</div>
                    <div className="text-sm text-gray-600">Citations</div>
                  </div>
                </>
              )}
              {user.role === 'reviewer' && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.reviews}</div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {profile.avg_review_quality_score?.toFixed(1) || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Quality Score</div>
                  </div>
                </>
              )}
              {user.role === 'editor' && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.editorialWork}</div>
                    <div className="text-sm text-gray-600">Manuscripts Handled</div>
                  </div>
                </>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{profile.h_index || 0}</div>
                <div className="text-sm text-gray-600">h-index</div>
              </div>
              {profile.total_publications > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.total_publications}</div>
                  <div className="text-sm text-gray-600">Publications</div>
                </div>
              )}
              {profile.response_rate && user.role === 'reviewer' && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {(profile.response_rate * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Response Rate</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {isEditMode ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <Button
                variant="outline"
                onClick={() => setIsEditMode(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
            <ProfileForm profile={profile} onUpdate={handleProfileUpdate} />
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academic">Academic Info</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">About</h3>
                {profile.bio ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-gray-500 italic">No bio provided yet.</p>
                )}
              </Card>

              {profile.expertise && profile.expertise.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Areas of Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map((area, index) => (
                      <Badge key={index} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {(profile.linkedin_url || profile.twitter_handle || profile.website_url) && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Professional Links</h3>
                  <div className="space-y-3">
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        LinkedIn Profile
                      </a>
                    )}
                    {profile.twitter_handle && (
                      <a
                        href={`https://twitter.com/${profile.twitter_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        @{profile.twitter_handle}
                      </a>
                    )}
                    {profile.website_url && (
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Personal Website
                      </a>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="academic" className="space-y-6">
              {/* Role-specific academic information */}
              {user.role === 'author' && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Author Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Total Manuscripts</span>
                      <span className="font-semibold">{stats.manuscripts}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Total Citations</span>
                      <span className="font-semibold">{stats.citations}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">h-index</span>
                      <span className="font-semibold">{profile.h_index || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Publications</span>
                      <span className="font-semibold">{profile.total_publications}</span>
                    </div>
                  </div>
                </Card>
              )}

              {user.role === 'reviewer' && (
                <>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Reviewer Performance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Total Reviews</span>
                        <span className="font-semibold">{stats.reviews}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Quality Score</span>
                        <span className="font-semibold">
                          {profile.avg_review_quality_score?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Response Rate</span>
                        <span className="font-semibold">
                          {profile.response_rate ? `${(profile.response_rate * 100).toFixed(0)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Current Load</span>
                        <span className="font-semibold">
                          {profile.current_review_load || 0} / {profile.max_concurrent_reviews || 3}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {profile.preferred_fields && profile.preferred_fields.length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Preferred Review Fields</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferred_fields.map((field, index) => (
                          <Badge key={index} variant="outline">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              )}

              {user.role === 'editor' && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Editorial Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Manuscripts Handled</span>
                      <span className="font-semibold">{stats.editorialWork}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Active Reviews</span>
                      <span className="font-semibold">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Average Decision Time</span>
                      <span className="font-semibold">14 days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Accept Rate</span>
                      <span className="font-semibold">32%</span>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Account Settings
                </h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-3 text-gray-500" />
                      <div className="text-left">
                        <div className="font-medium">Email Preferences</div>
                        <div className="text-sm text-gray-600">Manage notification settings</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="flex items-center">
                      <Key className="w-5 h-5 mr-3 text-gray-500" />
                      <div className="text-left">
                        <div className="font-medium">Change Password</div>
                        <div className="text-sm text-gray-600">Update your account password</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 mr-3 text-gray-500" />
                      <div className="text-left">
                        <div className="font-medium">Two-Factor Authentication</div>
                        <div className="text-sm text-gray-600">
                          {user.emailVerified ? 'Enabled' : 'Not configured'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 mr-3 text-gray-500" />
                      <div className="text-left">
                        <div className="font-medium">Notification Settings</div>
                        <div className="text-sm text-gray-600">Configure alerts and reminders</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <Separator className="my-4" />

                  <button className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition group">
                    <div className="flex items-center">
                      <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                      <div className="text-left">
                        <div className="font-medium text-red-600">Delete Account</div>
                        <div className="text-sm text-gray-600">Permanently delete your account and data</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}