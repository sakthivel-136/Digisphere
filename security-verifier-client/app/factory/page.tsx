'use client'

import { FactoriesTable } from '@/app/components/factory/FactoriesTable'
import { useAuthGuard } from '@/app/services/auth.guard'
import { PageTransition } from '@/app/components/layout/PageTransition'
import { PageContainer } from '@/app/components/layout/PageContainer'
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Building2 } from 'lucide-react'

export default function FactoryPage() {
  const { authorized } = useAuthGuard()

  if (!authorized) {
    return (
      <PageTransition>
        <PageLoadingSpinner label="Checking access…" />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageContainer>
        <motion.div variants={containerVariants} initial="initial" animate="animate">
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Factories
                </h1>
                <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                  Create, edit, and manage factory locations
                </p>
              </div>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div variants={itemVariants}>
            <FactoriesTable />
          </motion.div>
        </motion.div>
      </PageContainer>
    </PageTransition>
  )
}
