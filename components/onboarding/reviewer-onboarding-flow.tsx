'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  CheckCircle,
  Star,
  Clock,
  Users,
  FileText,
  ArrowRight,
  ArrowLeft,
  User,
  Award,
  MessageSquare,
  Target,
  Loader2
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<any>
  completed: boolean
  required: boolean
}

interface ReviewerProfile {
  expertise: string[]
  orcid?: string
  h_index?: number
  total_publications?: number
  preferred_fields?: string[]
  bio?: string
  availability_status?: string
  max_concurrent_reviews?: number
  review_preferences?: {
    notification_frequency: string
    review_types: string[]
    time_commitment_hours: number
  }
}

interface OnboardingFlowProps {
  userId: string
  initialProfile?: Partial<ReviewerProfile>
  onComplete?: () => void
}

// Step 1: Welcome and Introduction
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-8 h-8 text-white" />
      </div>
      
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
          Welcome to The Commons Reviewer Program
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
          Thank you for joining our academic publishing platform as a peer reviewer. 
          Your expertise will help maintain the highest standards of scholarly research.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <Card className="p-4 text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Expert Community</h3>
          <p className="text-sm text-gray-600">Join a network of distinguished scholars and researchers</p>
        </Card>
        
        <Card className="p-4 text-center">
          <Star className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Quality Reviews</h3>
          <p className="text-sm text-gray-600">Contribute to maintaining high academic standards</p>
        </Card>
        
        <Card className="p-4 text-center">
          <Clock className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Flexible Schedule</h3>
          <p className="text-sm text-gray-600">Review on your own timeline with reasonable deadlines</p>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">What to Expect</h4>
        <div className="text-left space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Complete your reviewer profile and preferences</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Learn about our review process and quality standards</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Review a sample manuscript and scoring criteria</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Set up your reviewer dashboard and notifications</span>
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="mt-6">
        Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}

