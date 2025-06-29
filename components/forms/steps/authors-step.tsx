'use client'

import React, { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  User, 
  Mail, 
  Building, 
  ExternalLink,
  Star,
  Info
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

export default function AuthorsStep() {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'authors'
  })

  const authors = watch('authors')

  const addAuthor = () => {
    append({
      name: '',
      email: '',
      affiliation: '',
      orcid: '',
      isCorresponding: false,
      contributionStatement: '',
    })
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    
    move(sourceIndex, destinationIndex)
  }

  const setCorrespondingAuthor = (index: number) => {
    // Set all authors to non-corresponding first
    authors.forEach((_, i) => {
      setValue(`authors.${i}.isCorresponding`, false)
    })
    // Set the selected author as corresponding
    setValue(`authors.${index}.isCorresponding`, true)
  }

  const validateORCID = (orcid: string) => {
    if (!orcid) return true
    const orcidRegex = /^(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])$/
    return orcidRegex.test(orcid)
  }

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Authors & Affiliations
        </Label>
        <p className="text-gray-600 mb-6">
          Add all authors in the order they should appear on the manuscript. Drag to reorder.
        </p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="authors">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-6 transition-all ${
                          snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="flex flex-col items-center justify-center mt-2 p-2 text-gray-400 hover:text-gray-600 cursor-grab"
                          >
                            <GripVertical className="w-5 h-5" />
                            <span className="text-xs mt-1">{index + 1}</span>
                          </div>

                          {/* Author Form */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                              <Label htmlFor={`authors.${index}.name`} className="text-sm font-medium">
                                Full Name *
                              </Label>
                              <div className="relative mt-1">
                                <Input
                                  {...register(`authors.${index}.name`)}
                                  placeholder="First Last"
                                  className="pl-10"
                                />
                                <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                              </div>
                              {errors.authors?.[index]?.name && (
                                <p className="text-red-600 text-xs mt-1">
                                  {errors.authors[index].name.message}
                                </p>
                              )}
                            </div>

                            {/* Email */}
                            <div>
                              <Label htmlFor={`authors.${index}.email`} className="text-sm font-medium">
                                Email Address *
                              </Label>
                              <div className="relative mt-1">
                                <Input
                                  {...register(`authors.${index}.email`)}
                                  type="email"
                                  placeholder="email@institution.edu"
                                  className="pl-10"
                                />
                                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                              </div>
                              {errors.authors?.[index]?.email && (
                                <p className="text-red-600 text-xs mt-1">
                                  {errors.authors[index].email.message}
                                </p>
                              )}
                            </div>

                            {/* Affiliation */}
                            <div>
                              <Label htmlFor={`authors.${index}.affiliation`} className="text-sm font-medium">
                                Affiliation
                              </Label>
                              <div className="relative mt-1">
                                <Input
                                  {...register(`authors.${index}.affiliation`)}
                                  placeholder="University, Department"
                                  className="pl-10"
                                />
                                <Building className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                              </div>
                            </div>

                            {/* ORCID */}
                            <div>
                              <Label htmlFor={`authors.${index}.orcid`} className="text-sm font-medium">
                                ORCID iD
                              </Label>
                              <div className="relative mt-1">
                                <Input
                                  {...register(`authors.${index}.orcid`, {
                                    validate: validateORCID
                                  })}
                                  placeholder="0000-0000-0000-0000"
                                  className="pl-10"
                                />
                                <ExternalLink className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                              </div>
                              {errors.authors?.[index]?.orcid && (
                                <p className="text-red-600 text-xs mt-1">
                                  Invalid ORCID format
                                </p>
                              )}
                            </div>

                            {/* Contribution Statement */}
                            <div className="md:col-span-2">
                              <Label htmlFor={`authors.${index}.contributionStatement`} className="text-sm font-medium">
                                Contribution Statement
                              </Label>
                              <Textarea
                                {...register(`authors.${index}.contributionStatement`)}
                                placeholder="Describe this author's contribution to the work..."
                                rows={2}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          {/* Author Actions */}
                          <div className="flex flex-col gap-2 mt-2">
                            {/* Corresponding Author */}
                            <Button
                              type="button"
                              variant={authors[index]?.isCorresponding ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCorrespondingAuthor(index)}
                              className="flex items-center gap-1"
                            >
                              <Star className="w-3 h-3" />
                              {authors[index]?.isCorresponding ? 'Corresponding' : 'Set as Corresponding'}
                            </Button>

                            {/* Remove Author */}
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Corresponding Author Badge */}
                        {authors[index]?.isCorresponding && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                              <Star className="w-3 h-3" />
                              Corresponding Author
                            </Badge>
                          </div>
                        )}
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add Author Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addAuthor}
          className="w-full mt-4 flex items-center justify-center gap-2 py-6 border-dashed"
        >
          <Plus className="w-5 h-5" />
          Add Another Author
        </Button>

        {errors.authors && (
          <p className="text-red-600 text-sm mt-2">{errors.authors.message as string}</p>
        )}
      </div>

      {/* CRediT Roles Reference */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded-full">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Author Contribution Guidelines</h4>
            <p className="text-sm text-blue-800 mt-1">
              Consider using CRediT (Contributor Roles Taxonomy) roles in contribution statements:
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-blue-700">
              <div>• Conceptualization</div>
              <div>• Data curation</div>
              <div>• Formal analysis</div>
              <div>• Funding acquisition</div>
              <div>• Investigation</div>
              <div>• Methodology</div>
              <div>• Project administration</div>
              <div>• Resources</div>
              <div>• Software</div>
              <div>• Supervision</div>
              <div>• Validation</div>
              <div>• Visualization</div>
              <div>• Writing - original draft</div>
              <div>• Writing - review & editing</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ORCID Information */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-green-100 rounded-full">
            <ExternalLink className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-green-900">ORCID iD Information</h4>
            <p className="text-sm text-green-800 mt-1">
              ORCID provides a persistent digital identifier that distinguishes you from other researchers. 
              Don't have one? <a href="https://orcid.org/register" target="_blank" rel="noopener noreferrer" 
              className="underline hover:text-green-900">Register for free at orcid.org</a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}