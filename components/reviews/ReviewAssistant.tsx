'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Wand2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';
import { AssistanceResponse, AssistanceSuggestion, BiasWarning } from '@/lib/types/quality';

interface ReviewAssistantProps {
  reviewId: string;
  section: string;
  currentText: string;
  onTextChange?: (text: string) => void;
  assistanceLevel?: 'minimal' | 'standard' | 'comprehensive';
}

export default function ReviewAssistant({
  reviewId,
  section,
  currentText,
  onTextChange,
  assistanceLevel = 'standard'
}: ReviewAssistantProps) {
  const [suggestions, setSuggestions] = useState<AssistanceSuggestion[]>([]);
  const [warnings, setWarnings] = useState<BiasWarning[]>([]);
  const [completenessScore, setCompletenessScore] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');
  const [estimatedImpact, setEstimatedImpact] = useState<number>(0);

  // Debounced analysis
  const analyzeText = useCallback(
    debounce(async (text: string) => {
      if (text.length < 20 || text === lastAnalyzedText) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/reviews/assistance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            review_id: reviewId,
            section,
            current_text: text,
            assistance_type: 'all'
          })
        });

        if (!response.ok) throw new Error('Failed to analyze text');

        const data: AssistanceResponse = await response.json();
        setSuggestions(data.suggestions);
        setWarnings(data.warnings);
        setCompletenessScore(data.completeness_score);
        setEstimatedImpact(data.estimated_quality_impact);
        setLastAnalyzedText(text);
      } catch (error) {
        console.error('Error analyzing text:', error);
      } finally {
        setLoading(false);
      }
    }, 2000),
    [reviewId, section, lastAnalyzedText]
  );

  useEffect(() => {
    if (currentText && assistanceLevel !== 'minimal') {
      analyzeText(currentText);
    }
  }, [currentText, analyzeText, assistanceLevel]);

  const handleAcceptSuggestion = async (suggestionIndex: number) => {
    const suggestion = suggestions[suggestionIndex];
    if (!onTextChange) return;

    // Apply the suggestion
    const newText = currentText.replace(suggestion.original_text, suggestion.suggested_text);
    onTextChange(newText);

    // Send feedback
    await fetch('/api/reviews/assistance/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_id: reviewId,
        suggestion_type: suggestion.type,
        suggestion_id: suggestionIndex,
        accepted: true,
        final_text: newText
      })
    });

    // Remove suggestion
    setSuggestions(prev => prev.filter((_, index) => index !== suggestionIndex));
  };

  const handleRejectSuggestion = async (suggestionIndex: number, feedback?: string) => {
    const suggestion = suggestions[suggestionIndex];

    // Send feedback
    await fetch('/api/reviews/assistance/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_id: reviewId,
        suggestion_type: suggestion.type,
        suggestion_id: suggestionIndex,
        accepted: false,
        feedback_text: feedback
      })
    });

    // Remove suggestion
    setSuggestions(prev => prev.filter((_, index) => index !== suggestionIndex));
  };

  const handleAddressWarning = (warningIndex: number) => {
    setWarnings(prev => prev.map((warning, index) => 
      index === warningIndex ? { ...warning, addressed: true } : warning
    ));
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'completeness':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'tone':
        return <Wand2 className="h-4 w-4 text-purple-600" />;
      case 'clarity':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getWarningSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-300 bg-red-50 text-red-800';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 text-yellow-800';
      default:
        return 'border-blue-300 bg-blue-50 text-blue-800';
    }
  };

  if (assistanceLevel === 'minimal') {
    return (
      <div className="text-sm text-gray-500 p-2">
        AI assistance is set to minimal. Enable standard or comprehensive assistance for suggestions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quality Overview */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                completenessScore >= 0.8 ? 'bg-green-500' :
                completenessScore >= 0.6 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                Section Completeness: {Math.round(completenessScore * 100)}%
              </span>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            
            {estimatedImpact > 0 && (
              <Badge variant="outline" className="text-green-700 border-green-300">
                +{Math.round(estimatedImpact * 100)}% potential improvement
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bias Warnings */}
      {warnings.filter(w => !w.addressed).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Bias Detection Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warnings.filter(w => !w.addressed).map((warning, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${getWarningSeverityColor(warning.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      {warning.type.replace(/_/g, ' ').toUpperCase()} bias detected
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Found:</strong> "{warning.detected_text}"
                    </p>
                    <p className="text-sm">
                      <strong>Suggestion:</strong> {warning.suggestion}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddressWarning(index)}
                    className="ml-3"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Lightbulb className="h-5 w-5" />
              <span>AI Suggestions</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Review these suggestions to improve your review quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {suggestion.reason}
                      </span>
                    </div>
                    
                    {suggestion.suggested_text !== suggestion.original_text && (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-red-700">Original:</span>
                          <p className="bg-red-50 p-2 rounded border-l-4 border-red-200 mt-1">
                            {suggestion.original_text}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Suggested:</span>
                          <p className="bg-green-50 p-2 rounded border-l-4 border-green-200 mt-1">
                            {suggestion.suggested_text}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptSuggestion(index)}
                        className="flex items-center space-x-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectSuggestion(index)}
                        className="flex items-center space-x-1"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No suggestions state */}
      {!loading && suggestions.length === 0 && warnings.length === 0 && currentText.length > 20 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-800 font-medium">
              Great work! No immediate suggestions for this section.
            </p>
            <p className="text-xs text-green-700 mt-1">
              Your writing appears clear and well-structured.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}