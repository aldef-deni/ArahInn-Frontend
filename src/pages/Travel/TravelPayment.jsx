import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  TrainFront, Plane, Ship, ArrowRight, Clock, Loader2, AlertCircle,
  CheckCircle2, Ticket, ShieldCheck, Wallet, ChevronLeft, Download,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'

const fmtDMY = (s) => { if (!s) return '-'; const [y,m,d] = String(s).slice(0,10).split('-'); return `${d}/${m}/${y}` }

export default function TravelPayment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [err, setErr] = useState(null)

  const { data: b, isLoading, refetch } = useQuery({
    queryKey: ['travel-booking', id],
    queryFn: () => travelApi.getBooking(id).then(r => r.data?.data),
  })

  const [downloading, setDownloading] = useState(false)

  const payMut = useMutation({
    mutationFn: () => travelApi.payBooking(id, { simulate: true }),
    onSuccess: () => { setErr(null); refetch() },
    onError: (e) => setErr(e?.response?.data?.message || 'Pembayaran gagal. Coba lagi.'),
  })

  const downloadEtiket = async () => {
    setDownloading(true)
    try {
      const res = await travelApi.downloadEtiket(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      Object.assign(document.createElement('a'), { href: url, download: `E-Tiket-${b.code}.pdf` }).click()
      URL.revokeObjectURL(url)
    } catch { setErr('Gagal mengunduh e-tiket.') }
    finally { setDownloading(false) }
  }

  if (isLoading) return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
  if (!b) return <div className="min-h-[70vh] flex items-center justify-center text-slate-400">Pesanan tidak ditemukan.</div>

  const Icon = b.moda === 'pesawat' ? Plane : b.moda === 'pelni' ? Ship : TrainFront
  const accent = b.moda === 'pesawat' ? 'sky' : b.moda === 'pelni' ? 'cyan' : 'orange'
  const issued = b.status === 'issued'

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO title="Pembayaran Tiket" url={`/tiket/bayar/${id}`} />
      <div className="container max-w-lg py-5">
        <button onClick={() => navigate('/tiket')} className="flex items-center gap-1 text-sm text-slate-500 mb-4 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> Tiket Lain</button>

        {/* Status banner */}
        {issued ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
            <h1 className="font-display text-xl font-bold text-slate-900">E-Tiket Terbit!</h1>
            <p className="text-sm text-slate-500 mt-1">Tiket Anda sudah diterbitkan, dikirim ke email & siap dipakai.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button onClick={downloadEtiket} disabled={downloading} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-60">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Unduh E-Tiket PDF
              </button>
              {b.urlEtiket && (
                <a href={b.urlEtiket} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50">
                  <Ticket className="w-4 h-4" /> Versi Operator
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Selesaikan pembayaran untuk menerbitkan e-tiket{b.timeLimit ? ` sebelum ${new Date(b.timeLimit).toLocaleString('id-ID')}` : ''}.</p>
          </div>
        )}

        {/* Trip card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-9 h-9 rounded-lg bg-${accent}-100 flex items-center justify-center`}><Icon className={`w-4.5 h-4.5 text-${accent}-600`} /></div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">{b.serviceName || (b.moda === 'pesawat' ? 'Penerbangan' : 'Kereta')}</p>
              <p className="text-[11px] text-slate-500">Kode: <span className="font-mono font-bold">{b.code}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center"><p className="font-bold text-slate-900">{b.departTime || '-'}</p><p className="text-[10px] text-slate-400">{b.origin}</p></div>
            <div className="flex-1 flex items-center gap-1.5"><div className="h-px flex-1 bg-slate-200" /><ArrowRight className="w-3.5 h-3.5 text-slate-300" /><div className="h-px flex-1 bg-slate-200" /></div>
            <div className="text-center"><p className="font-bold text-slate-900">{b.arriveTime || '-'}</p><p className="text-[10px] text-slate-400">{b.destination}</p></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{fmtDMY(b.departDate)} · {b.pax} penumpang{b.vendorBookingCode ? ` · PNR ${b.vendorBookingCode}` : ''}</p>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <p className="font-bold text-sm text-slate-900 mb-2.5">Rincian Harga</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Harga tiket</span><span className="text-slate-900">{formatRupiah(b.vendorPrice)}</span></div>
            {b.markup > 0 && <div className="flex justify-between"><span className="text-slate-500">Biaya layanan ({b.pax} × {formatRupiah(b.markup)})</span><span className="text-slate-900">{formatRupiah(b.markup * b.pax)}</span></div>}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-brand">{formatRupiah(b.totalPrice)}</span></div>
          </div>
        </div>

        {err && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{err}</p></div>}

        {/* Pay button */}
        {!issued && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-2 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total Bayar</p><p className="font-display text-xl font-bold text-brand">{formatRupiah(b.totalPrice)}</p></div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> Aman</div>
            </div>
            <button onClick={() => payMut.mutate()} disabled={payMut.isPending} className="w-full py-3.5 rounded-xl bg-brand hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
              {payMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses pembayaran...</> : <><Wallet className="w-4 h-4" /> Bayar Sekarang</>}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">Setelah bayar, e-tiket otomatis diterbitkan.</p>
          </div>
        )}
      </div>
    </div>
  )
}
