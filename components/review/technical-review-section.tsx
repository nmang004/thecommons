'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  Database, 
  Code2, 
  BarChart3, 
  ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  GitBranch,
  Microscope,
  TrendingUp,
  Plus,
  Trash2,
  Eye
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useReviewFormStore } from '@/lib/stores/review-form-store'
import type { StatisticalReview, DataReview, CodeReview, FigureReview } from '@/types/review'

interface TechnicalReviewSectionProps {
  className?: string
}

const FIGURE_QUALITY_OPTIONS = [
  { value: 'poor', label: 'Poor', description: 'Significant issues with quality or presentation' },
  { value: 'fair', label: 'Fair', description: 'Some issues but generally acceptable' },
  { value: 'good', label: 'Good', description: 'Well-presented with minor issues' },
  { value: 'excellent', label: 'Excellent', description: 'Outstanding quality and presentation' }
] as const

const RELEVANCE_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Not directly relevant to main findings' },
  { value: 'medium', label: 'Medium', description: 'Somewhat relevant, could be improved' },
  { value: 'high', label: 'High', description: 'Highly relevant and well-integrated' }
] as const

const CODE_LANGUAGES = [
  'Python', 'R', 'MATLAB', 'JavaScript', 'Julia', 'Java', 'C++', 'C', 
  'Scala', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'
]

const DATA_FORMATS = [
  'CSV', 'JSON', 'XML', 'Excel', 'HDF5', 'NetCDF', 'Parquet', 'SQL Database', 'Other'
]

