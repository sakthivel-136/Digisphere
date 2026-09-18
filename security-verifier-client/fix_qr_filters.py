with open('app/components/qr/QrFilters.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex items-center gap-4"',
    'className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full max-w-md"'
)
content = content.replace(
    'text-blue-600',
    'text-[var(--primary)]'
)
content = content.replace(
    'text-slate-700',
    'text-[var(--foreground-muted)]'
)
content = content.replace(
    'w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-white hover:border-blue-300 transition-all cursor-pointer',
    'input-modern'
)
with open('app/components/qr/QrFilters.tsx', 'w') as f:
    f.write(content)
