import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plane, TrainFront, Ship, ArrowRight, Calendar, Users,
  Ticket, Clock, CheckCircle2, XCircle, ChevronRight, Download, Loader2,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'

const MODA = {
  pesawat: { label: 'Pesawat',    Icon: Plane,      grad: 'from-sky-400/15 to-blue-500/10',     ring: 'text-sky-600',    dot: 'bg-sky-500' },
  kereta:  { label: 'Kereta Api', Icon: TrainFront, grad: 'from-amber-400/15 to-orange-500/10', ring: 'text-amber-600',  dot: 'bg-amber-500' },
  pelni:   { label: 'Kapal Laut', Icon: Ship,       grad: 'from-cyan-400/15 to-blue-500/10',    ring: 'text-cyan-600',   dot: 'bg-cyan-500' },
}
const STATUS = {
  pending_payment: { label: 'Menunggu Pembayaran', cls: 'bg-amber-50 text-amber-700 ring-amber-200',     Icon: Clock },
  paid:            { label: 'Diproses',            cls: 'bg-blue-50 text-blue-700 ring-blue-200',        Icon: Clock },
  issued:          { label: 'E-Tiket Terbit',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CheckCircle2 },
  canceled:        { label: 'Dibatalkan',          cls: 'bg-rose-50 text-rose-600 ring-rose-200',        Icon: XCircle },
  expired:         { label: 'Kedaluwarsa',         cls: 'bg-slate-100 text-slate-500 ring-slate-200',    Icon: XCircle },
  failed:          { label: 'Gagal',               cls: 'bg-rose-50 text-rose-600 ring-rose-200',        Icon: XCircle },
}
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const fmtDate = (d) => { if (!d) return '-'; const x = new Date(d); return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}` }
const fmtTime = (s) => !s ? '' : (s.length === 4 ? `${s.slice(0,2)}:${s.slice(2,4)}` : s.slice(0,5))
const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

export default function TravelBookingList() {
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['my-travel-bookings'],
    queryFn : () => travelApi.myBookings().then(r => r.data?.data || []),
  })

  const downloadEtiket = async (b) => {
    setDownloading(b.id)
    try {
      const res  = await travelApi.downloadEtiket(b.id)
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      Object.assign(document.createElement('a'), { href: url, download: `E-Tiket-${b.code}.pdf` }).click()
      URL.revokeObjectURL(url)
    } catch { /* noop */ }
    finally { setDownloading(null) }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
            <div className="skeleton h-4 w-24 rounded-full mb-4" />
            <div className="skeleton h-5 w-2/3 rounded mb-3" />
            <div className="skeleton h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="text-center py-14 sm:py-20 px-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-100 to-cyan-50 flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-9 h-9 text-sky-400" />
        </div>
        <p className="font-semibold text-base sm:text-lg text-slate-800">Belum ada pesanan tiket</p>
        <p className="text-slate-400 text-xs sm:text-sm mt-1.5 mb-6 max-w-xs mx-auto">Pesanan tiket pesawat, kereta, dan kapal laut kamu akan muncul di sini.</p>
        <button onClick={() => navigate('/tiket')}
          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all">
          Pesan Tiket
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {data.map(b => {
        const m = MODA[b.moda] || MODA.pesawat
        const s = STATUS[b.status] || STATUS.pending_payment
        const Icon = m.Icon, SIcon = s.Icon
        const isIssued  = b.status === 'issued'
        const isPending = b.status === 'pending_payment'
        const isDownloading = downloading === b.id

        return (
          <div key={b.id} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_14px_-6px_rgba(15,23,42,0.12)] hover:shadow-[0_8px_28px_-10px_rgba(15,23,42,0.18)] transition-all duration-300">
            {/* Header strip — soft moda gradient */}
            <div className={`relative px-4 sm:px-5 py-3 bg-gradient-to-r ${m.grad} flex items-center justify-between gap-2`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center shadow-sm shrink-0">
                  <Icon className={`w-4.5 h-4.5 ${m.ring}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-800 leading-tight">{m.label}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{b.code}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold ring-1 ${s.cls} shrink-0`}>
                <SIcon className="w-3 h-3" /> {s.label}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {/* Route */}
              <div className="flex items-center gap-3">
                <div className="text-center min-w-0">
                  <p className="font-bold text-slate-900 text-sm leading-tight">{fmtTime(b.departTime) || titleCase(b.originName) || b.origin}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[88px]">{titleCase(b.originName) || b.origin}</p>
                </div>
                <div className="flex-1 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />
                  <Icon className="w-3.5 h-3.5 text-slate-300" />
                  <div className="h-px flex-1 bg-gradient-to-l from-slate-200 via-slate-200 to-transparent" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="text-center min-w-0">
                  <p className="font-bold text-slate-900 text-sm leading-tight">{fmtTime(b.arriveTime) || titleCase(b.destinationName) || b.destination}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[88px]">{titleCase(b.destinationName) || b.destination}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] sm:text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {fmtDate(b.departDate)}</span>
                {b.serviceName && <span className="inline-flex items-center gap-1">· {titleCase(b.serviceName)}</span>}
                {b.class && <span className="inline-flex items-center gap-1">· Kelas {b.class}</span>}
                <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {b.pax} pax</span>
              </div>

              {/* Footer: price + actions */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-dashed border-slate-150">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Total</p>
                  <p className="font-display text-base sm:text-lg font-bold text-slate-900 leading-tight">{formatRupiah(b.totalPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isPending && (
                    <button onClick={() => navigate(`/tiket/bayar/${b.code ?? b.id}`)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition-all">
                      Bayar Sekarang
                    </button>
                  )}
                  {isIssued && (
                    <button onClick={() => downloadEtiket(b)} disabled={isDownloading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60">
                      {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} E-Tiket
                    </button>
                  )}
                  <button onClick={() => navigate(`/tiket/bayar/${b.code ?? b.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all">
                    Detail <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
