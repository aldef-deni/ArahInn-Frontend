import { useState, useEffect } from 'react'

/**
 * Pemilih tanggal lahir berbasis dropdown (Tanggal · Bulan · Tahun).
 * Hanya menampilkan TAHUN/bulan/hari yang valid dalam rentang min–max,
 * sehingga tahun di luar kategori usia (mis. bayi 0–23 bln) tidak muncul.
 * value & onChange memakai format YYYY-MM-DD.
 */
const pad = (n) => String(n).padStart(2, '0')
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const daysInMonth = (y, m) => new Date(y, m, 0).getDate() // m: 1–12

export default function BirthdatePicker({ label, value, min, max, onChange }) {
  const [minY, minM, minD] = (min || '1900-01-01').split('-').map(Number)
  const [maxY, maxM, maxD] = (max || '2100-12-31').split('-').map(Number)

  const seed = value ? value.split('-') : ['', '', '']
  const [yy, setYy] = useState(seed[0] || '')
  const [mm, setMm] = useState(seed[1] ? String(Number(seed[1])) : '')
  const [dd, setDd] = useState(seed[2] ? String(Number(seed[2])) : '')

  // Sinkron bila value direset dari luar (mis. ganti kategori)
  useEffect(() => {
    if (!value) { setYy(''); setMm(''); setDd('') }
  }, [value])

  const years = []
  for (let y = maxY; y >= minY; y--) years.push(y)

  const monthsFor = (y) => {
    const lo = Number(y) === minY ? minM : 1
    const hi = Number(y) === maxY ? maxM : 12
    const arr = []
    for (let m = lo; m <= hi; m++) arr.push(m)
    return arr
  }
  const daysFor = (y, m) => {
    if (!y || !m) return Array.from({ length: 31 }, (_, i) => i + 1)
    let lo = 1, hi = daysInMonth(Number(y), Number(m))
    if (Number(y) === minY && Number(m) === minM) lo = minD
    if (Number(y) === maxY && Number(m) === maxM) hi = Math.min(hi, maxD)
    const arr = []
    for (let d = lo; d <= hi; d++) arr.push(d)
    return arr
  }

  const commit = (ny, nm, nd) => onChange(ny && nm && nd ? `${ny}-${pad(Number(nm))}-${pad(Number(nd))}` : '')

  const pick = (which, raw) => {
    let ny = yy, nm = mm, nd = dd
    if (which === 'y') ny = raw
    if (which === 'm') nm = raw
    if (which === 'd') nd = raw
    // Re-validasi bulan terhadap tahun
    if (ny && nm) {
      const lo = Number(ny) === minY ? minM : 1
      const hi = Number(ny) === maxY ? maxM : 12
      if (Number(nm) < lo || Number(nm) > hi) nm = ''
    }
    // Re-validasi hari terhadap tahun+bulan
    if (ny && nm && nd) {
      const ok = daysFor(ny, nm).includes(Number(nd))
      if (!ok) nd = ''
    }
    setYy(ny); setMm(nm); setDd(nd)
    commit(ny, nm, nd)
  }

  const selCls = 'w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <div>
      {label && <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        <select aria-label="Tanggal" value={dd} onChange={e => pick('d', e.target.value)} disabled={!yy || !mm} className={selCls}>
          <option value="">Tgl</option>
          {daysFor(yy, mm).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label="Bulan" value={mm} onChange={e => pick('m', e.target.value)} disabled={!yy} className={selCls}>
          <option value="">Bulan</option>
          {monthsFor(yy || maxY).map(m => <option key={m} value={m}>{MONTHS_ID[m - 1]}</option>)}
        </select>
        <select aria-label="Tahun" value={yy} onChange={e => pick('y', e.target.value)} className={selCls}>
          <option value="">Tahun</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}
