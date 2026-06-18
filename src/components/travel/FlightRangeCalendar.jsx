import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plane, Loader2 } from 'lucide-react'
import { formatRupiah } from '@/utils'

// Kalender rentang (range) untuk tiket pesawat Pulang-Pergi.
// Pilih tanggal pergi → pulang dalam satu kalender, dengan highlight rentang.
// Menampilkan harga termurah HANYA untuk 2 tanggal terpilih (depart & return).

const WD = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayYmd = () => { const t = new Date(); return ymd(t.getFullYear(), t.getMonth(), t.getDate()) }
const fmtChip = (s) => { if (!s) return '-'; const [y, m, d] = s.split('-').map(Number); return `${d} ${SHORT[m - 1]}` }

function MonthGrid({ year, month, depart, ret, minYmd, onPick }) {
  const startWd = (new Date(year, month, 1).getDay() + 6) % 7 // 0 = Senin
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWd; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  return (
    <div className="flex-1 min-w-[248px]">
      <p className="text-center font-display font-bold text-slate-800 mb-3">{MONTHS[month]} {year}</p>
      <div className="grid grid-cols-7 mb-1.5">
        {WD.map((w, i) => (
          <div key={w} className={`text-center text-[11px] font-semibold ${i === 6 ? 'text-rose-400' : 'text-slate-400'}`}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const cur = ymd(year, month, d)
          const disabled = cur < minYmd
          const isDep = cur === depart
          const isRet = cur === ret
          const inRange = depart && ret && cur > depart && cur < ret
          const edge = isDep || isRet
          const isSun = i % 7 === 6
          return (
            <div key={i} className={`relative flex items-center justify-center ${inRange ? 'bg-sky-50' : ''} ${isDep && ret ? 'bg-gradient-to-r from-transparent to-sky-50' : ''} ${isRet ? 'bg-gradient-to-l from-transparent to-sky-50' : ''}`}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(cur)}
                className={`w-9 h-9 rounded-full text-sm font-semibold flex items-center justify-center transition-colors
                  ${disabled ? 'text-slate-300 cursor-not-allowed'
                    : edge ? 'bg-sky-500 text-white shadow-sm'
                    : inRange ? 'text-sky-700'
                    : isSun ? 'text-rose-500 hover:bg-slate-100'
                    : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {d}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FlightRangeCalendar({ value, onChange, onClose, onConfirm, prices, pricesLoading }) {
  const minYmd = todayYmd()
  const depart = value?.depart || ''
  const ret = value?.return || ''

  const init = depart ? depart.split('-').map(Number) : (() => { const t = new Date(); return [t.getFullYear(), t.getMonth() + 1, 1] })()
  const [base, setBase] = useState({ y: init[0], m: init[1] - 1 })

  const next = { y: base.m === 11 ? base.y + 1 : base.y, m: (base.m + 1) % 12 }
  const now = new Date()
  const prevDisabled = base.y < now.getFullYear() || (base.y === now.getFullYear() && base.m <= now.getMonth())

  const pick = (cur) => {
    // belum ada depart, atau sudah lengkap → mulai ulang dari depart
    if (!depart || (depart && ret)) { onChange({ depart: cur, return: '' }); return }
    if (cur <= depart) { onChange({ depart: cur, return: '' }); return }
    onChange({ depart, return: cur })
  }

  const goPrev = () => { if (prevDisabled) return; setBase(b => ({ y: b.m === 0 ? b.y - 1 : b.y, m: (b.m + 11) % 12 })) }
  const goNext = () => setBase(b => ({ y: b.m === 11 ? b.y + 1 : b.y, m: (b.m + 1) % 12 }))

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 sm:p-5 max-w-[640px]">
        {/* Nav */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={goPrev} disabled={prevDisabled}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-slate-400">Pilih tanggal pergi & pulang</span>
          <button type="button" onClick={goNext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Months */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
          <MonthGrid year={base.y} month={base.m} depart={depart} ret={ret} minYmd={minYmd} onPick={pick} />
          <div className="hidden sm:block">
            <MonthGrid year={next.y} month={next.m} depart={depart} ret={ret} minYmd={minYmd} onPick={pick} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Plane className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-slate-700">Berangkat {fmtChip(depart)}</span>
            <span className="text-slate-300">|</span>
            <span className={`font-semibold ${ret ? 'text-slate-700' : 'text-slate-400'}`}>Pulang {fmtChip(ret)}</span>
          </div>
          {(prices || pricesLoading) && (
            <div className="flex items-center gap-3 text-xs">
              {pricesLoading
                ? <span className="flex items-center gap-1 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Cek harga…</span>
                : <>
                    {prices?.depart != null && <span className="text-slate-500">Pergi: <b className="text-sky-600">{formatRupiah(prices.depart)}</b></span>}
                    {prices?.return != null && <span className="text-slate-500">Pulang: <b className="text-sky-600">{formatRupiah(prices.return)}</b></span>}
                  </>}
            </div>
          )}
        </div>

        <button type="button" onClick={onConfirm} disabled={!depart || !ret}
          className="w-full mt-3 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {!depart || !ret ? 'Pilih tanggal pulang' : 'Selesai'}
        </button>
      </div>
    </>
  )
}
