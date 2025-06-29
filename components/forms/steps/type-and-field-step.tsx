'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Microscope, 
  Calculator, 
  Beaker, 
  Globe, 
  Brain, 
  Heart, 
  Leaf,
  Building,
  Zap
} from 'lucide-react'

const MANUSCRIPT_TYPES = [
  {
    id: 'research-article',
    title: 'Research Article',
    description: 'Original research with novel findings and methodology',
    icon: BookOpen,
  },
  {
    id: 'review-article',
    title: 'Review Article',
    description: 'Comprehensive review of existing literature in a field',
    icon: Globe,
  },
  {
    id: 'short-communication',
    title: 'Short Communication',
    description: 'Brief report of significant findings or preliminary results',
    icon: Zap,
  },
  {
    id: 'case-study',
    title: 'Case Study',
    description: 'Detailed analysis of a particular case or phenomenon',
    icon: Microscope,
  },
]

const FIELDS_OF_STUDY = [
  {
    id: 'biology',
    name: 'Biology & Life Sciences',
    icon: Leaf,
    color: 'bg-green-100 text-green-800',
    subfields: [
      'Molecular Biology',
      'Cell Biology',
      'Genetics',
      'Biochemistry',
      'Marine Biology',
      'Ecology',
      'Botany',
      'Zoology',
    ],
  },
  {
    id: 'medicine',
    name: 'Medicine & Health Sciences',
    icon: Heart,
    color: 'bg-red-100 text-red-800',
    subfields: [
      'Clinical Medicine',
      'Public Health',
      'Medical Research',
      'Pharmacy',
      'Nursing',
      'Dentistry',
      'Veterinary Medicine',
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: Beaker,
    color: 'bg-blue-100 text-blue-800',
    subfields: [
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Physical Chemistry',
      'Analytical Chemistry',
      'Materials Chemistry',
    ],
  },
  {
    id: 'physics',
    name: 'Physics & Astronomy',
    icon: Calculator,
    color: 'bg-purple-100 text-purple-800',
    subfields: [
      'Theoretical Physics',
      'Experimental Physics',
      'Astrophysics',
      'Quantum Physics',
      'Materials Physics',
    ],
  },
  {
    id: 'psychology',
    name: 'Psychology & Neuroscience',
    icon: Brain,
    color: 'bg-indigo-100 text-indigo-800',
    subfields: [
      'Cognitive Psychology',
      'Clinical Psychology',
      'Neuroscience',
      'Behavioral Psychology',
      'Developmental Psychology',
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering & Technology',
    icon: Building,
    color: 'bg-orange-100 text-orange-800',
    subfields: [
      'Computer Science',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
    ],
  },
]

export default function TypeAndFieldStep() {
  const { register, watch, setValue, formState: { errors } } = useFormContext()
  
  const selectedType = watch('manuscriptType')
  const selectedField = watch('fieldOfStudy')
  const selectedSubfield = watch('subfield')

  const selectedFieldData = FIELDS_OF_STUDY.find(field => field.id === selectedField)

  return (
    <div className="space-y-8">
      {/* Manuscript Type Selection */}
      <div>
        <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Select Manuscript Type
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MANUSCRIPT_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <Card
                key={type.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedType === type.id
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('manuscriptType', type.id, { shouldValidate: true })}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedType === type.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{type.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        {errors.manuscriptType && (
          <p className="text-red-600 text-sm mt-2">{errors.manuscriptType.message as string}</p>
        )}
        <input type="hidden" {...register('manuscriptType')} />
      </div>

      {/* Field of Study Selection */}
      <div>
        <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Select Field of Study
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIELDS_OF_STUDY.map((field) => {
            const Icon = field.icon
            return (
              <Card
                key={field.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedField === field.id
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setValue('fieldOfStudy', field.id, { shouldValidate: true })
                  setValue('subfield', '', { shouldValidate: true }) // Reset subfield when field changes
                }}
              >
                <div className="text-center">
                  <div className={`inline-flex p-3 rounded-lg mb-3 ${
                    selectedField === field.id ? 'bg-primary text-white' : field.color
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{field.name}</h3>
                </div>
              </Card>
            )
          })}
        </div>
        {errors.fieldOfStudy && (
          <p className="text-red-600 text-sm mt-2">{errors.fieldOfStudy.message as string}</p>
        )}
        <input type="hidden" {...register('fieldOfStudy')} />
      </div>

      {/* Subfield Selection */}
      {selectedFieldData && (
        <div>
          <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
            Select Subfield (Optional)
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedFieldData.subfields.map((subfield) => (
              <Button
                key={subfield}
                type="button"
                variant={selectedSubfield === subfield ? "default" : "outline"}
                size="sm"
                onClick={() => setValue('subfield', 
                  selectedSubfield === subfield ? '' : subfield, 
                  { shouldValidate: true }
                )}
                className="rounded-full"
              >
                {subfield}
              </Button>
            ))}
          </div>
          <input type="hidden" {...register('subfield')} />
        </div>
      )}

      {/* Help Text */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded-full">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Need help choosing?</h4>
            <p className="text-sm text-blue-800 mt-1">
              Select the manuscript type that best describes your work and the field that most closely 
              matches your research area. This helps us assign appropriate reviewers and editors.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}