'use client'

/**
 * components/ui/GlassCard.tsx
 * THE standard glass surface for the entire application.
 * Use this instead of any ad-hoc bg-white/border/shadow combination.
 *
 * Variants:
 *   default   → standard page card
 *   elevated  → dropdowns, modals (stronger shadow)
 *   muted     → table headers, inset sections
 *   flat      → borderless, subtle surface
 */

import React from 'react'
import { cn } from '@/lib/cn'

type GlassCardVariant = 'default' | 'elevated' | 'muted' | 'flat'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant
  /** Removes internal padding when you want full control */
  noPadding?: boolean
  /** Adds a subtle hover lift */
  hoverable?: boolean
  children: React.ReactNode
}

const variantClasses: Record<GlassCardVariant, string> = {
  default: [
    'bg-[var(--surface)]',
    'border border-[var(--border)]',
    'shadow-sm',
  ].join(' '),

  elevated: [
    'bg-[var(--surface)]',
    'border border-[var(--border)]',
    'shadow-xl shadow-black/5',
  ].join(' '),

  muted: [
    'bg-[var(--surface-muted)]',
    'border border-[var(--border)]',
    'shadow-none',
  ].join(' '),

  flat: [
    'bg-[var(--surface)]',
    'border-0',
    'shadow-none',
  ].join(' '),
}

export function GlassCard({
  variant = 'default',
  noPadding = false,
  hoverable = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Base
        'rounded-2xl',
        'backdrop-blur-xl',
        'transition-all duration-200',
        // Variant
        variantClasses[variant],
        // Hover lift
        hoverable && 'hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--ring)]',
        // Padding
        !noPadding && 'p-5 sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default GlassCard
