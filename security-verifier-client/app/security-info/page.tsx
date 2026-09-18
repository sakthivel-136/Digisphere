'use client'

import { useState } from 'react'
import { PageTransition } from '@/app/components/layout/PageTransition'
import { PageContainer } from '@/app/components/layout/PageContainer'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { Badge } from '@/app/components/ui/Badge'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Shield, Filter } from 'lucide-react'

// ── Types preserved exactly ──
interface SecurityReport {
  id: string
  guardName: string
  site: string
  date: string
  status: 'submitted' | 'pending'
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
interface FilterBarProps {
  status: string
  setStatus: (v: string) => void
}

function FilterBar({ status, setStatus }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-muted)]">
        <Filter size={15} />
        Filter by status
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="input-modern w-auto min-w-[140px]"
      >
        <option value="all">All</option>
        <option value="submitted">Submitted</option>
        <option value="pending">Pending</option>
      </select>
    </div>
  )
}

// ── Report List ───────────────────────────────────────────────────────────────
function ReportList({ reports }: { reports: SecurityReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-subtle)]">
        <Shield className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-semibold text-[var(--foreground-muted)]">No reports found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
            <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Guard</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Site</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Date</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)] transition-colors duration-100"
            >
              <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{r.guardName}</td>
              <td className="px-5 py-3.5 text-[var(--foreground-muted)]">{r.site}</td>
              <td className="px-5 py-3.5 text-[var(--foreground-muted)]">{r.date}</td>
              <td className="px-5 py-3.5">
                <Badge variant={r.status === 'submitted' ? 'success' : 'warning'} dot>
                  {r.status === 'submitted' ? 'Submitted' : 'Pending'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SecurityInfoPage() {
  // ── State preserved exactly ──
  const [status, setStatus] = useState('all')

  // Mock data (preserved exactly — replace with API later)
  const reports: SecurityReport[] = [
    { id: '1', guardName: 'Ramesh Kumar', site: 'Building A',   date: '2025-01-22', status: 'submitted' },
    { id: '2', guardName: 'Suresh Patel', site: 'Warehouse 3',  date: '2025-01-22', status: 'pending'   },
  ]

  const filteredReports =
    status === 'all' ? reports : reports.filter((r) => r.status === status)

  return (
    <PageTransition>
      <PageContainer>
        <motion.div variants={containerVariants} initial="initial" animate="animate">

          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                Security Information
              </h1>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                Guard reports and security submissions
              </p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div variants={itemVariants}>
            <GlassCard className="mb-6">
              <FilterBar status={status} setStatus={setStatus} />
            </GlassCard>
          </motion.div>

          {/* Report Table */}
          <motion.div variants={itemVariants}>
            <GlassCard noPadding className="overflow-hidden">
              <ReportList reports={filteredReports} />
            </GlassCard>
          </motion.div>

        </motion.div>
      </PageContainer>
    </PageTransition>
  )
}
