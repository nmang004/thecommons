import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Filter,
  Users,
  Star,
  Clock,
  CheckCircle,
  Mail,
  MapPin,
  TrendingUp,
  AlertCircle,
  Eye
} from 'lucide-react'

interface ReviewerWithStats {
  id: string
  full_name: string
  email: string
  affiliation?: string
  expertise?: string[]
  h_index?: number
  total_publications: number
  avatar_url?: string
  // Calculated stats
  reviewsCompleted: number
  averageReviewTime: number
  acceptanceRate: number
  qualityScore: number
  availability: 'available' | 'busy' | 'unavailable'
  lastReviewDate?: string
}

export default async function ReviewerFinderPage() {
  const supabase = await createClient()

  // TODO: Replace with actual database query once reviewers are in the system
  // For now, using mock data to demonstrate the interface
  const useMockData = true
  
  let reviewersWithStats: ReviewerWithStats[] = []

  if (useMockData) {
    // Mock reviewer data for demonstration
    reviewersWithStats = [
      {
        id: '1',
        full_name: 'Dr. Sarah Chen',
        email: 'sarah.chen@stanford.edu',
        affiliation: 'Stanford University',
        expertise: ['Machine Learning', 'Computer Vision', 'Neural Networks'],
        h_index: 45,
        total_publications: 120,
        reviewsCompleted: 23,
        averageReviewTime: 18,
        acceptanceRate: 85,
        qualityScore: 4.7,
        availability: 'available',
        lastReviewDate: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        full_name: 'Prof. Michael Rodriguez',
        email: 'm.rodriguez@mit.edu',
        affiliation: 'MIT',
        expertise: ['Quantum Computing', 'Cryptography', 'Algorithms'],
        h_index: 52,
        total_publications: 89,
        reviewsCompleted: 31,
        averageReviewTime: 14,
        acceptanceRate: 92,
        qualityScore: 4.9,
        availability: 'available',
        lastReviewDate: '2024-01-20T00:00:00Z'
      },
      {
        id: '3',
        full_name: 'Dr. Aisha Patel',
        email: 'aisha.patel@oxford.ac.uk',
        affiliation: 'University of Oxford',
        expertise: ['Biomedical Engineering', 'Signal Processing', 'Medical Imaging'],
        h_index: 38,
        total_publications: 95,
        reviewsCompleted: 19,
        averageReviewTime: 22,
        acceptanceRate: 78,
        qualityScore: 4.5,
        availability: 'busy',
        lastReviewDate: '2024-01-10T00:00:00Z'
      },
      {
        id: '4',
        full_name: 'Prof. James Wilson',
        email: 'j.wilson@caltech.edu',
        affiliation: 'Caltech',
        expertise: ['Astrophysics', 'Cosmology', 'Data Analysis'],
        h_index: 67,
        total_publications: 156,
        reviewsCompleted: 42,
        averageReviewTime: 16,
        acceptanceRate: 88,
        qualityScore: 4.8,
        availability: 'available',
        lastReviewDate: '2024-01-25T00:00:00Z'
      },
      {
        id: '5',
        full_name: 'Dr. Elena Kowalski',
        email: 'elena.k@ethz.ch',
        affiliation: 'ETH Zurich',
        expertise: ['Materials Science', 'Nanotechnology', 'Sustainability'],
        h_index: 41,
        total_publications: 103,
        reviewsCompleted: 27,
        averageReviewTime: 20,
        acceptanceRate: 82,
        qualityScore: 4.6,
        availability: 'available',
        lastReviewDate: '2024-01-18T00:00:00Z'
      },
      {
        id: '6',
        full_name: 'Prof. David Kim',
        email: 'd.kim@seoul.ac.kr',
        affiliation: 'Seoul National University',
        expertise: ['Robotics', 'Artificial Intelligence', 'Human-Computer Interaction'],
        h_index: 35,
        total_publications: 78,
        reviewsCompleted: 15,
        averageReviewTime: 25,
        acceptanceRate: 73,
        qualityScore: 4.3,
        availability: 'busy',
        lastReviewDate: '2024-01-08T00:00:00Z'
      },
      {
        id: '7',
        full_name: 'Dr. Maria Santos',
        email: 'maria.santos@usp.br',
        affiliation: 'University of São Paulo',
        expertise: ['Climate Science', 'Environmental Engineering', 'Data Modeling'],
        h_index: 29,
        total_publications: 67,
        reviewsCompleted: 12,
        averageReviewTime: 28,
        acceptanceRate: 70,
        qualityScore: 4.2,
        availability: 'available',
        lastReviewDate: '2023-12-22T00:00:00Z'
      },
      {
        id: '8',
        full_name: 'Prof. Ahmed Hassan',
        email: 'a.hassan@aucairo.edu',
        affiliation: 'American University in Cairo',
        expertise: ['Renewable Energy', 'Power Systems', 'Smart Grids'],
        h_index: 33,
        total_publications: 85,
        reviewsCompleted: 18,
        averageReviewTime: 21,
        acceptanceRate: 76,
        qualityScore: 4.4,
        availability: 'available',
        lastReviewDate: '2024-01-12T00:00:00Z'
      },
      {
        id: '9',
        full_name: 'Dr. Lisa Thompson',
        email: 'l.thompson@ubc.ca',
        affiliation: 'University of British Columbia',
        expertise: ['Marine Biology', 'Oceanography', 'Conservation'],
        h_index: 31,
        total_publications: 72,
        reviewsCompleted: 16,
        averageReviewTime: 24,
        acceptanceRate: 79,
        qualityScore: 4.5,
        availability: 'unavailable',
        lastReviewDate: '2024-01-05T00:00:00Z'
      },
      {
        id: '10',
        full_name: 'Prof. Hiroshi Tanaka',
        email: 'h.tanaka@tokyo.ac.jp',
        affiliation: 'University of Tokyo',
        expertise: ['Molecular Biology', 'Genetics', 'Biotechnology'],
        h_index: 48,
        total_publications: 134,
        reviewsCompleted: 35,
        averageReviewTime: 17,
        acceptanceRate: 89,
        qualityScore: 4.7,
        availability: 'available',
        lastReviewDate: '2024-01-22T00:00:00Z'
      },
      {
        id: '11',
        full_name: 'Dr. Sophie Dubois',
        email: 's.dubois@sorbonne.fr',
        affiliation: 'Sorbonne University',
        expertise: ['Theoretical Physics', 'Quantum Mechanics', 'Mathematical Physics'],
        h_index: 39,
        total_publications: 91,
        reviewsCompleted: 21,
        averageReviewTime: 19,
        acceptanceRate: 84,
        qualityScore: 4.6,
        availability: 'busy',
        lastReviewDate: '2024-01-14T00:00:00Z'
      },
      {
        id: '12',
        full_name: 'Prof. Robert Taylor',
        email: 'r.taylor@cambridge.ac.uk',
        affiliation: 'University of Cambridge',
        expertise: ['Economics', 'Econometrics', 'Financial Markets'],
        h_index: 44,
        total_publications: 98,
        reviewsCompleted: 29,
        averageReviewTime: 16,
        acceptanceRate: 87,
        qualityScore: 4.8,
        availability: 'available',
        lastReviewDate: '2024-01-19T00:00:00Z'
      }
    ]
  } else {
    // Get all potential reviewers from database
    const { data: reviewers } = await supabase
      .from('profiles')
      .select(`
        *,
        review_assignments!reviewer_id(
          id,
          status,
          invited_at,
          completed_at,
          due_date
        ),
        reviews!reviewer_id(
          id,
          submitted_at,
          review_quality_score,
          time_spent_hours
        )
      `)
      .eq('role', 'reviewer')
      .order('full_name')

    // Calculate reviewer statistics
    reviewersWithStats = reviewers?.map(reviewer => {
      const assignments = reviewer.review_assignments || []
      const reviews = reviewer.reviews || []
      
      const completedAssignments = assignments.filter((a: any) => a.status === 'completed')
      const totalInvitations = assignments.length
      const acceptedAssignments = assignments.filter((a: any) => 
        ['accepted', 'completed'].includes(a.status)
      )
      
      // Calculate average review time
      const completedReviews = reviews.filter((r: any) => r.time_spent_hours)
      const averageReviewTime = completedReviews.length > 0 
        ? completedReviews.reduce((sum: number, r: any) => sum + (r.time_spent_hours || 0), 0) / completedReviews.length 
        : 0

      // Calculate quality score
      const reviewsWithQuality = reviews.filter((r: any) => r.review_quality_score)
      const qualityScore = reviewsWithQuality.length > 0
        ? reviewsWithQuality.reduce((sum: number, r: any) => sum + (r.review_quality_score || 0), 0) / reviewsWithQuality.length
        : 0

      // Calculate acceptance rate
      const acceptanceRate = totalInvitations > 0 
        ? (acceptedAssignments.length / totalInvitations) * 100 
        : 0

      // Determine availability based on current assignments
      const activeAssignments = assignments.filter((a: any) => 
        ['invited', 'accepted'].includes(a.status)
      )
      let availability: 'available' | 'busy' | 'unavailable' = 'available'
      if (activeAssignments.length >= 3) availability = 'unavailable'
      else if (activeAssignments.length >= 2) availability = 'busy'

      // Get last review date
      const lastReview = reviews
        .filter((r: any) => r.submitted_at)
        .sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]

      return {
        id: reviewer.id,
        full_name: reviewer.full_name,
        email: reviewer.email,
        affiliation: reviewer.affiliation,
        expertise: reviewer.expertise,
        h_index: reviewer.h_index,
        total_publications: reviewer.total_publications,
        avatar_url: reviewer.avatar_url,
        reviewsCompleted: completedAssignments.length,
        averageReviewTime: Math.round(averageReviewTime),
        acceptanceRate: Math.round(acceptanceRate),
        qualityScore: Math.round(qualityScore * 10) / 10,
        availability,
        lastReviewDate: lastReview?.submitted_at
      }
    }) || []
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available':
        return <CheckCircle className="w-3 h-3" />
      case 'busy':
        return <Clock className="w-3 h-3" />
      case 'unavailable':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Reviewer Finder
            </h1>
            <p className="text-gray-600 mt-1">
              Find and invite qualified reviewers based on expertise and availability
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter by Expertise
            </Button>
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search Reviewers
            </Button>
          </div>
        </div>
      </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviewers</p>
                <p className="text-2xl font-bold text-gray-900">{reviewersWithStats.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviewersWithStats.filter(r => r.availability === 'available').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviewersWithStats.filter(r => r.availability === 'busy').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviewersWithStats.length > 0 
                    ? (reviewersWithStats.reduce((sum, r) => sum + r.qualityScore, 0) / reviewersWithStats.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Reviewers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewersWithStats.map((reviewer) => (
            <Card key={reviewer.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {reviewer.full_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {reviewer.full_name}
                    </h3>
                    {reviewer.affiliation && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {reviewer.affiliation}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={`${getAvailabilityColor(reviewer.availability)} border flex items-center`}>
                  {getAvailabilityIcon(reviewer.availability)}
                  <span className="ml-1 capitalize">{reviewer.availability}</span>
                </Badge>
              </div>

              {/* Expertise */}
              {reviewer.expertise && reviewer.expertise.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-1">
                    {reviewer.expertise.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {reviewer.expertise.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{reviewer.expertise.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-gray-600">Reviews</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{reviewer.reviewsCompleted}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                    <span className="text-xs text-gray-600">Quality</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {reviewer.qualityScore > 0 ? `${reviewer.qualityScore}/5.0` : 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 text-blue-500 mr-1" />
                    <span className="text-xs text-gray-600">Accept Rate</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{reviewer.acceptanceRate}%</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <TrendingUp className="w-3 h-3 text-purple-500 mr-1" />
                    <span className="text-xs text-gray-600">H-Index</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {reviewer.h_index || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Last Activity */}
              {reviewer.lastReviewDate && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600">
                    Last review: {new Date(reviewer.lastReviewDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Profile
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  disabled={reviewer.availability === 'unavailable'}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Invite
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {reviewersWithStats.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviewers found
            </h3>
            <p className="text-gray-600">
              Reviewers will appear here once they register with the platform
            </p>
          </Card>
        )}
    </div>
  )
}