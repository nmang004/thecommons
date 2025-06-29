'use client'

import React from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Trash2, 
  Mail, 
  User, 
 
  AlertTriangle,
  DollarSign,
  Database,
  Info
} from 'lucide-react'

export default function AdditionalInfoStep() {
  const { register, control, watch, formState: { errors } } = useFormContext()
  
  // Suggested Reviewers
  const { fields: suggestedReviewers, append: appendSuggested, remove: removeSuggested } = useFieldArray({
    control,
    name: 'suggestedReviewers'
  })

  // Excluded Reviewers
  const { fields: excludedReviewers, append: appendExcluded, remove: removeExcluded } = useFieldArray({
    control,
    name: 'excludedReviewers'
  })

  const coverLetter = watch('coverLetter') || ''
  const fundingStatement = watch('fundingStatement') || ''
  const conflictOfInterest = watch('conflictOfInterest') || ''
  const dataAvailability = watch('dataAvailability') || ''

  const addSuggestedReviewer = () => {
    appendSuggested({
      name: '',
      email: '',
      affiliation: '',
      expertise: '',
    })
  }

  const addExcludedReviewer = () => {
    appendExcluded({
      name: '',
      reason: '',
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Additional Information
        </Label>
        <p className="text-gray-600 mb-6">
          Provide additional context to help editors and reviewers evaluate your manuscript.
        </p>
      </div>

      {/* Cover Letter */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Label htmlFor="coverLetter" className="text-base font-medium text-gray-900">
              Cover Letter (Optional)
            </Label>
            <p className="text-sm text-gray-600">
              Address the editor and highlight the significance of your work
            </p>
          </div>
        </div>
        
        <Textarea
          id="coverLetter"
          {...register('coverLetter')}
          placeholder="Dear Editor,&#10;&#10;We are submitting our manuscript titled [title] for consideration for publication in The Commons...&#10;&#10;This work makes significant contributions to the field by...&#10;&#10;We believe this manuscript is suitable for your journal because...&#10;&#10;Thank you for your consideration.&#10;&#10;Sincerely,&#10;[Your name]"
          rows={12}
          className="text-sm"
        />
        
        <div className="text-sm text-gray-500 mt-2">
          {coverLetter.split(/\s+/).filter(word => word.length > 0).length} words
        </div>
      </Card>

      {/* Suggested Reviewers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <Label className="text-base font-medium text-gray-900">
                Suggested Reviewers (Optional)
              </Label>
              <p className="text-sm text-gray-600">
                Suggest experts who could review your manuscript
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {suggestedReviewers.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`suggestedReviewers.${index}.name`} className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    {...register(`suggestedReviewers.${index}.name`)}
                    placeholder="Dr. Jane Smith"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`suggestedReviewers.${index}.email`} className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    {...register(`suggestedReviewers.${index}.email`)}
                    type="email"
                    placeholder="jane.smith@university.edu"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`suggestedReviewers.${index}.affiliation`} className="text-sm font-medium">
                    Affiliation *
                  </Label>
                  <Input
                    {...register(`suggestedReviewers.${index}.affiliation`)}
                    placeholder="University, Department"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSuggested(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor={`suggestedReviewers.${index}.expertise`} className="text-sm font-medium">
                  Expertise/Why they are qualified
                </Label>
                <Textarea
                  {...register(`suggestedReviewers.${index}.expertise`)}
                  placeholder="Brief description of their expertise relevant to your manuscript..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addSuggestedReviewer}
          className="w-full mt-4 flex items-center justify-center gap-2 border-dashed"
          disabled={suggestedReviewers.length >= 5}
        >
          <Plus className="w-4 h-4" />
          Add Suggested Reviewer {suggestedReviewers.length > 0 && `(${suggestedReviewers.length}/5)`}
        </Button>
      </Card>

      {/* Excluded Reviewers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <Label className="text-base font-medium text-gray-900">
                Excluded Reviewers (Optional)
              </Label>
              <p className="text-sm text-gray-600">
                List individuals who should not review your manuscript
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {excludedReviewers.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1">
                  <Label htmlFor={`excludedReviewers.${index}.name`} className="text-sm font-medium">
                    Name *
                  </Label>
                  <Input
                    {...register(`excludedReviewers.${index}.name`)}
                    placeholder="Dr. John Doe"
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-1">
                  <Label htmlFor={`excludedReviewers.${index}.reason`} className="text-sm font-medium">
                    Reason for Exclusion *
                  </Label>
                  <Input
                    {...register(`excludedReviewers.${index}.reason`)}
                    placeholder="Conflict of interest, collaboration, etc."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeExcluded(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addExcludedReviewer}
          className="w-full mt-4 flex items-center justify-center gap-2 border-dashed"
          disabled={excludedReviewers.length >= 3}
        >
          <Plus className="w-4 h-4" />
          Add Excluded Reviewer {excludedReviewers.length > 0 && `(${excludedReviewers.length}/3)`}
        </Button>
      </Card>

      {/* Funding Statement */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <Label htmlFor="fundingStatement" className="text-base font-medium text-gray-900">
              Funding Statement (Optional)
            </Label>
            <p className="text-sm text-gray-600">
              List all funding sources that supported this work
            </p>
          </div>
        </div>
        
        <Textarea
          id="fundingStatement"
          {...register('fundingStatement')}
          placeholder="This work was supported by [Grant Agency] under grant number [Grant Number]. [Author Name] was supported by a fellowship from [Fellowship Organization]..."
          rows={4}
          className="text-sm"
        />
        
        <p className="text-xs text-gray-500 mt-2">
          Include grant numbers, fellowship details, and institutional support
        </p>
      </Card>

      {/* Conflict of Interest */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <Label htmlFor="conflictOfInterest" className="text-base font-medium text-gray-900">
              Conflict of Interest Statement (Optional)
            </Label>
            <p className="text-sm text-gray-600">
              Declare any potential conflicts of interest
            </p>
          </div>
        </div>
        
        <Textarea
          id="conflictOfInterest"
          {...register('conflictOfInterest')}
          placeholder="The authors declare no conflict of interest. OR: Author X has served as a consultant for Company Y..."
          rows={4}
          className="text-sm"
        />
        
        <p className="text-xs text-gray-500 mt-2">
          Include financial, personal, or professional relationships that could influence the work
        </p>
      </Card>

      {/* Data Availability */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Database className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <Label htmlFor="dataAvailability" className="text-base font-medium text-gray-900">
              Data Availability Statement (Optional)
            </Label>
            <p className="text-sm text-gray-600">
              Describe how readers can access the data supporting your conclusions
            </p>
          </div>
        </div>
        
        <Textarea
          id="dataAvailability"
          {...register('dataAvailability')}
          placeholder="The data that support the findings of this study are available from [repository/database] at [URL/DOI]. OR: Data are available upon reasonable request from the corresponding author..."
          rows={4}
          className="text-sm"
        />
        
        <p className="text-xs text-gray-500 mt-2">
          Specify repositories, access restrictions, or contact information for data requests
        </p>
      </Card>

      {/* Guidelines */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded-full">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Helpful Tips</h4>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• <strong>Suggested reviewers:</strong> Choose experts without conflicts of interest</li>
              <li>• <strong>Cover letter:</strong> Briefly explain the significance and fit for the journal</li>
              <li>• <strong>Funding:</strong> Include all sources, even if no funding was received</li>
              <li>• <strong>Data:</strong> Be specific about access methods and any restrictions</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}