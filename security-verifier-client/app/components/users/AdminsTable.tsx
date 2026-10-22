'use client'

import React from 'react'
import { SpotlightCard } from '../ui/SpotlightCard'
import { AdminUser, deleteAdminUser } from '@/app/api/admins.api'
import { ShieldCheck, Crown, Lock, Trash2 } from 'lucide-react'

interface AdminsTableProps {
  admins: AdminUser[]
  onRefresh: () => Promise<void>
}

export default function AdminsTable({ admins, onRefresh }: AdminsTableProps) {
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${name}?`)) return

    try {
      await deleteAdminUser(id)
      await onRefresh()
    } catch (err) {
      alert('Failed to remove admin')
    }
  }

  return (
    <SpotlightCard className="shadow-sm overflow-hidden w-full p-0">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Admin ID
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Administrative Tier
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PIN / Security Key
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-slate-100">
          {admins.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="bg-purple-50 p-3 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">No administrators registered</p>
                  <p className="text-xs text-slate-400">Click &ldquo;Add Admin&rdquo; above to grant administrative privileges.</p>
                </div>
              </td>
            </tr>
          ) : (
            admins.map((admin) => (
              <tr
                key={admin.id}
                className="hover:bg-slate-50/80 transition-colors duration-150 group"
              >
                {/* ID */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-slate-800">
                  {admin.user_id}
                </td>

                {/* Name */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                  {admin.name}
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {admin.role === 'MD' || admin.role === 'CEO' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      Managing Director (MD) • Superior
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      System Admin
                    </span>
                  )}
                </td>

                {/* PIN - Strictly Masked (No reveal button for Admin privacy) */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div className="inline-flex items-center gap-1.5 font-mono bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-xs">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>••••</span>
                    <span className="text-[10px] text-slate-400 ml-1">(Private)</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(admin.id, admin.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Admin Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </SpotlightCard>
  )
}
