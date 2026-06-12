import { useRef } from 'react'
import { Calendar } from 'lucide-react'

// Menampilkan tanggal sebagai DD/MM/YYYY (format Indonesia), apa pun locale browser.
// Nilai tetap disimpan ISO (yyyy-mm-dd) seperti <input type="date"> biasa, dan
// kalender native tetap dipakai (overlay transparan + showPicker).
const isoToDmy = (iso) => {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  return (y && m && d) ? `${d}/${m}/${y}` : ''
}

export default function DateInput({
  value, onChange, min, max, disabled, className = '', placeholder = 'DD/MM/YYYY',
}) {
  const ref = useRef(null)
  const openPicker = () => {
    const el = ref.current
    if (!el || disabled) return
    if (typeof el.showPicker === 'function') {
      try { el.showPicker() } catch { el.focus() }
    } else {
      el.focus()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white ${disabled ? 'opacity-50' : ''}`}>
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value ? isoToDmy(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
      <input
        ref={ref}
        type="date"
        value={value || ''}
        min={min}
        max={max}
        disabled={disabled}
        onClick={openPicker}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label={placeholder}
      />
    </div>
  )
}
