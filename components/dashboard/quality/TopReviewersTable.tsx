'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star,
  TrendingUp,
  User,
  MessageCircle
} from 'lucide-react';

interface TopReviewer {
  reviewer_id: string;
  name: string;
  average_quality: number;
  total_reviews: number;
  badges: Array<{
    type: string;
    earned_at: string;
    description: string;
  }>;
}

interface TopReviewersTableProps {
  reviewers: TopReviewer[];
}

export default function TopReviewersTable({ reviewers }: TopReviewersTableProps) {
  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'consistency_champion':
        return <Medal className="h-4 w-4" />;
      case 'thorough_reviewer':
        return <Award className="h-4 w-4" />;
      case 'constructive_feedback':
        return <MessageCircle className="h-4 w-4" />;
      case 'timely_reviewer':
        return <TrendingUp className="h-4 w-4" />;
      case 'quality_excellence':
        return <Star className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getBadgeDisplayName = (type: string): string => {
    const badgeNames: Record<string, string> = {
      consistency_champion: 'Consistency Champion',
      thorough_reviewer: 'Thorough Reviewer',
      constructive_feedback: 'Constructive Feedback',
      timely_reviewer: 'Timely Reviewer',
      quality_excellence: 'Excellence Award'
    };
    
    return badgeNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      consistency_champion: 'bg-blue-100 text-blue-800 border-blue-300',
      thorough_reviewer: 'bg-purple-100 text-purple-800 border-purple-300',
      constructive_feedback: 'bg-green-100 text-green-800 border-green-300',
      timely_reviewer: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      quality_excellence: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getQualityRank = (index: number) => {
    if (index === 0) return { icon: <Trophy className="h-5 w-5 text-yellow-500" />, label: '1st' };
    if (index === 1) return { icon: <Medal className="h-5 w-5 text-gray-400" />, label: '2nd' };
    if (index === 2) return { icon: <Award className="h-5 w-5 text-orange-600" />, label: '3rd' };
    return { icon: <Star className="h-5 w-5 text-gray-300" />, label: `${index + 1}th` };
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleContactReviewer = (reviewerId: string) => {
    // Navigate to reviewer profile or open contact modal
    window.open(`/dashboard/admin/reviewers/${reviewerId}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5" />
          <span>Top Performing Reviewers</span>
        </CardTitle>
        <CardDescription>
          Reviewers with the highest quality scores and most valuable contributions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviewers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium mb-1">No data available</p>
            <p className="text-sm">Reviewer performance data will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewers.map((reviewer, index) => {
              const rank = getQualityRank(index);
              const qualityPercentage = Math.round(reviewer.average_quality * 100);
              
              return (
                <div 
                  key={reviewer.reviewer_id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                    {rank.icon}
                  </div>
                  
                  {/* Reviewer Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(reviewer.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {reviewer.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {reviewer.total_reviews} reviews completed
                        </p>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    {reviewer.badges && reviewer.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {reviewer.badges.slice(0, 3).map((badge, badgeIndex) => (
                          <Badge 
                            key={badgeIndex}
                            variant="outline"
                            className={`${getBadgeColor(badge.type)} text-xs flex items-center space-x-1`}
                            title={badge.description}
                          >
                            {getBadgeIcon(badge.type)}
                            <span>{getBadgeDisplayName(badge.type)}</span>
                          </Badge>
                        ))}
                        {reviewer.badges.length > 3 && (
                          <Badge variant="outline" className="text-xs text-gray-600">
                            +{reviewer.badges.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Quality Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {qualityPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Quality Score
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactReviewer(reviewer.reviewer_id)}
                      className="flex items-center space-x-1"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {reviewers.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Recognition Criteria</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <strong>Quality Score:</strong> Based on completeness, constructiveness, and consistency
              </div>
              <div>
                <strong>Badges:</strong> Earned through exceptional performance in specific areas
              </div>
              <div>
                <strong>Volume:</strong> Minimum 5 completed reviews in the time period
              </div>
              <div>
                <strong>Impact:</strong> Positive feedback from authors and editors
              </div>
            </div>
          </div>
        )}

        {reviewers.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Top Reviewers
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}