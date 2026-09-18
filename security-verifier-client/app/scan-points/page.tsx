'use client'

import { useEffect, useState } from 'react'
import { ScanPointsTable, ScanPoint } from '../components/scan/ScanPointsTable'
import { ScanPointForm } from '../components/scan/ScanPointForm'
import { getScanPointsByFactory, createScanPoint, updateScanPoint } from '../api/scanPoints.api'
import { useAuthGuard } from '../services/auth.guard'
import { getApiUrl } from '../utils/apiUrl'
import { PageTransition } from '@/app/components/layout/PageTransition'
import { PageContainer } from '@/app/components/layout/PageContainer'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Plus, ScanLine } from 'lucide-react'

/* ─── Types (preserved) ───────────────────────────────────────────────────── */

interface Factory {
  id: string
  name: string
}

type StatusFilter   = 'All' | 'Active' | 'Inactive'
type PriorityFilter = 'All' | 'Low' | 'Medium' | 'High'

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ScanPointsPage() {
  const { authorized } = useAuthGuard()

  // ── All state preserved exactly ──
  const [scanPoints,        setScanPoints]        = useState<ScanPoint[]>([])
  const [factories,         setFactories]         = useState<Factory[]>([])
  const [selectedFactory,   setSelectedFactory]   = useState<string>('')
  const [isFormOpen,        setIsFormOpen]        = useState<boolean>(false)
  const [editingScanPoint,  setEditingScanPoint]  = useState<ScanPoint | null>(null)
  const [statusFilter,      setStatusFilter]      = useState<StatusFilter>('All')
  const [priorityFilter,    setPriorityFilter]    = useState<PriorityFilter>('All')

  /* ── Load Factories (preserved) ── */
  useEffect(() => {
    if (!authorized) return
    const API_BASE_URL = getApiUrl()
    const FACTORY_ENDPOINT = `${API_BASE_URL}/factories/minimal`

    console.log(`🔍 Fetching from: ${FACTORY_ENDPOINT}`)

    fetch(FACTORY_ENDPOINT)
      .then(res => {
        if (!res.ok) {
          console.error(`❌ Backend Error: ${res.status} at ${FACTORY_ENDPOINT}`)
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        const factoryArray = Array.isArray(data) ? data : []
        console.log('✅ Factories loaded:', factoryArray)
        setFactories(factoryArray)
        if (factoryArray.length > 0) {
          setSelectedFactory(factoryArray[0].id)
        } else {
          setSelectedFactory('')
        }
      })
      .catch((err: unknown) => {
        console.error('⚠️ Network or Parsing Error:', err)
        setFactories([])
      })
  }, [authorized])

  /* ── Load Scan Points (preserved) ── */
  useEffect(() => {
    if (!authorized || !selectedFactory) return
    getScanPointsByFactory(selectedFactory)
      .then((data: ScanPoint[]) => {
        setScanPoints(Array.isArray(data) ? data : [])
      })
      .catch((err: unknown) => {
        console.error('Failed to load scan points:', err)
        setScanPoints([])
      })
  }, [authorized, selectedFactory])

  /* ── Filter (preserved) ── */
  const visibleScanPoints = scanPoints.filter(sp => {
    if (statusFilter === 'Active'   && !sp.is_active) return false
    if (statusFilter === 'Inactive' &&  sp.is_active) return false
    if (priorityFilter !== 'All' && sp.risk_level !== priorityFilter) return false
    return true
  })

  /* ── Auth guard loading ── */
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

          {/* ── Header ── */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                <ScanLine className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Scan Points
                </h1>
                <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                  Manage and monitor location checkpoints
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => { setEditingScanPoint(null); setIsFormOpen(true) }}
              className="btn-primary flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Scan Point
            </motion.button>
          </motion.div>

          {/* ── Filters Toolbar ── */}
          <motion.div variants={itemVariants}>
            <GlassCard className="mb-6">
              <div className="flex flex-wrap gap-6 items-end">

                {/* Factory */}
                <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                  <label className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">
                    Factory Location
                  </label>
                  <select
                    value={selectedFactory}
                    onChange={e => setSelectedFactory(e.target.value)}
                    disabled={factories.length === 0}
                    className="input-modern disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {factories.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                    {factories.length === 0 && (
                      <option value="" disabled>No factories available</option>
                    )}
                  </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                  <label className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                    className="input-modern"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Risk */}
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                  <label className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">
                    Risk Level
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value as PriorityFilter)}
                    className="input-modern"
                  >
                    <option value="All">All Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Table ── */}
          <motion.div variants={itemVariants}>
            <GlassCard noPadding className="overflow-hidden">
              <ScanPointsTable
                scanPoints={visibleScanPoints}
                onEdit={(sp: ScanPoint) => {
                  setEditingScanPoint(sp)
                  setIsFormOpen(true)
                }}
                onDisable={async (id: string) => {
                  try {
                    const updated = await updateScanPoint(id, { is_active: false })
                    setScanPoints(prev =>
                      prev.map(sp => sp.id === id ? { ...sp, ...updated } : sp)
                    )
                  } catch (err: unknown) {
                    console.error('Failed to disable scan point:', err)
                  }
                }}
              />
            </GlassCard>
          </motion.div>

        </motion.div>

        {/* ── Form Modal (preserved) ── */}
        {isFormOpen && (
          <ScanPointForm
            scanPoint={editingScanPoint}
            onClose={() => setIsFormOpen(false)}
            onSubmit={async (data: Partial<ScanPoint>) => {
              try {
                if (editingScanPoint) {
                  const updated = await updateScanPoint(editingScanPoint.id, data)
                  setScanPoints(prev =>
                    prev.map(sp =>
                      sp.id === editingScanPoint.id ? { ...sp, ...updated } : sp
                    )
                  )
                } else {
                  const created = await createScanPoint({ ...data, factory_id: selectedFactory })
                  setScanPoints(prev => [...prev, created])
                }
              } catch (err: unknown) {
                console.error('Failed to save scan point:', err)
              } finally {
                setIsFormOpen(false)
                setEditingScanPoint(null)
              }
            }}
          />
        )}
      </PageContainer>
    </PageTransition>
  )
}