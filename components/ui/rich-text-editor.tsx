'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import Focus from '@tiptap/extension-focus'
import { suggestion } from './rich-text-editor-suggestion'
import { useCallback, useEffect } from 'react'
import { Button } from './button'
import { Separator } from './separator'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Type,
  AtSign,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  variables?: string[]
  reviewComments?: Array<{
    id: string
    reviewer_name?: string
    comment_type: string
    content: string
    include_in_letter: boolean
  }>
  onVariableInsert?: (variable: string) => void
  onCommentInsert?: (comment: any) => void
  className?: string
  editable?: boolean
  maxLength?: number
}

export function RichTextEditor({ 
  content = '',
  onChange,
  placeholder = 'Start writing your decision letter...',
  variables = [],
  reviewComments = [],
  onVariableInsert,
  onCommentInsert,
  className,
  editable = true,
  maxLength
}: RichTextEditorProps) {
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention-variable bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium',
        },
        suggestion: suggestion(variables, onVariableInsert),
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Typography,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  const insertVariable = useCallback((variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`{{${variable}}}`).run()
      onVariableInsert?.(variable)
    }
  }, [editor, onVariableInsert])

  const insertComment = useCallback((comment: any) => {
    if (editor) {
      const commentBlock = `
        <div class="review-comment bg-gray-50 border-l-4 border-blue-500 p-4 my-4">
          <div class="font-medium text-gray-900">${comment.reviewer_name || 'Reviewer'} - ${comment.comment_type}</div>
          <div class="text-gray-700 mt-2">${comment.content}</div>
        </div>
      `
      editor.chain().focus().insertContent(commentBlock).run()
      onCommentInsert?.(comment)
    }
  }, [editor, onCommentInsert])

  const MenuBar = () => {
    if (!editor) return null

    return (
      <div className="border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('bold') && 'bg-gray-100'
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('italic') && 'bg-gray-100'
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('bulletList') && 'bg-gray-100'
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('orderedList') && 'bg-gray-100'
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('blockquote') && 'bg-gray-100'
            )}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor.chain().focus().insertContent('@').run()}
            className="h-8 px-2 text-xs"
          >
            <AtSign className="h-3 w-3 mr-1" />
            Variable
          </Button>
        </div>
      </div>
    )
  }

  const VariableSidebar = () => {
    if (variables.length === 0) return null

    return (
      <div className="w-64 border-l bg-gray-50 p-4">
        <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center">
          <Type className="h-4 w-4 mr-2" />
          Available Variables
        </h4>
        <div className="space-y-2">
          {variables.map((variable) => (
            <Button
              key={variable}
              variant="ghost"
              size="sm"
              onClick={() => insertVariable(variable)}
              className="w-full justify-start text-xs font-mono h-8"
            >
              {`{{${variable}}}`}
            </Button>
          ))}
        </div>

        {reviewComments.length > 0 && (
          <>
            <h4 className="font-medium text-sm text-gray-900 mb-3 mt-6 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Review Comments
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reviewComments
                .filter(comment => comment.include_in_letter)
                .map((comment) => (
                <Button
                  key={comment.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => insertComment(comment)}
                  className="w-full justify-start text-xs h-auto p-2 text-left"
                >
                  <div>
                    <div className="font-medium">
                      {comment.reviewer_name || 'Reviewer'} - {comment.comment_type}
                    </div>
                    <div className="text-gray-600 line-clamp-2">
                      {comment.content.substring(0, 100)}...
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-white', className)}>
      <div className="flex">
        <div className="flex-1">
          <MenuBar />
          <div className="relative">
            <EditorContent 
              editor={editor} 
              className="prose prose-sm max-w-none p-4 min-h-[300px] focus-within:outline-none"
            />
            {maxLength && editor && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {editor.storage.characterCount.characters()}/{maxLength}
              </div>
            )}
          </div>
        </div>
        <VariableSidebar />
      </div>
    </div>
  )
}