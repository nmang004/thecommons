'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  distance?: number
  className?: string
  once?: boolean
}

const getDirectionOffset = (direction: string, distance: number) => {
  switch (direction) {
    case 'up':
      return { x: 0, y: distance }
    case 'down':
      return { x: 0, y: -distance }
    case 'left':
      return { x: distance, y: 0 }
    case 'right':
      return { x: -distance, y: 0 }
    default:
      return { x: 0, y: distance }
  }
}

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
  className = '',
  once = true,
}: RevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once })

  const offset = getDirectionOffset(direction, distance)

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...offset,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
            }
          : {}
      }
      transition={{
        duration,
        delay,
        ease: [0.25, 0.25, 0.25, 0.75],
      }}
    >
      {children}
    </motion.div>
  )
}

// Staggered reveal for lists
interface StaggerRevealProps {
  children: ReactNode[]
  direction?: 'up' | 'down' | 'left' | 'right'
  staggerDelay?: number
  duration?: number
  distance?: number
  className?: string
  once?: boolean
}

export function StaggerReveal({
  children,
  direction = 'up',
  staggerDelay = 0.1,
  duration = 0.6,
  distance = 30,
  className = '',
  once = true,
}: StaggerRevealProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <Reveal
          key={index}
          direction={direction}
          delay={index * staggerDelay}
          duration={duration}
          distance={distance}
          once={once}
        >
          {child}
        </Reveal>
      ))}
    </div>
  )
}