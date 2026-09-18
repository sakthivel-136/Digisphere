import re

with open('app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    """import { SpotlightCard } from "../components/ui/SpotlightCard"
import { ShimmerSkeleton, StaggeredList, StaggeredItem } from "../components/ui/LayoutOrchestration\"""",
    """import { PageTransition } from '@/app/components/layout/PageTransition'
import { PageContainer } from '@/app/components/layout/PageContainer'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { LayoutDashboard } from 'lucide-react'"""
)

# 2. Auth
content = content.replace(
    """  if (!authorized) {
    return <div className="p-6 text-white min-h-screen bg-[#07071f] flex items-center justify-center">Checking access...</div>
  }""",
    """  if (!authorized) {
    return <PageTransition><PageLoadingSpinner label="Checking access..." /></PageTransition>
  }"""
)

# 3. Main wrapper
content = content.replace(
    """  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">""",
    """  return (
    <PageTransition>
      <PageContainer>"""
)

# 4. Closing wrapper
content = content.replace(
    """        <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Pentagon Security Verifier · Dashboard</p>
      </div>
    </div>""",
    """        <p className="mt-8 text-center text-xs text-[var(--foreground-subtle)]">© {new Date().getFullYear()} Pentagon Security Verifier · Dashboard</p>
      </PageContainer>
    </PageTransition>"""
)

# 5. Header
content = content.replace(
    """        {/* ── HEADER ── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics Dashboard</h1>
            <p className="mt-1 text-slate-500 text-sm">
              {selectedFactoryName && <span className="font-medium text-indigo-600">{selectedFactoryName}</span>}
              {selectedFactoryName && ' · '}
              Patrol performance overview
              {lastUpdated && <span className="ml-2 text-emerald-600 font-medium">· Updated {lastUpdated}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            {adminName}
          </div>
        </div>""",
    """        {/* ── HEADER ── */}
        <motion.div variants={itemVariants} initial="initial" animate="animate" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">Analytics Dashboard</h1>
              <p className="mt-1 text-[var(--foreground-muted)] text-sm">
                {selectedFactoryName && <span className="font-medium text-[var(--primary)]">{selectedFactoryName}</span>}
                {selectedFactoryName && ' · '}
                Patrol performance overview
                {lastUpdated && <span className="ml-2 text-emerald-600 font-medium">· Updated {lastUpdated}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <div className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
            {adminName}
          </div>
        </motion.div>"""
)

# 6. Controls bar
content = content.replace(
    """        {/* ── CONTROLS BAR ── */}
        <div className="flex gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap items-end">""",
    """        {/* ── CONTROLS BAR ── */}
        <motion.div variants={itemVariants} initial="initial" animate="animate">
          <GlassCard className="flex flex-wrap gap-4 items-end mb-8">"""
)

content = content.replace(
    """            <button
              onClick={fetchReport}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? '↻ Loading...' : 'Load'}
            </button>
            <button
              id="pdf-export-btn"
              onClick={() => exportDashboardPDF(stats, selectedFactory, selectedFactoryName, selectedDate, adminName)}
              disabled={loading || report.length === 0}
              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ml-auto"
            >
              📊 Export PDF
            </button>
        </div>""",
    """            <button
              onClick={fetchReport}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '↻ Loading...' : 'Load'}
            </button>
            <button
              id="pdf-export-btn"
              onClick={() => exportDashboardPDF(stats, selectedFactory, selectedFactoryName, selectedDate, adminName)}
              disabled={loading || report.length === 0}
              className="btn-secondary ml-auto"
            >
              📊 Export PDF
            </button>
          </GlassCard>
        </motion.div>"""
)

content = content.replace(
    'className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"',
    'className="input-modern w-full sm:w-64"'
)
content = content.replace(
    'className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"',
    'className="input-modern"'
)

# 7. Loading state at bottom
content = content.replace(
    """        ) : report.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[300px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <span className="text-5xl">📊</span>
            <p className="text-lg font-semibold text-slate-500">No data found</p>
            <p className="text-sm">Select a factory and date, then click Load</p>
          </div>
        ) : loading ? (
          <StaggeredList className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
            <StaggeredItem><ShimmerSkeleton className="h-[300px] w-full" /></StaggeredItem>
            <StaggeredItem><ShimmerSkeleton className="h-[300px] w-full" /></StaggeredItem>
            <StaggeredItem><ShimmerSkeleton className="h-[300px] w-full md:col-span-2" /></StaggeredItem>
          </StaggeredList>
        ) : null}""",
    """        ) : report.length === 0 && !loading ? (
          <GlassCard className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-[var(--foreground-subtle)]">
            <span className="text-5xl opacity-50">📊</span>
            <p className="text-lg font-semibold text-[var(--foreground-muted)]">No data found</p>
            <p className="text-sm">Select a factory and date, then click Load</p>
          </GlassCard>
        ) : loading ? (
          <GlassCard className="min-h-[300px] flex items-center justify-center">
            <PageLoadingSpinner label="Loading dashboard data..." />
          </GlassCard>
        ) : null}"""
)

# 8. StatCard rewrite
content = content.replace(
    """    <SpotlightCard className="p-5 flex flex-col justify-center min-h-[100px]">
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${bg}`} />
      <div className="pl-3 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`mt-1.5 text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
      {icon && <div className="absolute right-4 bottom-4 text-3xl opacity-20 pointer-events-none">{icon}</div>}
    </SpotlightCard>""",
    """    <GlassCard className="p-5 flex flex-col justify-center min-h-[100px] relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-1 ${bg}`} />
      <div className="pl-3 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">{label}</p>
        <p className={`mt-1.5 text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">{sub}</p>}
      </div>
      {icon && <div className="absolute right-4 bottom-4 text-3xl opacity-10 pointer-events-none">{icon}</div>}
    </GlassCard>"""
)

# 9. StaggeredList to motion.div
content = content.replace('<StaggeredList', '<motion.div variants={containerVariants} initial="initial" animate="animate"')
content = content.replace('</StaggeredList>', '</motion.div>')
content = content.replace('<StaggeredItem', '<motion.div variants={itemVariants}')
content = content.replace('</StaggeredItem>', '</motion.div>')


# 10. Replace bg-white rounded-2xl shadow-sm border border-slate-200 -> glass-surface rounded-2xl
content = content.replace('bg-white rounded-2xl shadow-sm border border-slate-200', 'glass-surface rounded-2xl')

# 11. Text color replaces
content = content.replace('text-slate-500', 'text-[var(--foreground-muted)]')
content = content.replace('text-slate-400', 'text-[var(--foreground-subtle)]')
content = content.replace('text-slate-700', 'text-[var(--foreground)]')
content = content.replace('text-slate-900', 'text-[var(--foreground)]')
content = content.replace('bg-slate-50', 'bg-[var(--surface-muted)]')
content = content.replace('border-slate-50', 'border-[var(--border)]')
content = content.replace('border-slate-100', 'border-[var(--border)]')

with open('app/dashboard/page.tsx', 'w') as f:
    f.write(content)
