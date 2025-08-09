'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatMapData {
  reviewer_id: string;
  reviewer_name: string;
  metrics: {
    [key: string]: number; // metric name -> score (0-1)
  };
  total_reviews: number;
  average_quality: number;
}

interface QualityHeatMapProps {
  data: HeatMapData[];
  metrics: string[];
}

export default function QualityHeatMap({ data, metrics }: QualityHeatMapProps) {
  const getColorIntensity = (score: number): string => {
    const intensity = Math.round(score * 100);
    
    if (intensity >= 90) return 'bg-green-600';
    if (intensity >= 80) return 'bg-green-500';
    if (intensity >= 70) return 'bg-green-400';
    if (intensity >= 60) return 'bg-yellow-500';
    if (intensity >= 50) return 'bg-yellow-400';
    if (intensity >= 40) return 'bg-orange-400';
    if (intensity >= 30) return 'bg-orange-500';
    if (intensity >= 20) return 'bg-red-400';
    if (intensity >= 10) return 'bg-red-500';
    return 'bg-red-600';
  };

  const getMetricDisplayName = (metric: string): string => {
    const displayNames: Record<string, string> = {
      completeness: 'Completeness',
      timeliness: 'Timeliness',
      depth: 'Depth',
      constructiveness_score: 'Constructiveness',
      clarity: 'Clarity',
      consistency: 'Consistency',
      professionalism: 'Professionalism',
      bias_free: 'Bias-Free',
      specificity: 'Specificity'
    };
    
    return displayNames[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Sort reviewers by average quality (descending)
  const sortedData = [...data].sort((a, b) => b.average_quality - a.average_quality);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quality Performance Heat Map</CardTitle>
        <CardDescription>
          Visual representation of reviewer performance across quality metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `200px repeat(${metrics.length}, 100px) 120px` }}>
              <div className="p-2 font-medium text-sm text-gray-700">Reviewer</div>
              {metrics.map(metric => (
                <div key={metric} className="p-2 text-center font-medium text-xs text-gray-700 transform -rotate-45 origin-center">
                  {getMetricDisplayName(metric)}
                </div>
              ))}
              <div className="p-2 text-center font-medium text-sm text-gray-700">Overall</div>
            </div>

            {/* Heat Map Grid */}
            <div className="space-y-1">
              {sortedData.map((reviewer) => (
                <div 
                  key={reviewer.reviewer_id}
                  className="grid gap-1 items-center" 
                  style={{ gridTemplateColumns: `200px repeat(${metrics.length}, 100px) 120px` }}
                >
                  {/* Reviewer Name */}
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {reviewer.reviewer_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {reviewer.total_reviews} reviews
                    </div>
                  </div>

                  {/* Metric Cells */}
                  {metrics.map(metric => {
                    const score = reviewer.metrics[metric] || 0;
                    const percentage = Math.round(score * 100);
                    
                    return (
                      <TooltipProvider key={metric}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`h-12 w-full rounded flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${getColorIntensity(score)}`}
                            >
                              <span className="text-white text-xs font-medium">
                                {percentage}%
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <p className="font-medium">{getMetricDisplayName(metric)}</p>
                              <p>{reviewer.reviewer_name}</p>
                              <p className="text-lg font-bold">{percentage}%</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}

                  {/* Overall Score */}
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {Math.round(reviewer.average_quality * 100)}%
                    </div>
                    <Badge 
                      variant="outline"
                      className={
                        reviewer.average_quality >= 0.8 ? 'border-green-300 text-green-800 bg-green-50' :
                        reviewer.average_quality >= 0.6 ? 'border-blue-300 text-blue-800 bg-blue-50' :
                        reviewer.average_quality >= 0.4 ? 'border-yellow-300 text-yellow-800 bg-yellow-50' :
                        'border-red-300 text-red-800 bg-red-50'
                      }
                    >
                      {reviewer.average_quality >= 0.8 ? 'Excellent' :
                       reviewer.average_quality >= 0.6 ? 'Good' :
                       reviewer.average_quality >= 0.4 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-3">Performance Scale</h5>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-xs text-gray-600">0-20%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <span className="text-xs text-gray-600">20-40%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span className="text-xs text-gray-600">40-60%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-xs text-gray-600">60-80%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-xs text-gray-600">80-90%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-xs text-gray-600">90-100%</span>
            </div>
          </div>
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No reviewer data available for heat map visualization.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}