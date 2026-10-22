'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getSecurityUsers } from '@/app/api/securityUsers.api'
import { getFactories } from '@/app/api/factories.api'
import { getAdminUsers, AdminUser } from '@/app/api/admins.api'
import UsersTable from '@/app/components/users/UsersTable'
import AdminsTable from '@/app/components/users/AdminsTable'
import UserForm from '@/app/components/users/UserForm'
import AdminForm from '@/app/components/users/AdminForm'
import { SecurityUser } from '@/app/types/securityUser'
import { useAuthGuard } from '@/app/services/auth.guard'
import { PageTransition } from '@/app/components/layout/PageTransition'
import { PageContainer } from '@/app/components/layout/PageContainer'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Plus, Users, ShieldCheck, Clock, UserCheck } from 'lucide-react'

interface Factory {
  factory_code: string
  factory_name: string
  location?: string | null
}

export default function UserCrudPage() {
  const { authorized } = useAuthGuard()
  const [viewMode, setViewMode] = useState<'SECURITY' | 'ADMIN'>('SECURITY')

  const [users, setUsers] = useState<SecurityUser[]>([])
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [factories, setFactories] = useState<Factory[]>([])

  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SecurityUser | null>(null)

  // 2-Minute Auto-Revert Timer for Admin View
  const [adminTimerSeconds, setAdminTimerSeconds] = useState(120)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const stopAdminTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAdminTimer = useCallback(() => {
    stopAdminTimer()
    setAdminTimerSeconds(120) // 2 minutes
    timerRef.current = setInterval(() => {
      setAdminTimerSeconds(prev => {
        if (prev <= 1) {
          stopAdminTimer()
          setViewMode('SECURITY')
          return 120
        }
        return prev - 1
      })
    }, 1000)
  }, [stopAdminTimer])

  useEffect(() => {
    if (viewMode === 'ADMIN') {
      startAdminTimer()
    } else {
      stopAdminTimer()
    }
    return () => stopAdminTimer()
  }, [viewMode, startAdminTimer, stopAdminTimer])

  // Load both security users and admins
  const loadData = useCallback(async () => {
    if (!authorized) return
    try {
      setLoading(true)
      const [u, f, a] = await Promise.all([
        getSecurityUsers(),
        getFactories(),
        getAdminUsers().catch(() => []),
      ])
      setUsers(u)
      setFactories(f?.data || f || [])
      setAdmins(a)
    } catch (error) {
      console.error('Failed to load users data:', error)
    } finally {
      setLoading(false)
    }
  }, [authorized])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddUser = () => {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  const handleEditUser = (user: SecurityUser) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleToggleView = () => {
    if (viewMode === 'SECURITY') {
      setViewMode('ADMIN')
    } else {
      setViewMode('SECURITY')
    }
  }

  if (!authorized) {
    return (
      <PageTransition>
        <PageLoadingSpinner label="Checking access…" />
      </PageTransition>
    )
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <PageTransition>
      <PageContainer>
        <motion.div variants={containerVariants} initial="initial" animate="animate">

          {/* Page Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  viewMode === 'ADMIN' ? 'bg-purple-100' : 'bg-blue-100'
                }`}
              >
                {viewMode === 'ADMIN' ? (
                  <ShieldCheck className="h-6 w-6 text-purple-700" />
                ) : (
                  <Users className="h-6 w-6 text-blue-700" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {viewMode === 'ADMIN' ? 'Portal Administrators' : 'Security Guard Users'}
                  </h1>
                  {viewMode === 'ADMIN' && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                      Privileged View
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {viewMode === 'ADMIN'
                    ? 'Manage system operators & Managing Directors (MD). PINs are strictly hidden for privacy.'
                    : 'Manage active factory patrol officers and 4-digit security login PINs.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">

              {/* View Toggle */}
              <button
                onClick={handleToggleView}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  viewMode === 'ADMIN'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {viewMode === 'ADMIN' ? (
                  <>
                    <UserCheck className="w-4 h-4 text-amber-700" />
                    <span>Back to Security Users</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Show Admins</span>
                  </>
                )}
              </button>

              {/* Add Security User Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                Add Security User
              </motion.button>

              {/* Add Admin Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsAdminFormOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                Add Admin
              </motion.button>
            </div>
          </motion.div>

          {/* Active Auto-Revert Notice when on Admin Mode */}
          <AnimatePresence>
            {viewMode === 'ADMIN' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5 text-xs text-purple-900 font-medium">
                  <ShieldCheck className="w-4 h-4 text-purple-700 flex-shrink-0" />
                  <span>
                    <strong>Admin Directory Active:</strong> Sensitive PINs are protected. View auto-reverts to Security Users in 2 minutes for security compliance.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full text-xs font-mono font-bold text-purple-700 border border-purple-200 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                  <span>{formatTimer(adminTimerSeconds)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Content */}
          <motion.div variants={itemVariants}>
            {loading && users.length === 0 ? (
              <GlassCard className="flex items-center justify-center py-16">
                <PageLoadingSpinner label="Loading directory…" />
              </GlassCard>
            ) : viewMode === 'ADMIN' ? (
              <AdminsTable
                admins={admins}
                onRefresh={loadData}
              />
            ) : (
              <UsersTable
                users={users}
                onAddUser={handleAddUser}
                onEditUser={handleEditUser}
                onRefresh={loadData}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Security User Modal */}
        {isFormOpen && (
          <UserForm
            user={editingUser}
            factories={factories}
            onClose={() => setIsFormOpen(false)}
            onSave={loadData}
          />
        )}

        {/* Admin Modal */}
        {isAdminFormOpen && (
          <AdminForm
            onClose={() => setIsAdminFormOpen(false)}
            onSave={loadData}
          />
        )}
      </PageContainer>
    </PageTransition>
  )
}
