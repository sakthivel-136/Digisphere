'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Clock, 
  Users, 
  Activity, 
  QrCode, 
  BarChart3, 
  FileText, 
  MapPin, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react'
import AppDownloadModal from './components/ui/AppDownloadModal'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
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

export default function Hero() {
  const router = useRouter()
  const [showAppModal, setShowAppModal] = useState(false)

  // Real-world security metrics replacing the placeholder factory ones
  const metrics = [
    { label: "Active Guards", value: "120+", icon: Users },
    { label: "Daily Patrols", value: "2,500+", icon: Activity },
    { label: "Scan Points", value: "850", icon: MapPin },
    { label: "Coverage", value: "99.9%", icon: Shield }
  ]

  const features = [
    {
      title: "QR-Based Verification",
      desc: "Guards scan physical QR codes placed at critical factory locations to cryptographically prove their presence during patrol rounds.",
      icon: QrCode,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Live Analytics Dashboard",
      desc: "Monitor factory coverage in real-time. Track completion rates, identify missed checkpoints, and view guard leaderboards instantly.",
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Automated PDF Reports",
      desc: "Instantly generate and download comprehensive patrol reports with exact timestamps, guard IDs, and completion statuses.",
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Multi-Factory Scaling",
      desc: "Manage multiple factory locations, configure unlimited scan points, and set custom risk levels directly from the portal.",
      icon: MapPin,
      color: "text-violet-600",
      bg: "bg-violet-50"
    }
  ]

  return (
    <>
      <AppDownloadModal 
        isOpen={showAppModal} 
        onClose={() => setShowAppModal(false)} 
        appLink="https://docs.google.com/uc?export=download&id=14R6VexC8HZ02_GyVLZO97AdmWgOmFAFv"
      />
      
      {/* ── HERO SECTION ── */}
      <section className="relative w-full flex items-center justify-center overflow-hidden bg-slate-50 pt-16 pb-24 border-b border-[var(--border)]">
        {/* Ambient Splashes */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-[140px] opacity-10 animate-pulse-subtle pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-[var(--success)] rounded-full mix-blend-multiply filter blur-[140px] opacity-[0.05] animate-pulse-subtle delay-700 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-muted)] text-[var(--primary)] text-sm font-semibold border border-indigo-100/50 shadow-sm">
              <Shield className="w-4 h-4" />
              <span>Enterprise Security Infrastructure</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.1]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-indigo-400">
                PENTAGON SECURITY
              </span> <br />
              <span className="text-4xl lg:text-5xl mt-2 block">Patrol & Verification System</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg text-[var(--foreground-muted)] max-w-xl leading-relaxed">
              We replace outdated paper logs with a cryptographically secure, QR-based digital workflow. Ensure your guards are exactly where they need to be, exactly when they need to be there.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => router.push('/login')}
                className="btn-primary flex items-center gap-2 text-base px-8 py-4 shadow-lg shadow-indigo-500/20"
              >
                Access Admin Portal <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAppModal(true)}
                className="btn-secondary flex items-center gap-2 text-base px-8 py-4 bg-white border border-slate-200"
              >
                Download Guard App
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg mx-auto lg:ml-auto"
          >
            {/* Hero Card */}
            <div className="glass-surface rounded-3xl p-8 relative z-10 shadow-2xl overflow-hidden border border-white/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 z-0 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
                <div className="w-full flex justify-center p-6 bg-white/70 rounded-2xl shadow-sm border border-white/60 backdrop-blur-md">
                  <Image
                    src="/logocomm.png"
                    alt="Pentagon Garments Logo"
                    width={220}
                    height={70}
                    className="object-contain"
                    priority
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  {metrics.map((m, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -3, scale: 1.02 }}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-3 transition-all duration-300"
                    >
                      <div className="p-2 rounded-xl bg-slate-50">
                        <m.icon className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{m.value}</div>
                        <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-bold mt-0.5">{m.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Live Indicator */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-20"></div>
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Live Tracking</div>
                <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> System Active
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── WHAT WE DO SECTION ── */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[var(--primary)] font-bold tracking-wide uppercase text-sm mb-3">Core Capabilities</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] mb-6">
              How the System Works
            </h3>
            <p className="text-lg text-[var(--foreground-muted)] leading-relaxed">
              We bridge the gap between physical factory patrols and digital oversight. 
              Our comprehensive architecture ensures no checkpoint is missed and every round is documented.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${feat.bg} flex items-center justify-center mb-6`}>
                  <feat.icon className={`w-7 h-7 ${feat.color}`} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-3">{feat.title}</h4>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE / WORKFLOW SECTION ── */}
      <section className="py-24 bg-slate-50 border-t border-[var(--border)] overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Visual Representation */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 rounded-[40px] transform rotate-3 scale-105" />
              <div className="glass-surface rounded-[40px] p-8 border border-white/60 shadow-2xl relative z-10">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">1</div>
                    <div>
                      <h5 className="font-bold text-slate-800">Admin Defines Checkpoints</h5>
                      <p className="text-sm text-slate-500 mt-1">Print and place QR tags at physical locations (e.g., Warehouse 3, Gate A).</p>
                    </div>
                  </div>
                  {/* Step 2 */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">2</div>
                    <div>
                      <h5 className="font-bold text-slate-800">Guards Execute Patrols</h5>
                      <p className="text-sm text-slate-500 mt-1">Security staff scan QRs using the Android app. Geo-location and timestamps are locked.</p>
                    </div>
                  </div>
                  {/* Step 3 */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">3</div>
                    <div>
                      <h5 className="font-bold text-slate-800">System Aggregates Data</h5>
                      <p className="text-sm text-slate-500 mt-1">The Next.js backend generates leaderboards, tracks missed scans, and prepares PDFs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] mb-6">
                End-to-End Security Accountability
              </h2>
              <p className="text-lg text-[var(--foreground-muted)] leading-relaxed mb-8">
                The Digisphere Security Verifier is built to ensure complete transparency. By forcing guards to physically scan checkpoints, management guarantees that patrols actually happen.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  "No spoofing allowed — tied to physical QR scans",
                  "Hardware-accelerated web portal for instant insights",
                  "Role-based access control for Admins & Super Admins",
                  "100% data retention for auditing and compliance"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary"
              >
                View Live Dashboard
              </button>
            </motion.div>
          </div>
        </div>
      </section>

    </>
  )
}
