'use client'

/**
 * components/ui/Input.tsx
 * Standard input and textarea for the entire application.
 * Consistent focus ring, border, error and disabled states.
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Full width (default true) */
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    fullWidth = true,
    className,
    id,
    ...props
  },
  ref
) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--foreground-muted)] tracking-wide uppercase"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 text-[var(--foreground-subtle)]">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl bg-[var(--surface)] text-sm text-[var(--foreground)]',
            'border border-[var(--border)]',
            'px-3 py-2.5',
            'placeholder:text-[var(--foreground-subtle)]',
            'outline-none',
            'transition-all duration-150',
            // Focus
            'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
            // Error
            error && 'border-[var(--danger)] focus:ring-[var(--danger)]/20',
            // Disabled
            props.disabled && 'opacity-50 cursor-not-allowed bg-[var(--surface-muted)]',
            // Icon offsets
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 text-[var(--foreground-subtle)]">
            {rightIcon}
          </span>
        )}
      </div>

      {(error || hint) && (
        <p
          className={cn(
            'text-xs',
            error ? 'text-[var(--danger)]' : 'text-[var(--foreground-subtle)]'
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
})

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...props },
  ref
) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--foreground-muted)] tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-xl bg-[var(--surface)] text-sm text-[var(--foreground)]',
          'border border-[var(--border)]',
          'px-3 py-2.5',
          'placeholder:text-[var(--foreground-subtle)]',
          'outline-none resize-y min-h-[100px]',
          'transition-all duration-150',
          'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
          error && 'border-[var(--danger)] focus:ring-[var(--danger)]/20',
          props.disabled && 'opacity-50 cursor-not-allowed bg-[var(--surface-muted)]',
          className
        )}
        {...props}
      />
      {(error || hint) && (
        <p className={cn('text-xs', error ? 'text-[var(--danger)]' : 'text-[var(--foreground-subtle)]')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
})

export default Input