export function TechnicalReviewSection({ className }: TechnicalReviewSectionProps) {
  const { form, updateSection, validationErrors } = useReviewFormStore()
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['statistics']))
  const [newFigure, setNewFigure] = useState({
    figureNumber: '',
    quality: 'good' as const,
    clarity: 'good' as const,
    relevance: 'high' as const,
    suggestions: ''
  })

  if (!form) return null

  const technicalReview = form.sections.technicalReview || {}
  const sectionErrors = validationErrors.technicalReview || []

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Calculate completion percentage
  const calculateCompletion = () => {
    const sections = [
      technicalReview.statistics,
      technicalReview.dataAvailability,
      technicalReview.codeReproducibility,
      technicalReview.methodology,
      technicalReview.figuresAndTables?.length > 0
    ]
    
    const completedSections = sections.filter(Boolean).length
    return Math.round((completedSections / sections.length) * 100)
  }

  const completion = calculateCompletion()

  // Update functions
  const updateStatistics = (updates: Partial<StatisticalReview>) => {
    updateSection('technicalReview', {
      ...technicalReview,
      statistics: {
        ...technicalReview.statistics,
        ...updates
      }
    })
  }

  const updateDataReview = (updates: Partial<DataReview>) => {
    updateSection('technicalReview', {
      ...technicalReview,
      dataAvailability: {
        ...technicalReview.dataAvailability,
        ...updates
      }
    })
  }

  const updateCodeReview = (updates: Partial<CodeReview>) => {
    updateSection('technicalReview', {
      ...technicalReview,
      codeReproducibility: {
        ...technicalReview.codeReproducibility,
        ...updates
      }
    })
  }

  const updateMethodology = (updates: any) => {
    updateSection('technicalReview', {
      ...technicalReview,
      methodology: {
        ...technicalReview.methodology,
        ...updates
      }
    })
  }

  const addFigureReview = () => {
    if (!newFigure.figureNumber.trim()) return
    
    const figureReview: FigureReview = {
      ...newFigure,
      figureNumber: newFigure.figureNumber.trim()
    }
    
    const currentFigures = technicalReview.figuresAndTables || []
    updateSection('technicalReview', {
      ...technicalReview,
      figuresAndTables: [...currentFigures, figureReview]
    })
    
    setNewFigure({
      figureNumber: '',
      quality: 'good',
      clarity: 'good', 
      relevance: 'high',
      suggestions: ''
    })
  }

  const removeFigureReview = (index: number) => {
    const currentFigures = technicalReview.figuresAndTables || []
    updateSection('technicalReview', {
      ...technicalReview,
      figuresAndTables: currentFigures.filter((_, i) => i !== index)
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Technical Review
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Evaluate technical aspects including statistics, data, and reproducibility
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Completion</div>
              <div className="text-lg font-semibold">{completion}%</div>
            </div>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            This section is optional but recommended for manuscripts with significant technical components.
          </p>
        </div>
      </div>

      {/* Statistical Review */}
      <Collapsible open={expandedSections.has('statistics')} onOpenChange={() => toggleSection('statistics')}>
        <Card>
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Statistical Analysis
                    </h3>
                    <p className="text-sm text-gray-600">
                      Review statistical methods and validity
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {technicalReview.statistics && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('statistics') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Statistical Checks */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Statistical Validity Checks</Label>
                  
                  {[
                    { key: 'appropriateMethods', label: 'Methods are appropriate for the data and research question' },
                    { key: 'sampleSizeAdequate', label: 'Sample size is adequate for the analysis' },
                    { key: 'statisticalSignificance', label: 'Statistical significance is properly reported' },
                    { key: 'effectSizeReported', label: 'Effect sizes are reported where appropriate' },
                    { key: 'confidenceIntervalsReported', label: 'Confidence intervals are provided' },
                    { key: 'multipleTestingAccounted', label: 'Multiple testing corrections applied when needed' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        checked={technicalReview.statistics?.[key as keyof StatisticalReview] as boolean || false}
                        onCheckedChange={(checked) => 
                          updateStatistics({ [key]: checked })
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                
                {/* Comments */}
                <div className="space-y-2">
                  <Label htmlFor="stats-comments" className="text-sm font-medium">
                    Statistical Review Comments
                  </Label>
                  <Textarea
                    id="stats-comments"
                    value={technicalReview.statistics?.comments || ''}
                    onChange={(e) => updateStatistics({ comments: e.target.value })}
                    placeholder="Comment on statistical methods, assumptions, and validity..."
                    rows={8}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Data Availability */}
      <Collapsible open={expandedSections.has('data')} onOpenChange={() => toggleSection('data')}>
        <Card>
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Data Availability
                    </h3>
                    <p className="text-sm text-gray-600">
                      Assess data sharing and reproducibility
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {technicalReview.dataAvailability && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('data') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={technicalReview.dataAvailability?.dataAvailable || false}
                      onCheckedChange={(checked) => 
                        updateDataReview({ dataAvailable: checked as boolean })
                      }
                    />
                    <Label>Data is available for review/replication</Label>
                  </div>
                  
                  {technicalReview.dataAvailability?.dataAvailable && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="data-location">Data Location/Repository</Label>
                        <Input
                          id="data-location"
                          value={technicalReview.dataAvailability?.dataLocation || ''}
                          onChange={(e) => updateDataReview({ dataLocation: e.target.value })}
                          placeholder="e.g., GitHub, Zenodo, institutional repository"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="data-format">Data Format</Label>
                        <Select
                          value={technicalReview.dataAvailability?.dataFormat || ''}
                          onValueChange={(value) => updateDataReview({ dataFormat: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select data format" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_FORMATS.map(format => (
                              <SelectItem key={format} value={format}>
                                {format}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="access-restrictions">Access Restrictions</Label>
                        <Textarea
                          id="access-restrictions"
                          value={technicalReview.dataAvailability?.accessRestrictions || ''}
                          onChange={(e) => updateDataReview({ accessRestrictions: e.target.value })}
                          placeholder="Describe any restrictions on data access..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={technicalReview.dataAvailability?.reproducible || false}
                          onCheckedChange={(checked) => 
                            updateDataReview({ reproducible: checked as boolean })
                          }
                        />
                        <Label>Results are reproducible from available data</Label>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-comments">Data Availability Comments</Label>
                  <Textarea
                    id="data-comments"
                    value={technicalReview.dataAvailability?.comments || ''}
                    onChange={(e) => updateDataReview({ comments: e.target.value })}
                    placeholder="Comment on data quality, accessibility, and reproducibility..."
                    rows={8}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Code Reproducibility */}
      <Collapsible open={expandedSections.has('code')} onOpenChange={() => toggleSection('code')}>
        <Card>
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Code2 className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Code & Reproducibility
                    </h3>
                    <p className="text-sm text-gray-600">
                      Review computational reproducibility
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {technicalReview.codeReproducibility && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('code') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={technicalReview.codeReproducibility?.codeAvailable || false}
                      onCheckedChange={(checked) => 
                        updateCodeReview({ codeAvailable: checked as boolean })
                      }
                    />
                    <Label>Source code is available</Label>
                  </div>
                  
                  {technicalReview.codeReproducibility?.codeAvailable && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="code-location">Code Location/Repository</Label>
                        <Input
                          id="code-location"
                          value={technicalReview.codeReproducibility?.codeLocation || ''}
                          onChange={(e) => updateCodeReview({ codeLocation: e.target.value })}
                          placeholder="e.g., GitHub, GitLab, institutional repository"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="code-language">Programming Language</Label>
                        <Select
                          value={technicalReview.codeReproducibility?.language || ''}
                          onValueChange={(value) => updateCodeReview({ language: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select programming language" />
                          </SelectTrigger>
                          <SelectContent>
                            {CODE_LANGUAGES.map(lang => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="documentation">Documentation Quality</Label>
                        <Select
                          value={technicalReview.codeReproducibility?.documentation || ''}
                          onValueChange={(value: 'none' | 'minimal' | 'adequate' | 'comprehensive') => 
                            updateCodeReview({ documentation: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select documentation quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="adequate">Adequate</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={technicalReview.codeReproducibility?.reproducible || false}
                          onCheckedChange={(checked) => 
                            updateCodeReview({ reproducible: checked as boolean })
                          }
                        />
                        <Label>Code successfully reproduces results</Label>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code-comments">Code Review Comments</Label>
                  <Textarea
                    id="code-comments"
                    value={technicalReview.codeReproducibility?.comments || ''}
                    onChange={(e) => updateCodeReview({ comments: e.target.value })}
                    placeholder="Comment on code quality, documentation, and reproducibility..."
                    rows={8}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Methodology Review */}
      <Collapsible open={expandedSections.has('methodology')} onOpenChange={() => toggleSection('methodology')}>
        <Card>
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Microscope className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Methodology Assessment
                    </h3>
                    <p className="text-sm text-gray-600">
                      Evaluate methodological rigor and appropriateness
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {technicalReview.methodology && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('methodology') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={technicalReview.methodology?.appropriate || false}
                      onCheckedChange={(checked) => 
                        updateMethodology({ appropriate: checked })
                      }
                    />
                    <Label>Methods are appropriate for the research question</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={technicalReview.methodology?.rigorous || false}
                      onCheckedChange={(checked) => 
                        updateMethodology({ rigorous: checked })
                      }
                    />
                    <Label>Methods are rigorously applied</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="limitations">Methodological Limitations</Label>
                    <Textarea
                      id="limitations"
                      value={technicalReview.methodology?.limitations || ''}
                      onChange={(e) => updateMethodology({ limitations: e.target.value })}
                      placeholder="Describe any methodological limitations..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="methodology-suggestions">Suggestions for Improvement</Label>
                  <Textarea
                    id="methodology-suggestions"
                    value={technicalReview.methodology?.suggestions || ''}
                    onChange={(e) => updateMethodology({ suggestions: e.target.value })}
                    placeholder="Suggest improvements to methodology..."
                    rows={6}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Figures and Tables */}
      <Collapsible open={expandedSections.has('figures')} onOpenChange={() => toggleSection('figures')}>
        <Card>
          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ImageIcon className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Figures & Tables
                    </h3>
                    <p className="text-sm text-gray-600">
                      Review visual elements and their effectiveness
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {technicalReview.figuresAndTables && technicalReview.figuresAndTables.length > 0 && (
                    <Badge variant="secondary">
                      {technicalReview.figuresAndTables.length} reviewed
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    {expandedSections.has('figures') ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-6 border-t border-gray-200">
              {/* Add New Figure Review */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">Add Figure/Table Review</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="figure-number">Figure/Table Number</Label>
                    <Input
                      id="figure-number"
                      value={newFigure.figureNumber}
                      onChange={(e) => setNewFigure(prev => ({ ...prev, figureNumber: e.target.value }))}
                      placeholder="e.g., Figure 1, Table 2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select
                      value={newFigure.quality}
                      onValueChange={(value: typeof newFigure.quality) => 
                        setNewFigure(prev => ({ ...prev, quality: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIGURE_QUALITY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Clarity</Label>
                    <Select
                      value={newFigure.clarity}
                      onValueChange={(value: typeof newFigure.clarity) => 
                        setNewFigure(prev => ({ ...prev, clarity: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIGURE_QUALITY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Relevance</Label>
                    <Select
                      value={newFigure.relevance}
                      onValueChange={(value: typeof newFigure.relevance) => 
                        setNewFigure(prev => ({ ...prev, relevance: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELEVANCE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor="figure-suggestions">Suggestions for Improvement</Label>
                  <Textarea
                    id="figure-suggestions"
                    value={newFigure.suggestions}
                    onChange={(e) => setNewFigure(prev => ({ ...prev, suggestions: e.target.value }))}
                    placeholder="Provide specific suggestions for improving this figure or table..."
                    rows={2}
                  />
                </div>
                
                <div className="mt-4">
                  <Button onClick={addFigureReview} disabled={!newFigure.figureNumber.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Review
                  </Button>
                </div>
              </div>
              
              {/* Existing Figure Reviews */}
              {technicalReview.figuresAndTables && technicalReview.figuresAndTables.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Figure/Table Reviews</h4>
                  
                  {technicalReview.figuresAndTables.map((figure, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">
                            {figure.figureNumber}
                          </h5>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFigureReview(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Quality:</span>
                            <Badge variant="outline" className="capitalize">
                              {figure.quality}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Clarity:</span>
                            <Badge variant="outline" className="capitalize">
                              {figure.clarity}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Relevance:</span>
                            <Badge variant="outline" className="capitalize">
                              {figure.relevance}
                            </Badge>
                          </div>
                        </div>
                        
                        {figure.suggestions && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {figure.suggestions}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Summary */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Technical Review Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {completion}%
              </div>
              <div className="text-xs text-gray-600">
                Complete
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {technicalReview.statistics ? '✓' : '-'}
              </div>
              <div className="text-xs text-gray-600">
                Statistics
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {technicalReview.dataAvailability ? '✓' : '-'}
              </div>
              <div className="text-xs text-gray-600">
                Data
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {technicalReview.codeReproducibility ? '✓' : '-'}
              </div>
              <div className="text-xs text-gray-600">
                Code
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-indigo-600">
                {technicalReview.figuresAndTables?.length || 0}
              </div>
              <div className="text-xs text-gray-600">
                Figures
              </div>
            </div>
          </div>
          
          {completion === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">
                  Technical review section completed!
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}