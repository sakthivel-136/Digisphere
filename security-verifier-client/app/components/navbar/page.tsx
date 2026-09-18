'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LogOut,
  Menu,
  X,
  Download,
  RefreshCw,
  Moon,
  Sun,
  ChevronDown,
  BookOpen,
  Smartphone,
  User,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clearAuth, getUser, type AuthUser } from '@/app/services/token.service'
import AppDownloadModal from '../ui/AppDownloadModal'
import { cn } from '@/lib/cn'
import { dropdownVariants, mobileMenuVariants, containerVariants, itemVariants } from '@/lib/animations'

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Reports',   href: '/report-download' },
  { name: 'Users',     href: '/user-crud' },
  { name: 'QR',        href: '/dashboard/qr-crud' },
  { name: 'Factories', href: '/factory' },
]

// ─── Dropdown action list ──────────────────────────────────────────────────────

const DESKTOP_BREAKPOINT = 1051

// ─── Component ────────────────────────────────────────────────────────────────

const Navbar = () => {
  const router   = useRouter()
  const pathname = usePathname()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen,   setIsUserMenuOpen]   = useState(false)
  const [showAppModal,     setShowAppModal]     = useState(false)
  const [isDarkMode,       setIsDarkMode]       = useState(false)
  const [user,             setUser]             = useState<AuthUser | null>(null)
  const [mounted,          setMounted]          = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)

  // ── Mount & theme init ──
  useEffect(() => {
    setMounted(true)
    setUser(getUser())
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // ── Close dropdown on outside click / Escape ──
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false)
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown',  handler)
    document.addEventListener('touchstart', handler)
    document.addEventListener('keydown',    keyHandler)
    return () => {
      document.removeEventListener('mousedown',  handler)
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('keydown',    keyHandler)
    }
  }, [])

  // ── Close mobile menu on resize to desktop ──
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) setIsMobileMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = () => {
    clearAuth()
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
    router.replace('/login')
  }

  const toggleTheme = () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const initials  = user?.username?.substring(0, 2).toUpperCase() ?? 'AD'
  const userName  = user?.username ?? 'Admin'
  const userRole  = user?.role     ?? 'Admin'

  return (
    <>
      <AppDownloadModal
        isOpen={showAppModal}
        onClose={() => setShowAppModal(false)}
        appLink="https://docs.google.com/uc?export=download&id=14R6VexC8HZ02_GyVLZO97AdmWgOmFAFv"
      />

      <header className="sticky top-0 z-[var(--z-sticky)] w-full glass-surface border-b border-[var(--border)]">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity duration-200 active:scale-95"
          >
            <div className="flex h-10 items-center">
              <Image
                src="/logocomm.png"
                alt="Pentagon Security"
                width={140}
                height={34}
                priority
                className="object-contain"
              />
            </div>
          </Link>

          {/* ── Desktop Nav Pills ── */}
          <nav
            aria-label="Main navigation"
            className="hidden min-[1051px]:flex items-center justify-center flex-1 mx-6"
          >
            <div className="flex items-center gap-1 rounded-2xl bg-[var(--surface-muted)] px-1.5 py-1.5 border border-[var(--border)]">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className="relative">
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10 block px-3.5 py-1.5 text-sm font-semibold rounded-xl',
                      'transition-colors duration-150',
                      isActive(item.href)
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </nav>

          {/* ── Right Side ── */}
          <div className="flex items-center gap-2">

            {/* USER AVATAR DROPDOWN */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className={cn(
                  'flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl',
                  'bg-[var(--surface)] border border-[var(--border)]',
                  'hover:border-[var(--primary)]/40 hover:bg-[var(--surface-muted)]',
                  'transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
                  'active:scale-95'
                )}
              >
                {/* Avatar */}
                <div className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold pointer-events-none shadow-sm">
                  {mounted ? initials : 'AD'}
                </div>
                {/* Name — hidden on xs */}
                <span className="hidden sm:block text-sm font-semibold text-[var(--foreground)] max-w-[90px] truncate pointer-events-none">
                  {mounted ? userName : '…'}
                </span>
                {/* Chevron */}
                <ChevronDown
                  size={14}
                  className={cn(
                    'text-[var(--foreground-subtle)] pointer-events-none transition-transform duration-200',
                    isUserMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    role="menu"
                    aria-label="User options"
                    variants={dropdownVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      'absolute right-0 top-full mt-2 w-56',
                      'bg-[var(--surface)] rounded-2xl',
                      'border border-[var(--border)]',
                      'shadow-xl shadow-black/8',
                      'p-2 z-[var(--z-dropdown)]',
                      'origin-top-right'
                    )}
                  >
                    {/* User info header */}
                    <div className="px-3 py-3 mb-1 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
                      <p className="text-sm font-bold text-[var(--foreground)] truncate">{mounted ? userName : '…'}</p>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{mounted ? userRole : ''}</p>
                    </div>

                    {/* Actions */}
                    {[
                      {
                        label: 'App Guide',
                        icon:  <BookOpen size={15} />,
                        onClick: () => setIsUserMenuOpen(false),
                      },
                      {
                        label: 'Switch User',
                        icon:  <RefreshCw size={15} />,
                        onClick: () => { setIsUserMenuOpen(false); router.push('/login') },
                      },
                      {
                        label: 'Download App',
                        icon:  <Smartphone size={15} />,
                        onClick: () => { setShowAppModal(true); setIsUserMenuOpen(false) },
                        gold: true,
                      },
                    ].map(({ label, icon, onClick, gold }) => (
                      <button
                        key={label}
                        role="menuitem"
                        type="button"
                        onClick={onClick}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                          'transition-colors duration-150 active:scale-95',
                          gold
                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                        )}
                      >
                        <span className="flex-shrink-0">{icon}</span>
                        {label}
                      </button>
                    ))}

                    {/* Theme toggle */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors duration-150 active:scale-95"
                    >
                      <span className="flex items-center gap-3">
                        {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </span>
                      {/* Toggle pill */}
                      <div className={cn('relative h-5 w-9 rounded-full transition-colors duration-200', isDarkMode ? 'bg-[var(--primary)]' : 'bg-[var(--surface-hover)]')}>
                        <div className={cn('absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200', isDarkMode ? 'translate-x-5' : 'translate-x-1')} />
                      </div>
                    </button>

                    <div className="h-px bg-[var(--border)] my-1.5 mx-1" />

                    {/* Logout */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors duration-150 active:scale-95"
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* HAMBURGER — mobile only */}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className={cn(
                'min-[1051px]:hidden',
                'flex items-center justify-center p-2 rounded-xl',
                'bg-[var(--surface)] border border-[var(--border)]',
                'hover:bg-[var(--surface-hover)] transition-colors duration-150',
                'active:scale-95 touch-target'
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isMobileMenuOpen ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {isMobileMenuOpen
                    ? <X    size={20} className="pointer-events-none" />
                    : <Menu size={20} className="pointer-events-none" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-[1051px]:hidden border-t border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="px-4 py-4 space-y-1"
              >
                {/* Nav links */}
                {navItems.map((item) => (
                  <motion.div key={item.name} variants={itemVariants}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150',
                        isActive(item.href)
                          ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                          : 'text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                      )}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}

                {/* Divider */}
                <div className="h-px bg-[var(--border)] !my-3" />

                {/* Mobile action buttons */}
                {[
                  {
                    label: 'Switch User',
                    icon: <RefreshCw size={16} />,
                    onClick: () => { setIsMobileMenuOpen(false); router.push('/login') },
                  },
                  {
                    label: 'Download App',
                    icon: <Download size={16} />,
                    onClick: () => { setIsMobileMenuOpen(false); setShowAppModal(true) },
                  },
                ].map(({ label, icon, onClick }) => (
                  <motion.div key={label} variants={itemVariants}>
                    <button
                      type="button"
                      onClick={onClick}
                      className="flex items-center w-full gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors duration-150 active:scale-95"
                    >
                      <span className="text-[var(--foreground-subtle)]">{icon}</span>
                      {label}
                    </button>
                  </motion.div>
                ))}

                {/* Theme toggle */}
                <motion.div variants={itemVariants}>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors duration-150 active:scale-95"
                  >
                    <span className="flex items-center gap-3">
                      {isDarkMode
                        ? <Sun  size={16} className="text-[var(--foreground-subtle)]" />
                        : <Moon size={16} className="text-[var(--foreground-subtle)]" />}
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                    <div className={cn('relative h-5 w-9 rounded-full transition-colors', isDarkMode ? 'bg-[var(--primary)]' : 'bg-[var(--surface-hover)]')}>
                      <div className={cn('absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform', isDarkMode ? 'translate-x-5' : 'translate-x-1')} />
                    </div>
                  </button>
                </motion.div>

                {/* Logout */}
                <motion.div variants={itemVariants}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center w-full gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors duration-150 active:scale-95"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}

export default Navbar
