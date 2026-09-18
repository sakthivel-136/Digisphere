'use client'

import { useState } from 'react'
import ActivityFilters from '@/app/components/security-activity/ActivityFilters'
import { ActivityTable } from '@/app/components/security-activity/ActivityTable'
import { ActivitySummaryCards } from '@/app/components/security-activity/ActivitySummaryCards'
import { ActivityDetails } from '@/app/components/security-activity/ActivityDetails'
import type { Activity, ActivityFilterValues } from '@/app/components/security-activity/types'
import { PageTransition } from '@/app/components/layout/PageTransition'
import { PageContainer } from '@/app/components/layout/PageContainer'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Activity as ActivityIcon } from 'lucide-react'

// ── Mock data preserved exactly ──
const mockActivities: Activity[] = [
  {
    id: 'ACT001',
    type: 'QR Scan',
    timestamp: '2023-11-15T08:30:00Z',
    guardName: 'John Smith',
    guardId: 'G001',
    routeName: 'Morning Patrol',
    building: 'Building A',
    floor: 'Floor 1',
    area: 'Main Entrance',
    source: 'Mobile App',
    status: 'Success',
  },
]

export default function SecurityActivityPage() {
  // ── State preserved exactly ──
  const [activities] = useState<Activity[]>(mockActivities)
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>(mockActivities)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // ── Handler preserved exactly ──
  const handleFilter = (filters: ActivityFilterValues) => {
    let filtered = [...activities]
    if (filters.activityType !== 'All') {
      filtered = filtered.filter(a => a.type === filters.activityType)
    }
    if (filters.guard !== 'All') {
      filtered = filtered.filter(a => a.guardName === filters.guard)
    }
    if (filters.route !== 'All') {
      filtered = filtered.filter(a => a.routeName === filters.route)
    }
    setFilteredActivities(filtered)
  }

  return (
    <PageTransition>
      <PageContainer>
        <motion.div variants={containerVariants} initial="initial" animate="animate">

          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
              <ActivityIcon className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                Security Activity Log
              </h1>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                Real-time patrol and guard activity tracking
              </p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div variants={itemVariants}>
            <GlassCard className="mb-6">
              <ActivityFilters activities={activities} onFilter={handleFilter} />
            </GlassCard>
          </motion.div>

          {/* Summary Cards */}
          <motion.div variants={itemVariants}>
            <ActivitySummaryCards
              totalActivities={filteredActivities.length}
              missedScans={filteredActivities.filter(a => a.type === 'Missed Scan').length}
              emergencyAlerts={filteredActivities.filter(a => a.type === 'Emergency Alert').length}
              issuesReported={filteredActivities.filter(a => a.status !== 'Success').length}
            />
          </motion.div>

          {/* Activity Table */}
          <motion.div variants={itemVariants}>
            <GlassCard noPadding className="mt-6 overflow-hidden">
              <ActivityTable
                activities={filteredActivities}
                onViewDetails={(activity) => {
                  setSelectedActivity(activity)
                  setIsDetailsOpen(true)
                }}
              />
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Details Panel */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
          />
        )}
      </PageContainer>
    </PageTransition>
  )
}
