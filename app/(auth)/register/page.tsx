'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowLeft, ArrowRight, Check, User, Mail, FileText, Users } from 'lucide-react'
import type { UserRole } from '@/types/database'

type RegistrationStep = 'account' | 'personal' | 'academic' | 'role' | 'verification'

interface RegistrationData {
  email: string
  password: string
  fullName: string
  affiliation: string
  orcid: string
  bio: string
  expertise: string[]
  role: UserRole
  linkedinUrl: string
  websiteUrl: string
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('account')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    email: '',
    password: '',
    fullName: '',
    affiliation: '',
    orcid: '',
    bio: '',
    expertise: [],
    role: 'author',
    linkedinUrl: '',
    websiteUrl: '',
  })
  
  const router = useRouter()
  const supabase = createClient()

  const steps = [
    { id: 'account', title: 'Account', icon: Mail },
    { id: 'personal', title: 'Personal', icon: User },
    { id: 'academic', title: 'Academic', icon: FileText },
    { id: 'role', title: 'Role', icon: Users },
  ]

  const handleInputChange = (field: keyof RegistrationData, value: string | string[]) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }))
  }

  const handleExpertiseAdd = (expertise: string) => {
    if (expertise.trim() && !registrationData.expertise.includes(expertise.trim())) {
      handleInputChange('expertise', [...registrationData.expertise, expertise.trim()])
    }
  }

  const handleExpertiseRemove = (expertise: string) => {
    handleInputChange('expertise', registrationData.expertise.filter(e => e !== expertise))
  }

  const validateStep = (step: RegistrationStep): boolean => {
    switch (step) {
      case 'account':
        return !!(registrationData.email && registrationData.password.length >= 6)
      case 'personal':
        return !!(registrationData.fullName)
      case 'academic':
        return true // Optional fields
      case 'role':
        return !!(registrationData.role)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields')
      return
    }
    
    setError('')
    const stepIndex = steps.findIndex(s => s.id === currentStep)
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id as RegistrationStep)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id as RegistrationStep)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: registrationData.email,
            full_name: registrationData.fullName,
            affiliation: registrationData.affiliation || null,
            orcid: registrationData.orcid || null,
            bio: registrationData.bio || null,
            expertise: registrationData.expertise.length > 0 ? registrationData.expertise : null,
            role: registrationData.role,
            linkedin_url: registrationData.linkedinUrl || null,
            website_url: registrationData.websiteUrl || null,
          })

        if (profileError) {
          setError('Failed to create profile: ' + profileError.message)
          return
        }

        setCurrentStep('verification')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'account':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address *</Label>
              <Input
                id="email"
                type="email"
                value={registrationData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your academic email"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={registrationData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Minimum 6 characters required
              </p>
            </div>
          </div>
        )

      case 'personal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name *</Label>
              <Input
                id="fullName"
                type="text"
                value={registrationData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="affiliation">Institutional affiliation</Label>
              <Input
                id="affiliation"
                type="text"
                value={registrationData.affiliation}
                onChange={(e) => handleInputChange('affiliation', e.target.value)}
                placeholder="University, Research Institute, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="orcid">ORCID ID</Label>
              <Input
                id="orcid"
                type="text"
                value={registrationData.orcid}
                onChange={(e) => handleInputChange('orcid', e.target.value)}
                placeholder="0000-0000-0000-0000"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your unique researcher identifier
              </p>
            </div>
          </div>
        )

      case 'academic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Academic bio</Label>
              <Textarea
                id="bio"
                value={registrationData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Brief description of your research interests and background"
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Areas of expertise</Label>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {registrationData.expertise.map((exp, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {exp}
                      <button
                        type="button"
                        onClick={() => handleExpertiseRemove(exp)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="Add expertise and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleExpertiseAdd(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn profile</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={registrationData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="websiteUrl">Personal website</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={registrationData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="mt-1"
              />
            </div>
          </div>
        )

      case 'role':
        return (
          <div className="space-y-4">
            <div>
              <Label>Primary role</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {[
                  { value: 'author', label: 'Author', description: 'Submit and publish research' },
                  { value: 'reviewer', label: 'Reviewer', description: 'Review submitted manuscripts' },
                  { value: 'editor', label: 'Editor', description: 'Manage editorial process' },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleInputChange('role', role.value as UserRole)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      registrationData.role === role.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{role.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{role.description}</div>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                You can change this later in your profile settings
              </p>
            </div>
          </div>
        )

      case 'verification':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Check your email
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong>{registrationData.email}</strong>. 
              Click the link in your email to activate your account.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Continue to login
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  if (currentStep === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="w-full max-w-md p-8">
          {renderStepContent()}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Join The Commons
          </h1>
          <p className="text-gray-600">
            Create your academic publishing account
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-100 text-green-600'
                      : isActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-px bg-gray-300 mx-4" />
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {renderStepContent()}

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'account'}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading || !validateStep(currentStep)}
            className="flex items-center"
          >
            {isLoading ? 'Creating account...' : 
             currentStep === 'role' ? 'Create account' : 'Next'
            }
            {currentStep !== 'role' && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}