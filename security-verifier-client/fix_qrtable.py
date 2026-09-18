with open('app/components/qr/QrTable.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import { SpotlightCard } from "../ui/SpotlightCard";',
    ''
)
content = content.replace(
    '<SpotlightCard className="shadow-sm overflow-hidden p-0">',
    '<div className="w-full">'
)
content = content.replace(
    '</SpotlightCard>',
    '</div>'
)

# Fix colors
content = content.replace('bg-slate-50', 'bg-[var(--surface-muted)]')
content = content.replace('bg-white', 'bg-transparent')
content = content.replace('divide-slate-100', 'divide-[var(--border)]')
content = content.replace('border-slate-100', 'border-[var(--border)]')
content = content.replace('text-slate-400', 'text-[var(--foreground-muted)]')
content = content.replace('text-slate-800', 'text-[var(--foreground)]')
content = content.replace('text-slate-600', 'text-[var(--foreground-subtle)]')
content = content.replace('hover:bg-slate-50', 'hover:bg-[var(--surface-muted)]')

with open('app/components/qr/QrTable.tsx', 'w') as f:
    f.write(content)
