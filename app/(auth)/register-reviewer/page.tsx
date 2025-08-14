'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  Upload, 
  X, 
  Plus, 
  CheckCircle, 
  Loader2,
  UserPlus
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ReviewerApplicationData {
  expertise_areas: string[]
  motivation: string
  cv_file?: File
  references: Array<{
    name: string
    email: string
    affiliation: string
    relationship: 'colleague' | 'supervisor' | 'mentor' | 'collaborator' | 'other'
  }>
  additional_info: string
  preferred_review_frequency: 'light' | 'moderate' | 'heavy'
  areas_of_interest: string[]
  language_preferences: string[]
  guidelines_accepted: boolean
  terms_accepted: boolean
}

const expertiseOptions = [
  'Artificial Intelligence', 'Machine Learning', 'Computer Science', 'Data Science',
  'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Medicine', 'Psychology',
  'Economics', 'Engineering', 'Environmental Science', 'Materials Science',
  'Neuroscience', 'Genetics', 'Pharmacology', 'Public Health', 'Statistics',
  'Social Sciences', 'Education', 'Linguistics', 'Philosophy', 'History'
]


export default function ReviewerRegistrationPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<ReviewerApplicationData>({
    expertise_areas: [],
    motivation: '',
    references: [{ name: '', email: '', affiliation: '', relationship: 'colleague' }],
    additional_info: '',
    preferred_review_frequency: 'moderate',
    areas_of_interest: [],
    language_preferences: ['English'],
    guidelines_accepted: false,
    terms_accepted: false
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      const returnTo = encodeURIComponent('/register-reviewer')
      router.push(`/api/auth/login?returnTo=${returnTo}`)
    }
  }, [user, isLoading, router])

  // Check if user already has reviewer role or pending application
  useEffect(() => {
    if (user && user.role === 'reviewer') {
      router.push('/reviewer') // Already a reviewer
    }
  }, [user, router])

  const updateFormData = (field: keyof ReviewerApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleExpertiseArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.includes(area)
        ? prev.expertise_areas.filter(a => a !== area)
        : [...prev.expertise_areas, area]
    }))
  }

  const addReference = () => {
    if (formData.references.length < 5) {
      setFormData(prev => ({
        ...prev,
        references: [...prev.references, { name: '', email: '', affiliation: '', relationship: 'colleague' }]
      }))
    }
  }

  const removeReference = (index: number) => {
    if (formData.references.length > 1) {
      setFormData(prev => ({
        ...prev,
        references: prev.references.filter((_, i) => i !== index)
      }))
    }
  }

  const updateReference = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
      updateFormData('cv_file', file)
    } else {
      setError('Please upload a PDF file under 10MB')
    }
  }

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.expertise_areas.length >= 3 && formData.motivation.length >= 100
      case 2:
        return formData.references.every(ref => ref.name && ref.email && ref.affiliation)
      case 3:
        return formData.areas_of_interest.length >= 2 && formData.language_preferences.length >= 1
      case 4:
        return formData.guidelines_accepted && formData.terms_accepted
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4) || !user) return

    setIsSubmitting(true)
    setError('')

    try {
      const submitData = new FormData()
      submitData.append('application', JSON.stringify({
        user_id: user.id,
        expertise_areas: formData.expertise_areas,
        motivation: formData.motivation,
        references: formData.references,
        additional_info: formData.additional_info,
        preferred_review_frequency: formData.preferred_review_frequency,
        areas_of_interest: formData.areas_of_interest,
        language_preferences: formData.language_preferences
      }))

      if (formData.cv_file) {
        submitData.append('cv', formData.cv_file)
      }

      const response = await fetch('/api/reviewers/apply', {
        method: 'POST',
        body: submitData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Application submission failed')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/reviewer/application-pending')
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for applying to become a reviewer. We'll review your application and 
            get back to you within 3-5 business days.
          </p>
          <p className="text-sm text-gray-500">Redirecting to status page...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Reviewer Application
          </h1>
          <p className="text-gray-600">
            Join our expert community of peer reviewers
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`h-1 w-16 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {step} of 4: {
              step === 1 ? 'Expertise & Motivation' :
              step === 2 ? 'References' :
              step === 3 ? 'Preferences' :
              'Review & Submit'
            }
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-8">
          {/* Step 1: Expertise & Motivation */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">
                  Areas of Expertise <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Select at least 3 areas where you have deep expertise and can provide quality reviews.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {expertiseOptions.map((area) => (
                    <Badge
                      key={area}
                      variant={formData.expertise_areas.includes(area) ? "default" : "outline"}
                      className="cursor-pointer justify-center p-2 text-center"
                      onClick={() => toggleExpertiseArea(area)}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.expertise_areas.length} / 3+ required
                </p>
              </div>

              <div>
                <Label htmlFor="motivation" className="text-base font-medium">
                  Motivation <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Tell us why you want to become a reviewer and what you hope to contribute (minimum 100 characters).
                </p>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => updateFormData('motivation', e.target.value)}
                  placeholder="I want to become a reviewer because..."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.motivation.length} / 100+ characters required
                </p>
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">
                  CV Upload (Optional)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Upload CV (PDF, max 10MB)
                  </label>
                  {formData.cv_file && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {formData.cv_file.name} uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: References */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Professional References</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Provide at least one professional reference who can vouch for your expertise and character.
                </p>
              </div>

              {formData.references.map((reference, index) => (
                <Card key={index} className="p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Reference {index + 1}</h4>
                    {formData.references.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReference(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`ref-name-${index}`}>Full Name *</Label>
                      <Input
                        id={`ref-name-${index}`}
                        value={reference.name}
                        onChange={(e) => updateReference(index, 'name', e.target.value)}
                        placeholder="Dr. Jane Smith"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ref-email-${index}`}>Email *</Label>
                      <Input
                        id={`ref-email-${index}`}
                        type="email"
                        value={reference.email}
                        onChange={(e) => updateReference(index, 'email', e.target.value)}
                        placeholder="jane.smith@university.edu"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ref-affiliation-${index}`}>Affiliation *</Label>
                      <Input
                        id={`ref-affiliation-${index}`}
                        value={reference.affiliation}
                        onChange={(e) => updateReference(index, 'affiliation', e.target.value)}
                        placeholder="University of Example"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ref-relationship-${index}`}>Relationship *</Label>
                      <select
                        id={`ref-relationship-${index}`}
                        value={reference.relationship}
                        onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="colleague">Colleague</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="mentor">Mentor</option>
                        <option value="collaborator">Collaborator</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </Card>
              ))}

              {formData.references.length < 5 && (
                <Button
                  variant="outline"
                  onClick={addReference}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Reference
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">
                  Review Frequency Preference
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: 'Light', desc: '1-2 reviews per month' },
                    { value: 'moderate', label: 'Moderate', desc: '3-4 reviews per month' },
                    { value: 'heavy', label: 'Heavy', desc: '5+ reviews per month' }
                  ].map((option) => (
                    <Card
                      key={option.value}
                      className={`p-4 cursor-pointer transition-colors ${
                        formData.preferred_review_frequency === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateFormData('preferred_review_frequency', option.value)}
                    >
                      <h4 className="font-medium text-gray-900">{option.label}</h4>
                      <p className="text-sm text-gray-600">{option.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="additional-info" className="text-base font-medium">
                  Additional Information
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Any additional information you'd like us to know about your background or interests.
                </p>
                <Textarea
                  id="additional-info"
                  value={formData.additional_info}
                  onChange={(e) => updateFormData('additional_info', e.target.value)}
                  placeholder="Additional qualifications, special interests, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Application</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Areas of Expertise</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.expertise_areas.map((area) => (
                        <Badge key={area} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Motivation</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.motivation.substring(0, 200)}
                      {formData.motivation.length > 200 ? '...' : ''}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">References</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.references.length} reference{formData.references.length !== 1 ? 's' : ''} provided
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Review Frequency</h4>
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      {formData.preferred_review_frequency} workload
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="guidelines"
                    checked={formData.guidelines_accepted}
                    onCheckedChange={(checked) => updateFormData('guidelines_accepted', checked)}
                  />
                  <Label htmlFor="guidelines" className="text-sm leading-5">
                    I have read and agree to follow the{' '}
                    <a href="/guidelines" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                      Reviewer Guidelines
                    </a>{' '}
                    and ethical standards for peer review.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.terms_accepted}
                    onCheckedChange={(checked) => updateFormData('terms_accepted', checked)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-5">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                      Privacy Policy
                    </a>
                    .
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Previous
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!validateStep(step)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(4) || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}