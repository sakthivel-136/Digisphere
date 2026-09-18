'use client'

import { useEffect, useState } from 'react'
import { getSecurityUsers } from '@/app/api/securityUsers.api'
import { getFactories } from '@/app/api/factories.api'
import UsersTable from '@/app/components/users/UsersTable'
import UserForm from '@/app/components/users/UserForm'
import { SecurityUser } from '@/app/types/securityUser'
import { useAuthGuard } from '@/app/services/auth.guard'
import { StaggeredList, StaggeredItem } from '@/app/components/ui/LayoutOrchestration'

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
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SecurityUser | null>(null)

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
      <div className="p-6 text-slate-400 min-h-screen bg-slate-50 flex items-center justify-center">
        Checking access...
      </div>
    )
  }

  return (
    <StaggeredList className="min-h-screen bg-slate-50 p-8 font-sans">
      {/* HEADER SECTION */}
      <StaggeredItem className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Users</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and register factory operators and portal admins</p>
        </div>
        
        <button
          onClick={handleAddUser}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          <span>Add Security User</span>
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </StaggeredItem>

      <StaggeredItem className="max-w-7xl mx-auto">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-medium">Loading user management...</p>
          </div>
        ) : (
          <UsersTable
            users={users}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onRefresh={loadData}
          />
        )}
      </StaggeredItem>

      {isFormOpen && (
        <UserForm
          user={editingUser}
          factories={factories}
          onClose={() => setIsFormOpen(false)}
          onSave={loadData}
        />
      )}
    </StaggeredList>
  )
}


