'use client'

/**
 * components/ui/Button.tsx
 * THE standard button for the entire application.
 * 
 * Variants: primary | secondary | danger | ghost | link
 * Sizes:    sm | md (default) | lg
 * 
 * Features:
 * - Framer Motion hover (scale 1.02) + tap (scale 0.97)
 * - Built-in loading state with spinner
 * - Disabled state
 * - Icon support (left/right)
 * - Full keyboard accessibility
 * - prefers-reduced-motion safe
 */

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { LoadingSpinner } from './LoadingSpinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--primary)] text-white',
    'hover:bg-[var(--primary-hover)]',
    'border border-transparent',
    'shadow-sm shadow-[var(--primary)]/20',
    'focus-visible:ring-[var(--primary)]',
  ].join(' '),

  secondary: [
    'bg-[var(--surface)] text-[var(--foreground)]',
    'border border-[var(--border)]',
    'hover:bg-[var(--surface-hover)]',
    'focus-visible:ring-[var(--primary)]',
  ].join(' '),

  danger: [
    'bg-[var(--danger-muted)] text-[var(--danger)]',
    'border border-transparent',
    'hover:bg-[var(--danger)] hover:text-white',
    'focus-visible:ring-[var(--danger)]',
  ].join(' '),

  ghost: [
    'bg-transparent text-[var(--foreground-muted)]',
    'border border-transparent',
    'hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
    'focus-visible:ring-[var(--primary)]',
  ].join(' '),

  link: [
    'bg-transparent text-[var(--primary)]',
    'border border-transparent',
    'hover:underline underline-offset-2',
    'focus-visible:ring-[var(--primary)]',
    'px-0 shadow-none',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      // Cast to avoid motion/html button type mismatch
      {...(props as object)}
      disabled={isDisabled}
      className={cn(
        // Base
        'relative inline-flex items-center justify-center font-medium',
        'transition-colors duration-150',
        'outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        // Variant
        variantClasses[variant],
        // Size
        sizeClasses[size],
        // Disabled
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {loading ? (
        <>
          <LoadingSpinner
            size={size === 'lg' ? 'sm' : 'xs'}
            className="border-current/30 border-t-current"
          />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="pointer-events-none flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="pointer-events-none flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  )
}

export default Button
