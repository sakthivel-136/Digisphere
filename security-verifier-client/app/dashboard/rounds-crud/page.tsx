'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Clock,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Hourglass,
  CalendarDays,
  Layers,
  ArrowRight
} from 'lucide-react';

import { useAuthGuard } from '@/app/services/auth.guard';
import { getUser } from '@/app/services/token.service';
import {
  PatrolRound,
  getRounds,
  createRound,
  updateRound,
  deleteRound
} from '@/app/api/rounds.api';
import {
  formatTime12h,
  calculateDuration,
  exportRoundsTimetablePDF
} from '@/app/utils/roundsPdfExport';
import { PageTransition } from '@/app/components/layout/PageTransition';
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner';

export default function RoundsCrudPage() {
  // 1. RBAC: Strictly restricted to ADMIN
  const { authorized } = useAuthGuard({ allowedRoles: ['ADMIN'] });
  const router = useRouter();

  // State
  const [rounds, setRounds] = useState<PatrolRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<PatrolRound | null>(null);
  const [formRoundNumber, setFormRoundNumber] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState<string>('06:00');
  const [formEndTime, setFormEndTime] = useState<string>('07:00');
  const [formError, setFormError] = useState<string | null>(null);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [confirmCollisionTick, setConfirmCollisionTick] = useState<boolean>(false);

  // Delete Confirmation state
  const [deleteConfirmRound, setDeleteConfirmRound] = useState<PatrolRound | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Rounds Data
  const loadRounds = async () => {
    try {
      setLoading(true);
      const data = await getRounds();
      setRounds(data);
    } catch (err) {
      console.error('Failed to load patrol rounds:', err);
      showNotification('error', 'Unable to fetch patrol rounds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadRounds();
    }
  }, [authorized]);

  // Compute next available round number for Auto-increment
  const nextRoundNumber = useMemo(() => {
    if (rounds.length === 0) return 1;
    const maxNumber = Math.max(...rounds.map((r) => r.round_number));
    return maxNumber + 1;
  }, [rounds]);

  // Filtered rounds by search
  const filteredRounds = useMemo(() => {
    if (!searchQuery.trim()) return rounds;
    const q = searchQuery.toLowerCase();
    return rounds.filter(
      (r) =>
        `round ${r.round_number}`.includes(q) ||
        r.round_number.toString().includes(q) ||
        r.start_time.includes(q) ||
        r.end_time.includes(q)
    );
  }, [rounds, searchQuery]);

  // Check for time slot overlap / exact collision
  const findCollidingRound = (start: string, end: string, currentId?: string) => {
    return rounds.find((r) => {
      if (currentId && r.id === currentId) return false;
      return r.start_time === start || r.end_time === end;
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRound(null);
    setFormRoundNumber(nextRoundNumber);
    setFormStartTime('06:00');
    setFormEndTime('07:00');
    setFormError(null);
    setCollisionWarning(null);
    setConfirmCollisionTick(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (round: PatrolRound) => {
    setEditingRound(round);
    setFormRoundNumber(round.round_number);
    setFormStartTime(round.start_time);
    setFormEndTime(round.end_time);
    setFormError(null);
    setCollisionWarning(null);
    setConfirmCollisionTick(false);
    setIsModalOpen(true);
  };

  // Whenever start or end time changes, check if time already exists
  useEffect(() => {
    if (!isModalOpen) return;
    const collision = findCollidingRound(formStartTime, formEndTime, editingRound?.id);
    if (collision) {
      setCollisionWarning(
        `A round slot with start time ${formatTime12h(collision.start_time)} (Round ${String(collision.round_number).padStart(2, '0')}) already exists. Really you want to save it?`
      );
    } else {
      setCollisionWarning(null);
      setConfirmCollisionTick(false);
    }
  }, [formStartTime, formEndTime, isModalOpen, editingRound, rounds]);

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation 1: Round number positive integer
    if (!formRoundNumber || formRoundNumber <= 0) {
      setFormError('Round Number must be a positive integer.');
      return;
    }

    // Validation 2: Duplicate check
    const duplicate = rounds.find(
      (r) => r.round_number === formRoundNumber && (!editingRound || r.id !== editingRound.id)
    );
    if (duplicate) {
      setFormError(`Round ${formRoundNumber} already exists. Please choose a unique round number.`);
      return;
    }

    // Validation 3: Time values present
    if (!formStartTime || !formEndTime) {
      setFormError('Both Start Time and End Time are required.');
      return;
    }

    try {
      if (editingRound) {
        const updated = await updateRound(editingRound.id, {
          round_number: formRoundNumber,
          start_time: formStartTime,
          end_time: formEndTime,
        });
        setRounds((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)).sort((a, b) => a.round_number - b.round_number)
        );
        showNotification('success', `Round ${String(updated.round_number).padStart(2, '0')} updated successfully.`);
      } else {
        const created = await createRound({
          round_number: formRoundNumber,
          start_time: formStartTime,
          end_time: formEndTime,
        });
        setRounds((prev) =>
          [...prev, created].sort((a, b) => a.round_number - b.round_number)
        );
        showNotification('success', `Round ${String(created.round_number).padStart(2, '0')} created successfully.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving round:', err);
      setFormError('Failed to save round. Please try again.');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmRound) return;
    try {
      await deleteRound(deleteConfirmRound.id);
      setRounds((prev) => prev.filter((r) => r.id !== deleteConfirmRound.id));
      showNotification('success', `Round ${String(deleteConfirmRound.round_number).padStart(2, '0')} removed.`);
      setDeleteConfirmRound(null);
    } catch (err) {
      console.error('Error deleting round:', err);
      showNotification('error', 'Failed to delete round slot.');
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const user = getUser();
      const author = user?.username || 'Security Administrator';
      await exportRoundsTimetablePDF(rounds, author);
      showNotification('success', 'Patrol rounds timetable PDF exported successfully.');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      showNotification('error', 'Could not export timetable PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!authorized) {
    return (
      <PageTransition>
        <PageLoadingSpinner label="Authenticating Administrator Clearance..." />
      </PageTransition>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[10%] w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[5%] left-[5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Floating Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${
                notification.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/30 text-rose-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
                Pentagon Security Operations
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Patrol Rounds Management
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                Admin Console
              </span>
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Configure mandatory factory verification rounds, define operating time windows, and manage 24-hour patrol schedules with instant PDF timetable exports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || rounds.length === 0}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 hover:text-white border border-white/10 hover:border-indigo-500/40 text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <FileDown className="w-4 h-4 text-indigo-400" />
              )}
              Export Rounds PDF
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add Patrol Round
            </button>
          </div>
        </div>

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Total Configured Rounds
              </span>
              <RotateCcw className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              {rounds.length}
            </div>
            <div className="mt-1 text-xs text-neutral-500">Scheduled patrol checkpoints</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Daily Cycle Window
              </span>
              <CalendarDays className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              24 Hours
            </div>
            <div className="mt-1 text-xs text-neutral-500">Continuous day & night coverage</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                System Status
              </span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </div>
            <div className="mt-1 text-xs text-neutral-500">Live QR patrol enforcement active</div>
          </div>
        </div>

        {/* Search & Counter Bar */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by round number or time slot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              Showing <span className="text-white font-semibold">{filteredRounds.length}</span> of {rounds.length} rounds
            </span>
            <button
              onClick={loadRounds}
              title="Refresh Rounds"
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Rounds Card Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : filteredRounds.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10">
              <RotateCcw className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No Rounds Found</h3>
              <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? `No patrol rounds match "${searchQuery}".`
                  : 'No patrol rounds have been configured yet.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Round
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredRounds.map((round, idx) => {
                const durationStr = calculateDuration(round.start_time, round.end_time);

                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.2 }}
                    className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-5 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
                  >
                    {/* Top hover gradient line */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

                    <div>
                      {/* Badge + Duration */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                          Round {String(round.round_number).padStart(2, '0')}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white/[0.05] border border-white/10 text-neutral-300 flex items-center gap-1">
                          <Hourglass className="w-3 h-3 text-neutral-400" />
                          {durationStr}
                        </span>
                      </div>

                      {/* Time Range Display */}
                      <div className="mt-4">
                        <div className="text-xs uppercase font-semibold text-neutral-400 tracking-wider">
                          Time Window
                        </div>
                        <div className="text-base font-bold text-white mt-1 font-mono tracking-tight group-hover:text-indigo-200 transition-colors">
                          {formatTime12h(round.start_time)} – {formatTime12h(round.end_time)}
                        </div>
                        <div className="text-xs text-neutral-400 font-mono mt-0.5">
                          {round.start_time} - {round.end_time} (24h)
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(round)}
                        title="Edit Round"
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-neutral-400 hover:text-white border border-white/10 hover:border-indigo-500/30 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmRound(round)}
                        title="Delete Round"
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────── MODAL: Create / Edit Round ──────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-white/15 p-6 sm:p-7 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {editingRound ? `Edit Round ${editingRound.round_number}` : 'New Patrol Round'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Round Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formRoundNumber}
                    onChange={(e) => setFormRoundNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Unique sequential identifier for this patrol round.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      Start Time (24h) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {formatTime12h(formStartTime)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      End Time (24h) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {formatTime12h(formEndTime)}
                    </p>
                  </div>
                </div>

                {/* Duration Preview */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Computed Round Duration:</span>
                  <span className="font-semibold text-indigo-300 font-mono">
                    {calculateDuration(formStartTime, formEndTime)}
                  </span>
                </div>

                {/* Collision Warning & Checkbox confirmation */}
                {collisionWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">
                        {collisionWarning}
                      </p>
                    </div>

                    <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={confirmCollisionTick}
                        onChange={(e) => setConfirmCollisionTick(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-400/50 bg-amber-950/40 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                      />
                      <span className="text-amber-300 font-semibold text-[11px]">
                        Yes, I understand and really want to save this slot.
                      </span>
                    </label>
                  </motion.div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!collisionWarning && !confirmCollisionTick}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 disabled:shadow-none"
                  >
                    {editingRound ? 'Update Round' : 'Create Round'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: Delete Confirmation ──────────────── */}
      <AnimatePresence>
        {deleteConfirmRound && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmRound(null)}
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
              <h3 className="text-lg font-bold text-white">Delete Patrol Round?</h3>
              <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="text-white font-semibold">
                  Round {String(deleteConfirmRound.round_number).padStart(2, '0')} (
                  {formatTime12h(deleteConfirmRound.start_time)} –{' '}
                  {formatTime12h(deleteConfirmRound.end_time)})
                </span>
                ? This will remove this scheduled patrol checkpoint slot.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmRound(null)}
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
