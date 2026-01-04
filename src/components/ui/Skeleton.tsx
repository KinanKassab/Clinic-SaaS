'use client'

import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'circle'
  width?: string
  height?: string
}

export default function Skeleton({ 
  className, 
  variant = 'text',
  width,
  height 
}: SkeletonProps) {
  const baseClasses = 'relative overflow-hidden bg-gray-200 rounded'
  
  const variantClasses = {
    text: 'h-4',
    card: 'h-24',
    circle: 'rounded-full'
  }

  const style = {
    ...(width && { width }),
    ...(height && { height })
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
    </div>
  )
}

