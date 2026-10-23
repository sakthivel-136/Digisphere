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
  CalendarDays,
  Smartphone,
  LockKeyhole,
  Building2
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
import { getFactories } from '@/app/api/factories.api';
import {
  formatTime12h,
  calculateDuration,
  exportRoundsTimetablePDF
} from '@/app/utils/roundsPdfExport';
import { logReportDownload } from '@/app/api/reportAudit.api';
import { PageTransition } from '@/app/components/layout/PageTransition';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { containerVariants, itemVariants } from '@/lib/animations';
import { useFactory } from '@/app/context/FactoryContext';

interface FactoryOption {
  factory_code: string;
  factory_name: string;
}

export default function RoundsCrudPage() {
  // 1. RBAC: Restricted to ADMIN
  const { authorized } = useAuthGuard({ allowedRoles: ['ADMIN'] });
  const router = useRouter();

  // Factory State from Global Context
  const { factories, selectedFactory, setSelectedFactory } = useFactory();

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
  const [formScanStartTime, setFormScanStartTime] = useState<string>('06:55');
  const [formScanEndTime, setFormScanEndTime] = useState<string>('07:20');
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

  // Load Factories & Rounds Data
  const loadRounds = async (factoryCode = selectedFactory) => {
    try {
      setLoading(true);
      const data = await getRounds(factoryCode);
      setRounds(data);
    } catch (err) {
      console.error('Failed to load patrol rounds:', err);
      showNotification('error', 'Unable to fetch patrol rounds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized && selectedFactory) {
      loadRounds(selectedFactory);
    }
  }, [authorized, selectedFactory]);

  // Compute next available round number for Auto-increment in selected factory
  const nextRoundNumber = useMemo(() => {
    const factoryRounds = rounds.filter(
      (r) => !r.factory_code || r.factory_code === selectedFactory
    );
    if (factoryRounds.length === 0) return 1;
    const maxNumber = Math.max(...factoryRounds.map((r) => r.round_number));
    return maxNumber + 1;
  }, [rounds, selectedFactory]);

  // Strictly filter rounds to ONLY the selected factory and search query
  const filteredRounds = useMemo(() => {
    const factoryRounds = rounds.filter(
      (r) => !r.factory_code || r.factory_code === selectedFactory
    );
    if (!searchQuery.trim()) return factoryRounds;
    const q = searchQuery.toLowerCase();
    return factoryRounds.filter(
      (r) =>
        `round ${r.round_number}`.includes(q) ||
        r.round_number.toString().includes(q) ||
        r.start_time.includes(q) ||
        r.end_time.includes(q) ||
        (r.scan_start_time && r.scan_start_time.includes(q)) ||
        (r.scan_end_time && r.scan_end_time.includes(q))
    );
  }, [rounds, selectedFactory, searchQuery]);

  // Check for time slot overlap / exact collision
  const findCollidingRound = (start: string, end: string, scanStart: string, scanEnd: string, currentId?: string) => {
    return rounds.find((r) => {
      if (currentId && r.id === currentId) return false;
      return (
        r.start_time === start ||
        r.end_time === end ||
        r.scan_start_time === scanStart ||
        r.scan_end_time === scanEnd
      );
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRound(null);
    setFormRoundNumber(nextRoundNumber);
    setFormStartTime('06:00');
    setFormEndTime('07:00');
    setFormScanStartTime('06:55');
    setFormScanEndTime('07:20');
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
    setFormScanStartTime(round.scan_start_time || '06:55');
    setFormScanEndTime(round.scan_end_time || '07:20');
    setFormError(null);
    setCollisionWarning(null);
    setConfirmCollisionTick(false);
    setIsModalOpen(true);
  };

  // Whenever start, end, or scan window times change, check if slot already exists
  useEffect(() => {
    if (!isModalOpen) return;
    const collision = findCollidingRound(
      formStartTime,
      formEndTime,
      formScanStartTime,
      formScanEndTime,
      editingRound?.id
    );
    if (collision) {
      setCollisionWarning(
        `A round slot with start time ${formatTime12h(collision.start_time)} (Round ${String(collision.round_number).padStart(2, '0')}) already exists. Really you want to save it?`
      );
    } else {
      setCollisionWarning(null);
      setConfirmCollisionTick(false);
    }
  }, [formStartTime, formEndTime, formScanStartTime, formScanEndTime, isModalOpen, editingRound, rounds]);

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formRoundNumber || formRoundNumber <= 0) {
      setFormError('Round Number must be a positive integer.');
      return;
    }

    const duplicate = rounds.find(
      (r) => r.round_number === formRoundNumber && (!editingRound || r.id !== editingRound.id)
    );
    if (duplicate) {
      setFormError(`Round ${formRoundNumber} already exists. Please choose a unique round number.`);
      return;
    }

    if (!formStartTime || !formEndTime || !formScanStartTime || !formScanEndTime) {
      setFormError('Round operating times and Scan Window opening/closing times are all required.');
      return;
    }

    try {
      if (editingRound) {
        const updated = await updateRound(editingRound.id, {
          factory_code: selectedFactory,
          round_number: formRoundNumber,
          start_time: formStartTime,
          end_time: formEndTime,
          scan_start_time: formScanStartTime,
          scan_end_time: formScanEndTime,
        });
        setRounds((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)).sort((a, b) => a.round_number - b.round_number)
        );
        showNotification('success', `Round ${String(updated.round_number).padStart(2, '0')} updated successfully.`);
      } else {
        const created = await createRound({
          factory_code: selectedFactory,
          round_number: formRoundNumber,
          start_time: formStartTime,
          end_time: formEndTime,
          scan_start_time: formScanStartTime,
          scan_end_time: formScanEndTime,
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
      const selectedFactoryObj = factories.find((f) => f.factory_code === selectedFactory);
      const factoryName = selectedFactoryObj
        ? `${selectedFactoryObj.factory_code} - ${selectedFactoryObj.factory_name}`
        : selectedFactory;
      await exportRoundsTimetablePDF(rounds, author, factoryName);
      logReportDownload({
        report_type: 'ROUNDS_TIMETABLE_PDF',
        factory_code: selectedFactory,
        report_date: new Date().toISOString().split('T')[0],
        user_name: author,
      });
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
                  Configure round timings and enforce guard app login scan windows
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
                  Factory Rounds ({selectedFactory})
                </span>
                <div className="p-2 rounded-xl bg-[var(--primary-muted)]">
                  <RotateCcw className="w-4 h-4 text-[var(--primary)]" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                {filteredRounds.length}
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-subtle)]">
                Patrol slots configured for {selectedFactory}
              </div>
            </GlassCard>

            <GlassCard hoverable>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                  App Login Enforced
                </span>
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/40">
                  <LockKeyhole className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--primary)] tracking-tight">
                Scan Windows
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-subtle)]">
                Guards can only log in during open scan windows
              </div>
            </GlassCard>

            <GlassCard hoverable>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                  System Status
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
                    placeholder="Search by round number, round timing, or scan window..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-modern pl-10"
                  />
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <span className="text-xs font-medium text-[var(--foreground-muted)]">
                    Showing <span className="font-bold text-[var(--foreground)]">{filteredRounds.length}</span> rounds for <span className="font-bold text-[var(--primary)] font-mono">{selectedFactory}</span>
                  </span>

                  <button
                    onClick={() => loadRounds()}
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
                  <GlassCard key={i} className="h-56 animate-pulse">
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
                  const scanStartFormatted = formatTime12h(round.scan_start_time || '06:55');
                  const scanEndFormatted = formatTime12h(round.scan_end_time || '07:20');

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

                        {/* Round Operating Time Display */}
                        <div className="mt-3.5">
                          <div className="text-[11px] uppercase font-bold text-[var(--foreground-subtle)] tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Round Timing
                          </div>
                          <div className="text-base font-bold text-[var(--foreground)] mt-0.5 font-mono tracking-tight">
                            {formatTime12h(round.start_time)} – {formatTime12h(round.end_time)}
                          </div>
                        </div>

                        {/* Scan Window Opening Timing Display (Guard App Login Window) */}
                        <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-md text-left">
                          <div className="text-[11px] uppercase font-extrabold text-amber-400 tracking-wider flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Scan Window (App Login)</span>
                          </div>
                          <div className="text-base font-black text-white mt-1 font-mono tracking-wide">
                            {scanStartFormatted} – {scanEndFormatted}
                          </div>
                          <div className="text-[11px] text-slate-300 font-mono mt-1 flex items-center gap-1.5 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0 animate-pulse" />
                            <span>24h: {round.scan_start_time || '06:55'} to {round.scan_end_time || '07:20'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(round)}
                          title="Edit Round & Scan Window"
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
                  className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-7 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[var(--primary-muted)] text-[var(--primary)]">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[var(--foreground)]">
                          {editingRound ? `Edit Round ${editingRound.round_number}` : 'New Patrol Round'}
                        </h3>
                        <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                          Factory: <span className="font-semibold text-[var(--foreground)] font-mono">{selectedFactory}</span>
                        </p>
                      </div>
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

                    {/* Section 1: Round Operating Timing */}
                    <div className="p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-3">
                      <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                        1. Round Timing (Operational Window)
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                            Round Start Time <span className="text-rose-500">*</span>
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
                          <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                            Round End Time <span className="text-rose-500">*</span>
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
                    </div>

                    {/* Section 2: Scan Window Opening Timing (App Login Window) */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-md space-y-3">
                      <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        2. Scan Window Opening (Guard App Login Allowed)
                      </div>
                      <p className="text-[11.5px] text-slate-300 leading-relaxed font-medium">
                        Security guards can only log into the Android verification app during this exact scan window.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-200 mb-1 uppercase tracking-wider">
                            Scan Window Opens <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="time"
                            required
                            value={formScanStartTime}
                            onChange={(e) => setFormScanStartTime(e.target.value)}
                            className="input-modern font-bold text-white bg-slate-800 border-slate-600 focus:border-amber-400"
                          />
                          <p className="text-[11px] text-amber-300 mt-1 font-mono font-semibold">
                            {formatTime12h(formScanStartTime)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-200 mb-1 uppercase tracking-wider">
                            Scan Window Closes <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="time"
                            required
                            value={formScanEndTime}
                            onChange={(e) => setFormScanEndTime(e.target.value)}
                            className="input-modern font-bold text-white bg-slate-800 border-slate-600 focus:border-amber-400"
                          />
                          <p className="text-[11px] text-amber-300 mt-1 font-mono font-semibold">
                            {formatTime12h(formScanEndTime)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Duration Preview */}
                    <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-xs">
                      <span className="text-[var(--foreground-muted)]">Total Round Duration:</span>
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
                    ? This will remove this scheduled patrol checkpoint slot and its guard login scan window.
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
                      type="submit"
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
