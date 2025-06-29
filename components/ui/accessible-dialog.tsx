'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFocusTrap, useFocusRestore } from '@/hooks/use-focus-trap'
import { motion, AnimatePresence } from 'framer-motion'

interface AccessibleDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  contentClassName?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full m-4',
}

export default function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
}: AccessibleDialogProps) {
  const focusTrapRef = useFocusTrap(isOpen)
  const { storeFocus, restoreFocus } = useFocusRestore()

  // Store focus when dialog opens and restore when it closes
  useEffect(() => {
    if (isOpen) {
      storeFocus()
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      restoreFocus()
      // Restore body scroll
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, storeFocus, restoreFocus])

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleEscapeEvent = () => {
      onClose()
    }

    document.addEventListener('keydown', handleEscape)
    focusTrapRef.current?.addEventListener('escape-key', handleEscapeEvent)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      focusTrapRef.current?.removeEventListener('escape-key', handleEscapeEvent)
    }
  }, [isOpen, closeOnEscape, onClose, focusTrapRef])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Dialog */}
        <motion.div
          ref={focusTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby={description ? "dialog-description" : undefined}
          className={`
            relative w-full ${sizeClasses[size]} mx-4 my-8
            bg-background border border-border rounded-lg shadow-xl
            max-h-[calc(100vh-4rem)] flex flex-col
            ${className}
          `}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div className="flex-1 mr-4">
              <h2 id="dialog-title" className="heading-3 mb-1">
                {title}
              </h2>
              {description && (
                <p id="dialog-description" className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-auto p-6 ${contentClassName}`}>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Confirmation dialog variant
interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <AccessibleDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-6">
        <p className="text-muted-foreground">{message}</p>
        
        <div className="flex space-x-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Loading...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </AccessibleDialog>
  )
}

// Alert dialog variant
interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  buttonText?: string
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
}: AlertDialogProps) {
  const typeStyles = {
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    success: 'text-green-600',
  }

  return (
    <AccessibleDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-6">
        <p className={`font-medium ${typeStyles[type]}`}>{message}</p>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>
            {buttonText}
          </Button>
        </div>
      </div>
    </AccessibleDialog>
  )
}