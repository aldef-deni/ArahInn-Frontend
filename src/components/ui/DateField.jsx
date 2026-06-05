import { useRef } from 'react'

/**
 * Field tanggal dengan tampilan DD/MM/YYYY (value internal tetap YYYY-MM-DD).
 * Seluruh kotak clickable → buka kalender native (showPicker).
 */
export default function DateField({ label, value, onChange, max, min, icon: Icon, placeholder = 'DD/MM/YYYY' }) {
  const ref = useRef(null)
  const open = () => {
    const el = ref.current
    if (!el) return
    try { el.showPicker ? el.showPicker() : el.focus() } catch { el.focus() }
  }
  const disp = value
    ? (() => { const [y, m, d] = value.split('-'); return `${d}/${m}/${y}` })()
    : placeholder

  return (
    <div>
      {label && <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>}
      <div
        className="relative flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus-within:ring-2 focus-within:ring-brand/30"
        onClick={open}
      >
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className={`flex-1 text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`}>{disp}</span>
        <input
          ref={ref}
          type="date"
          value={value || ''}
          max={max}
          min={min}
          onChange={e => onChange(e.target.value)}
          className="absolute bottom-1 left-3 w-px h-px opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-label={label}
        />
      </div>
    </div>
  )
}
