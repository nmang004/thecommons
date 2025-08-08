'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Star,
  HelpCircle
} from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useReviewFormStore } from '@/lib/stores/review-form-store'
import type { ScoreWithComments, QualityAspect } from '@/types/review'

interface QualityAssessmentSectionProps {
  className?: string
}

const SCORE_LABELS = [
  'Poor',
  'Fair', 
  'Good',
  'Very Good',
  'Excellent'
]

const SCORE_DESCRIPTIONS = {
  originality: {
    1: 'No novelty; entirely derivative work',
    2: 'Minor novelty; mostly existing approaches',
    3: 'Some novel elements; reasonable contribution',
    4: 'Clear novelty; significant new insights',
    5: 'Highly original; groundbreaking contribution'
  },
  significance: {
    1: 'Minimal impact; narrow applicability',
    2: 'Limited impact; specialized interest',
    3: 'Moderate impact; useful contribution',
    4: 'High impact; advances the field',
    5: 'Major impact; transformative work'
  },
  methodology: {
    1: 'Flawed methodology; unreliable results',
    2: 'Questionable methods; limited validity',
    3: 'Sound methodology; appropriate approach',
    4: 'Rigorous methods; well-executed',
    5: 'Exemplary methodology; gold standard'
  },
  clarity: {
    1: 'Very unclear; difficult to follow',
    2: 'Somewhat unclear; confusing sections',
    3: 'Generally clear; minor issues',
    4: 'Clear and well-organized',
    5: 'Exceptionally clear; excellent writing'
  },
  references: {
    1: 'Inadequate; missing key references',
    2: 'Limited coverage; some gaps',
    3: 'Adequate coverage; appropriate citations',
    4: 'Comprehensive; well-contextualized',
    5: 'Excellent; complete and current'
  },
  ethics: {
    1: 'Serious ethical concerns',
    2: 'Some ethical issues to address',
    3: 'Adequate ethical consideration',
    4: 'Good ethical framework',
    5: 'Exemplary ethical standards'
  },
  reproducibility: {
    1: 'Not reproducible; insufficient details',
    2: 'Difficult to reproduce; missing information',
    3: 'Reproducible with effort',
    4: 'Easily reproducible; good documentation',
    5: 'Fully reproducible; excellent resources'
  }
}

const DEFAULT_ASPECTS: Record<QualityAspect, { weight: number; required: boolean; description: string }> = {
  originality: { 
    weight: 20, 
    required: true, 
    description: 'How novel and original is this research contribution?' 
  },
  significance: { 
    weight: 25, 
    required: true, 
    description: 'What is the potential impact and importance of this work?' 
  },
  methodology: { 
    weight: 20, 
    required: true, 
    description: 'Are the methods appropriate, rigorous, and well-executed?' 
  },
  clarity: { 
    weight: 20, 
    required: true, 
    description: 'Is the manuscript clearly written and well-organized?' 
  },
  references: { 
    weight: 15, 
    required: true, 
    description: 'Is the literature review comprehensive and appropriate?' 
  },
  ethics: { 
    weight: 0, 
    required: false, 
    description: 'Are ethical standards adequately addressed?' 
  },
  reproducibility: { 
    weight: 0, 
    required: false, 
    description: 'Can the work be reproduced based on the information provided?' 
  },
}

