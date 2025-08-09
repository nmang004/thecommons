'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface TrendData {
  date: string;
  average_quality: number;
  review_count: number;
}

interface QualityTrendsChartProps {
  data: TrendData[];
}

export default function QualityTrendsChart({ data }: QualityTrendsChartProps) {
  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    average_quality: Math.round(item.average_quality * 100) / 100
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-blue-600">
            Quality Score: {payload[0].value}
          </p>
          <p className="text-sm text-green-600">
            Reviews: {payload[1]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quality Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Score Trend</CardTitle>
          <CardDescription>
            Average quality scores over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <YAxis 
                  domain={[0, 1]} 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="average_quality" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Review Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Review Volume</CardTitle>
          <CardDescription>
            Number of reviews processed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="review_count" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Combined Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Quality vs Volume Analysis</CardTitle>
          <CardDescription>
            Correlation between review volume and average quality scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <YAxis 
                  yAxisId="quality"
                  orientation="left"
                  domain={[0, 1]}
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <YAxis 
                  yAxisId="count"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  yAxisId="quality"
                  type="monotone" 
                  dataKey="average_quality" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Quality Score"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="count"
                  type="monotone" 
                  dataKey="review_count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Review Count"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Quality Score</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
              <span className="text-sm text-gray-600">Review Count</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}