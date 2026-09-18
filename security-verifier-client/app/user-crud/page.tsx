'use client'

import { useEffect, useState } from 'react'
import { getSecurityUsers } from '@/app/api/securityUsers.api'
import { getFactories } from '@/app/api/factories.api'
import UsersTable from '@/app/components/users/UsersTable'
import UserForm from '@/app/components/users/UserForm'
import { SecurityUser } from '@/app/types/securityUser'
import { useAuthGuard } from '@/app/services/auth.guard'
import { PageTransition } from '@/app/components/layout/PageTransition'
import { PageContainer } from '@/app/components/layout/PageContainer'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Plus, Users } from 'lucide-react'

interface Factory {
  factory_code: string
  factory_name: string
  location?: string | null
}

export default function UserCrudPage() {
  const { authorized } = useAuthGuard()
  const [users, setUsers] = useState<SecurityUser[]>([])
  const [factories, setFactories] = useState<Factory[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SecurityUser | null>(null)

  // ── All handlers preserved exactly ──
  const loadData = async () => {
    if (!authorized) return
    try {
      setLoading(true)
      const [u, f] = await Promise.all([getSecurityUsers(), getFactories()])
      setUsers(u)
      setFactories(f?.data || f || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized])

  const handleAddUser = () => {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  const handleEditUser = (user: SecurityUser) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

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

          {/* Page Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  System Users
                </h1>
                <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                  Manage and register factory operators and portal admins
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={handleAddUser}
              className="btn-primary flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Security User
            </motion.button>
          </motion.div>

          {/* Table Content */}
          <motion.div variants={itemVariants}>
            {loading && users.length === 0 ? (
              <GlassCard className="flex items-center justify-center py-16">
                <PageLoadingSpinner label="Loading users…" />
              </GlassCard>
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

        {/* Modal (outside motion.div to avoid stacking context issues) */}
        {isFormOpen && (
          <UserForm
            user={editingUser}
            factories={factories}
            onClose={() => setIsFormOpen(false)}
            onSave={loadData}
          />
        )}
      </PageContainer>
    </PageTransition>
  )
}
