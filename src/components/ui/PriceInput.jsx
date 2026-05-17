import { forwardRef } from 'react'

const formatDisplay = (val) => {
  if (val === '' || val === null || val === undefined) return ''
  const num = typeof val === 'string' ? Number(String(val).replace(/\D/g, '')) : val
  if (!Number.isFinite(num) || num === 0) return num === 0 ? '0' : ''
  return num.toLocaleString('id-ID')
}

const parseNumeric = (str) => {
  const digits = String(str ?? '').replace(/\D/g, '')
  return digits === '' ? '' : Number(digits)
}

/**
 * PriceInput — input dengan format ribuan otomatis (1.000.000)
 *
 * Props:
 *  - value: number | '' (stored as number)
 *  - onChange: (n: number | '') => void
 *  - prefix: string (default 'Rp')
 *  - suffix: string (e.g. '/malam')
 *  - className: applied to wrapper div
 *  - inputClassName: applied to the <input>
 *  - placeholder: input placeholder text
 *  - disabled, name, id, etc.
 */
const PriceInput = forwardRef(function PriceInput(
  {
    value,
    onChange,
    prefix = 'Rp',
    suffix,
    className = '',
    inputClassName = '',
    placeholder = '0',
    disabled = false,
    ...rest
  },
  ref,
) {
  return (
    <div
      className={`flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 transition ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {prefix && (
        <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm font-medium border-r border-slate-200 shrink-0">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatDisplay(value)}
        onChange={(e) => onChange?.(parseNumeric(e.target.value))}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex-1 px-3 py-2.5 text-sm text-slate-900 focus:outline-none bg-transparent ${inputClassName}`}
        {...rest}
      />
      {suffix && (
        <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-xs border-l border-slate-200 shrink-0">
          {suffix}
        </span>
      )}
    </div>
  )
})

export default PriceInput

export { formatDisplay as formatPriceDisplay, parseNumeric as parsePriceInput }
