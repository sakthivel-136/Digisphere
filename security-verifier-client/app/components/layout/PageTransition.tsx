'use client'

/**
 * components/layout/PageTransition.tsx
 * Wraps every page with a standardized Framer Motion entrance animation.
 * Subtle, fast, premium. Respects prefers-reduced-motion.
 *
 * Usage:
 *   export default function MyPage() {
 *     return (
 *       <PageTransition>
 *         <PageContainer>...</PageContainer>
 *       </PageTransition>
 *     )
 *   }
 */

import React from 'react'
import { motion } from 'framer-motion'
import { pageVariants } from '@/lib/animations'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
