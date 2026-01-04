'use client'

import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="p-16 text-center flex flex-col items-center">
      {icon && (
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="text-gray-500 mt-1 mb-6">{description}</p>
      )}
      {action && (
        <button 
          onClick={action.onClick}
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

