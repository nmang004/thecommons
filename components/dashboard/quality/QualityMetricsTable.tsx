'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricData {
  metric: string;
  average_score: number;
  trend: 'up' | 'down' | 'stable';
}

interface QualityMetricsTableProps {
  metrics: MetricData[];
}

export default function QualityMetricsTable({ metrics }: QualityMetricsTableProps) {
  const getMetricDisplayName = (metric: string): string => {
    const displayNames: Record<string, string> = {
      completeness: 'Completeness',
      timeliness: 'Timeliness',
      depth: 'Review Depth',
      constructiveness_score: 'Constructiveness',
      clarity: 'Clarity',
      consistency: 'Consistency',
      professionalism: 'Professionalism',
      bias_free: 'Bias-Free Language',
      specificity: 'Specificity',
      recommendation_alignment: 'Recommendation Alignment',
      internal_consistency: 'Internal Consistency'
    };
    
    return displayNames[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMetricDescription = (metric: string): string => {
    const descriptions: Record<string, string> = {
      completeness: 'How thoroughly all required sections are filled',
      timeliness: 'Reviews submitted relative to deadline',
      depth: 'Level of detail and analysis provided',
      constructiveness_score: 'Helpfulness and actionability of feedback',
      clarity: 'Readability and structure of reviews',
      consistency: 'Alignment between comments and recommendation',
      professionalism: 'Professional tone and language use',
      bias_free: 'Absence of biased language or assumptions',
      specificity: 'Use of specific examples and references',
      recommendation_alignment: 'How well recommendation matches feedback',
      internal_consistency: 'Consistency within the review sections'
    };
    
    return descriptions[metric] || 'Quality metric analysis';
  };

  const getScoreStatus = (score: number): { color: string; label: string } => {
    if (score >= 0.85) return { color: 'green', label: 'Excellent' };
    if (score >= 0.70) return { color: 'blue', label: 'Good' };
    if (score >= 0.55) return { color: 'yellow', label: 'Fair' };
    return { color: 'red', label: 'Needs Improvement' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const sortedMetrics = [...metrics].sort((a, b) => b.average_score - a.average_score);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Metrics Breakdown</CardTitle>
        <CardDescription>
          Detailed analysis of individual quality metrics across all reviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedMetrics.map((metric) => {
            const status = getScoreStatus(metric.average_score);
            const percentage = Math.round(metric.average_score * 100);
            
            return (
              <div key={metric.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">
                      {getMetricDisplayName(metric.metric)}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${status.color === 'green' ? 'border-green-300 text-green-800 bg-green-50' :
                          status.color === 'blue' ? 'border-blue-300 text-blue-800 bg-blue-50' :
                          status.color === 'yellow' ? 'border-yellow-300 text-yellow-800 bg-yellow-50' :
                          'border-red-300 text-red-800 bg-red-50'}
                      `}
                    >
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {percentage}%
                    </span>
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  {getMetricDescription(metric.metric)}
                </p>
                
                <Progress 
                  value={percentage} 
                  className="h-2"
                  // @ts-ignore
                  indicatorClassName={
                    status.color === 'green' ? 'bg-green-600' :
                    status.color === 'blue' ? 'bg-blue-600' :
                    status.color === 'yellow' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }
                />
              </div>
            );
          })}
        </div>

        {metrics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No metric data available for the selected time period.</p>
          </div>
        )}

        {metrics.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Metric Interpretation Guide</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>Excellent (85%+): Outstanding performance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Good (70-84%): Solid performance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                <span>Fair (55-69%): Room for improvement</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Needs Improvement (&lt;55%): Requires attention</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}