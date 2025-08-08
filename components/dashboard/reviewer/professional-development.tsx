'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  Award,
  Users,
  Star,
  Clock,
  CheckCircle,
  Play,
  Eye,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Plus
} from 'lucide-react'
import { Course, Certificate, MentorshipStatus, Feedback } from '@/types/database'

interface ProfessionalDevelopmentProps {
  development: {
    reviewTraining: Course[]
    certifications: Certificate[]
    mentorshipProgram: MentorshipStatus
    reviewFeedback: Feedback[]
  }
}

export function ProfessionalDevelopment({ development }: ProfessionalDevelopmentProps) {
  const { reviewTraining, certifications, mentorshipProgram, reviewFeedback } = development

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'not_started':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in_progress':
        return Play
      case 'not_started':
      default:
        return Clock
    }
  }

  const averageFeedbackRating = reviewFeedback.length > 0 
    ? reviewFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / reviewFeedback.length
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900">
          Professional Development
        </h2>
        <p className="text-gray-600">
          Track your learning progress, certifications, and reviewer feedback
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Courses Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {reviewTraining.filter(course => course.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Certifications</p>
              <p className="text-3xl font-bold text-gray-900">{certifications.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mentorships</p>
              <p className="text-3xl font-bold text-gray-900">
                {mentorshipProgram.activeMentorships}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {averageFeedbackRating.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Training Courses */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Review Training</h3>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
          </div>

          <div className="space-y-4">
            {reviewTraining.length > 0 ? (
              reviewTraining.map((course) => {
                const StatusIcon = getStatusIcon(course.status)
                
                return (
                  <div
                    key={course.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                      </div>
                      <Badge className={getStatusColor(course.status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {course.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {course.duration}
                      </div>
                      {course.completedAt && (
                        <span>Completed {new Date(course.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    {course.status === 'in_progress' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      {course.status === 'not_started' && (
                        <Button size="sm" variant="outline">
                          <Play className="w-3 h-3 mr-1" />
                          Start Course
                        </Button>
                      )}
                      {course.status === 'in_progress' && (
                        <Button size="sm">
                          <Play className="w-3 h-3 mr-1" />
                          Continue
                        </Button>
                      )}
                      {course.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No training courses available</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Explore Training
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Certifications */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
            <Button variant="outline" size="sm">
              <Award className="w-4 h-4 mr-2" />
              Earn More
            </Button>
          </div>

          <div className="space-y-4">
            {certifications.length > 0 ? (
              certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Award className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{cert.name}</h4>
                        <p className="text-sm text-gray-600">Issued by {cert.issuedBy}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Issued {new Date(cert.issuedAt).toLocaleDateString()}
                          {cert.expiresAt && (
                            <span> • Expires {new Date(cert.expiresAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {cert.credentialUrl && (
                    <div className="mt-3">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Credential
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No certifications yet</p>
                <p className="text-sm text-gray-500">
                  Complete training courses to earn certifications
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mentorship Program */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Mentorship Program</h3>
            <Badge variant="secondary">
              {mentorshipProgram.role || 'Not Enrolled'}
            </Badge>
          </div>

          {mentorshipProgram.role ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {mentorshipProgram.activeMentorships}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {mentorshipProgram.completedMentorships}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>

              {mentorshipProgram.averageRating && (
                <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-medium">
                    {mentorshipProgram.averageRating.toFixed(1)} average rating
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  View Mentorships
                </Button>
                {mentorshipProgram.role === 'mentor' && (
                  <Button size="sm" variant="outline">
                    <Plus className="w-3 h-3 mr-1" />
                    Take Mentee
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Join Mentorship Program</h4>
              <p className="text-gray-600 text-sm mb-4">
                Share knowledge or learn from experienced reviewers
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline">
                  Become Mentor
                </Button>
                <Button size="sm" variant="outline">
                  Find Mentor
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Review Feedback */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Review Feedback</h3>
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              {reviewFeedback.length} feedback received
            </div>
          </div>

          {reviewFeedback.length > 0 ? (
            <div className="space-y-4">
              {/* Average Rating Display */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {averageFeedbackRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= averageFeedbackRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">Average rating from editors and authors</p>
              </div>

              {/* Recent Feedback */}
              <div className="space-y-3">
                {reviewFeedback.slice(0, 3).map((feedback) => (
                  <div key={feedback.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary"
                          className={feedback.type === 'editor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                        >
                          {feedback.type}
                        </Badge>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= feedback.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{feedback.comments}</p>
                    
                    <div className="text-xs text-gray-500">
                      For: {feedback.manuscriptTitle}
                    </div>
                  </div>
                ))}
              </div>

              {reviewFeedback.length > 3 && (
                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  View All Feedback
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No feedback received yet</p>
              <p className="text-sm text-gray-500">
                Complete reviews to receive feedback from editors and authors
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Learning Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Learning Resources</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Review Guidelines</h4>
            <p className="text-sm text-gray-600 mb-3">
              Comprehensive guide to writing effective peer reviews
            </p>
            <Button size="sm" variant="outline">
              Read Guide
            </Button>
          </div>

          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Community Forum</h4>
            <p className="text-sm text-gray-600 mb-3">
              Connect with other reviewers and share experiences
            </p>
            <Button size="sm" variant="outline">
              Join Discussion
            </Button>
          </div>

          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Webinars</h4>
            <p className="text-sm text-gray-600 mb-3">
              Live sessions on advanced review techniques
            </p>
            <Button size="sm" variant="outline">
              View Schedule
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}