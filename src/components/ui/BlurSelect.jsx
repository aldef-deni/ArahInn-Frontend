import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

/**
 * Dropdown custom dengan background blur (glassmorphism), teks jelas.
 * Pakai portal ke body supaya tidak ter-clip oleh container overflow-hidden.
 * options: [{ value, label }]
 */
export default function BlurSelect({ value, onChange, options = [], placeholder = '' }) {
  const btnRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)

  const selected = options.find(o => String(o.value) === String(value))

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    setPos({ left: r.left, top: r.bottom + 6, width: r.width })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="w-full flex items-center justify-between gap-2 bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-white/60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[91] max-h-64 overflow-y-auto scrollbar-hide rounded-2xl border border-white/20 bg-slate-900/60 backdrop-blur-2xl shadow-2xl py-1.5"
            style={{ left: pos.left, top: pos.top, width: Math.max(pos.width, 170) }}
          >
            {options.map(opt => {
              const active = String(opt.value) === String(value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    active ? 'bg-white/25 text-white font-semibold' : 'text-white/90 hover:bg-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
