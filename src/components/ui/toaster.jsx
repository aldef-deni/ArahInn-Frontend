import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils'

let toastId    = 0
let listeners  = []

export function toast({ title, description, variant = 'default', duration = 4000 }) {
  const id = ++toastId
  listeners.forEach(fn => fn({ id, title, description, variant, duration }))
  return id
}

// ── Auto-detect success: jika tidak variant destructive & title mengandung kata sukses → success
const SUCCESS_KEYWORDS = [
  'berhasil', 'diperbarui', 'ditambahkan', 'disimpan', 'disetujui',
  'diaktifkan', 'dinonaktifkan', 'dihapus', 'dikirim', 'dibatalkan',
  'terdaftar', 'terkirim',
]

function detectVariant(variant, title = '') {
  if (variant === 'destructive') return 'destructive'
  if (variant === 'success') return 'success'
  const t = (title || '').toLowerCase()
  if (SUCCESS_KEYWORDS.some(k => t.includes(k))) return 'success'
  return variant || 'default'
}

function ToastItem({ id, title, description, variant: rawVariant, onDismiss }) {
  const variant = detectVariant(rawVariant, title)

  const config = {
    default: {
      Icon: Info,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100',
      borderClass: 'border-slate-200',
      bgClass: 'bg-white',
      accentBar: 'bg-blue-500',
    },
    destructive: {
      Icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      borderClass: 'border-red-200',
      bgClass: 'bg-red-50',
      accentBar: 'bg-red-500',
    },
    success: {
      Icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      borderClass: 'border-emerald-200',
      bgClass: 'bg-emerald-50',
      accentBar: 'bg-emerald-500',
    },
  }[variant]

  const Icon = config.Icon

  return (
    <div className={cn(
      'relative flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl border min-w-[300px] max-w-sm overflow-hidden animate-slide-in-right',
      config.borderClass,
      config.bgClass,
    )}>
      {/* Accent bar di kiri */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', config.accentBar)} />

      {/* Icon dalam circle */}
      <div className={cn('shrink-0 w-9 h-9 rounded-full flex items-center justify-center', config.iconBg)}>
        <Icon className={cn('w-5 h-5', config.iconColor)} strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title       && <p className={cn(
          'font-bold text-sm leading-tight',
          variant === 'success' ? 'text-emerald-900' :
          variant === 'destructive' ? 'text-red-900' :
          'text-slate-900'
        )}>{title}</p>}
        {description && <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{description}</p>}
      </div>

      <button onClick={() => onDismiss(id)}
        className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="Tutup"
      >
        <X className="w-3.5 h-3.5 text-slate-500" />
      </button>
    </div>
  )
}

export function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [t, ...prev].slice(0, 5))
      setTimeout(() => dismiss(t.id), t.duration)
    }
    listeners.push(handler)
    return () => { listeners = listeners.filter(f => f !== handler) }
  }, [])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none">
      <div className="flex flex-col gap-2.5 pointer-events-auto">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </div>
  )
}

// Re-export useToast from hook
export { useToast } from '@/hooks/use-toast'
