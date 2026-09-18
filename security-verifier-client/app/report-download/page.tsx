'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Search, AlertTriangle, FileText, Calendar, Building2, User, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Placeholder imports for your existing components
import ReportTable from '@/app/components/reports/ReportTable'
import { getApiUrl } from "@/app/utils/apiUrl"
import PatrolReportPDF from '@/app/components/reports/PatrolReportPDF'
import { tokenService } from '@/app/services/token.service'

const IconSpinner = () => <Loader2 className="w-5 h-5 animate-spin" />

export default function ReportDownloadPage() {
  const router = useRouter()
  const [factories, setFactories] = useState<any[]>([])
  const [factoryCode, setFactoryCode] = useState("")
  
  const [reportType, setReportType] = useState<"single" | "range" | "month">("single")
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })

  const [report, setReport] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollReport = async () => {
    // Only poll if we have already fetched once (report has items or we explicitly loaded)
    // Actually, just calling fetch without setting loading to true
    if (!tokenService.get()) return;
    try {
      let url = `${getApiUrl()}/report/download?factory_code=${factoryCode}`
      if (reportType === 'single') {
        url += `&report_date=${reportDate}`
      } else if (reportType === 'range') {
        url += `&report_date=${reportDate}&end_date=${endDate}`
      } else {
        const y = selectedMonth.split('-')[0]
        const m = selectedMonth.split('-')[1]
        url += `&month=${m}&year=${y}`
      }
      
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tokenService.get()}` } })
      if (res.ok) {
        const data = await res.json()
        setReport(data.report || [])
      }
    } catch (e) {
      // silent fail on poll
    }
  }

  // Poll every 15 seconds automatically
  useEffect(() => {
    const interval = setInterval(() => {
      pollReport()
    }, 15000)
    return () => clearInterval(interval)
  }, [factoryCode, reportType, reportDate, endDate, selectedMonth])

  // Get Admin Name (JWT payload)
  const [adminName, setAdminName] = useState("")
  const [pdfTrigger, setPdfTrigger] = useState(0)
  
  // Purge State
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [purgeConfirmText, setPurgeConfirmText] = useState("")

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = tokenService.get()
    if (!token) {
      router.push('/login')
      return
    }

    const storedName = localStorage.getItem('adminName') || localStorage.getItem('name') || "Admin"
    setAdminName(storedName)

    fetchFactories()
  }, [router])

  const fetchFactories = async () => {
    try {
      const token = tokenService.get()
      const res = await fetch(`${getApiUrl()}/factories`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch factories")
      const data = await res.json()
      setFactories(data)
      if (data.length > 0) setFactoryCode(data[0].factory_code)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    setReport([])
    
    try {
      const token = tokenService.get()
      let url = `${getApiUrl()}/report/download?factory_code=${factoryCode}`
      
      if (reportType === 'single') {
        url += `&report_date=${reportDate}`
      } else if (reportType === 'range') {
        url += `&report_date=${reportDate}&end_date=${endDate}`
      } else {
        const y = selectedMonth.split('-')[0]
        const m = selectedMonth.split('-')[1]
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
        url += `&report_date=${selectedMonth}-01&end_date=${selectedMonth}-${lastDay}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to fetch report")
      
      setReport(Array.isArray(data) ? data : data.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    setPdfLoading(true)
    setPdfTrigger(prev => prev + 1)
    setTimeout(() => {
      setPdfLoading(false)
    }, 1500)
  }

  const handlePurgeData = async () => {
    // Standard Purge Logic (You can hook this up to your actual API)
    alert(`Purging data for ${factoryCode}...`)
    setShowPurgeModal(false)
    setPurgeConfirmText("")
  }

  const currentFactory = factories.find(f => f.factory_code === factoryCode)
  const factoryName = currentFactory?.factory_name || factoryCode

  // Calculate cleanLogs for rendering
  const cleanLogs = report

  return (
    <div className="w-full flex-1">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Patrol Reports</h1>
            <p className="text-[var(--foreground-muted)] text-sm">View logs, generate documentation, and manage patrol data.</p>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 border-[var(--border)] shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
            <span className="text-sm font-medium">Admin: {adminName || "Loading..."}</span>
          </div>
        </div>

        {/* ERROR TOAST */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 rounded-xl bg-[var(--danger-muted)] text-[var(--danger)] border border-[var(--danger)]/20 shadow-sm flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTROLS CARD */}
        <div className="card-modern p-6 mb-8 relative z-10">
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-[var(--surface-muted)] p-1 rounded-xl inline-flex">
            {(['single', 'range', 'month'] as const).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-spring z-10 ${reportType === type ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
              >
                {reportType === type && (
                  <motion.div layoutId="reportTab" className="absolute inset-0 bg-white shadow-sm rounded-lg -z-10" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                )}
                {type === 'single' ? 'Daily' : type === 'range' ? 'Date Range' : 'Monthly'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            
            {/* FACTORY */}
            <div className={reportType === "range" ? "md:col-span-3" : "md:col-span-4"}>
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                <Building2 className="w-4 h-4" /> Location
              </label>
              <select
                className="input-modern"
                value={factoryCode}
                onChange={(e) => setFactoryCode(e.target.value)}
              >
                {factories.map((f) => (
                  <option key={f.factory_code} value={f.factory_code}>
                    {f.factory_name}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE SELECTORS */}
            {reportType === "single" && (
              <div className="md:col-span-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4" /> Patrol Date
                </label>
                <input
                  type="date"
                  className="input-modern"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
            )}

            {reportType === "range" && (
              <>
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">From Date</label>
                  <input
                    type="date"
                    className="input-modern"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">To Date</label>
                  <input
                    type="date"
                    className="input-modern"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {reportType === "month" && (
              <div className="md:col-span-4">
                <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">Select Month</label>
                <input
                  type="month"
                  className="input-modern"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className={`md:col-span-4 flex gap-3 ${reportType === "range" ? "md:col-span-3" : ""}`}>
              <button
                onClick={fetchReport}
                disabled={loading}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <IconSpinner /> : <><Search className="w-4 h-4" /> View</>}
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={!report.length || pdfLoading || loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? <IconSpinner /> : <><Download className="w-4 h-4" /> Export</>}
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS AREA */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* PURGE ACTION BAR */}
          <div className="flex justify-end">
             <button 
                onClick={() => setShowPurgeModal(true)}
                className="btn-danger flex items-center gap-2 text-sm py-2 px-4 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Purge Old Data
             </button>
          </div>

          <div className="card-modern overflow-hidden min-h-[400px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--foreground-subtle)] space-y-4">
                <IconSpinner />
                <p className="text-sm">Fetching patrol data...</p>
              </div>
            ) : cleanLogs.length > 0 ? (
              <div ref={printRef} className="flex-1">
                <div className="border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-muted)] flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold">Report Data</h3>
                  <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-[var(--primary-muted)] text-[var(--primary)] rounded-full">
                    {cleanLogs.length} Records
                  </span>
                </div>
                <ReportTable logs={cleanLogs} loading={loading} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--foreground-subtle)] space-y-3 opacity-60">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="font-medium text-lg">No data found</p>
                <p className="text-sm">Select a factory and date range to view logs.</p>
              </div>
            )}
          </div>
        </div>

        {/* PDF HIDDEN RENDER */}
        {pdfTrigger > 0 && cleanLogs.length > 0 && (
          <div className="hidden">
            <PatrolReportPDF
              key={pdfTrigger}
              logs={cleanLogs}
              factoryCode={factoryCode}
              factoryName={factoryName}
              factoryAddress={currentFactory?.factory_address || "N/A"}
              reportDate={
                reportType === "single"
                  ? reportDate
                  : reportType === "range"
                  ? `${reportDate} to ${endDate}`
                  : `${new Date(selectedMonth + "-02").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
              }
              generatedBy={adminName}
            />
          </div>
        )}

        {/* PURGE MODAL */}
        <AnimatePresence>
          {showPurgeModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[var(--border)]"
              >
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--danger-muted)] flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-[var(--danger)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Purge Old Data?</h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-6">
                    This action is permanent and cannot be undone. To confirm, please type the factory code <strong className="text-[var(--foreground)]">{factoryCode}</strong> below.
                  </p>
                  
                  <input
                    type="text"
                    placeholder="Factory Code"
                    value={purgeConfirmText}
                    onChange={(e) => setPurgeConfirmText(e.target.value)}
                    className="input-modern mb-6"
                  />
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowPurgeModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handlePurgeData}
                      disabled={purgeConfirmText !== factoryCode}
                      className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Purge Data
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
