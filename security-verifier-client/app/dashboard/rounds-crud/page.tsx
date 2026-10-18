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
  RefreshCw,
  Hourglass,
  CalendarDays
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
import { PageContainer } from '@/app/components/layout/PageContainer';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function RoundsCrudPage() {
  // 1. RBAC: Restricted to ADMIN
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
        <PageLoadingSpinner label="Checking access..." />
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

          {/* Standard Header matching QR, Users, and Factories pages */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                <RotateCcw className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Patrol Rounds Management
                </h1>
                <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                  Configure mandatory factory verification rounds and 24-hour time slots
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleExportPDF}
                disabled={isExporting || rounds.length === 0}
                className="btn-secondary"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-[var(--primary)]" />
                ) : (
                  <FileDown className="h-4 w-4 text-[var(--primary)]" />
                )}
                Export PDF
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleOpenCreateModal}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add Patrol Round
              </motion.button>
            </div>
          </motion.div>

          {/* KPI Summary Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <GlassCard hoverable>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                  Total Rounds
                </span>
                <div className="p-2 rounded-xl bg-[var(--primary-muted)]">
                  <RotateCcw className="w-4 h-4 text-[var(--primary)]" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                {rounds.length}
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-subtle)]">
                Scheduled patrol verification checkpoints
              </div>
            </GlassCard>

            <GlassCard hoverable>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                  Daily Cycle
                </span>
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/40">
                  <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                24 Hours
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-subtle)]">
                Continuous day & night factory coverage
              </div>
            </GlassCard>

            <GlassCard hoverable>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                  Status
                </span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-subtle)]">
                Live QR patrol verification enforced
              </div>
            </GlassCard>
          </motion.div>

          {/* Search Filter Toolbar in GlassCard */}
          <motion.div variants={itemVariants} className="mb-6">
            <GlassCard>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="w-4 h-4 text-[var(--foreground-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by round number or time slot..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-modern pl-10"
                  />
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <span className="text-xs font-medium text-[var(--foreground-muted)]">
                    Showing <span className="font-bold text-[var(--foreground)]">{filteredRounds.length}</span> of {rounds.length} rounds
                  </span>

                  <button
                    onClick={loadRounds}
                    title="Refresh Rounds"
                    className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Rounds Cards Grid */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <GlassCard key={i} className="h-44 animate-pulse">
                    <div className="h-4 bg-[var(--surface-hover)] rounded w-1/3 mb-4" />
                    <div className="h-6 bg-[var(--surface-hover)] rounded w-2/3 mb-2" />
                    <div className="h-4 bg-[var(--surface-hover)] rounded w-1/2" />
                  </GlassCard>
                ))}
              </div>
            ) : filteredRounds.length === 0 ? (
              <GlassCard className="py-16 text-center">
                <RotateCcw className="w-12 h-12 text-[var(--foreground-subtle)] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-[var(--foreground)]">No Rounds Found</h3>
                <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-md mx-auto">
                  {searchQuery
                    ? `No patrol rounds match "${searchQuery}".`
                    : 'No patrol rounds have been configured yet.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="mt-6 btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Round
                  </button>
                )}
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredRounds.map((round) => {
                  const durationStr = calculateDuration(round.start_time, round.end_time);

                  return (
                    <GlassCard
                      key={round.id}
                      hoverable
                      className="flex flex-col justify-between"
                    >
                      <div>
                        {/* Badge + Duration */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5 text-[var(--primary)]" />
                            Round {String(round.round_number).padStart(2, '0')}
                          </span>

                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--foreground-muted)] flex items-center gap-1">
                            <Hourglass className="w-3 h-3 text-[var(--foreground-subtle)]" />
                            {durationStr}
                          </span>
                        </div>

                        {/* Time Range Display */}
                        <div className="mt-4">
                          <div className="text-[11px] uppercase font-bold text-[var(--foreground-subtle)] tracking-wider">
                            Time Window
                          </div>
                          <div className="text-base font-bold text-[var(--foreground)] mt-1 font-mono tracking-tight">
                            {formatTime12h(round.start_time)} – {formatTime12h(round.end_time)}
                          </div>
                          <div className="text-xs text-[var(--foreground-muted)] font-mono mt-0.5">
                            {round.start_time} - {round.end_time} (24h)
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-5 pt-3.5 border-t border-[var(--border)] flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(round)}
                          title="Edit Round"
                          className="p-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] hover:text-[var(--primary)] border border-[var(--border)] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmRound(round)}
                          title="Delete Round"
                          className="p-2 rounded-xl bg-[var(--surface)] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[var(--foreground-muted)] hover:text-rose-600 border border-[var(--border)] hover:border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ──────────────── MODAL: Create / Edit Round ──────────────── */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsModalOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-7 shadow-2xl z-10"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[var(--primary-muted)] text-[var(--primary)]">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-[var(--foreground)]">
                        {editingRound ? `Edit Round ${editingRound.round_number}` : 'New Patrol Round'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-xl text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {formError && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                        Round Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formRoundNumber}
                        onChange={(e) => setFormRoundNumber(parseInt(e.target.value, 10) || 1)}
                        className="input-modern font-mono"
                      />
                      <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                        Unique sequential identifier for this patrol round.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                          Start Time (24h) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={formStartTime}
                          onChange={(e) => setFormStartTime(e.target.value)}
                          className="input-modern"
                        />
                        <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                          {formatTime12h(formStartTime)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                          End Time (24h) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={formEndTime}
                          onChange={(e) => setFormEndTime(e.target.value)}
                          className="input-modern"
                        />
                        <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">
                          {formatTime12h(formEndTime)}
                        </p>
                      </div>
                    </div>

                    {/* Duration Preview */}
                    <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-xs">
                      <span className="text-[var(--foreground-muted)]">Computed Duration:</span>
                      <span className="font-bold text-[var(--primary)] font-mono">
                        {calculateDuration(formStartTime, formEndTime)}
                      </span>
                    </div>

                    {/* Collision Warning & Checkbox confirmation */}
                    {collisionWarning && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-semibold">
                            {collisionWarning}
                          </p>
                        </div>

                        <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={confirmCollisionTick}
                            onChange={(e) => setConfirmCollisionTick(e.target.checked)}
                            className="w-4 h-4 rounded border-amber-400 text-[var(--primary)] focus:ring-0 cursor-pointer"
                          />
                          <span className="text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                            Yes, I understand and really want to save this slot.
                          </span>
                        </label>
                      </motion.div>
                    )}

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!!collisionWarning && !confirmCollisionTick}
                        className="btn-primary"
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
              <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDeleteConfirmRound(null)}
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
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Patrol Round?</h3>
                  <p className="text-sm text-[var(--foreground-muted)] mt-2 leading-relaxed">
                    Are you sure you want to delete{' '}
                    <span className="text-[var(--foreground)] font-bold">
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
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
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
