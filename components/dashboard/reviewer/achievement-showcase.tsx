'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Award, 
  Star, 
  Medal,
  Crown,
  Sparkles,
  Eye,
  Lock
} from 'lucide-react'
import { Badge as BadgeType } from '@/types/database'

interface AchievementShowcaseProps {
  badges: BadgeType[]
  totalReviews: number
  compact?: boolean
}

export function AchievementShowcase({ badges, totalReviews, compact = false }: AchievementShowcaseProps) {
  const [showAll, setShowAll] = useState(false)

  // Sort badges by rarity (legendary > epic > rare > uncommon > common)
  const sortedBadges = [...badges].sort((a, b) => {
    const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 }
    return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - 
           (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0)
  })

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500'
      case 'epic':
        return 'from-purple-400 to-pink-500'
      case 'rare':
        return 'from-blue-400 to-cyan-500'
      case 'uncommon':
        return 'from-green-400 to-emerald-500'
      case 'common':
        return 'from-gray-400 to-gray-500'
      default:
        return 'from-gray-300 to-gray-400'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return Crown
      case 'epic':
        return Sparkles
      case 'rare':
        return Medal
      case 'uncommon':
        return Award
      case 'common':
      default:
        return Trophy
    }
  }

  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'quality':
        return Star
      case 'timeliness':
        return Medal
      case 'service':
        return Award
      case 'volume':
        return Trophy
      case 'expertise':
        return Eye
      default:
        return Trophy
    }
  }

  // Mock upcoming badges based on current progress
  const getUpcomingBadges = () => {
    const upcoming = []
    
    if (totalReviews < 5) {
      upcoming.push({
        name: 'Getting Started',
        description: 'Complete 5 reviews',
        progress: totalReviews,
        target: 5,
        category: 'volume'
      })
    } else if (totalReviews < 10) {
      upcoming.push({
        name: 'Reviewer',
        description: 'Complete 10 reviews',
        progress: totalReviews,
        target: 10,
        category: 'volume'
      })
    } else if (totalReviews < 25) {
      upcoming.push({
        name: 'Experienced Reviewer',
        description: 'Complete 25 reviews',
        progress: totalReviews,
        target: 25,
        category: 'volume'
      })
    } else if (totalReviews < 50) {
      upcoming.push({
        name: 'Expert Reviewer',
        description: 'Complete 50 reviews',
        progress: totalReviews,
        target: 50,
        category: 'volume'
      })
    }

    return upcoming
  }

  const upcomingBadges = getUpcomingBadges()

  if (compact) {
    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-heading font-semibold text-gray-900">
            Achievements
          </h3>
          <Badge variant="secondary">
            {badges.length} earned
          </Badge>
        </div>

        {badges.length > 0 ? (
          <div className="space-y-3">
            {/* Most recent/prestigious badges */}
            <div className="flex flex-wrap gap-2">
              {sortedBadges.slice(0, 3).map((badge) => {
                const IconComponent = getBadgeIcon(badge.category)
                return (
                  <div
                    key={badge.id}
                    className={`inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white text-xs font-medium`}
                  >
                    <IconComponent className="w-3 h-3 mr-1" />
                    {badge.name}
                  </div>
                )
              })}
              {badges.length > 3 && (
                <div className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                  +{badges.length - 3} more
                </div>
              )}
            </div>

            {/* Next milestone */}
            {upcomingBadges.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Next Achievement
                  </span>
                  <span className="text-xs text-gray-500">
                    {upcomingBadges[0].progress}/{upcomingBadges[0].target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{
                      width: `${(upcomingBadges[0].progress / upcomingBadges[0].target) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">{upcomingBadges[0].name}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No badges earned yet</p>
            <p className="text-xs text-gray-500">Complete your first review to start earning achievements!</p>
          </div>
        )}
      </Card>
    )
  }

  // Full achievement showcase
  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-semibold text-gray-900">
            Your Achievements
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800">
              {badges.length} badges earned
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showAll ? 'Show Less' : 'View All'}
            </Button>
          </div>
        </div>

        {badges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAll ? sortedBadges : sortedBadges.slice(0, 6)).map((badge) => {
              const IconComponent = getBadgeIcon(badge.category)
              const RarityIcon = getRarityIcon(badge.rarity)
              
              return (
                <div
                  key={badge.id}
                  className={`relative p-4 rounded-lg bg-gradient-to-br ${getRarityColor(badge.rarity)} text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <RarityIcon className="w-4 h-4 opacity-70" />
                  </div>
                  
                  <h3 className="font-semibold mb-1">{badge.name}</h3>
                  <p className="text-sm opacity-90 line-clamp-2">
                    {badge.description}
                  </p>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className="bg-white bg-opacity-20 text-white border-0 text-xs"
                    >
                      {badge.rarity}
                    </Badge>
                    <span className="text-xs opacity-70">
                      {badge.category}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No achievements yet
            </h3>
            <p className="text-gray-600">
              Complete reviews to start earning badges and recognition!
            </p>
          </div>
        )}
      </Card>

      {/* Progress Towards Next Achievements */}
      {upcomingBadges.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">
            Progress Towards Next Achievements
          </h2>
          
          <div className="space-y-4">
            {upcomingBadges.map((upcoming, index) => {
              const IconComponent = getBadgeIcon(upcoming.category)
              const progress = (upcoming.progress / upcoming.target) * 100
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{upcoming.name}</h3>
                        <p className="text-sm text-gray-600">{upcoming.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {upcoming.progress}/{upcoming.target}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{width: `${Math.min(progress, 100)}%`}}
                    />
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {upcoming.target - upcoming.progress} more {upcoming.category === 'volume' ? 'reviews' : 'actions'} needed
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Badge Gallery (All Available Badges) */}
      <Card className="p-6">
        <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">
          Badge Gallery
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* This would come from a complete badge list API */}
          {['Volume', 'Quality', 'Timeliness', 'Service'].map((category) => (
            <div key={category} className="text-center p-4 border border-gray-200 rounded-lg opacity-50">
              <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <h4 className="font-medium text-gray-600">{category} Badges</h4>
              <p className="text-xs text-gray-500 mt-1">Unlock by completing reviews</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}