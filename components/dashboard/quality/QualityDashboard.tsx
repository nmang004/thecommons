'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Filter, AlertCircle } from 'lucide-react';
import QualityOverviewCard from './QualityOverviewCard';
import QualityTrendsChart from './QualityTrendsChart';
import QualityMetricsTable from './QualityMetricsTable';
import FlaggedReviewsList from './FlaggedReviewsList';
import TopReviewersTable from './TopReviewersTable';
import { QualityDashboardData } from '@/lib/types/quality';

export default function QualityDashboard() {
  const [data, setData] = useState<QualityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [fieldFilter, setFieldFilter] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, fieldFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range: timeRange,
        ...(fieldFilter && { field: fieldFilter })
      });

      const response = await fetch(`/api/quality/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const analytics = await response.json();
      setData(analytics);
    } catch (error) {
      console.error('Error fetching quality analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    // Implementation for exporting analytics data
    console.log('Exporting quality analytics data...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load analytics data</p>
          <Button onClick={fetchAnalytics} variant="outline" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Analytics</h1>
          <p className="text-gray-600">Monitor and analyze review quality across your platform</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={fieldFilter} onValueChange={setFieldFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All fields" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All fields</SelectItem>
              <SelectItem value="computer_science">Computer Science</SelectItem>
              <SelectItem value="biology">Biology</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QualityOverviewCard
          title="Total Reviews"
          value={data.overview.total_reviews}
          type="count"
          description={`Reviews analyzed in the last ${timeRange} days`}
          status={data.overview.total_reviews > 0 ? 'good' : 'warning'}
        />
        
        <QualityOverviewCard
          title="Average Quality"
          value={data.overview.average_quality}
          type="score"
          status={
            data.overview.average_quality >= 0.8 ? 'excellent' :
            data.overview.average_quality >= 0.6 ? 'good' :
            data.overview.average_quality >= 0.4 ? 'warning' : 'critical'
          }
          progress={data.overview.average_quality * 100}
          description="Overall quality score across all reviews"
        />
        
        <QualityOverviewCard
          title="Reviews Flagged"
          value={data.overview.reviews_flagged}
          type="count"
          status={
            data.overview.reviews_flagged === 0 ? 'excellent' :
            data.overview.reviews_flagged < 5 ? 'good' :
            data.overview.reviews_flagged < 15 ? 'warning' : 'critical'
          }
          description="Reviews requiring attention"
        />
        
        <QualityOverviewCard
          title="Pending Review"
          value={data.overview.pending_editor_review}
          type="count"
          status={
            data.overview.pending_editor_review === 0 ? 'excellent' :
            data.overview.pending_editor_review < 5 ? 'good' : 'warning'
          }
          description="Reports awaiting editor review"
        />
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Quality Trends</TabsTrigger>
          <TabsTrigger value="metrics">Metrics Breakdown</TabsTrigger>
          <TabsTrigger value="reviewers">Top Reviewers</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <QualityTrendsChart data={data.trends} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <QualityMetricsTable metrics={data.metrics_breakdown} />
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-4">
          <TopReviewersTable reviewers={data.top_reviewers} />
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <FlaggedReviewsList reviews={data.flagged_reviews} />
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Insights</CardTitle>
            <CardDescription>
              Key findings from recent quality analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overview.average_quality > 0.8 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-green-900">Excellent Quality Maintained</h4>
                  <p className="text-sm text-green-700">
                    Reviews are consistently meeting high quality standards.
                  </p>
                </div>
              </div>
            )}
            
            {data.overview.reviews_flagged > 10 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-yellow-900">Increased Flagged Reviews</h4>
                  <p className="text-sm text-yellow-700">
                    Consider reviewing training materials or reviewer guidelines.
                  </p>
                </div>
              </div>
            )}
            
            {data.overview.pending_editor_review > 5 && (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-blue-900">Reviews Await Editor Feedback</h4>
                  <p className="text-sm text-blue-700">
                    {data.overview.pending_editor_review} quality reports need editor review.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common quality management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Filter className="h-4 w-4 mr-2" />
              Review Flagged Submissions
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              Trigger Batch Analysis
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export Quality Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}