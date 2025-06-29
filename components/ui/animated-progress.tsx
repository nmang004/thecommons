'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedProgressProps {
  value: number // 0-100
  max?: number
  height?: number
  color?: string
  backgroundColor?: string
  showLabel?: boolean
  label?: string
  duration?: number
  delay?: number
  className?: string
}

export default function AnimatedProgress({
  value,
  max = 100,
  height = 8,
  color = 'bg-primary',
  backgroundColor = 'bg-muted',
  showLabel = false,
  label,
  duration = 1.5,
  delay = 0,
  className = '',
}: AnimatedProgressProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.5 })
  
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div ref={ref} className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium">{label}</span>}
          <span className="text-sm text-muted-foreground">{value}/{max}</span>
        </div>
      )}
      
      <div
        className={`w-full rounded-full overflow-hidden ${backgroundColor}`}
        style={{ height: `${height}px` }}
      >
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : {}}
          transition={{
            duration,
            delay,
            ease: [0.25, 0.25, 0.25, 0.75],
          }}
        />
      </div>
    </div>
  )
}

// Circular progress variant
interface CircularProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showLabel?: boolean
  duration?: number
  delay?: number
  className?: string
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#1e3a8a',
  backgroundColor = '#e5e7eb',
  showLabel = true,
  duration = 1.5,
  delay = 0,
  className = '',
}: CircularProgressProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.5 })
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div ref={ref} className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: offset } : {}}
          transition={{
            duration,
            delay,
            ease: [0.25, 0.25, 0.25, 0.75],
          }}
        />
      </svg>
      
      {showLabel && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: delay + 0.5 }}
        >
          <span className="text-2xl font-bold text-foreground">
            {Math.round(percentage)}%
          </span>
        </motion.div>
      )}
    </div>
  )
}

// Step progress for multi-step forms
interface StepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  className?: string
}

export function StepProgress({
  currentStep,
  totalSteps,
  stepLabels,
  className = '',
}: StepProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber <= currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={stepNumber} className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {stepNumber}
              </motion.div>
              
              {stepLabels && stepLabels[index] && (
                <motion.span
                  className={`mt-2 text-xs text-center ${
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stepLabels[index]}
                </motion.span>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Progress line */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted transform -translate-y-1/2" />
        <motion.div
          className="absolute top-1/2 left-0 h-0.5 bg-primary transform -translate-y-1/2"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}