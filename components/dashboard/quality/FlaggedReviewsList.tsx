'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Flag,
  User,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FlaggedReview {
  review_id: string;
  manuscript_title: string;
  reviewer_name: string;
  flags: string[];
  quality_score: number;
  submitted_at: string;
}

interface FlaggedReviewsListProps {
  reviews: FlaggedReview[];
}

export default function FlaggedReviewsList({ reviews }: FlaggedReviewsListProps) {
  const getFlagDisplayName = (flag: string): string => {
    const flagNames: Record<string, string> = {
      bias_suspected: 'Bias Suspected',
      unprofessional_tone: 'Unprofessional Tone',
      incomplete_review: 'Incomplete',
      inconsistent_recommendation: 'Inconsistent',
      low_constructiveness: 'Low Constructiveness',
      excellent_quality: 'Excellent Quality',
      needs_improvement: 'Needs Improvement'
    };
    
    return flagNames[flag] || flag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFlagSeverity = (flag: string): 'critical' | 'warning' | 'info' | 'positive' => {
    const criticalFlags = ['bias_suspected', 'unprofessional_tone'];
    const warningFlags = ['incomplete_review', 'inconsistent_recommendation', 'low_constructiveness', 'needs_improvement'];
    const positiveFlags = ['excellent_quality'];
    
    if (criticalFlags.includes(flag)) return 'critical';
    if (warningFlags.includes(flag)) return 'warning';
    if (positiveFlags.includes(flag)) return 'positive';
    return 'info';
  };

  const getFlagColor = (severity: 'critical' | 'warning' | 'info' | 'positive'): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getQualityScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleReviewClick = (reviewId: string) => {
    // Navigate to review details
    window.open(`/dashboard/editor/reviews/${reviewId}`, '_blank');
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    // Sort by severity (critical first) and then by date
    const aSeverity = Math.max(...a.flags.map(f => 
      getFlagSeverity(f) === 'critical' ? 4 : 
      getFlagSeverity(f) === 'warning' ? 3 : 
      getFlagSeverity(f) === 'positive' ? 1 : 2
    ));
    const bSeverity = Math.max(...b.flags.map(f => 
      getFlagSeverity(f) === 'critical' ? 4 : 
      getFlagSeverity(f) === 'warning' ? 3 : 
      getFlagSeverity(f) === 'positive' ? 1 : 2
    ));
    
    if (aSeverity !== bSeverity) return bSeverity - aSeverity;
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Flag className="h-5 w-5" />
          <span>Flagged Reviews</span>
        </CardTitle>
        <CardDescription>
          Reviews that have been flagged for quality concerns or excellence
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Flag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium mb-1">No flagged reviews</p>
            <p className="text-sm">All reviews are within quality standards</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews.map((review) => {
              const hasCriticalFlags = review.flags.some(f => getFlagSeverity(f) === 'critical');
              const hasPositiveFlags = review.flags.some(f => getFlagSeverity(f) === 'positive');
              
              return (
                <div 
                  key={review.review_id}
                  className={`p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                    hasCriticalFlags ? 'border-red-200 bg-red-50' :
                    hasPositiveFlags ? 'border-green-200 bg-green-50' :
                    'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Manuscript Title */}
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {review.manuscript_title}
                        </h4>
                      </div>
                      
                      {/* Reviewer and Quality Score */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{review.reviewer_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Quality Score:</span>
                          <span className={`font-medium ${getQualityScoreColor(review.quality_score)}`}>
                            {(review.quality_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDistanceToNow(new Date(review.submitted_at))} ago</span>
                        </div>
                      </div>
                      
                      {/* Flags */}
                      <div className="flex flex-wrap gap-2">
                        {review.flags.map((flag) => {
                          const severity = getFlagSeverity(flag);
                          const colorClass = getFlagColor(severity);
                          
                          return (
                            <Badge 
                              key={flag}
                              variant="outline"
                              className={`${colorClass} text-xs`}
                            >
                              {severity === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {getFlagDisplayName(flag)}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewClick(review.review_id)}
                        className="flex items-center space-x-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Review</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {sortedReviews.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Flag Priority Guide</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-800">Critical: Requires immediate attention</span>
              </div>
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800">Warning: Needs review</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <span className="text-green-800">Positive: Excellent quality</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}