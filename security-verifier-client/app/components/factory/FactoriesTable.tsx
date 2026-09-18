'use client'

import { useEffect, useState } from "react"
import { SpotlightCard } from "../ui/SpotlightCard"
import { ShimmerSkeleton } from "../ui/LayoutOrchestration"
import { FactoryForm } from './FactoryForm'
import {
  getFactories,
  createFactory,
  updateFactory,
  deleteFactory as deleteFactoryApi,
} from '@/app/api/factories.api'

interface Factory {
  id: string
  name: string
  location?: string
  address?: string
}

export const FactoriesTable = () => {

  /* ================= STATE ================= */

  const [factories, setFactories] = useState<Factory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editAddress, setEditAddress] = useState('')

  /* ================= LOAD ================= */

  const loadFactories = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await getFactories()
      const data = res.data || res

      const normalized = data.map((f: any) => ({
        id: f.factory_code,
        name: f.factory_name,
        location: f.location || '',
        address: f.factory_address || '',
      }))

      setFactories(normalized)

    } catch (err: any) {
      console.error(err)
      setError('Failed to load factories')
    } finally {
      setLoading(false)
    }
  }

  /* ================= CREATE ================= */

  const addFactory = async (payload: {
    name: string
    code: string
    location?: string
    address?: string
  }) => {
    try {
      await createFactory({
        factory_name: payload.name,
        factory_code: payload.code,
        location: payload.location || '',
        factory_address: payload.address || '',
      })
      await loadFactories()
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Create failed'
      alert(errMsg)
    }
  }

  /* ================= UPDATE ================= */

  const saveEdit = async (id: string) => {
    try {
      await updateFactory(id, {
        factory_name: editName,
        factory_code: id,
        location: editLocation,
        factory_address: editAddress,
      })
      setEditingId(null)
      await loadFactories()
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Update failed'
      alert(errMsg)
    }
  }

  /* ================= DELETE ================= */

  const deleteFactory = async (id: string) => {
    if (!confirm('Delete this factory?')) return

    try {
      await deleteFactoryApi(id)
      await loadFactories()
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Delete failed'
      alert(errMsg)
    }
  }

  /* ================= EDIT ================= */

  const startEdit = (f: Factory) => {
    setEditingId(f.id)
    setEditName(f.name)
    setEditLocation(f.location || '')
    setEditAddress(f.address || '')
  }

  /* ================= INIT ================= */

  useEffect(() => {
    loadFactories()
  }, [])

  /* ================= UI ================= */

  return (
    <div className="space-y-8">
      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Add */}
      <SpotlightCard className="p-6">
        <FactoryForm onSubmit={addFactory} />
      </SpotlightCard>

      {/* Loading */}
      {loading ? (
        <ShimmerSkeleton className="h-64 w-full" />
      ) : (
        /* Table */
        <SpotlightCard className="shadow-sm overflow-hidden w-full p-0">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-100">
              {factories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="bg-slate-50 p-3 rounded-full">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-500">No factories found</p>
                      <p className="text-xs text-slate-400">Add a new factory location to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                factories.map((f) => (
                  <tr 
                    key={f.id} 
                    className="hover:bg-slate-50 transition-colors duration-150 group"
                  >
                    {/* Code */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-slate-800">
                      {f.id}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {editingId === f.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        f.name
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {editingId === f.id ? (
                        <input
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        f.location || '—'
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {editingId === f.id ? (
                        <input
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        f.address || '—'
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        {editingId === f.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(f.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-slate-600 hover:text-slate-800 transition-colors duration-200 font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(f)}
                              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteFactory(f.id)}
                              className="text-slate-600 hover:text-red-600 transition-colors duration-200 font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </SpotlightCard>
      )}
    </div>
  )
}

