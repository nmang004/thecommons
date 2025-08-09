'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Star,
  Flag,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { ReviewQualityReport, QualityFlag } from '@/lib/types/quality';
import { formatDistanceToNow } from 'date-fns';

interface QualityReportCardProps {
  report: ReviewQualityReport;
  isEditor?: boolean;
  onEditorFeedback?: (rating: number, notes: string) => void;
  onFlagReview?: (flags: QualityFlag[], reason: string) => void;
}

export default function QualityReportCard({ 
  report, 
  isEditor = false,
  onEditorFeedback,
  onFlagReview: _onFlagReview 
}: QualityReportCardProps) {
  const [editorRating, setEditorRating] = useState<number>(report.editor_rating || 0);
  const [editorNotes, setEditorNotes] = useState(report.editor_notes || '');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const getQualityLabel = (score: number): { label: string; color: string } => {
    if (score >= 0.9) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 0.8) return { label: 'Very Good', color: 'text-blue-600' };
    if (score >= 0.7) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 0.6) return { label: 'Satisfactory', color: 'text-yellow-600' };
    if (score >= 0.5) return { label: 'Needs Improvement', color: 'text-orange-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  const getFlagColor = (flag: QualityFlag): string => {
    const flagColors: Record<QualityFlag, string> = {
      'bias_suspected': 'bg-red-100 text-red-800 border-red-300',
      'unprofessional_tone': 'bg-red-100 text-red-800 border-red-300',
      'incomplete_review': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'inconsistent_recommendation': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'low_constructiveness': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'excellent_quality': 'bg-green-100 text-green-800 border-green-300',
      'needs_improvement': 'bg-orange-100 text-orange-800 border-orange-300',
      'ethical_concern': 'bg-red-100 text-red-800 border-red-300'
    };
    return flagColors[flag] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getFlagDisplayName = (flag: QualityFlag): string => {
    const flagNames: Record<QualityFlag, string> = {
      'bias_suspected': 'Bias Suspected',
      'unprofessional_tone': 'Unprofessional Tone',
      'incomplete_review': 'Incomplete Review',
      'inconsistent_recommendation': 'Inconsistent Recommendation',
      'low_constructiveness': 'Low Constructiveness',
      'excellent_quality': 'Excellent Quality',
      'needs_improvement': 'Needs Improvement',
      'ethical_concern': 'Ethical Concern'
    };
    return flagNames[flag] || flag.replace(/_/g, ' ');
  };

  const renderMetricScore = (label: string, score: number, icon: React.ReactNode) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-bold text-gray-900">
          {Math.round(score * 100)}%
        </span>
        <Progress 
          value={score * 100} 
          className="w-16 h-2" 
          // @ts-ignore
          indicatorClassName={
            score >= 0.8 ? 'bg-green-600' :
            score >= 0.6 ? 'bg-blue-600' :
            score >= 0.4 ? 'bg-yellow-600' :
            'bg-red-600'
          }
        />
      </div>
    </div>
  );

  const handleSubmitFeedback = () => {
    if (onEditorFeedback && editorRating > 0) {
      onEditorFeedback(editorRating, editorNotes);
      setShowFeedbackForm(false);
    }
  };

  const qualityInfo = report.quality_score ? getQualityLabel(report.quality_score) : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Quality Report</span>
            </CardTitle>
            <CardDescription>
              AI-powered analysis and quality assessment
            </CardDescription>
          </div>
          
          {report.quality_score && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${qualityInfo?.color}`}>
                {Math.round(report.quality_score * 100)}%
              </div>
              <div className={`text-sm ${qualityInfo?.color}`}>
                {qualityInfo?.label}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge variant="outline" className={
            report.status === 'analysis_complete' ? 'border-green-300 text-green-800 bg-green-50' :
            report.status === 'pending_editor_review' ? 'border-yellow-300 text-yellow-800 bg-yellow-50' :
            'border-gray-300 text-gray-800 bg-gray-50'
          }>
            {report.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          
          {report.analysis_completed_at && (
            <span className="text-sm text-gray-500">
              • Analyzed {formatDistanceToNow(new Date(report.analysis_completed_at))} ago
            </span>
          )}
        </div>

        {/* Flags */}
        {report.flags && report.flags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <Flag className="h-4 w-4" />
              <span>Quality Flags</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {report.flags.map((flag) => (
                <Badge 
                  key={flag}
                  variant="outline"
                  className={getFlagColor(flag)}
                >
                  {getFlagDisplayName(flag)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Automated Metrics */}
        {report.automated_metrics && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Automated Metrics</h4>
            <div className="space-y-2">
              {report.automated_metrics.completeness !== undefined && 
                renderMetricScore('Completeness', report.automated_metrics.completeness, <CheckCircle className="h-4 w-4 text-green-600" />)
              }
              {report.automated_metrics.timeliness !== undefined && 
                renderMetricScore('Timeliness', report.automated_metrics.timeliness, <Clock className="h-4 w-4 text-blue-600" />)
              }
              {report.automated_metrics.depth !== undefined && 
                renderMetricScore('Depth', report.automated_metrics.depth, <BarChart3 className="h-4 w-4 text-purple-600" />)
              }
              {report.automated_metrics.specificity !== undefined && 
                renderMetricScore('Specificity', report.automated_metrics.specificity, <TrendingUp className="h-4 w-4 text-orange-600" />)
              }
            </div>
          </div>
        )}

        {/* NLP Analysis */}
        {report.nlp_analysis && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">AI Language Analysis</h4>
            <div className="space-y-2">
              {report.nlp_analysis.constructiveness_score !== undefined && 
                renderMetricScore('Constructiveness', report.nlp_analysis.constructiveness_score, <MessageSquare className="h-4 w-4 text-green-600" />)
              }
              {report.nlp_analysis.clarity !== undefined && 
                renderMetricScore('Clarity', report.nlp_analysis.clarity, <Star className="h-4 w-4 text-blue-600" />)
              }
              {report.nlp_analysis.professionalism !== undefined && 
                renderMetricScore('Professionalism', report.nlp_analysis.professionalism, <CheckCircle className="h-4 w-4 text-purple-600" />)
              }
              
              {report.nlp_analysis.sentiment && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
                  <Badge variant="outline" className={
                    report.nlp_analysis.sentiment === 'positive' ? 'border-green-300 text-green-800' :
                    report.nlp_analysis.sentiment === 'negative' ? 'border-red-300 text-red-800' :
                    'border-gray-300 text-gray-800'
                  }>
                    {report.nlp_analysis.sentiment}
                  </Badge>
                </div>
              )}

              {report.nlp_analysis.bias_indicators && report.nlp_analysis.bias_indicators.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Bias Indicators Detected</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {report.nlp_analysis.bias_indicators.map((indicator, index) => (
                      <Badge key={index} variant="outline" className="border-red-300 text-red-800 bg-red-100 text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consistency Metrics */}
        {report.consistency_metrics && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Consistency Analysis</h4>
            <div className="space-y-2">
              {report.consistency_metrics.recommendation_alignment !== undefined && 
                renderMetricScore('Recommendation Alignment', report.consistency_metrics.recommendation_alignment, <TrendingUp className="h-4 w-4 text-green-600" />)
              }
              {report.consistency_metrics.internal_consistency !== undefined && 
                renderMetricScore('Internal Consistency', report.consistency_metrics.internal_consistency, <CheckCircle className="h-4 w-4 text-blue-600" />)
              }
            </div>
          </div>
        )}

        {/* Editor Feedback Section */}
        {isEditor && (
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Editor Feedback</h4>
            
            {report.editor_rating ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= report.editor_rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                {report.editor_notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{report.editor_notes}</p>
                  </div>
                )}
                {report.editor_reviewed_at && (
                  <p className="text-xs text-gray-500">
                    Reviewed {formatDistanceToNow(new Date(report.editor_reviewed_at))} ago
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {!showFeedbackForm ? (
                  <Button 
                    onClick={() => setShowFeedbackForm(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Editor Feedback
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Rating (1-5 stars)
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`h-6 w-6 cursor-pointer transition-colors ${
                              star <= editorRating ? 'text-yellow-500 fill-current' : 'text-gray-300 hover:text-yellow-300'
                            }`}
                            onClick={() => setEditorRating(star)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Additional Notes (Optional)
                      </label>
                      <Textarea
                        value={editorNotes}
                        onChange={(e) => setEditorNotes(e.target.value)}
                        placeholder="Add specific feedback or observations..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleSubmitFeedback}
                        disabled={editorRating === 0}
                        className="flex-1"
                      >
                        Submit Feedback
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowFeedbackForm(false);
                          setEditorRating(0);
                          setEditorNotes('');
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}