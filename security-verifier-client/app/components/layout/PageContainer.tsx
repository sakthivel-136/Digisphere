'use client'

/**
 * components/layout/PageContainer.tsx
 * Standard responsive page wrapper — consistent max-width + spacing.
 * Every page's main content should sit inside this.
 */

import React from 'react'
import { cn } from '@/lib/cn'

interface PageContainerProps {
  children: React.ReactNode
  /** Extra Tailwind classes */
  className?: string
  /** Remove the default max-width constraint */
  fluid?: boolean
}

export function PageContainer({
  children,
  className,
  fluid = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full min-h-[calc(100vh-64px)]',
        'px-4 sm:px-6 lg:px-8',
        'py-6 sm:py-8',
        !fluid && 'max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

export default PageContainer
