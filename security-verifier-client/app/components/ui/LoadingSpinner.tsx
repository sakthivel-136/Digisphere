'use client'

/**
 * components/ui/LoadingSpinner.tsx
 * Single, reusable spinner for the entire application.
 * Never duplicate spinner implementations across pages.
 */

import React from 'react'
import { cn } from '@/lib/cn'

interface LoadingSpinnerProps {
  /** xs=12px, sm=16px, md=20px (default), lg=28px, xl=40px */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Accessible label for screen readers */
  label?: string
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-[2.5px]',
  xl: 'h-10 w-10 border-[3px]',
}

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading…',
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block rounded-full animate-spin',
        'border-[var(--primary-muted)] border-t-[var(--primary)]',
        sizeClasses[size],
        className
      )}
    />
  )
}

/**
 * Full-page centered loading state.
 */
export function PageLoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" label={label} />
        <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