export function QualityAssessmentSection({ className }: QualityAssessmentSectionProps) {
  const { 
    form, 
    template, 
    updateSection, 
    validationErrors 
  } = useReviewFormStore()

  const [expandedAspect, setExpandedAspect] = useState<QualityAspect | null>(null)

  if (!form) return null

  const qualityAssessment = form.sections.qualityAssessment
  const sectionErrors = validationErrors.qualityAssessment || []

  // Get aspects configuration from template or use defaults
  const aspectsConfig = template?.templateData?.sections?.qualityAssessment || DEFAULT_ASPECTS
  const aspects = Object.keys(aspectsConfig) as QualityAspect[]

  const updateAspect = (aspect: QualityAspect, updates: Partial<ScoreWithComments>) => {
    const currentAspect = qualityAssessment[aspect]
    updateSection('qualityAssessment', {
      ...qualityAssessment,
      [aspect]: {
        ...currentAspect,
        ...updates,
      }
    })
  }

  // Calculate weighted score
  const calculateWeightedScore = () => {
    let totalWeight = 0
    let weightedSum = 0
    
    aspects.forEach(aspect => {
      const config = aspectsConfig[aspect]
      const assessment = qualityAssessment[aspect]
      
      if (config.weight > 0 && (assessment?.score || 0) > 0) {
        totalWeight += config.weight
        weightedSum += (assessment?.score || 0) * config.weight
      }
    })
    
    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0
  }

  // Calculate completion percentage
  const calculateCompletion = () => {
    const requiredAspects = aspects.filter(aspect => aspectsConfig[aspect].required)
    const completedAspects = requiredAspects.filter(aspect => {
      const assessment = qualityAssessment[aspect]
      return (assessment?.score || 0) > 0 && (assessment?.comments || '').trim().length > 0
    })
    
    return requiredAspects.length > 0 ? Math.round((completedAspects.length / requiredAspects.length) * 100) : 0
  }

  const completion = calculateCompletion()
  const weightedScore = calculateWeightedScore()

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Section Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Quality Assessment
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Evaluate the manuscript across key quality dimensions
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Completion</div>
                <div className="text-lg font-semibold">{completion}%</div>
              </div>
              
              {weightedScore > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Weighted Score</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {weightedScore}/5.0
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Progress value={completion} className="h-2" />
          
          {sectionErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    Please address the following issues:
                  </h4>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {sectionErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quality Aspects */}
        <div className="space-y-4">
          {aspects.map((aspect) => {
            const config = aspectsConfig[aspect]
            const assessment = qualityAssessment[aspect]
            const isExpanded = expandedAspect === aspect
            const isComplete = (assessment?.score || 0) > 0 && (assessment?.comments || '').trim().length > 0
            
            return (
              <Card key={aspect} className={`p-6 ${isComplete ? 'ring-2 ring-green-200' : ''}`}>
                <div className="space-y-4">
                  {/* Aspect Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {isComplete ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                        
                        <h3 className="text-lg font-medium text-gray-900 capitalize">
                          {aspect.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        
                        {config.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                        
                        {config.weight > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Weight: {config.weight}%
                          </Badge>
                        )}
                      </div>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{config.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    {(assessment?.score || 0) > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: (assessment?.score || 0) }, (_, i) => (
                            <Star 
                              key={i} 
                              className="w-4 h-4 fill-yellow-400 text-yellow-400" 
                            />
                          ))}
                          {Array.from({ length: 5 - (assessment?.score || 0) }, (_, i) => (
                            <Star 
                              key={i + (assessment?.score || 0)} 
                              className="w-4 h-4 text-gray-300" 
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {SCORE_LABELS[(assessment?.score || 0) - 1]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score Slider */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Score ({SCORE_LABELS[(assessment?.score || 0) - 1] || 'Not rated'})
                    </Label>
                    
                    <div className="px-3">
                      <Slider
                        value={[(assessment?.score || 0)]}
                        onValueChange={([value]) => updateAspect(aspect, { score: value })}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        {SCORE_LABELS.map((_, index) => (
                          <span key={index}>{index + 1}</span>
                        ))}
                      </div>
                    </div>
                    
                    {(assessment?.score || 0) > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                          <Info className="w-4 h-4 inline mr-1" />
                          {(SCORE_DESCRIPTIONS as any)[aspect]?.[(assessment?.score || 0)] || 'No description available'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${aspect}-comments`} className="text-sm font-medium">
                        Comments {config.required && <span className="text-red-500">*</span>}
                      </Label>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedAspect(isExpanded ? null : aspect)}
                        className="text-xs"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                    
                    <Textarea
                      id={`${aspect}-comments`}
                      value={(assessment?.comments || '')}
                      onChange={(e) => updateAspect(aspect, { comments: e.target.value })}
                      placeholder={`Provide detailed feedback on ${aspect.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}...`}
                      rows={isExpanded ? 6 : 3}
                      className="min-h-[80px]"
                    />
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {(assessment?.comments || '').length} characters
                      </span>
                      {(assessment?.comments || '').length > 0 && (assessment?.comments || '').length < 50 && (
                        <span className="text-amber-600">
                          Consider providing more detailed feedback
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Summary Card */}
        <Card className="p-6 bg-gray-50 border-gray-200">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Assessment Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {completion}%
                </div>
                <div className="text-sm text-gray-600">
                  Complete
                </div>
              </div>
              
              {weightedScore > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {weightedScore}/5.0
                  </div>
                  <div className="text-sm text-gray-600">
                    Weighted Score
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {aspects.filter(a => (qualityAssessment[a]?.score || 0) > 0).length}/{aspects.length}
                </div>
                <div className="text-sm text-gray-600">
                  Aspects Rated
                </div>
              </div>
            </div>
            
            {completion === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-800">
                    Quality assessment section completed!
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  )
}