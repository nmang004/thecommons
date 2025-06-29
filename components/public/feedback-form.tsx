'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Zap, 
  Star,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'general', 'academic']),
  category: z.enum(['submission', 'review', 'editorial', 'ui_ux', 'performance', 'other']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  steps_to_reproduce: z.string().max(1000).optional(),
  expected_behavior: z.string().max(500).optional(),
  actual_behavior: z.string().max(500).optional(),
  academic_context: z.object({
    institution: z.string().optional(),
    field_of_study: z.string().optional(),
    role: z.enum(['author', 'reviewer', 'editor', 'reader']).optional(),
    experience_level: z.enum(['novice', 'intermediate', 'expert']).optional()
  }).optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  allow_follow_up: z.boolean().default(false)
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'destructive' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'default' },
  { value: 'improvement', label: 'Improvement', icon: Zap, color: 'secondary' },
  { value: 'academic', label: 'Academic Feedback', icon: Star, color: 'default' },
  { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'default' }
];

const categories = [
  { value: 'submission', label: 'Manuscript Submission' },
  { value: 'review', label: 'Peer Review Process' },
  { value: 'editorial', label: 'Editorial Process' },
  { value: 'ui_ux', label: 'User Interface/Experience' },
  { value: 'performance', label: 'Performance/Speed' },
  { value: 'other', label: 'Other' }
];

const severityLevels = [
  { value: 'low', label: 'Low', description: 'Minor issue, not blocking' },
  { value: 'medium', label: 'Medium', description: 'Moderate impact' },
  { value: 'high', label: 'High', description: 'Significant issue' },
  { value: 'critical', label: 'Critical', description: 'Blocks core functionality' }
];

interface FeedbackFormProps {
  onClose?: () => void;
  initialType?: string;
  initialCategory?: string;
}

export function FeedbackForm({ onClose, initialType, initialCategory }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: initialType as any || undefined,
      category: initialCategory as any || undefined,
      severity: 'medium',
      allow_follow_up: false
    }
  });

  const watchedType = watch('type');

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Add current page URL
      const feedbackData = {
        ...data,
        page_url: window.location.href,
        user_agent: navigator.userAgent
      };

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      setIsSubmitted(true);
      
      // Auto-close after 3 seconds if onClose is provided
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }

    } catch (error) {
      console.error('Feedback submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold text-green-700">
            Thank You for Your Feedback!
          </h2>
          <p className="text-gray-600">
            Your feedback has been submitted and will help us improve The Commons.
            Our team will review it and respond if needed.
          </p>
          {onClose && (
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Share Your Feedback
          </h2>
          <p className="text-gray-600">
            Help us improve The Commons by sharing your thoughts, reporting issues, 
            or suggesting new features. Your input is valuable to our academic community.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Feedback Type */}
          <div>
            <Label htmlFor="type" className="text-sm font-medium">
              Feedback Type *
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = watchedType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setValue('type', type.value as any);
                      setSelectedType(type.value);
                    }}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <select
              {...register('category')}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              {...register('title')}
              placeholder="Brief, descriptive title"
              className="mt-1"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              {...register('description')}
              placeholder="Provide detailed information about your feedback..."
              rows={4}
              className="mt-1"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Severity (for bugs) */}
          {watchedType === 'bug' && (
            <div>
              <Label htmlFor="severity" className="text-sm font-medium">
                Severity
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {severityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setValue('severity', level.value as any)}
                    className={`p-2 border rounded text-center text-xs ${
                      watch('severity') === level.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-gray-500">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bug-specific fields */}
          {watchedType === 'bug' && (
            <>
              <div>
                <Label htmlFor="steps_to_reproduce" className="text-sm font-medium">
                  Steps to Reproduce
                </Label>
                <Textarea
                  {...register('steps_to_reproduce')}
                  placeholder="1. Go to... 2. Click on... 3. See error..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected_behavior" className="text-sm font-medium">
                    Expected Behavior
                  </Label>
                  <Textarea
                    {...register('expected_behavior')}
                    placeholder="What should happen?"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="actual_behavior" className="text-sm font-medium">
                    Actual Behavior
                  </Label>
                  <Textarea
                    {...register('actual_behavior')}
                    placeholder="What actually happened?"
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {/* Academic Context */}
          {watchedType === 'academic' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Academic Context</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institution" className="text-sm font-medium">
                    Institution
                  </Label>
                  <Input
                    {...register('academic_context.institution')}
                    placeholder="University or research institution"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="field_of_study" className="text-sm font-medium">
                    Field of Study
                  </Label>
                  <Input
                    {...register('academic_context.field_of_study')}
                    placeholder="e.g., Computer Science, Biology"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-sm font-medium">
                    Role
                  </Label>
                  <select
                    {...register('academic_context.role')}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your role</option>
                    <option value="author">Author</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="editor">Editor</option>
                    <option value="reader">Reader</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="experience_level" className="text-sm font-medium">
                    Experience Level
                  </Label>
                  <select
                    {...register('academic_context.experience_level')}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select experience level</option>
                    <option value="novice">Novice</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact_email" className="text-sm font-medium">
                Contact Email (Optional)
              </Label>
              <Input
                {...register('contact_email')}
                type="email"
                placeholder="your.email@university.edu"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide your email if you'd like us to follow up on this feedback.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                {...register('allow_follow_up')}
                id="allow_follow_up"
              />
              <Label htmlFor="allow_follow_up" className="text-sm">
                I agree to be contacted about this feedback
              </Label>
            </div>
          </div>

          {/* Error Alert */}
          {submitError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-red-800">
                <strong>Error:</strong> {submitError}
              </div>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Submit Feedback</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}