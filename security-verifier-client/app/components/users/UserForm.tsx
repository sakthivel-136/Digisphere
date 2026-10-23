'use client'

import {
  useState,
  ChangeEvent,
  FormEvent,
  useMemo,
  useEffect,
} from 'react'

import {
  createSecurityUser,
  updateSecurityUser,
} from '@/app/api/securityUsers.api'
import { checkPinUnique } from '@/app/api/admins.api'

import { SecurityUser } from '@/app/types/securityUser'

interface UserFormProps {
  user: SecurityUser | null
  onClose: () => void
  onSave: () => void
  factories: Array<{ factory_code: string; factory_name: string; location?: string | null }>
  defaultFactory?: string
}

export default function UserForm({
  user,
  onClose,
  onSave,
  factories,
  defaultFactory,
}: UserFormProps) {

  /* ================= DERIVED INITIAL DATA ================= */

  const initialData = useMemo<SecurityUser>(() => ({
    security_id: user?.security_id ?? '',
    security_name: user?.security_name ?? '',
    security_password: user?.security_password ?? '',
    factory: user?.factory ?? defaultFactory ?? factories?.[0]?.factory_code ?? '',
  }), [user, factories, defaultFactory])

  const [formData, setFormData] = useState<SecurityUser>(initialData)
  const [submitting, setSubmitting] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)

  /* ================= SYNC WHEN USER CHANGES ================= */

  useEffect(() => {
    setFormData(initialData)
    setPinError(null)
  }, [initialData])

  /* ================= HANDLE INPUT ================= */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (name === 'security_password') {
      // Allow only numbers, max 4 digits
      const numericVal = value.replace(/\D/g, '').slice(0, 4)
      setFormData(prev => ({ ...prev, security_password: numericVal }))
      if (numericVal.length === 4) {
        setPinError(null)
      }
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPinError(null)

    const password = (formData.security_password ?? '').trim()

    if (!formData.security_id.trim()) {
      alert('Security ID required')
      return
    }

    if (!formData.security_name.trim()) {
      alert('Security name required')
      return
    }

    if (!user && !password) {
      setPinError('A 4-digit unique PIN is required')
      return
    }

    if (password && !/^\d{4}$/.test(password)) {
      setPinError('Security PIN must be exactly 4 numeric digits (e.g. 1038)')
      return
    }

    setSubmitting(true)

    try {
      // Check 4-digit PIN uniqueness across both security guards and admins
      if (password) {
        const pinCheck = await checkPinUnique(password, {
          excludeSecurityId: user?.security_id,
        })
        if (!pinCheck.isUnique) {
          setPinError(pinCheck.message || 'This 4-digit PIN is already taken. Please try another unique PIN.')
          setSubmitting(false)
          return
        }
      }

      if (user) {
        await updateSecurityUser(user.security_id, {
          security_name: formData.security_name,
          factory: formData.factory,
          ...(password ? { security_password: password } : {}),
        })
      } else {
        await createSecurityUser({
          security_id: formData.security_id,
          security_name: formData.security_name,
          security_password: password,
          factory: formData.factory,
        })
      }

      onSave()
      onClose()

    } catch (err: unknown) {
      console.error('Save error:', err)
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert('Error saving security user')
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mt-20 border border-slate-100">

        <h2 className="text-xl font-bold text-slate-800 mb-1">
          {user ? 'Edit Security User' : 'Add Security User'}
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Assign patrol officer credentials and 4-digit PIN
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Security ID <span className="text-red-500">*</span>
            </label>
            <input
              name="security_id"
              value={formData.security_id}
              onChange={handleChange}
              className="w-full border border-slate-200 p-2.5 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 11401038"
              required
              disabled={!!user}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Security Name <span className="text-red-500">*</span>
            </label>
            <input
              name="security_name"
              value={formData.security_name}
              onChange={handleChange}
              className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. THIRUPPATHI A"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              4-Digit Security PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="security_password"
              value={formData.security_password ?? ''}
              onChange={handleChange}
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full border p-2.5 rounded-lg text-sm font-mono tracking-widest text-center text-lg focus:ring-2 outline-none ${
                pinError ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500'
              }`}
              placeholder="•••• (4 digits)"
              required={!user}
            />
            {pinError ? (
              <p className="text-xs text-red-600 font-medium mt-1">{pinError}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Must be an exact 4-digit unique numeric PIN.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Factory Location <span className="text-red-500">*</span>
            </label>
            <select
              name="factory"
              value={formData.factory}
              onChange={handleChange}
              className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              required
            >
              {factories.map(f => (
                <option key={f.factory_code} value={f.factory_code}>
                  {f.factory_code} - {f.factory_name} ({f.location || 'Site'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Verifying PIN...' : user ? 'Update User' : 'Save Security User'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
