'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Shield, Clock, Users, Activity } from 'lucide-react'
import AppDownloadModal from './components/ui/AppDownloadModal'

export default function Hero() {
  const router = useRouter()
  const [showAppModal, setShowAppModal] = useState(false)

  const metrics = [
    { label: "Active Operators", value: "250+", icon: Users },
    { label: "Daily Batches", value: "10k+", icon: Activity },
    { label: "Uptime", value: "99.9%", icon: Clock },
    { label: "Active Lines", value: "45", icon: Shield }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
  }

  return (
    <>
      <AppDownloadModal 
        isOpen={showAppModal} 
        onClose={() => setShowAppModal(false)} 
        appLink="https://docs.google.com/uc?export=download&id=14R6VexC8HZ02_GyVLZO97AdmWgOmFAFv"
      />
      <section className="relative min-h-[calc(100vh-64px)] w-full flex items-center justify-center overflow-hidden bg-background">
        {/* 1. Ambient Background Splashes */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-pulse-subtle pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[var(--success)] rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.07] animate-pulse-subtle delay-700 pointer-events-none" />

        <div className="container mx-auto px-6 py-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content Area */}
          <motion.div 
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-muted)] text-[var(--primary)] text-sm font-semibold border border-[var(--ring)]">
              <Shield className="w-4 h-4" />
              <span>Secure & Reliable Operations</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-indigo-400">
                PENTAGON SECURITY
              </span> <br />
              PATROL AND MANAGEMENT SYSTEM
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg lg:text-xl text-[var(--foreground-muted)] max-w-xl leading-relaxed">
              Turn routine factory security rounds into measurable, reliable, and proactive workflows with real-time analytics and QR-based monitoring.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => router.push('/login')}
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
              >
                Enter Portal <Activity className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAppModal(true)}
                className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
              >
                Download App
              </button>
            </motion.div>
          </motion.div>

          {/* Right Preview/Metrics Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg mx-auto lg:mr-0"
          >
            {/* Main Glass Card */}
            <div className="glass-panel rounded-3xl p-8 relative z-10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
                <div className="w-full flex justify-center p-4 bg-white/50 rounded-2xl shadow-sm border border-white/60">
                  <Image
                    src="/logocomm.png"
                    alt="Pentagon Garments Logo"
                    width={240}
                    height={80}
                    className="object-contain"
                    priority
                  />
                </div>

                {/* Mini Metrics Grid inside the card */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  {metrics.map((m, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -2 }}
                      className="bg-white/80 p-4 rounded-xl border border-[var(--border)] shadow-sm flex flex-col items-start gap-2 transition-spring"
                    >
                      <m.icon className="w-5 h-5 text-[var(--primary)]" />
                      <div>
                        <div className="text-2xl font-bold text-[var(--foreground)]">{m.value}</div>
                        <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">{m.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Element 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 glass-panel p-4 rounded-xl shadow-lg z-20 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--success-muted)] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--foreground)]">Line Active</div>
                <div className="text-xs text-[var(--foreground-muted)]">All units producing</div>
              </div>
            </motion.div>
            
          </motion.div>
        </div>
      </section>
    </>
  )
}