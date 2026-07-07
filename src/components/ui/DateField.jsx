/**
 * Field tanggal dengan tampilan DD/MM/YYYY (value internal tetap YYYY-MM-DD).
 * Seluruh kotak clickable → buka kalender native. Input transparan menutupi
 * seluruh kotak (overlay) supaya tap langsung membuka picker native di semua
 * browser, termasuk Safari iOS (yang tidak mendukung showPicker/focus programatik).
 */
export default function DateField({ label, value, onChange, max, min, icon: Icon, placeholder = 'DD/MM/YYYY', className, labelClassName }) {
  const disp = value
    ? (() => { const [y, m, d] = value.split('-'); return `${d}/${m}/${y}` })()
    : placeholder

  const boxCls = className || 'relative flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus-within:ring-2 focus-within:ring-brand/30'

  return (
    <div>
      {label && <label className={labelClassName || 'block text-[11px] font-semibold text-slate-500 mb-1'}>{label}</label>}
      <div className={boxCls}>
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className={`flex-1 text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`}>{disp}</span>
        <input
          type="date"
          value={value || ''}
          max={max}
          min={min}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
      </div>
    </div>
  )
}
