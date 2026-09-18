'use client'

/**
 * components/ui/Badge.tsx
 * Standard badge/pill for status, roles, and labels.
 * Replaces StatusBadge, RoleBadge, ActivityBadge across the app.
 */

import React from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-muted)] text-[var(--foreground-muted)] border-[var(--border)]',
  primary: 'bg-[var(--primary-muted)] text-[var(--primary)] border-[var(--primary)]/20',
  success: 'bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]/20',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]/20',
  danger:  'bg-[var(--danger-muted)] text-[var(--danger)] border-[var(--danger)]/20',
  muted:   'bg-[var(--surface-muted)] text-[var(--foreground-subtle)] border-transparent',
}

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--foreground-muted)]',
  primary: 'bg-[var(--primary)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger:  'bg-[var(--danger)]',
  muted:   'bg-[var(--foreground-subtle)]',
}

export function Badge({
  variant = 'default',
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-0.5 rounded-full',
        'text-xs font-semibold',
        'border',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotClasses[variant])} />
      )}
      {children}
    </span>
  )
}

export default Badge
