'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Lightbulb, FileText } from 'lucide-react'

// Common academic keywords for suggestions
const SUGGESTED_KEYWORDS = [
  'machine learning', 'artificial intelligence', 'deep learning', 'neural networks',
  'data analysis', 'statistical analysis', 'molecular biology', 'cell biology',
  'clinical trial', 'systematic review', 'meta-analysis', 'case study',
  'experimental design', 'computational biology', 'bioinformatics', 'genomics',
  'proteomics', 'biochemistry', 'organic chemistry', 'materials science',
  'nanotechnology', 'quantum mechanics', 'astrophysics', 'climate change',
  'environmental science', 'sustainability', 'renewable energy', 'biotechnology'
]

export default function TitleAndAbstractStep() {
  const { register, watch, setValue, formState: { errors } } = useFormContext()
  const [keywordInput, setKeywordInput] = useState('')
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false)
  
  const title = watch('title') || ''
  const abstract = watch('abstract') || ''
  const keywords = watch('keywords') || []

  const titleCharCount = title.length
  const abstractWordCount = abstract.split(/\s+/).filter(word => word.length > 0).length
  const abstractCharCount = abstract.length

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !keywords.includes(keyword.trim()) && keywords.length < 10) {
      setValue('keywords', [...keywords, keyword.trim()], { shouldValidate: true })
      setKeywordInput('')
      setShowKeywordSuggestions(false)
    }
  }

  const removeKeyword = (indexToRemove: number) => {
    setValue('keywords', keywords.filter((_, index) => index !== indexToRemove), { shouldValidate: true })
  }

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword(keywordInput)
    } else if (e.key === ',') {
      e.preventDefault()
      addKeyword(keywordInput)
    }
  }

  const filteredSuggestions = SUGGESTED_KEYWORDS.filter(
    keyword => 
      keyword.toLowerCase().includes(keywordInput.toLowerCase()) &&
      !keywords.includes(keyword) &&
      keywordInput.length > 1
  ).slice(0, 8)

  return (
    <div className="space-y-8">
      {/* Title Section */}
      <div>
        <Label htmlFor="title" className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Manuscript Title *
        </Label>
        <div className="space-y-2">
          <Input
            id="title"
            {...register('title')}
            placeholder="Enter your manuscript title..."
            className="text-lg p-4"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>Be specific and descriptive. Avoid abbreviations and jargon.</span>
            <span className={titleCharCount > 250 ? 'text-red-500' : ''}>
              {titleCharCount}/300 characters
            </span>
          </div>
        </div>
        {errors.title && (
          <p className="text-red-600 text-sm mt-2">{errors.title.message as string}</p>
        )}
      </div>

      {/* Abstract Section */}
      <div>
        <Label htmlFor="abstract" className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Abstract *
        </Label>
        <div className="space-y-2">
          <Textarea
            id="abstract"
            {...register('abstract')}
            placeholder="Enter your manuscript abstract. Include background, methods, results, and conclusions..."
            rows={12}
            className="text-base leading-relaxed"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{abstractWordCount} words</span>
            <span className={abstractCharCount > 2800 ? 'text-red-500' : ''}>
              {abstractCharCount}/3000 characters
            </span>
          </div>
        </div>
        {errors.abstract && (
          <p className="text-red-600 text-sm mt-2">{errors.abstract.message as string}</p>
        )}
        
        {/* Abstract Guidelines */}
        <Card className="p-4 bg-amber-50 border-amber-200 mt-4">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-amber-100 rounded-full">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-amber-900">Abstract Guidelines</h4>
              <ul className="text-sm text-amber-800 mt-1 space-y-1">
                <li>• <strong>Background:</strong> Context and rationale for the study</li>
                <li>• <strong>Methods:</strong> Brief description of methodology</li>
                <li>• <strong>Results:</strong> Key findings and outcomes</li>
                <li>• <strong>Conclusions:</strong> Implications and significance</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Keywords Section */}
      <div>
        <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Keywords * (3-10 keywords)
        </Label>
        
        {/* Current Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Keyword Input */}
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => {
                setKeywordInput(e.target.value)
                setShowKeywordSuggestions(e.target.value.length > 1)
              }}
              onKeyDown={handleKeywordInputKeyPress}
              placeholder="Type keywords and press Enter or comma to add..."
              disabled={keywords.length >= 10}
            />
            <Button
              type="button"
              onClick={() => addKeyword(keywordInput)}
              disabled={!keywordInput.trim() || keywords.length >= 10}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Keyword Suggestions */}
          {showKeywordSuggestions && filteredSuggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-10 mt-1 p-2 shadow-lg">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <Lightbulb className="w-4 h-4" />
                Suggested keywords:
              </div>
              <div className="flex flex-wrap gap-1">
                {filteredSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addKeyword(suggestion)}
                    className="text-xs h-auto p-1 hover:bg-gray-100"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="text-sm text-gray-500 mt-2">
          {keywords.length}/10 keywords • Use specific terms that researchers would search for
        </div>
        
        {errors.keywords && (
          <p className="text-red-600 text-sm mt-2">{errors.keywords.message as string}</p>
        )}
      </div>

      {/* Help Section */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-green-100 rounded-full">
            <Lightbulb className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-green-900">Writing Tips</h4>
            <ul className="text-sm text-green-800 mt-1 space-y-1">
              <li>• Write a clear, informative title that captures the essence of your work</li>
              <li>• Structure your abstract to tell a complete story in 150-300 words</li>
              <li>• Choose keywords that researchers in your field would use to find your work</li>
              <li>• Avoid abbreviations and jargon in both title and abstract</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}