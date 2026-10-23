'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Check,
  Sparkles,
  Search,
} from 'lucide-react';

import { useAuthGuard } from '@/app/services/auth.guard';
import { useFactory } from '@/app/context/FactoryContext';
import { PageTransition } from '@/app/components/layout/PageTransition';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { containerVariants, itemVariants } from '@/lib/animations';
import {
  Shift,
  ShiftGuardAllocation,
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getShiftGuards,
  allocateShiftGuards,
} from '@/app/api/shifts.api';

// Format HH:mm into 12-hour format with AM/PM
function format12h(timeStr: string): string {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

export default function ShiftsPage() {
  const { authorized } = useAuthGuard({ allowedRoles: ['ADMIN'] });
  const { factories, selectedFactory, selectedFactoryName } = useFactory();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Modal States ────────────────────────────────────────────────────────────
  // Create / Edit Shift Modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formShiftName, setFormShiftName] = useState('');
  const [formShiftCode, setFormShiftCode] = useState('DAY');
  const [formStartTime, setFormStartTime] = useState('06:00');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formScanInterval, setFormScanInterval] = useState(45);
  const [formScanWindow, setFormScanWindow] = useState(25);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingShift, setIsSavingShift] = useState(false);

  // Guard Allocation Modal
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocatingShift, setAllocatingShift] = useState<Shift | null>(null);
  const [allocationData, setAllocationData] = useState<ShiftGuardAllocation | null>(null);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [guardSearch, setGuardSearch] = useState('');
  const [isSavingAlloc, setIsSavingAlloc] = useState(false);
  const [loadingAlloc, setLoadingAlloc] = useState(false);

  // Delete Confirmation Modal
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  // ─── Load Shifts ─────────────────────────────────────────────────────────────
  const loadShifts = useCallback(async (factoryCode = selectedFactory) => {
    try {
      setLoading(true);
      const data = await getShifts(factoryCode);
      setShifts(data);
    } catch (err: any) {
      console.error('Failed to load shifts:', err);
      showToast('error', 'Unable to fetch factory shifts.');
    } finally {
      setLoading(false);
    }
  }, [selectedFactory]);

  useEffect(() => {
    if (authorized && selectedFactory) {
      loadShifts(selectedFactory);
    }
  }, [authorized, selectedFactory, loadShifts]);

  // ─── Handle Open Create / Edit ───────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingShift(null);
    setFormShiftName('');
    setFormShiftCode('DAY');
    setFormStartTime('06:00');
    setFormEndTime('18:00');
    setFormScanInterval(45);
    setFormScanWindow(25);
    setFormError(null);
    setIsShiftModalOpen(true);
  };

  const handleOpenEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setFormShiftName(shift.shift_name);
    setFormShiftCode(shift.shift_code);
    setFormStartTime(shift.start_time);
    setFormEndTime(shift.end_time);
    setFormScanInterval(shift.scan_interval_mins || 45);
    setFormScanWindow(shift.scan_window_mins || 25);
    setFormError(null);
    setIsShiftModalOpen(true);
  };

  // ─── Submit Shift Form ───────────────────────────────────────────────────────
  const handleSubmitShiftForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formShiftName.trim()) {
      setFormError('Shift name is required.');
      return;
    }
    if (!formStartTime || !formEndTime) {
      setFormError('Start time and end time are required.');
      return;
    }

    try {
      setIsSavingShift(true);
      if (editingShift) {
        const updated = await updateShift(editingShift.id, {
          shift_name: formShiftName.trim(),
          shift_code: formShiftCode,
          start_time: formStartTime,
          end_time: formEndTime,
          scan_interval_mins: formScanInterval,
          scan_window_mins: formScanWindow,
        });
        setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast('success', `Shift "${updated.shift_name}" updated successfully.`);
      } else {
        const created = await createShift({
          factory_code: selectedFactory,
          shift_name: formShiftName.trim(),
          shift_code: formShiftCode,
          start_time: formStartTime,
          end_time: formEndTime,
          scan_interval_mins: formScanInterval,
          scan_window_mins: formScanWindow,
          is_active: 1,
        });
        setShifts((prev) => [...prev, created]);
        showToast('success', `Shift "${created.shift_name}" created successfully.`);
      }
      setIsShiftModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save shift.');
    } finally {
      setIsSavingShift(false);
    }
  };

  // ─── Delete Shift ────────────────────────────────────────────────────────────
  const handleConfirmDeleteShift = async () => {
    if (!deletingShift) return;
    try {
      await deleteShift(deletingShift.id);
      setShifts((prev) => prev.filter((s) => s.id !== deletingShift.id));
      showToast('success', `Shift "${deletingShift.shift_name}" deleted.`);
      setDeletingShift(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete shift.');
    }
  };

  // ─── Guard Allocation Modal Open & Save ──────────────────────────────────────
  const handleOpenAllocModal = async (shift: Shift) => {
    setAllocatingShift(shift);
    setIsAllocModalOpen(true);
    setLoadingAlloc(true);
    setGuardSearch('');
    try {
      const data = await getShiftGuards(shift.id);
      setAllocationData(data);
      setSelectedGuardIds(data.allocated_security_ids || []);
    } catch (err: any) {
      showToast('error', err.message || 'Could not load shift guard data.');
      setIsAllocModalOpen(false);
    } finally {
      setLoadingAlloc(false);
    }
  };

  const handleToggleGuard = (securityId: string) => {
    setSelectedGuardIds((prev) =>
      prev.includes(securityId) ? prev.filter((id) => id !== securityId) : [...prev, securityId]
    );
  };

  const handleSelectAllGuards = () => {
    if (!allocationData) return;
    const allIds = allocationData.all_factory_guards.map((g) => g.security_id);
    setSelectedGuardIds(allIds);
  };

  const handleClearAllGuards = () => {
    setSelectedGuardIds([]);
  };

  const handleSaveAllocations = async () => {
    if (!allocatingShift) return;
    try {
      setIsSavingAlloc(true);
      await allocateShiftGuards(allocatingShift.id, selectedGuardIds);
      showToast(
        'success',
        `Assigned ${selectedGuardIds.length} guards to ${allocatingShift.shift_name}.`
      );
      setIsAllocModalOpen(false);
      // Reload shifts to update allocation count badge
      await loadShifts(selectedFactory);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save guard allocations.');
    } finally {
      setIsSavingAlloc(false);
    }
  };

  // Filter shifts based on search query
  const filteredShifts = useMemo(() => {
    if (!searchQuery.trim()) return shifts;
    const q = searchQuery.toLowerCase();
    return shifts.filter(
      (s) =>
        s.shift_name.toLowerCase().includes(q) ||
        s.start_time.includes(q) ||
        s.end_time.includes(q) ||
        s.shift_code.toLowerCase().includes(q)
    );
  }, [shifts, searchQuery]);

  if (!authorized) {
    return (
      <PageTransition>
        <PageLoadingSpinner label="Verifying access..." />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageContainer>
        <motion.div variants={containerVariants} initial="initial" animate="animate">
          {/* Floating Toast Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-xl border ${
                  notification.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                )}
                <span className="text-sm font-semibold">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-sm">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Shift Operations & Authorization
                </h1>
                <p className="text-sm font-medium text-slate-600 mt-0.5">
                  Configure shift timings, scan windows, and enforce guard mobile login permissions
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => loadShifts(selectedFactory)}
                disabled={loading}
                className="btn-secondary !text-slate-700 hover:!text-slate-900 font-semibold"
              >
                <RefreshCw className={`h-4 w-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleOpenCreateModal}
                className="btn-primary font-bold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Shift
              </motion.button>
            </div>
          </motion.div>

          {/* Quick Informational Notice */}
          <motion.div
            variants={itemVariants}
            className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/90 p-4.5 flex items-start gap-3.5 shadow-xs"
          >
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              <strong className="font-bold text-slate-950">
                Shift Authorization Enforcement:
              </strong>{' '}
              Security guards are verified against their assigned shift upon logging into the mobile app. Guards attempting to log in outside their allocated shift will be denied access. By default, all factory guards are permitted in both shifts until custom allocations are saved.
            </div>
          </motion.div>

          {/* Search bar */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search shift by name, code or timing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-medium transition-all"
              />
            </div>
          </motion.div>

          {/* Shifts Cards Grid */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <p className="text-sm font-semibold text-slate-600">Loading factory shifts...</p>
              </div>
            ) : filteredShifts.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold text-slate-900">No Shifts Configured</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  No shifts found matching your search. Click &quot;Add Shift&quot; above to create a shift schedule.
                </p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredShifts.map((shift) => {
                  const isNight =
                    shift.shift_code === 'NIGHT' ||
                    shift.shift_name.toLowerCase().includes('night') ||
                    shift.start_time >= '18:00';

                  const hasAlloc = (shift.allocated_guards_count || 0) > 0;

                  return (
                    <div
                      key={shift.id}
                      className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between relative z-10 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`p-3 rounded-xl shadow-xs ${
                              isNight
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isNight ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                {shift.shift_name}
                              </h3>
                              <span
                                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                                  isNight
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {shift.shift_code}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              Factory: <span className="font-mono font-bold text-slate-800">{shift.factory_code}</span>
                            </p>
                          </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(shift)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit shift details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingShift(shift)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete shift"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Operational Timings Box */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Operating Window
                          </span>
                          <p className="text-lg font-black font-mono text-slate-900 mt-1">
                            {format12h(shift.start_time)} – {format12h(shift.end_time)}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            24h: {shift.start_time} to {shift.end_time}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                            App Scan Window
                          </span>
                          <p className="text-lg font-black font-mono text-emerald-700 mt-1">
                            {shift.scan_window_mins || 25} mins
                          </p>
                          <p className="text-xs font-medium text-emerald-700 mt-0.5">
                            Interval: {shift.scan_interval_mins || 45} mins
                          </p>
                        </div>
                      </div>

                      {/* Guard Allocation Status */}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <div className="text-xs">
                            {hasAlloc ? (
                              <span className="text-slate-700 font-medium">
                                Assigned Guards:{' '}
                                <strong className="font-bold font-mono text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                                  {shift.allocated_guards_count} Guards
                                </strong>
                              </span>
                            ) : (
                              <span className="text-slate-600 font-medium italic">
                                All factory guards permitted (Default)
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenAllocModal(shift)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-all shadow-sm active:scale-95"
                        >
                          <UserCheck className="w-4 h-4" />
                          Allocate Guards
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ──────────────── MODAL: Create / Edit Shift ──────────────── */}
          <AnimatePresence>
            {isShiftModalOpen && (
              <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsShiftModalOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-7 shadow-2xl z-10"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[var(--primary-muted)] text-[var(--primary)]">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[var(--foreground)]">
                          {editingShift ? `Edit ${editingShift.shift_name}` : 'Create New Shift'}
                        </h3>
                        <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                          Factory: <span className="font-semibold text-[var(--foreground)] font-mono">{selectedFactory}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsShiftModalOpen(false)}
                      className="p-2 rounded-xl text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {formError && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitShiftForm} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Morning Shift"
                          value={formShiftName}
                          onChange={(e) => setFormShiftName(e.target.value)}
                          className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Code</label>
                        <select
                          value={formShiftCode}
                          onChange={(e) => setFormShiftCode(e.target.value)}
                          className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="DAY">DAY (Morning)</option>
                          <option value="NIGHT">NIGHT (Night)</option>
                          <option value="AFTERNOON">AFTERNOON</option>
                          <option value="RELIEVER">RELIEVER</option>
                          <option value="GENERAL">GENERAL</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time (24h)</label>
                        <input
                          type="time"
                          required
                          value={formStartTime}
                          onChange={(e) => setFormStartTime(e.target.value)}
                          className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                          12h: {format12h(formStartTime)}
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Time (24h)</label>
                        <input
                          type="time"
                          required
                          value={formEndTime}
                          onChange={(e) => setFormEndTime(e.target.value)}
                          className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                          12h: {format12h(formEndTime)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scan Interval (min)</label>
                        <input
                          type="number"
                          min={10}
                          max={180}
                          value={formScanInterval}
                          onChange={(e) => setFormScanInterval(Number(e.target.value))}
                          className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scan Window (min)</label>
                        <input
                          type="number"
                          min={5}
                          max={90}
                          value={formScanWindow}
                          onChange={(e) => setFormScanWindow(Number(e.target.value))}
                          className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setIsShiftModalOpen(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingShift}
                        className="btn-primary"
                      >
                        {isSavingShift ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Shift Settings'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ──────────────── MODAL: Guard Shift Allocation ──────────────── */}
          <AnimatePresence>
            {isAllocModalOpen && (
              <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAllocModalOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-7 shadow-2xl z-10 max-h-[92vh] flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[var(--foreground)]">
                          Allocate Guards to {allocatingShift?.shift_name}
                        </h3>
                        <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-0.5">
                          Operating:{' '}
                          <span className="font-mono font-semibold">
                            {format12h(allocatingShift?.start_time || '')} –{' '}
                            {format12h(allocatingShift?.end_time || '')}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAllocModalOpen(false)}
                      className="p-2 rounded-xl text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Informational Guidance */}
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 shrink-0">
                    <strong>Shift Login Rule:</strong> Only guards checked below will be authorized to log in to the mobile app during this shift. Unchecked guards will be blocked with an active shift error.
                  </div>

                  {/* Search & Bulk Select Toolbar */}
                  <div className="mt-3 flex items-center justify-between gap-2 shrink-0">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
                      <input
                        type="text"
                        placeholder="Filter guards by name or ID..."
                        value={guardSearch}
                        onChange={(e) => setGuardSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllGuards}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[11px] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllGuards}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[11px] font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Guards Checklist */}
                  <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-64 border border-[var(--border)] rounded-xl p-2 bg-[var(--surface-muted)]">
                    {loadingAlloc ? (
                      <div className="py-8 flex items-center justify-center gap-2 text-xs text-[var(--foreground-muted)]">
                        <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
                        Loading factory guards...
                      </div>
                    ) : allocationData?.all_factory_guards.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--foreground-muted)]">
                        No security guards registered under factory {selectedFactory}.
                      </div>
                    ) : (
                      allocationData?.all_factory_guards
                        .filter(
                          (g) =>
                            g.security_name.toLowerCase().includes(guardSearch.toLowerCase()) ||
                            g.security_id.toLowerCase().includes(guardSearch.toLowerCase())
                        )
                        .map((g) => {
                          const isChecked = selectedGuardIds.includes(g.security_id);
                          return (
                            <label
                              key={g.security_id}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${
                                isChecked
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleGuard(g.security_id)}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {g.security_name}
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    ID: {g.security_id}
                                  </p>
                                </div>
                              </div>
                              {isChecked && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                                  Authorized
                                </span>
                              )}
                            </label>
                          );
                        })
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Selected: <strong className="font-bold text-slate-900 dark:text-white">{selectedGuardIds.length}</strong> guards
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAllocModalOpen(false)}
                        className="btn-secondary !py-1.5 !px-3 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingAlloc}
                        onClick={handleSaveAllocations}
                        className="btn-primary !py-1.5 !px-4 text-xs !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-600/20"
                      >
                        {isSavingAlloc ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Save Allocation ({selectedGuardIds.length})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ──────────────── MODAL: Delete Confirmation ──────────────── */}
          <AnimatePresence>
            {deletingShift && (
              <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDeletingShift(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl z-10"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 flex items-center justify-center mb-4">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Shift?</h3>
                  <p className="text-sm text-[var(--foreground-muted)] mt-2 leading-relaxed">
                    Are you sure you want to delete{' '}
                    <strong className="text-[var(--foreground)]">{deletingShift.shift_name}</strong>?
                    This will remove this shift timetable and clear all guard allocations assigned to it.
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDeletingShift(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteShift}
                      className="btn-primary !bg-rose-600 hover:!bg-rose-700 !shadow-rose-600/20"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </PageContainer>
    </PageTransition>
  );
}
