'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LogOut,
  Menu,
  User,
  X,
  Download,
  RefreshCw,
  Moon,
  Sun,
  ChevronDown,
  BookOpen,
  Smartphone
} from 'lucide-react'
import { clearAuth, getUser, AuthUser } from '@/app/services/token.service'
import AppDownloadModal from '../ui/AppDownloadModal'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showAppModal, setShowAppModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const [user, setUser] = useState<AuthUser | null>(null)

  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    clearAuth()
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
    router.replace('/login')
  }

  const startTour = () => {
    console.log('Starting App Tour...')
    // Implement tour logic here
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Reports', href: '/report-download' },
    { name: 'Users', href: '/user-crud' },
    { name: 'QR', href: '/dashboard/qr-crud' },
    { name: 'Factories', href: '/factory' },
  ]

  const isActive = (href: string) => pathname === href

  useEffect(() => {
    setUser(getUser())
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const initials = user?.username?.substring(0, 2).toUpperCase() || 'AD'
  const userName = user?.username || 'Admin'
  const userRole = user?.role || 'Admin'

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)

    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  return (
    <>
      <AppDownloadModal
        isOpen={showAppModal}
        onClose={() => setShowAppModal(false)}
        appLink="https://docs.google.com/uc?export=download&id=14R6VexC8HZ02_GyVLZO97AdmWgOmFAFv"
      />

      <header className="sticky top-0 z-50 w-full glass-panel border-b border-[var(--border-light)]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 active:scale-95"
          >
            <div className="flex h-10 w-auto items-center">
              <Image
                src="/logocomm.png"
                alt="Logo"
                width={150}
                height={35}
                priority
                className="object-contain"
              />
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden min-[1051px]:flex items-center justify-center flex-1 mx-4">
            <div className="flex items-center rounded-full bg-[var(--surface-muted)] px-1.5 py-1.5 shadow-inner border border-[var(--border)]">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative z-10 mx-0.5"
                >
                  <div className="flex items-center group">
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <span
                      className={`px-3.5 py-1.5 text-sm font-semibold rounded-full z-10 transition-all duration-200 hover:scale-105 active:scale-95 ${
                        isActive(item.href)
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* RIGHT SIDE: PROFILE & MOBILE TOGGLE */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* USER AVATAR + DROPDOWN */}
            <div className="relative z-[100] flex items-center" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary-muted)] hover:shadow-md hover:shadow-[var(--primary-muted)] transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
              >
                {/* Initials Avatar Box */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white text-xs font-bold flex items-center justify-center shadow-sm pointer-events-none">
                  {initials}
                </div>
                
                {/* Name & Role (Hidden on ultra-small mobile to save space, visible on tablet+) */}
                <span className="hidden sm:block text-sm font-semibold text-[var(--foreground)] max-w-[90px] truncate pointer-events-none">
                  {userName}
                </span>
                
                {/* Rotating Arrow Icon */}
                <ChevronDown
                  size={16}
                  className={`text-[var(--foreground-subtle)] transition-transform duration-300 pointer-events-none ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu List with Smooth Animation */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[var(--surface)] p-2 shadow-2xl shadow-indigo-900/10 border border-[var(--border)] origin-top-right z-[9999]"
                  >
                    
                    <div className="px-3 py-3 mb-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)]">
                        <p className="text-sm font-bold text-[var(--foreground)] truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)] font-medium">
                          {userRole}
                        </p>
                    </div>

                    {[
                      { label: 'App Guide',    icon: <BookOpen size={16}/>,    onClick: () => { startTour(); setIsUserMenuOpen(false) } },
                      { label: 'Switch User',  icon: <RefreshCw size={16}/>,   onClick: () => { setIsUserMenuOpen(false); router.push('/login') } },
                      { label: 'Download App', icon: <Smartphone size={16}/>,  onClick: () => { setShowAppModal(true); setIsUserMenuOpen(false) }, gold: true },
                    ].map(({ label, icon, onClick, gold }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95
                          ${gold ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            : 'text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary-muted)]'}`}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                    
                    {/* THEME SWITCH */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary-muted)] transition-all duration-200 active:scale-95 mt-1"
                    >
                        <div className="flex items-center gap-3">
                          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </div>
                        <div className={`relative h-5 w-9 rounded-full transition-colors ${isDarkMode ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}>
                          <div className={`absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-1'}`} />
                        </div>
                    </button>

                    <div className="h-px bg-[var(--border)] my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-all duration-200 active:scale-95"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              className="min-[1051px]:hidden flex p-2 text-[var(--foreground)] touch-target rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all duration-200 active:scale-95 items-center justify-center bg-[var(--surface)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 pointer-events-none" />
              ) : (
                <Menu className="h-5 w-5 pointer-events-none" />
              )}
            </button>

          </div>
        </div>

        {/* MOBILE MENU OVERLAY */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="min-[1051px]:hidden border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl overflow-hidden shadow-2xl"
            >
              <div className="px-4 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      isActive(item.href)
                        ? 'bg-[var(--primary-muted)] text-[var(--primary)] shadow-sm'
                        : 'text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                <div className="border-t border-[var(--border)] pt-3 mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                        setIsMobileMenuOpen(false)
                        router.push('/login')
                    }}
                    className="flex items-center w-full text-left px-4 py-3 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--foreground)] font-semibold text-sm transition-all duration-200 active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4 mr-3 text-[var(--foreground-subtle)]" />
                    Switch User
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                        setIsMobileMenuOpen(false)
                        setShowAppModal(true)
                    }}
                    className="flex items-center w-full text-left px-4 py-3 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--foreground)] font-semibold text-sm transition-all duration-200 active:scale-95"
                  >
                    <Download className="h-4 w-4 mr-3 text-[var(--foreground-subtle)]" />
                    Download App
                  </button>
                  
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-all duration-200 active:scale-95"
                  >
                    <div className="flex items-center">
                      {isDarkMode ? <Sun size={16} className="mr-3 text-[var(--foreground-subtle)]" /> : <Moon size={16} className="mr-3 text-[var(--foreground-subtle)]" />}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <div className={`relative h-5 w-9 rounded-full transition-colors ${isDarkMode ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger-muted)] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 mt-1"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Log out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </header>
    </>
  )
}

export default Navbar
