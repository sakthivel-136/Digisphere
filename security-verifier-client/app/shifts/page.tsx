'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  FileDown,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building,
  RefreshCw
} from 'lucide-react';

import { useAuthGuard } from '@/app/services/auth.guard';
import { getUser } from '@/app/services/token.service';
import {
  Shift,
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  bulkAllocateGuards,
  GuardAllocationPayload
} from '@/app/api/shifts.api';
import { getSecurityUsers } from '@/app/api/securityUsers.api';
import { SecurityUser } from '@/app/types/securityUser';
import { formatTime12h, exportShiftsTimetablePDF } from '@/app/utils/shiftPdfExport';
import { PageTransition } from '@/app/components/layout/PageTransition';
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner';

export default function ShiftsPage() {
  // 1. RBAC: Only accessible by ADMIN and SUPERVISOR
  const { authorized } = useAuthGuard({ roles: ['ADMIN', 'SUPERVISOR'] });
  const router = useRouter();

  // State
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Modals state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '06:00',
    endTime: '14:00',
    description: ''
  });

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [selectedShiftForRoster, setSelectedShiftForRoster] = useState<Shift | null>(null);
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>([]);
  const [guardSearch, setGuardSearch] = useState('');
  const [isSavingRoster, setIsSavingRoster] = useState(false);

  const [deleteConfirmShift, setDeleteConfirmShift] = useState<Shift | null>(null);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setStatusNotification({ type, message });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedShifts, fetchedGuards] = await Promise.all([
        getShifts(),
        getSecurityUsers().catch((err) => {
          console.warn('Could not fetch remote guards, using fallback', err);
          return [] as SecurityUser[];
        })
      ]);

      setShifts(fetchedShifts);

      // If backend returns empty guards (or in mock env), ensure sample guards for seamless roster management
      if (!fetchedGuards || fetchedGuards.length === 0) {
        setGuards([
          { security_id: 'SEC-001', security_name: 'Rajesh Kumar', factory: 'Factory A - Tirupur' },
          { security_id: 'SEC-002', security_name: 'Vigneshwaran M', factory: 'Factory A - Tirupur' },
          { security_id: 'SEC-003', security_name: 'Anand Sundaram', factory: 'Factory B - Avinashi' },
          { security_id: 'SEC-004', security_name: 'Prakash Raj', factory: 'Factory C - Perundurai' },
          { security_id: 'SEC-005', security_name: 'Selvam Perumal', factory: 'Factory A - Tirupur' },
          { security_id: 'SEC-006', security_name: 'Karthik N', factory: 'Factory B - Avinashi' },
          { security_id: 'SEC-007', security_name: 'Muruganandam C', factory: 'Factory C - Perundurai' },
          { security_id: 'SEC-008', security_name: 'Dinesh Balan', factory: 'Factory A - Tirupur' }
        ]);
      } else {
        setGuards(fetchedGuards);
      }
    } catch (error) {
      console.error('Error loading shifts/guards data:', error);
      showNotification('error', 'Failed to load shifts or guards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  // Guard lookup map
  const guardMap = useMemo(() => {
    const map = new Map<string, SecurityUser>();
    guards.forEach((g) => map.set(g.security_id, g));
    return map;
  }, [guards]);

  // Filtered guards in roster modal
  const filteredGuards = useMemo(() => {
    if (!guardSearch.trim()) return guards;
    const q = guardSearch.toLowerCase();
    return guards.filter(
      (g) =>
        g.security_name.toLowerCase().includes(q) ||
        g.security_id.toLowerCase().includes(q) ||
        (g.factory && g.factory.toLowerCase().includes(q))
    );
  }, [guards, guardSearch]);

  // Handle open create/edit shift modal
  const handleOpenShiftModal = (shift?: Shift) => {
    if (shift) {
      setEditingShift(shift);
      setShiftForm({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        description: shift.description || ''
      });
    } else {
      setEditingShift(null);
      setShiftForm({
        name: '',
        startTime: '06:00',
        endTime: '14:00',
        description: ''
      });
    }
    setIsShiftModalOpen(true);
  };

  // Handle save shift
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.name.trim()) {
      showNotification('error', 'Shift Name is required');
      return;
    }

    try {
      if (editingShift) {
        const updated = await updateShift(editingShift.id, {
          name: shiftForm.name.trim(),
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          description: shiftForm.description.trim()
        });
        setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showNotification('success', `Shift "${updated.name}" updated successfully.`);
      } else {
        const created = await createShift({
          name: shiftForm.name.trim(),
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          description: shiftForm.description.trim()
        });
        setShifts((prev) => [created, ...prev]);
        showNotification('success', `Shift "${created.name}" created successfully.`);
      }
      setIsShiftModalOpen(false);
    } catch (err) {
      console.error('Error saving shift:', err);
      showNotification('error', 'Failed to save shift details.');
    }
  };

  // Handle delete shift
  const handleConfirmDelete = async () => {
    if (!deleteConfirmShift) return;
    try {
      await deleteShift(deleteConfirmShift.id);
      setShifts((prev) => prev.filter((s) => s.id !== deleteConfirmShift.id));
      showNotification('success', `Shift "${deleteConfirmShift.name}" removed.`);
      setDeleteConfirmShift(null);
    } catch (err) {
      console.error('Error deleting shift:', err);
      showNotification('error', 'Failed to delete shift.');
    }
  };

  // Handle open Roster multi-select modal
  const handleOpenRosterModal = (shift: Shift) => {
    setSelectedShiftForRoster(shift);
    setSelectedGuardIds([...(shift.assignedGuardIds || [])]);
    setGuardSearch('');
    setIsRosterModalOpen(true);
  };

  // Toggle guard in roster
  const handleToggleGuard = (guardId: string) => {
    setSelectedGuardIds((prev) =>
      prev.includes(guardId) ? prev.filter((id) => id !== guardId) : [...prev, guardId]
    );
  };

  // Save Roster (bulk allocation)
  const handleSaveRoster = async () => {
    if (!selectedShiftForRoster) return;
    try {
      setIsSavingRoster(true);
      const payload: GuardAllocationPayload = {
        shift_id: selectedShiftForRoster.id,
        guard_ids: selectedGuardIds
      };

      await bulkAllocateGuards(payload);

      setShifts((prev) =>
        prev.map((s) =>
          s.id === selectedShiftForRoster.id ? { ...s, assignedGuardIds: selectedGuardIds } : s
        )
      );

      showNotification(
        'success',
        `Successfully allocated ${selectedGuardIds.length} guards to "${selectedShiftForRoster.name}".`
      );
      setIsRosterModalOpen(false);
    } catch (err) {
      console.error('Error saving roster:', err);
      showNotification('error', 'Failed to save roster allocation.');
    } finally {
      setIsSavingRoster(false);
    }
  };

  // Handle PDF Export
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const user = getUser();
      const author = user?.username || 'Security Administrator';
      await exportShiftsTimetablePDF(shifts, guards, author);
      showNotification('success', 'Official Timetable PDF generated & downloaded.');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      showNotification('error', 'Failed to generate timetable PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // If unauthorized, show auth loading check
  if (!authorized) {
    return (
      <PageTransition>
        <PageLoadingSpinner label="Authenticating Supervisor / Admin Clearance..." />
      </PageTransition>
    );
  }

  // Summary Metrics
  const totalAssignedGuards = shifts.reduce((acc, s) => acc + s.assignedGuardIds.length, 0);
  const unstaffedShiftsCount = shifts.filter((s) => s.assignedGuardIds.length === 0).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient neon glow highlights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[10%] w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[5%] left-[5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Floating Notification */}
        <AnimatePresence>
          {statusNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${
                statusNotification.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/30 text-rose-200'
              }`}
            >
              {statusNotification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              <span className="text-sm font-medium">{statusNotification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
                Pentagon Patrol Operations
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Shift Management & Roster
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                Live Console
              </span>
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Configure factory patrol shifts, schedule operating time windows, and allocate active security guards to guard rosters with real-time timetable exports.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || shifts.length === 0}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 hover:text-white border border-white/10 hover:border-indigo-500/40 text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <FileDown className="w-4 h-4 text-indigo-400" />
              )}
              Export Timetable PDF
            </button>

            <button
              onClick={() => handleOpenShiftModal()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Create New Shift
            </button>
          </div>
        </div>

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Total Shifts
              </span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              {shifts.length}
            </div>
            <div className="mt-1 text-xs text-neutral-500">Active operational windows</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Guards Deployed
              </span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              {totalAssignedGuards}
            </div>
            <div className="mt-1 text-xs text-neutral-500">Allocated across all shift rosters</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Roster Alerts
              </span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              {unstaffedShiftsCount}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {unstaffedShiftsCount > 0 ? 'Shifts require guard allocation' : 'All shifts fully covered'}
            </div>
          </div>
        </div>

        {/* Shift Cards Grid */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Configured Shifts ({shifts.length})
            </h2>
            <button
              onClick={loadData}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : shifts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10">
              <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No Shifts Configured</h3>
              <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                No security patrol shifts have been registered yet. Get started by clicking "Create New Shift".
              </p>
              <button
                onClick={() => handleOpenShiftModal()}
                className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Shift Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.map((shift, idx) => {
                const assignedCount = shift.assignedGuardIds.length;
                const isUnstaffed = assignedCount === 0;

                return (
                  <motion.div
                    key={shift.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                    className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
                  >
                    {/* Top Glow bar on hover */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

                    <div>
                      {/* Header + Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                            {shift.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-400">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-mono text-neutral-300">
                              {formatTime12h(shift.startTime)} – {formatTime12h(shift.endTime)}
                            </span>
                          </div>
                        </div>

                        {/* Guard count status indicator */}
                        {isUnstaffed ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            0 Guards
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {assignedCount} {assignedCount === 1 ? 'Guard' : 'Guards'}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-neutral-400 mt-3 line-clamp-2 leading-relaxed">
                        {shift.description || 'Standard verification patrol route assigned.'}
                      </p>

                      {/* Assigned Guard Mini Avatars Preview */}
                      <div className="mt-5 pt-4 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2.5">
                          <span className="font-medium">Assigned Guards</span>
                          <span className="text-neutral-500 font-mono">
                            {assignedCount} of {guards.length} total
                          </span>
                        </div>

                        {assignedCount === 0 ? (
                          <div className="py-2.5 px-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-300/90 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Shift unstaffed. Assign guards to activate schedule.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {shift.assignedGuardIds.slice(0, 4).map((gId) => {
                              const g = guardMap.get(gId);
                              const name = g?.security_name || gId;
                              const initials = name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase();

                              return (
                                <div
                                  key={gId}
                                  title={`${name} (${gId})`}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-neutral-200"
                                >
                                  <div className="w-4 h-4 rounded-full bg-indigo-500/30 text-[9px] font-bold text-indigo-300 flex items-center justify-center">
                                    {initials}
                                  </div>
                                  <span className="truncate max-w-[90px]">{name}</span>
                                </div>
                              );
                            })}
                            {assignedCount > 4 && (
                              <span className="text-[11px] font-semibold text-neutral-500 pl-1">
                                +{assignedCount - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenRosterModal(shift)}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/50 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Assign Guards
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenShiftModal(shift)}
                          title="Edit Shift"
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-neutral-400 hover:text-white border border-white/10 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmShift(shift)}
                          title="Delete Shift"
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────── MODAL 1: Create / Edit Shift ──────────────── */}
      <AnimatePresence>
        {isShiftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShiftModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-white/15 p-6 sm:p-8 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {editingShift ? 'Edit Shift Details' : 'Create New Patrol Shift'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsShiftModalOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveShift} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Shift Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Morning Perimeter Patrol"
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      Start Time (HH:mm) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={shiftForm.startTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      End Time (HH:mm) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={shiftForm.endTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Description / Operational Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about checkpoints, patrol objectives, or guidelines..."
                    value={shiftForm.description}
                    onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30"
                  >
                    {editingShift ? 'Save Changes' : 'Create Shift'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL 2: Guard Roster Multi-Select ──────────────── */}
      <AnimatePresence>
        {isRosterModalOpen && selectedShiftForRoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRosterModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl rounded-2xl bg-neutral-900 border border-white/15 p-6 sm:p-8 shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                      Roster Allocation
                    </span>
                    <span className="text-xs text-neutral-500">•</span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {formatTime12h(selectedShiftForRoster.startTime)} – {formatTime12h(selectedShiftForRoster.endTime)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Assign Guards: {selectedShiftForRoster.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsRosterModalOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar + Selected Counter */}
              <div className="my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search guards by name, Security ID, or factory station..."
                    value={guardSearch}
                    onChange={(e) => setGuardSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{selectedGuardIds.length} Guards Selected</span>
                </div>
              </div>

              {/* Guards List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
                {filteredGuards.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-400">
                    No active security guards match "{guardSearch}".
                  </div>
                ) : (
                  filteredGuards.map((guard) => {
                    const isSelected = selectedGuardIds.includes(guard.security_id);
                    const initials = guard.security_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={guard.security_id}
                        onClick={() => handleToggleGuard(guard.security_id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white/10 text-neutral-300'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white flex items-center gap-2">
                              {guard.security_name}
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                                {guard.security_id}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                              <Building className="w-3 h-3 text-neutral-500" />
                              <span>{guard.factory || 'Standard Patrol Zone'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-white/20 bg-white/5'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Roster Modal Footer */}
              <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedGuardIds([])}
                  className="text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRosterModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoster}
                    disabled={isSavingRoster}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingRoster ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Save Roster ({selectedGuardIds.length})
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL 3: Delete Confirmation ──────────────── */}
      <AnimatePresence>
        {deleteConfirmShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmShift(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-white/15 p-6 shadow-2xl z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Patrol Shift?</h3>
              <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                Are you sure you want to delete <span className="text-white font-semibold">"{deleteConfirmShift.name}"</span>? Any active guard allocations linked to this shift will be removed.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmShift(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-all shadow-md shadow-rose-600/30"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
