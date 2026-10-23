'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { createAdminUser, checkPinUnique, CreateAdminPayload } from '@/app/api/admins.api'
import { ShieldCheck, Crown, KeyRound, UserCheck, AlertCircle } from 'lucide-react'

interface AdminFormProps {
  onClose: () => void
  onSave: () => void
}

export default function AdminForm({ onClose, onSave }: AdminFormProps) {
  const [formData, setFormData] = useState<CreateAdminPayload>({
    user_id: '',
    name: '',
    user_pin: '',
    role: 'ADMIN',
  })
  const [submitting, setSubmitting] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (name === 'user_pin') {
      const numericVal = value.replace(/\D/g, '').slice(0, 4)
      setFormData(prev => ({ ...prev, user_pin: numericVal }))
      if (numericVal.length === 4) {
        setPinError(null)
      }
      return
    }

    if (name === 'user_id') {
      setUserError(null)
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPinError(null)
    setUserError(null)

    const userId = formData.user_id.trim().toLowerCase()
    const name = formData.name.trim()
    const pin = formData.user_pin.trim()

    if (!userId) {
      setUserError('Admin Username / ID is required')
      return
    }

    if (!name) {
      alert('Admin Full Name is required')
      return
    }

    if (!/^\d{4}$/.test(pin)) {
      setPinError('Admin PIN must be exactly 4 numeric digits (e.g. 2005)')
      return
    }

    setSubmitting(true)

    try {
      // 1. Verify 4-digit PIN uniqueness
      const pinCheck = await checkPinUnique(pin)
      if (!pinCheck.isUnique) {
        setPinError(pinCheck.message || 'This PIN is already assigned. Please try another unique 4-digit PIN.')
        setSubmitting(false)
        return
      }

      // 2. Create Admin user
      await createAdminUser({
        user_id: userId,
        name: name,
        user_pin: pin,
        role: formData.role,
      })

      onSave()
      onClose()
    } catch (err: unknown) {
      console.error('Failed to create admin:', err)
      if (err instanceof Error) {
        if (err.message.includes('already taken')) {
          setUserError(err.message)
        } else {
          alert(err.message)
        }
      } else {
        alert('Failed to register admin')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mt-20 border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            {formData.role === 'MD' ? (
              <Crown className="h-5 w-5 text-amber-600" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {formData.role === 'MD' ? 'Register Managing Director (MD)' : 'Add System Admin'}
            </h2>
            <p className="text-xs text-slate-500">
              {formData.role === 'MD'
                ? 'Managing Director / CEO with universal master authority'
                : 'Portal operator for security rounds & reporting'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Administrative Tier / Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                  formData.role === 'ADMIN'
                    ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={formData.role === 'ADMIN'}
                  onChange={handleChange}
                  className="text-purple-600"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Admin</span>
                  <span className="block text-[10px] text-slate-500">Standard Ops</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                  formData.role === 'MD'
                    ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="MD"
                  checked={formData.role === 'MD'}
                  onChange={handleChange}
                  className="text-amber-600"
                />
                <div>
                  <span className="block text-xs font-bold text-amber-900 flex items-center gap-1">
                    MD / CEO
                  </span>
                  <span className="block text-[10px] text-amber-700">Master Superior</span>
                </div>
              </label>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Admin Login ID / Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                className={`w-full border p-2.5 rounded-lg text-sm font-mono focus:ring-2 outline-none ${
                  userError ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-slate-200 focus:ring-purple-500'
                }`}
                placeholder="e.g. godwin or ceo_admin"
                required
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            {userError && <p className="text-xs text-red-600 font-medium mt-1">{userError}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g. GODWIN or SAKTHIVEL"
              required
            />
          </div>

          {/* 4-Digit Unique PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              4-Digit Unique PIN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="user_pin"
                value={formData.user_pin}
                onChange={handleChange}
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full border p-2.5 rounded-lg text-sm font-mono tracking-widest text-center text-lg focus:ring-2 outline-none ${
                  pinError ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-slate-200 focus:ring-purple-500'
                }`}
                placeholder="•••• (4 digits)"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            {pinError ? (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {pinError}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Must be an exact 4-digit unique numeric PIN. Used for dashboard & mobile login.
              </p>
            )}
          </div>

          {/* Actions */}
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
              className={`px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm text-white disabled:opacity-50 ${
                formData.role === 'MD' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {submitting ? 'Checking PIN...' : formData.role === 'MD' ? 'Save MD Admin' : 'Save Admin'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