// Step 2: Profile Setup
function ProfileStep({ 
  profile, 
  onUpdate, 
  onNext, 
  onPrev 
}: { 
  profile: ReviewerProfile
  onUpdate: (updates: Partial<ReviewerProfile>) => void
  onNext: () => void
  onPrev: () => void
}) {
  const [expertiseInput, setExpertiseInput] = useState('')
  
  const fieldOptions = [
    'Computer Science', 'Biology', 'Chemistry', 'Physics', 'Mathematics',
    'Psychology', 'Economics', 'Political Science', 'Sociology', 'History',
    'Literature', 'Philosophy', 'Engineering', 'Medicine', 'Environmental Science'
  ]

  const addExpertise = () => {
    if (expertiseInput.trim() && !profile.expertise.includes(expertiseInput.trim())) {
      onUpdate({
        expertise: [...profile.expertise, expertiseInput.trim()]
      })
      setExpertiseInput('')
    }
  }

  const removeExpertise = (item: string) => {
    onUpdate({
      expertise: profile.expertise.filter(e => e !== item)
    })
  }

  const canProceed = profile.expertise.length >= 2 && profile.bio && profile.bio.length >= 100

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-gray-900">
          Complete Your Reviewer Profile
        </h2>
        <p className="text-gray-600">
          Help us match you with manuscripts that align with your expertise
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Expertise Areas */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">
            Areas of Expertise (minimum 2 required)
          </Label>
          <div className="flex space-x-2 mb-3">
            <Input
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              placeholder="e.g., Machine Learning, Computational Biology"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addExpertise()
                }
              }}
            />
            <Button onClick={addExpertise} variant="outline">
              Add
            </Button>
          </div>
          
          {profile.expertise.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.expertise.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{item}</span>
                  <button
                    onClick={() => removeExpertise(item)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Common fields:</Label>
            <div className="flex flex-wrap gap-2">
              {fieldOptions.map((field) => (
                <Button
                  key={field}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!profile.expertise.includes(field)) {
                      onUpdate({ expertise: [...profile.expertise, field] })
                    }
                  }}
                  disabled={profile.expertise.includes(field)}
                >
                  {field}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Academic Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1 block">
              ORCID (optional)
            </Label>
            <Input
              value={profile.orcid || ''}
              onChange={(e) => onUpdate({ orcid: e.target.value })}
              placeholder="0000-0000-0000-0000"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1 block">
              H-Index (optional)
            </Label>
            <Input
              type="number"
              value={profile.h_index || ''}
              onChange={(e) => onUpdate({ h_index: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 25"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1 block">
              Total Publications (optional)
            </Label>
            <Input
              type="number"
              value={profile.total_publications || ''}
              onChange={(e) => onUpdate({ total_publications: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 50"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">
            Professional Bio (minimum 100 characters)
          </Label>
          <Textarea
            value={profile.bio || ''}
            onChange={(e) => onUpdate({ bio: e.target.value })}
            rows={4}
            placeholder="Describe your research background, current position, and areas of expertise. This will help editors understand your qualifications when considering you for reviews."
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {(profile.bio || '').length}/100 characters minimum
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onPrev} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step 3: Review Guidelines
function GuidelinesStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false)

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-gray-900">
          Review Guidelines & Standards
        </h2>
        <p className="text-gray-600">
          Understanding our peer review process and quality expectations
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Review Principles</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Constructive Feedback</h4>
                  <p className="text-sm text-gray-600">Provide specific, actionable suggestions for improvement</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Objective Assessment</h4>
                  <p className="text-sm text-gray-600">Evaluate based on scientific merit, not personal preferences</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Timely Completion</h4>
                  <p className="text-sm text-gray-600">Submit reviews within the agreed timeframe</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Confidentiality</h4>
                  <p className="text-sm text-gray-600">Maintain strict confidentiality of manuscript content</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Review Evaluation Criteria</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-amber-800 mb-1">Technical Quality</h5>
                <ul className="text-amber-700 space-y-1">
                  <li>• Methodology soundness</li>
                  <li>• Data analysis accuracy</li>
                  <li>• Statistical rigor</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-amber-800 mb-1">Contribution</h5>
                <ul className="text-amber-700 space-y-1">
                  <li>• Novelty and originality</li>
                  <li>• Significance to field</li>
                  <li>• Impact potential</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-amber-800 mb-1">Presentation</h5>
                <ul className="text-amber-700 space-y-1">
                  <li>• Clarity of writing</li>
                  <li>• Organization structure</li>
                  <li>• Figure quality</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-amber-800 mb-1">Completeness</h5>
                <ul className="text-amber-700 space-y-1">
                  <li>• Literature coverage</li>
                  <li>• Missing experiments</li>
                  <li>• Discussion depth</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Review Timeline Expectations</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">21</div>
                  <div className="text-sm text-gray-600">Days average deadline</div>
                </div>
                <div>
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">3-5</div>
                  <div className="text-sm text-gray-600">Hours time commitment</div>
                </div>
                <div>
                  <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">2-3</div>
                  <div className="text-sm text-gray-600">Reviews per month max</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-blue-200 bg-blue-50">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="guidelines-agreement"
            checked={agreedToGuidelines}
            onCheckedChange={(checked) => setAgreedToGuidelines(checked as boolean)}
          />
          <div>
            <Label htmlFor="guidelines-agreement" className="text-sm font-medium text-blue-900 cursor-pointer">
              I have read and agree to follow the review guidelines and maintain the highest standards of peer review
            </Label>
            <p className="text-xs text-blue-800 mt-1">
              This includes maintaining confidentiality, providing constructive feedback, and completing reviews in a timely manner.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onPrev} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={!agreedToGuidelines}>
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step 4: Preferences Setup
function PreferencesStep({
  profile,
  onUpdate,
  onNext,
  onPrev
}: {
  profile: ReviewerProfile
  onUpdate: (updates: Partial<ReviewerProfile>) => void
  onNext: () => void
  onPrev: () => void
}) {
  const updatePreferences = (key: string, value: any) => {
    onUpdate({
      review_preferences: {
        notification_frequency: 'immediate',
        review_types: ['original_research'],
        time_commitment_hours: 4,
        ...profile.review_preferences,
        [key]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-gray-900">
          Review Preferences
        </h2>
        <p className="text-gray-600">
          Configure your availability and notification preferences
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Workload Preferences */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Maximum Concurrent Reviews
          </Label>
          <Select
            value={profile.max_concurrent_reviews?.toString() || '2'}
            onValueChange={(value) => onUpdate({ max_concurrent_reviews: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 review at a time</SelectItem>
              <SelectItem value="2">2 reviews at a time (recommended)</SelectItem>
              <SelectItem value="3">3 reviews at a time</SelectItem>
              <SelectItem value="4">4 reviews at a time</SelectItem>
              <SelectItem value="5">5+ reviews at a time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Commitment */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Preferred Time Commitment per Review
          </Label>
          <Select
            value={profile.review_preferences?.time_commitment_hours?.toString() || '4'}
            onValueChange={(value) => updatePreferences('time_commitment_hours', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 hours (brief reviews)</SelectItem>
              <SelectItem value="4">3-4 hours (standard)</SelectItem>
              <SelectItem value="6">5-6 hours (detailed)</SelectItem>
              <SelectItem value="8">7-8 hours (comprehensive)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification Preferences */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Notification Frequency
          </Label>
          <Select
            value={profile.review_preferences?.notification_frequency || 'immediate'}
            onValueChange={(value) => updatePreferences('notification_frequency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate notifications</SelectItem>
              <SelectItem value="daily">Daily digest</SelectItem>
              <SelectItem value="weekly">Weekly summary</SelectItem>
              <SelectItem value="minimal">Minimal (urgent only)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Availability Status */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Current Availability Status
          </Label>
          <Select
            value={profile.availability_status || 'available'}
            onValueChange={(value) => onUpdate({ availability_status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available for new reviews</SelectItem>
              <SelectItem value="busy">Busy (limited availability)</SelectItem>
              <SelectItem value="unavailable">Temporarily unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onPrev} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Complete Setup
          <CheckCircle className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Main Onboarding Flow Component
export function ReviewerOnboardingFlow({ 
  userId, 
  initialProfile, 
  onComplete 
}: OnboardingFlowProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<ReviewerProfile>({
    expertise: [],
    preferred_fields: [],
    review_preferences: {
      notification_frequency: 'immediate',
      review_types: ['original_research'],
      time_commitment_hours: 4
    },
    availability_status: 'available',
    max_concurrent_reviews: 2,
    ...initialProfile
  })

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Introduction to The Commons',
      component: WelcomeStep,
      completed: currentStep > 0,
      required: true
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Complete your reviewer profile',
      component: ProfileStep,
      completed: currentStep > 1,
      required: true
    },
    {
      id: 'guidelines',
      title: 'Guidelines',
      description: 'Review guidelines and standards',
      component: GuidelinesStep,
      completed: currentStep > 2,
      required: true
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Set your review preferences',
      component: PreferencesStep,
      completed: currentStep > 3,
      required: true
    }
  ]

  const updateProfile = (updates: Partial<ReviewerProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/reviewers/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          profile,
          onboardingCompleted: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      if (onComplete) {
        onComplete()
      } else {
        router.push('/reviewer/dashboard?onboarding=complete')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100
  const CurrentStepComponent = steps[currentStep].component

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Setup...
          </h2>
          <p className="text-gray-600">
            We're finalizing your reviewer profile and preferences.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              Reviewer Onboarding
            </h1>
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          <Progress value={progress} className="h-2 mb-4" />
          
          <div className="flex justify-between text-xs">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index < currentStep
                      ? 'bg-blue-600 text-white'
                      : index === currentStep
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div>
          <CurrentStepComponent
            profile={profile}
            onUpdate={updateProfile}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </div>
      </div>
    </div>
  )
}