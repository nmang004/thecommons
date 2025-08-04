'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  FileText, 
  Users, 
  Search,
  Filter,
} from 'lucide-react'
import { DecisionTemplate, DecisionActions } from '@/types/database'

interface TemplateManagerProps {
  onTemplateSelect?: (template: DecisionTemplate) => void
  _selectedTemplate?: DecisionTemplate | null
  readOnly?: boolean
  className?: string
}

interface TemplateFormData {
  name: string
  category: 'accept' | 'minor_revision' | 'major_revision' | 'reject' | 'desk_reject'
  decision_type: string
  description: string
  template_content: {
    sections: Array<{
      id: string
      type: string
      content: string
      required: boolean
      order: number
    }>
    variables: string[]
    defaultActions?: DecisionActions
  }
  is_public: boolean
  tags: string[]
}

const TEMPLATE_CATEGORIES = [
  { value: 'accept', label: 'Acceptance', color: 'bg-green-100 text-green-800' },
  { value: 'minor_revision', label: 'Minor Revisions', color: 'bg-blue-100 text-blue-800' },
  { value: 'major_revision', label: 'Major Revisions', color: 'bg-orange-100 text-orange-800' },
  { value: 'reject', label: 'Rejection', color: 'bg-red-100 text-red-800' },
  { value: 'desk_reject', label: 'Desk Rejection', color: 'bg-gray-100 text-gray-800' }
]

const DECISION_TYPES = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'revisions_requested', label: 'Revisions Requested' },
  { value: 'rejected', label: 'Rejected' }
]

export function TemplateManager({ 
  onTemplateSelect, 
  _selectedTemplate, 
  readOnly = false,
  className 
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<DecisionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DecisionTemplate | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: 'accept',
    decision_type: 'accepted',
    description: '',
    template_content: {
      sections: [],
      variables: [],
      defaultActions: {}
    },
    is_public: false,
    tags: []
  })

  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/editorial/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateTemplate = () => {
    setFormData({
      name: '',
      category: 'accept',
      decision_type: 'accepted',
      description: '',
      template_content: {
        sections: [
          {
            id: 'greeting',
            type: 'text',
            content: 'Dear {{author_name}},',
            required: true,
            order: 1
          },
          {
            id: 'main',
            type: 'text',
            content: '',
            required: true,
            order: 2
          },
          {
            id: 'closing',
            type: 'text',
            content: 'Best regards,\n{{editor_name}}',
            required: true,
            order: 3
          }
        ],
        variables: ['author_name', 'manuscript_title', 'editor_name', 'journal_name'],
        defaultActions: {
          notifyAuthor: true,
          notifyReviewers: false
        }
      },
      is_public: false,
      tags: []
    })
    setIsCreating(true)
  }

  const handleEditTemplate = (template: DecisionTemplate) => {
    setFormData({
      name: template.name,
      category: template.category,
      decision_type: template.decision_type,
      description: template.description || '',
      template_content: template.template_content,
      is_public: template.is_public,
      tags: template.tags || []
    })
    setEditingTemplate(template)
    setIsCreating(true)
  }

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate 
        ? `/api/editorial/templates/${editingTemplate.id}`
        : '/api/editorial/templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadTemplates()
        setIsCreating(false)
        setEditingTemplate(null)
      }
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/editorial/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const updateFormSection = (sectionId: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      template_content: {
        ...prev.template_content,
        sections: prev.template_content.sections.map(section =>
          section.id === sectionId ? { ...section, content } : section
        )
      }
    }))
  }

  const getFullTemplateContent = (template: DecisionTemplate) => {
    if (typeof template.template_content === 'string') {
      return template.template_content
    }
    
    return template.template_content.sections
      ?.sort((a, b) => a.order - b.order)
      .map(section => section.content)
      .join('\n\n') || ''
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Decision Letter Templates
              </CardTitle>
              <CardDescription>
                Manage reusable templates for editorial decision letters
              </CardDescription>
            </div>
            {!readOnly && (
              <Button onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid gap-4">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge className={TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.color}>
                            {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label}
                          </Badge>
                          {template.is_public && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {template.description || 'No description provided'}
                        </CardDescription>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Used {template.usage_count} times</span>
                          <span>•</span>
                          <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{template.name}</DialogTitle>
                              <DialogDescription>
                                Template preview with variable placeholders
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap text-sm font-mono">
                                  {getFullTemplateContent(template)}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {onTemplateSelect && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onTemplateSelect(template)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Use
                          </Button>
                        )}

                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h4>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterCategory !== 'all' 
                  ? 'No templates match your search criteria'
                  : 'Create your first decision letter template'
                }
              </p>
              {!readOnly && !searchQuery && filterCategory === 'all' && (
                <Button onClick={handleCreateTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Creation/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Design a reusable template for editorial decision letters
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Acceptance Letter"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: TemplateFormData['category']) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when and how to use this template..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  placeholder="e.g., acceptance, standard, quick"
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Template Content</Label>
                <div className="space-y-4 mt-2">
                  {formData.template_content.sections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          Section {index + 1}: {section.type}
                        </Label>
                        <Badge variant={section.required ? 'default' : 'outline'}>
                          {section.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateFormSection(section.id, e.target.value)}
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div>
                <Label htmlFor="decisionType">Decision Type</Label>
                <Select 
                  value={formData.decision_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, decision_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.is_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isPublic">
                  Make this template available to all editors
                </Label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}