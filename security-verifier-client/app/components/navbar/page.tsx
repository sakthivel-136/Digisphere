'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, User, LogOut, RefreshCw, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clearAuth } from '@/app/services/token.service'
import AppDownloadModal from '../ui/AppDownloadModal'

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showAppModal, setShowAppModal] = useState(false)
  
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
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-spring">
          <div className="flex h-10 w-auto items-center">
            {/* Keeping original logo but you can replace with a sleek text mark if preferred */}
            <Image src="/logocomm.png" alt="Logo" width={170} height={4} priority className="object-contain" />
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden min-[1051px]:flex items-center justify-center flex-1 mx-4">
          <div className="flex items-center rounded-full bg-[var(--surface-muted)] px-2 py-1 shadow-inner border border-[var(--border)]">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} className="relative z-10 mx-1">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center"
                >
                  {isActive(item.href) && (
                    <motion.div 
                      layoutId="nav-pill" 
                      className="absolute inset-0 bg-white rounded-full shadow-sm" 
                      transition={{ type: "spring", stiffness: 380, damping: 30 }} 
                    />
                  )}
                  <span className={`px-4 py-2 text-sm font-medium rounded-full z-10 transition-colors ${isActive(item.href) ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </nav>

        {/* RIGHT ACTION ICONS */}
        <div className="flex items-center gap-3">
          
          {/* USER AVATAR (Visible on all screens) */}
          <div className="relative z-50" ref={userMenuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 touch-target rounded-full bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--ring)] hover:bg-[var(--primary)] hover:text-white transition-spring"
            >
              <User className="h-5 w-5" />
            </motion.button>
            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-3 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden z-[9999]"
              >
                  <div className="p-2 space-y-1">
                    <button onClick={() => router.push('/login')} className="flex items-center w-full px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)] rounded-lg transition-spring">
                      <RefreshCw className="h-4 w-4 mr-2 text-[var(--foreground-subtle)]" />
                      Switch User
                    </button>
                    <button 
                      onClick={() => setShowAppModal(true)} 
                      className="flex items-center w-full px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)] rounded-lg transition-spring"
                    >
                      <Download className="h-4 w-4 mr-2 text-[var(--foreground-subtle)]" />
                      Download App
                    </button>
                  </div>
                  <div className="border-t border-[var(--border)] p-2">
                    <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-muted)] rounded-lg transition-spring">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </button>
                  </div>
              </div>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button 
            className="max-[1050px]:flex hidden p-2 text-[var(--foreground)] touch-target rounded-full hover:bg-[var(--surface-hover)] transition-spring items-center justify-center" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-[1050px]:block hidden border-t border-[var(--border)] bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-xl px-4 py-3 font-medium transition-spring ${isActive(item.href) ? 'bg-[var(--primary-muted)] text-[var(--primary)]' : 'text-[var(--foreground)] hover:bg-[var(--surface-muted)]'}`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-[var(--border)] pt-4 mt-4 space-y-2">
                <button onClick={() => router.push('/login')} className="flex items-center w-full text-left px-4 py-3 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--foreground)] transition-spring">
                  <RefreshCw className="h-5 w-5 mr-3 text-[var(--foreground-subtle)]" />
                  Login / Switch
                </button>
                <button 
                  onClick={() => setShowAppModal(true)} 
                  className="flex items-center w-full text-left px-4 py-3 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--foreground)] transition-spring"
                >
                  <Download className="h-5 w-5 mr-3 text-[var(--foreground-subtle)]" />
                  Download App
                </button>
                <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger-muted)] rounded-xl transition-spring">
                  <LogOut className="h-5 w-5 mr-3" />
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