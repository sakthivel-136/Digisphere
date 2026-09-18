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
  ChevronDown,
  Download,
  RefreshCw,
  Moon,
  Sun,
} from 'lucide-react'
import { clearAuth } from '@/app/services/token.service'
import AppDownloadModal from '../ui/AppDownloadModal'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showAppModal, setShowAppModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    clearAuth()
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
    router.replace('/login')
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Reports', href: '/report-download' },
    { name: 'Users Management', href: '/user-crud' },
    { name: 'QR', href: '/dashboard/qr-crud' },
    { name: 'Factories', href: '/factory' },
  ]

  const isActive = (href: string) => pathname === href

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

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
      {/* APP DOWNLOAD MODAL */}
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
            className="flex items-center gap-2 hover:opacity-80 transition-spring"
          >
            <div className="flex h-10 w-auto items-center">
              <Image
                src="/logocomm.png"
                alt="Logo"
                width={170}
                height={40}
                priority
                className="object-contain"
              />
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden min-[1051px]:flex items-center justify-center flex-1 mx-4">
            <div className="flex items-center rounded-full bg-[var(--surface-muted)] px-2 py-1 shadow-inner border border-[var(--border)]">

              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative z-10 mx-1"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center"
                  >
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}

                    <span
                      className={`px-4 py-2 text-sm font-medium rounded-full z-10 transition-colors ${
                        isActive(item.href)
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {item.name}
                    </span>
                  </motion.div>
                </Link>
              ))}

            </div>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3">

            {/* PROFILE DROPDOWN */}
            <div
              className="relative z-[100]"
              ref={userMenuRef}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsUserMenuOpen((prev) => !prev)
                }}
                className="flex items-center gap-1 justify-center px-3 py-2 touch-target rounded-full bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--ring)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
              >
                <User className="h-5 w-5" />
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl ring-1 ring-black/5 z-[9999]"
                >

                    {/* USER HEADER */}
                    <div className="px-4 py-4 bg-[var(--surface-muted)] border-b border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-muted)] text-[var(--primary)]">
                          <User className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            User Account
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            Account Menu
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MENU ITEMS */}
                    <div className="p-2">

                      {/* SWITCH USER */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          router.push('/login')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                      >
                        <RefreshCw className="h-5 w-5 text-[var(--foreground-subtle)]" />

                        <span>Switch User</span>
                      </button>

                      {/* DOWNLOAD APP */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setShowAppModal(true)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                      >
                        <Download className="h-5 w-5 text-[var(--foreground-subtle)]" />

                        <span>Download App</span>
                      </button>

                      {/* THEME SWITCH */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isDarkMode ? (
                            <Sun className="h-5 w-5 text-[var(--foreground-subtle)]" />
                          ) : (
                            <Moon className="h-5 w-5 text-[var(--foreground-subtle)]" />
                          )}

                          <span>
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                          </span>
                        </div>

                        {/* Toggle */}
                        <div
                          className={`relative h-6 w-11 rounded-full transition-colors ${
                            isDarkMode
                              ? 'bg-[var(--primary)]'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                              isDarkMode
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </div>
                      </button>

                    </div>

                    {/* LOGOUT */}
                    <div className="border-t border-[var(--border)] p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors"
                      >
                        <LogOut className="h-5 w-5" />

                        <span>Log out</span>
                      </button>
                    </div>

                  </div>
                )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              className="max-[1050px]:flex hidden p-2 text-[var(--foreground)] touch-target rounded-full hover:bg-[var(--surface-hover)] transition-spring items-center justify-center"
              onClick={() =>
                setIsMobileMenuOpen((prev) => !prev)
              }
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

          </div>
        </div>

        {isMobileMenuOpen && (
            <div
              className="max-[1050px]:block hidden border-t border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2">

                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-xl px-4 py-3 font-medium transition-spring ${
                      isActive(item.href)
                        ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                <div className="border-t border-[var(--border)] pt-4 mt-4 space-y-2">

                  {/* SWITCH USER */}
                  <button
                    type="button"
                    onClick={() => {
                        setIsMobileMenuOpen(false)
                        router.push('/login')
                    }}
                    className="flex items-center w-full text-left px-4 py-3 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--foreground)] transition-spring"
                  >
                    <RefreshCw className="h-5 w-5 mr-3 text-[var(--foreground-subtle)]" />
                    Login / Switch
                  </button>

                  {/* DOWNLOAD APP */}
                  <button
                    type="button"
                    onClick={() => {
                        setIsMobileMenuOpen(false)
                        setShowAppModal(true)
                    }}
                    className="flex items-center w-full text-left px-4 py-3 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--foreground)] transition-spring"
                  >
                    <Download className="h-5 w-5 mr-3 text-[var(--foreground-subtle)]" />
                    Download App
                  </button>
                  
                  {/* THEME SWITCH MOBILE */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    <div className="flex items-center">
                      {isDarkMode ? (
                        <Sun className="h-5 w-5 mr-3 text-[var(--foreground-subtle)]" />
                      ) : (
                        <Moon className="h-5 w-5 mr-3 text-[var(--foreground-subtle)]" />
                      )}
                      <span className="text-base font-medium">
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </span>
                    </div>
                    <div
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        isDarkMode
                          ? 'bg-[var(--primary)]'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          isDarkMode
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </button>

                  {/* LOGOUT */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger-muted)] rounded-xl transition-spring"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Log out
                  </button>

                </div>
              </div>
            </div>
          )}

      </header>
    </>
  )
}

export default Navbar
