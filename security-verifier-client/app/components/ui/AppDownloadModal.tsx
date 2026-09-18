'use client'

import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Download } from 'lucide-react'
import QRCode from 'react-qr-code'

interface AppDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  appLink?: string
}

function MagneticButton({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 400, damping: 25 })
  const springY = useSpring(y, { stiffness: 400, damping: 25 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    // Calculate distance from center (max pull is 20px)
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    
    x.set(distanceX * 0.2)
    y.set(distanceY * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative touch-target ${className || ''}`}
    >
      {children}
    </motion.button>
  )
}

export default function AppDownloadModal({ isOpen, onClose, appLink = "https://pentagongarments.com/app" }: AppDownloadModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="glass-panel w-full max-w-md p-8 rounded-3xl pointer-events-auto shadow-2xl relative overflow-hidden"
            >
              {/* Background gradient orb */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--primary)] opacity-20 rounded-full blur-[64px] pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 transition-colors bg-white/50 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 bg-indigo-50 text-[var(--primary)] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                  <Smartphone className="w-8 h-8" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Download the App</h2>
                <p className="text-slate-500 mb-8 max-w-[280px]">
                  Scan this QR code with your phone camera to download the Pentagon Garments production app.
                </p>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 raise-hover">
                  <QRCode 
                    value={appLink} 
                    size={180}
                    level="H"
                    fgColor="#0f172a"
                  />
                </div>

                <div className="relative w-full flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>
                  
                  <MagneticButton 
                    onClick={() => window.open(appLink, '_blank')}
                    className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Click to Download</span>
                  </MagneticButton>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
