import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils'

let toastId    = 0
let listeners  = []

export function toast({ title, description, variant = 'default', duration = 4000 }) {
  const id = ++toastId
  listeners.forEach(fn => fn({ id, title, description, variant, duration }))
  return id
}

// Attach to useToast hook
import('@/hooks/use-toast').then(m => {
  // no-op: hook handles its own state
}).catch(() => {})

function ToastItem({ id, title, description, variant, onDismiss }) {
  const icons = {
    default     : <Info className="w-4 h-4 text-blue-500" />,
    destructive : <XCircle className="w-4 h-4 text-red-500" />,
    success     : <CheckCircle className="w-4 h-4 text-green-500" />,
  }

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl border bg-white min-w-[280px] max-w-sm animate-slide-in-right',
      variant === 'destructive' && 'border-red-200 bg-red-50',
    )}>
      <div className="shrink-0 mt-0.5">{icons[variant] || icons.default}</div>
      <div className="flex-1 min-w-0">
        {title       && <p className="font-semibold text-sm">{title}</p>}
        {description && <p className="text-muted-foreground text-xs mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onDismiss(id)}
        className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors">
        <X className="w-3.5 h-3.5 text-muted-foreground" />
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
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  )
}

// Re-export useToast from hook
export { useToast } from '@/hooks/use-toast'
