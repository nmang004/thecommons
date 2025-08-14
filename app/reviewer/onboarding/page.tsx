'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Loader2, BookOpen, Settings, Award } from 'lucide-react'

export default function ReviewerOnboardingPage() {
  const { user, isLoading, refreshAuth } = useAuth()
  const router = useRouter()
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [isCompleting, setIsCompleting] = useState(false)

  // Redirect if not a reviewer or onboarding already complete
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'reviewer' && user.role !== 'admin') {
        router.push('/become-reviewer')
        return
      }
      
      // Check if onboarding is already complete (this would come from Auth0 metadata)
      // For now, we'll check a simple condition
      if ((user.metadata as any)?.onboarding_complete) {
        router.push('/reviewer')
      }
    }
  }, [user, isLoading, router])

  const completeOnboarding = async () => {
    if (!user) return

    setIsCompleting(true)
    try {
      const response = await fetch('/api/reviewers/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id
        })
      })

      if (response.ok) {
        // Refresh auth to get updated metadata
        await refreshAuth()
        router.push('/reviewer')
      } else {
        console.error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding completion error:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Welcome to The Commons Reviewer Program!
          </h1>
          <p className="text-gray-600">
            Let's get you set up to start reviewing manuscripts
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Review Guidelines
            </h3>
            <p className="text-gray-600 text-sm">
              Understand our quality standards and review process
            </p>
            {onboardingStep > 1 && (
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
            )}
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Set Preferences
            </h3>
            <p className="text-gray-600 text-sm">
              Configure your availability and notification settings
            </p>
            {onboardingStep > 2 && (
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
            )}
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Reviewing
            </h3>
            <p className="text-gray-600 text-sm">
              Access your reviewer dashboard and first assignments
            </p>
            {onboardingStep > 3 && (
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
            )}
          </Card>
        </div>

        {/* Current Step Content */}
        <Card className="p-8">
          {onboardingStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Reviewer Guidelines & Standards
              </h2>
              
              <div className="prose max-w-none mb-8">
                <h3>Quality Standards</h3>
                <ul>
                  <li><strong>Thorough Review:</strong> Provide comprehensive feedback on methodology, results, and presentation</li>
                  <li><strong>Constructive Criticism:</strong> Offer specific, actionable suggestions for improvement</li>
                  <li><strong>Professional Tone:</strong> Maintain respectful and professional communication</li>
                  <li><strong>Confidentiality:</strong> Maintain strict confidentiality of manuscript content</li>
                </ul>

                <h3>Timeline Expectations</h3>
                <ul>
                  <li><strong>Response Time:</strong> Respond to invitations within 3 days</li>
                  <li><strong>Review Deadline:</strong> Complete reviews within 21 days of acceptance</li>
                  <li><strong>Communication:</strong> Notify editors if delays are expected</li>
                </ul>

                <h3>Ethical Guidelines</h3>
                <ul>
                  <li><strong>Conflicts of Interest:</strong> Declare any potential conflicts immediately</li>
                  <li><strong>Bias-Free Review:</strong> Focus on scientific merit, not personal preferences</li>
                  <li><strong>No Plagiarism:</strong> Report suspected plagiarism or misconduct</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <div></div>
                <Button onClick={() => setOnboardingStep(2)}>
                  I Understand - Continue
                </Button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Set Your Preferences
              </h2>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Review Capacity
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Based on your application, you indicated a <strong>moderate</strong> review frequency preference (3-4 reviews per month).
                    You can adjust this anytime in your profile settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Notification Preferences
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We'll notify you of new review invitations and important updates via email.
                    You can customize these settings in your dashboard.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Availability Status
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your status is currently set to <strong>Available</strong>. 
                    You can update this anytime to manage your review invitations.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setOnboardingStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setOnboardingStep(3)}>
                  Continue Setup
                </Button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Ready to Start Reviewing!
              </h2>
              
              <div className="mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    🎉 Congratulations!
                  </h3>
                  <p className="text-green-800">
                    You're now a verified reviewer for The Commons platform. 
                    Your expertise in <strong>{user.metadata.expertise?.join(', ')}</strong> will 
                    help maintain high standards of academic publishing.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What's Next?
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Access your personalized reviewer dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Receive manuscript invitations matching your expertise</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Start building your reviewer reputation and earning recognition</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Connect with the global academic community</span>
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> You can always access the reviewer guidelines and 
                    update your preferences from your dashboard settings.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setOnboardingStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={completeOnboarding}
                  disabled={isCompleting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 mr-2" />
                      Complete Setup & Start Reviewing
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}