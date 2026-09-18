'use client'

import { useState } from "react"
import { SpotlightCard } from "../ui/SpotlightCard"
import { deleteSecurityUser } from '@/app/api/securityUsers.api'
import { SecurityUser } from '@/app/types/securityUser'

interface UsersTableProps {
  users: SecurityUser[]
  onAddUser: () => void
  onEditUser: (user: SecurityUser) => void
  onRefresh: () => Promise<void>
}

export default function UsersTable({
  users,
  onEditUser,
  onRefresh,
}: UsersTableProps) {

  const [visiblePasswords, setVisiblePasswords] =
    useState<Record<string, boolean>>({})

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return

    try {
      await deleteSecurityUser(id)
      await onRefresh()
    } catch (err) {
      alert('Delete failed')
    }
  }

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <SpotlightCard className="shadow-sm overflow-hidden w-full p-0">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Password
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Factory
            </th>
            <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-slate-100">
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="bg-slate-50 p-3 rounded-full">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">No security users found</p>
                  <p className="text-xs text-slate-400">Click the button above to add a user to the system.</p>
                </div>
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr 
                key={user.security_id} 
                className="hover:bg-slate-50 transition-colors duration-150 group"
              >
                {/* ID */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-slate-800">
                  {user.security_id}
                </td>

                {/* Name */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                  {user.security_name}
                </td>

                {/* Password */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                      {visiblePasswords[user.security_id] ? user.security_password : '••••••'}
                    </span>
                    <button
                      onClick={() => togglePassword(user.security_id)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title={visiblePasswords[user.security_id] ? "Hide Password" : "Show Password"}
                    >
                      👁️
                    </button>
                  </div>
                </td>

                {/* Factory */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded text-xs">
                    {user.factory}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.security_id)}
                      className="text-slate-600 hover:text-red-600 transition-colors duration-200 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </SpotlightCard>
  )
}

