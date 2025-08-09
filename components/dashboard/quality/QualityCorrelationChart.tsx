'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface CorrelationDataPoint {
  x: number;
  y: number;
  reviewer_name: string;
  total_reviews: number;
  quality_score: number;
}

interface QualityCorrelationChartProps {
  data: CorrelationDataPoint[];
}

export default function QualityCorrelationChart({ data }: QualityCorrelationChartProps) {
  const [xMetric, setXMetric] = useState('total_reviews');
  const [yMetric, setYMetric] = useState('quality_score');

  const metrics = [
    { value: 'total_reviews', label: 'Total Reviews' },
    { value: 'quality_score', label: 'Quality Score' },
    { value: 'completeness', label: 'Completeness' },
    { value: 'constructiveness', label: 'Constructiveness' },
    { value: 'timeliness', label: 'Timeliness' },
    { value: 'consistency', label: 'Consistency' }
  ];

  // Transform data based on selected metrics
  const chartData = data.map(point => ({
    ...point,
    x: (point as any)[xMetric] || 0,
    y: (point as any)[yMetric] || 0
  }));

  // Calculate correlation coefficient
  const calculateCorrelation = (data: CorrelationDataPoint[]): number => {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const correlation = calculateCorrelation(chartData);

  const getCorrelationColor = (corr: number): string => {
    const absCorr = Math.abs(corr);
    if (absCorr >= 0.8) return corr > 0 ? 'text-green-600' : 'text-red-600';
    if (absCorr >= 0.6) return corr > 0 ? 'text-green-500' : 'text-red-500';
    if (absCorr >= 0.4) return corr > 0 ? 'text-blue-500' : 'text-orange-500';
    return 'text-gray-500';
  };

  const getCorrelationStrength = (corr: number): string => {
    const absCorr = Math.abs(corr);
    if (absCorr >= 0.8) return 'Strong';
    if (absCorr >= 0.6) return 'Moderate';
    if (absCorr >= 0.4) return 'Weak';
    return 'Very Weak';
  };

  const getPointColor = (point: CorrelationDataPoint): string => {
    const quality = point.quality_score || 0;
    if (quality >= 0.8) return '#10b981'; // green
    if (quality >= 0.6) return '#3b82f6'; // blue
    if (quality >= 0.4) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900 mb-1">{data.reviewer_name}</p>
          <p className="text-sm text-gray-600">
            {metrics.find(m => m.value === xMetric)?.label}: {data.x.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            {metrics.find(m => m.value === yMetric)?.label}: {data.y.toFixed(2)}
          </p>
          <p className="text-sm text-blue-600">
            Quality Score: {(data.quality_score * 100).toFixed(0)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quality Correlation Analysis</CardTitle>
            <CardDescription>
              Explore relationships between different quality metrics
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`text-right ${getCorrelationColor(correlation)}`}>
              <div className="text-lg font-bold">
                {correlation.toFixed(3)}
              </div>
              <div className="text-xs">
                {getCorrelationStrength(correlation)} {correlation > 0 ? 'Positive' : 'Negative'}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Metric Selection */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">X-Axis:</label>
            <Select value={xMetric} onValueChange={setXMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map(metric => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Y-Axis:</label>
            <Select value={yMetric} onValueChange={setYMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map(metric => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="x" 
                type="number"
                tick={{ fontSize: 12 }}
                className="text-gray-600"
                name={metrics.find(m => m.value === xMetric)?.label}
              />
              <YAxis 
                dataKey="y" 
                type="number"
                tick={{ fontSize: 12 }}
                className="text-gray-600"
                name={metrics.find(m => m.value === yMetric)?.label}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter dataKey="y">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPointColor(entry)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Analysis Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">{chartData.length}</div>
            <div className="text-sm text-gray-600">Data Points</div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className={`text-2xl font-bold ${getCorrelationColor(correlation)}`}>
              {correlation.toFixed(3)}
            </div>
            <div className="text-sm text-blue-700">Correlation</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {getCorrelationStrength(correlation)}
            </div>
            <div className="text-sm text-green-700">Relationship</div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">Quality Score Legend</h5>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Excellent (80%+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Good (60-79%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Fair (40-59%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Poor (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Interpretation Guide */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Correlation Interpretation:</strong>
          </p>
          <ul className="space-y-1 ml-4">
            <li>• <strong>Strong (±0.8-1.0):</strong> Very predictable relationship</li>
            <li>• <strong>Moderate (±0.6-0.79):</strong> Noticeable relationship</li>
            <li>• <strong>Weak (±0.4-0.59):</strong> Slight relationship</li>
            <li>• <strong>Very Weak (±0.0-0.39):</strong> Little to no relationship</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}