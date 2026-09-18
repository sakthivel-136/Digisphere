/**
 * lib/cn.ts
 * Utility: merges Tailwind class names without conflicts.
 * Usage: cn('px-4', condition && 'bg-blue-500', 'text-sm')
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
