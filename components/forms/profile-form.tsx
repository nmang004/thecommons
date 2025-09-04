'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { User, Building, Link as LinkIcon, Globe, Upload, X, Plus } from 'lucide-react'
import type { Profile, UserRole } from '@/types/database'

interface ProfileFormProps {
  profile: Profile | null
  onUpdate?: (profile: Profile) => void
}

export function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    affiliation: '',
    orcid: '',
    bio: '',
    expertise: [] as string[],
    linkedin_url: '',
    website_url: '',
    role: 'author' as UserRole,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newExpertise, setNewExpertise] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        affiliation: profile.affiliation || '',
        orcid: profile.orcid || '',
        bio: profile.bio || '',
        expertise: profile.expertise || [],
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
        role: profile.role,
      })
      setAvatarPreview(profile.avatar_url || null)
    }
  }, [profile])

  const handleInputChange = (field: keyof typeof formData, value: string | string[] | UserRole) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Avatar image must be less than 2MB')
        return
      }
      
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !profile) return null

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`
    const filePath = `profile-avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(filePath, avatarFile)

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleExpertiseAdd = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      handleInputChange('expertise', [...formData.expertise, newExpertise.trim()])
      setNewExpertise('')
    }
  }

  const handleExpertiseRemove = (expertise: string) => {
    handleInputChange('expertise', formData.expertise.filter(e => e !== expertise))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Upload avatar if changed
      let avatarUrl = profile.avatar_url
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }

      // Update profile
      const updateData = {
        ...formData,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setSuccess('Profile updated successfully!')
      onUpdate?.(updatedProfile)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600 mt-1">
          Update your academic profile and personal information
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div>
          <Label>Profile Picture</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Avatar className="w-16 h-16">
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              )}
              {!avatarPreview && <User className="w-8 h-8 text-gray-400" />}
            </Avatar>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </span>
                </Button>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG up to 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter your full name"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="affiliation">Institutional Affiliation</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="affiliation"
                type="text"
                value={formData.affiliation}
                onChange={(e) => handleInputChange('affiliation', e.target.value)}
                placeholder="University, Research Institute, etc."
                className="mt-1 pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="orcid">ORCID ID</Label>
            <Input
              id="orcid"
              type="text"
              value={formData.orcid}
              onChange={(e) => handleInputChange('orcid', e.target.value)}
              placeholder="0000-0000-0000-0000"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your unique researcher identifier
            </p>
          </div>

          <div>
            <Label htmlFor="role">Primary Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="author">Author</option>
              <option value="reviewer">Reviewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio">Academic Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Brief description of your research interests and background"
            rows={4}
            className="mt-1"
          />
        </div>

        {/* Expertise */}
        <div>
          <Label>Areas of Expertise</Label>
          <div className="mt-2">
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.expertise.map((exp, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {exp}
                  <button
                    type="button"
                    onClick={() => handleExpertiseRemove(exp)}
                    className="hover:text-red-600 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                placeholder="Add area of expertise"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleExpertiseAdd()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleExpertiseAdd}
                disabled={!newExpertise.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="mt-1 pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="websiteUrl">Personal Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="websiteUrl"
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="mt-1 pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || !formData.full_name}
            className="px-8"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </form>
    </Card>
  )
}