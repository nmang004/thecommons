'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface QualityOverviewCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  type?: 'metric' | 'count' | 'percentage' | 'score';
  status?: 'excellent' | 'good' | 'warning' | 'critical';
  progress?: number;
}

export default function QualityOverviewCard({
  title,
  value,
  description,
  trend,
  trendValue,
  type = 'count',
  status,
  progress
}: QualityOverviewCardProps) {
  const getIcon = () => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const formatValue = () => {
    if (typeof value === 'string') return value;
    
    switch (type) {
      case 'percentage':
        return `${Math.round(value * 100)}%`;
      case 'score':
        return value.toFixed(2);
      case 'metric':
        return value.toFixed(1);
      default:
        return value.toString();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'border-green-200 bg-green-50';
      case 'good':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <Card className={`${getStatusColor()} transition-colors`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-gray-900">
            {formatValue()}
          </div>
          {trend && trendValue && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={`text-xs font-medium ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        
        {progress !== undefined && (
          <div className="mt-3">
            <Progress 
              value={progress} 
              className="h-2" 
              // @ts-ignore
              indicatorClassName={
                progress >= 90 ? 'bg-green-600' :
                progress >= 70 ? 'bg-blue-600' :
                progress >= 50 ? 'bg-yellow-600' :
                'bg-red-600'
              }
            />
          </div>
        )}
        
        {description && (
          <p className="text-xs text-gray-600 mt-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}