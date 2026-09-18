with open('app/dashboard/qr-crud/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import { StaggeredList, StaggeredItem } from "@/app/components/ui/LayoutOrchestration";',
    """import { PageTransition } from '@/app/components/layout/PageTransition';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { PageLoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/animations';
import { QrCode, Plus } from 'lucide-react';"""
)

content = content.replace(
    '    return <div className="p-6 text-white min-h-screen bg-[#07071f] flex items-center justify-center">Checking access...</div>;',
    '    return <PageTransition><PageLoadingSpinner label="Checking access..." /></PageTransition>;'
)

content = content.replace(
    '''  return (
    <StaggeredList className="min-h-screen bg-slate-50 p-8 font-sans">
      <StaggeredItem className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Workstations / QR Codes</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and generate QR tags for factory lines</p>
        </div>
        <button
          onClick={handleAddQr}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
        >
          <span>Add Workstation QR</span>
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </StaggeredItem>

      <StaggeredItem className="max-w-7xl mx-auto mb-6">
        <QrFilters
          value={selectedFactory}
          onChange={(code) => {
            setSelectedFactory(code);
            loadQRCodes(code);
          }}
          factories={factories}
        />
      </StaggeredItem>

      <StaggeredItem className="max-w-7xl mx-auto">
        <QrTable
          qrCodes={filteredQrCodes}
          onEdit={handleEditQr}
          onDelete={handleDeleteQr}
          onView={handleViewQr}
          onToggleStatus={handleToggleStatus}
        />
      </StaggeredItem>''',
    '''  return (
    <PageTransition>
      <PageContainer>
        <motion.div variants={containerVariants} initial="initial" animate="animate">
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
                <QrCode className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Workstations / QR Codes
                </h1>
                <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                  Manage and generate QR tags for factory lines
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={handleAddQr}
              className="btn-primary flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Workstation QR
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <GlassCard>
              <QrFilters
                value={selectedFactory}
                onChange={(code) => {
                  setSelectedFactory(code);
                  loadQRCodes(code);
                }}
                factories={factories}
              />
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard noPadding className="overflow-hidden">
              <QrTable
                qrCodes={filteredQrCodes}
                onEdit={handleEditQr}
                onDelete={handleDeleteQr}
                onView={handleViewQr}
                onToggleStatus={handleToggleStatus}
              />
            </GlassCard>
          </motion.div>
        </motion.div>'''
)

content = content.replace('    </StaggeredList>', '      </PageContainer>\n    </PageTransition>')


with open('app/dashboard/qr-crud/page.tsx', 'w') as f:
    f.write(content)
