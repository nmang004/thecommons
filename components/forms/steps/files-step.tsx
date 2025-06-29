'use client'

import React, { useCallback, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Paperclip, 
 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'

const FILE_TYPES = [
  {
    id: 'manuscript_main',
    label: 'Main Manuscript',
    description: 'Your primary manuscript file (required)',
    required: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    icon: FileText,
  },
  {
    id: 'manuscript_anonymized',
    label: 'Anonymized Manuscript',
    description: 'Version with author information removed (for blind review)',
    required: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
    },
    maxSize: 50 * 1024 * 1024,
    icon: FileText,
  },
  {
    id: 'figure',
    label: 'Figures',
    description: 'High-resolution figures and images',
    required: false,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/tiff': ['.tiff', '.tif'],
      'image/svg+xml': ['.svg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB per file
    icon: Image,
    multiple: true,
  },
  {
    id: 'supplementary',
    label: 'Supplementary Materials',
    description: 'Additional data, appendices, or supporting documents',
    required: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: Paperclip,
    multiple: true,
  },
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function FileTypeUploader({ fileType, onFilesAdded, files }: {
  fileType: typeof FILE_TYPES[0]
  onFilesAdded: (files: File[], type: string) => void
  files: any[]
}) {
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null)
    
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]
      if (error.code === 'file-too-large') {
        setUploadError(`File too large. Maximum size is ${formatFileSize(fileType.maxSize)}`)
      } else if (error.code === 'file-invalid-type') {
        setUploadError(`Invalid file type. Accepted formats: ${Object.values(fileType.accept).flat().join(', ')}`)
      } else {
        setUploadError('File upload error')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      onFilesAdded(acceptedFiles, fileType.id)
    }
  }, [fileType, onFilesAdded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileType.accept as any,
    maxSize: fileType.maxSize,
    multiple: fileType.multiple || false,
  })

  const Icon = fileType.icon
  const hasFiles = files.filter(f => f.type === fileType.id).length > 0
  const isRequired = fileType.required

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasFiles ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{fileType.label}</h3>
              {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </div>
            <p className="text-sm text-gray-600">{fileType.description}</p>
          </div>
        </div>
        {hasFiles && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : hasFiles
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag and drop files here, or click to browse'
          }
        </p>
        <p className="text-xs text-gray-500">
          Max size: {formatFileSize(fileType.maxSize)} • 
          Formats: {Object.values(fileType.accept).flat().join(', ')}
        </p>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{uploadError}</span>
        </div>
      )}

      {/* Uploaded Files */}
      {files.filter(f => f.type === fileType.id).map((file, index) => (
        <div key={index} className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              // This will be handled by the parent component
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </Card>
  )
}

export default function FilesStep() {
  const { watch, setValue, formState: { errors } } = useFormContext()
  const manuscriptFiles = watch('manuscriptFiles') || []

  const handleFilesAdded = (newFiles: File[], type: string) => {
    const updatedFiles = [...manuscriptFiles]
    
    newFiles.forEach(file => {
      // For single-file types, replace existing file of same type
      if (!FILE_TYPES.find(ft => ft.id === type)?.multiple) {
        const existingIndex = updatedFiles.findIndex(f => f.type === type)
        if (existingIndex !== -1) {
          updatedFiles[existingIndex] = {
            file,
            type,
            name: file.name,
            size: file.size,
          }
        } else {
          updatedFiles.push({
            file,
            type,
            name: file.name,
            size: file.size,
          })
        }
      } else {
        // For multiple-file types, add all files
        updatedFiles.push({
          file,
          type,
          name: file.name,
          size: file.size,
        })
      }
    })
    
    setValue('manuscriptFiles', updatedFiles, { shouldValidate: true })
  }


  const hasRequiredFiles = manuscriptFiles.some((file: any) => file.type === 'manuscript_main')

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-heading font-semibold text-gray-900 mb-4 block">
          Upload Manuscript Files
        </Label>
        <p className="text-gray-600 mb-6">
          Upload your manuscript and supporting files. All files will be securely stored and only accessible to reviewers and editors.
        </p>
      </div>

      {/* File Type Uploaders */}
      <div className="space-y-6">
        {FILE_TYPES.map((fileType) => (
          <FileTypeUploader
            key={fileType.id}
            fileType={fileType}
            onFilesAdded={handleFilesAdded}
            files={manuscriptFiles}
          />
        ))}
      </div>

      {/* Validation Error */}
      {errors.manuscriptFiles && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">{errors.manuscriptFiles.message as string}</span>
        </div>
      )}

      {/* File Upload Guidelines */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded-full">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">File Upload Guidelines</h4>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• <strong>Main manuscript:</strong> Include title page, abstract, main text, references</li>
              <li>• <strong>Anonymized version:</strong> Remove all author identifying information</li>
              <li>• <strong>Figures:</strong> High resolution (300+ DPI) for publication quality</li>
              <li>• <strong>File naming:</strong> Use descriptive names (e.g., "Figure1_methodology.png")</li>
              <li>• <strong>Formats:</strong> PDF preferred for text, PNG/TIFF for figures</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Progress Summary */}
      {manuscriptFiles.length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">
                {manuscriptFiles.length} file{manuscriptFiles.length !== 1 ? 's' : ''} uploaded
              </span>
            </div>
            <div className="text-sm text-green-700">
              Total size: {formatFileSize(
                manuscriptFiles.reduce((total: number, file: any) => total + (file.size || 0), 0)
              )}
            </div>
          </div>
          {!hasRequiredFiles && (
            <p className="text-sm text-orange-700 mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Main manuscript file is still required
            </p>
          )}
        </Card>
      )}
    </div>
  )
}