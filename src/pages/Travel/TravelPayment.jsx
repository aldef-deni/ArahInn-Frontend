import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import i18n from '@/i18n'
import { useSetTravelModa } from '@/contexts/TravelFooterContext'
import {
  TrainFront, Plane, Ship, ArrowRight, Clock, Loader2, AlertCircle,
  CheckCircle2, Ticket, ChevronLeft, Download, Building2, Copy, Check,
} from 'lucide-react'
import { travelApi, paymentApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'

const fmtDMY = (s) => { if (!s) return '-'; const [y,m,d] = String(s).slice(0,10).split('-'); return `${d}/${m}/${y}` }
const pad2 = (n) => String(n).padStart(2, '0')
const PAY_WINDOW_MS = 12 * 60 * 1000   // batas bayar tiket pesawat: 12 menit

export default function TravelPayment() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [err, setErr] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState('')
  const [now, setNow] = useState(Date.now())
  const [payDeadline, setPayDeadline] = useState(null)

  // Tick tiap detik untuk countdown pembayaran
  useEffect(() => { const tmr = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(tmr) }, [])

  const { data: b, isLoading } = useQuery({
    queryKey: ['travel-booking', id],
    queryFn: () => travelApi.getBooking(id).then(r => r.data?.data),
    refetchInterval: (q) => (['pending_payment', 'paid'].includes(q.state.data?.status) ? 10000 : false),
  })

  const { data: mode } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: () => paymentApi.mode().then(r => r.data?.data),
  })
  const bank = mode?.bank

  // Beri tahu layout moda transaksi → footer khusus per moda (pesawat/pelni).
  // Pakai hint moda dari navigasi (state) agar footer langsung benar SEBELUM data booking
  // termuat (hindari kedip footer default), lalu dikonfirmasi dari b.moda setelah load.
  const location = useLocation()
  const hintModa = location.state?.moda
  const setTravelModa = useSetTravelModa()
  useEffect(() => { setTravelModa(b?.moda || hintModa || null); return () => setTravelModa(null) }, [b?.moda, hintModa, setTravelModa])

  // Deadline bayar 12 menit (tiket pesawat) — di-anchor saat order pertama dibuka & disimpan,
  // agar selalu mulai tepat 12:00 dan tak terpengaruh selisih jam server/klien (refresh tetap konsisten).
  useEffect(() => {
    if (!b || b.moda !== 'pesawat' || b.status !== 'pending_payment') { setPayDeadline(null); return }
    const key = `pay_deadline_${b.id}`
    let dl = Number(localStorage.getItem(key))
    if (!dl || Number.isNaN(dl)) { dl = Date.now() + PAY_WINDOW_MS; localStorage.setItem(key, String(dl)) }
    setPayDeadline(dl)
  }, [b?.id, b?.moda, b?.status])

  const copy = (text, field) => {
    try { navigator.clipboard?.writeText(String(text)) } catch { /* noop */ }
    setCopied(field); setTimeout(() => setCopied(''), 1500)
  }

  const downloadEtiket = async (legId = id, code = b.code) => {
    setDownloading(true)
    try {
      const res = await travelApi.downloadEtiket(legId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      Object.assign(document.createElement('a'), { href: url, download: `E-Tiket-${code}.pdf` }).click()
      URL.revokeObjectURL(url)
    } catch { setErr(t('travel.downloadEtiketFailed')) }
    finally { setDownloading(false) }
  }

  if (isLoading) return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
  if (!b) return <div className="min-h-[70vh] flex items-center justify-center text-slate-400">{t('travel.orderNotFound')}</div>

  const Icon = b.moda === 'pesawat' ? Plane : b.moda === 'pelni' ? Ship : TrainFront
  const accent = b.moda === 'pesawat' ? 'sky' : b.moda === 'pelni' ? 'cyan' : 'orange'
  // Pulang-pergi: 1 order = 2 leg (group). Total & status mengacu ke seluruh group.
  const isRT  = !!b.isRoundtrip
  const legs  = (b.groupLegs && b.groupLegs.length) ? b.groupLegs : [b]
  const orderTotal = isRT ? (b.groupTotal ?? legs.reduce((s, l) => s + Number(l.totalPrice || 0), 0)) : Number(b.totalPrice || 0)
  const issued = isRT ? legs.every(l => l.status === 'issued') : b.status === 'issued'
  const failed = ['failed', 'canceled', 'expired'].includes(b.status)
  const legLabel = (l) => l.leg === 'return' ? t('travel.tripReturn') : t('travel.tripDepart')

  // Countdown 12 menit (khusus tiket pesawat)
  const remainMs  = payDeadline ? Math.max(0, payDeadline - now) : 0
  const cdMin = Math.floor(remainMs / 60000)
  const cdSec = Math.floor((remainMs % 60000) / 1000)
  const cdExpired = payDeadline ? remainMs <= 0 : false
  const showCountdown = b.moda === 'pesawat' && b.status === 'pending_payment' && !!payDeadline

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO title={t('travel.paymentSeo')} url={`/tiket/bayar/${id}`} />
      <div className="container max-w-lg py-5">
        <button onClick={() => navigate(b.moda === 'pesawat' ? '/tiket/pesawat' : b.moda === 'pelni' ? '/tiket/pelni' : '/tiket')} className="flex items-center gap-1 text-sm text-slate-500 mb-4 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> {t('travel.otherTickets')}</button>

        {/* Status banner */}
        {issued ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
            <h1 className="font-display text-xl font-bold text-slate-900">{t('travel.etiketIssued')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('travel.etiketIssuedDesc')}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {isRT ? legs.map(l => (
                <button key={l.id} onClick={() => downloadEtiket(l.id, l.code)} disabled={downloading} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-60">
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {legLabel(l)} · {t('travel.downloadEtiketPdf')}
                </button>
              )) : (
                <>
                  <button onClick={() => downloadEtiket()} disabled={downloading} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-60">
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {t('travel.downloadEtiketPdf')}
                  </button>
                  {b.urlEtiket && (
                    <a href={b.urlEtiket} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50">
                      <Ticket className="w-4 h-4" /> {t('travel.operatorVersion')}
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        ) : failed ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-6 text-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-7 h-7 text-rose-600" /></div>
            <h1 className="font-display text-xl font-bold text-slate-900">{b.status === 'expired' ? t('travel.orderExpiredTitle') : t('travel.orderCanceledTitle')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('travel.makeNewOrder')}</p>
          </div>
        ) : showCountdown ? (
          <div className={`rounded-2xl border p-4 mb-4 ${cdExpired ? 'bg-rose-50 border-rose-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cdExpired ? 'bg-rose-100' : 'bg-white shadow-sm'}`}>
                <Clock className={`w-5.5 h-5.5 ${cdExpired ? 'text-rose-600' : 'text-amber-600'}`} />
              </div>
              <div className="min-w-0 flex-1">
                {cdExpired ? (
                  <>
                    <p className="text-sm font-bold text-rose-700">{t('travel.payExpiredTitle')}</p>
                    <p className="text-xs text-rose-600/90 mt-0.5">{t('travel.payExpiredMsg')}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">{t('travel.payCountdownLabel')}</p>
                    <p className="font-display text-3xl font-bold tabular-nums text-amber-700 leading-none mt-1">{pad2(cdMin)}:{pad2(cdSec)}</p>
                  </>
                )}
              </div>
            </div>
            {!cdExpired && (
              <p className="text-[11px] text-amber-800/90 mt-3 leading-relaxed flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {t('travel.payCountdownWarn')}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{t('travel.transferPrompt')}{b.timeLimit ? ` ${t('travel.transferBefore', { date: new Date(b.timeLimit).toLocaleString(i18n.language === 'en' ? 'en-US' : 'id-ID') })}` : ''}. {t('travel.statusAuto')}</p>
          </div>
        )}

        {/* Trip card(s) — 1 leg (one-way) atau 2 leg (pulang-pergi) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          {legs.map((l, i) => (
            <div key={l.id || i} className={i > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-9 h-9 rounded-lg bg-${accent}-100 flex items-center justify-center`}><Icon className={`w-4.5 h-4.5 text-${accent}-600`} /></div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate flex items-center gap-1.5">
                    {isRT && <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-bold uppercase">{legLabel(l)}</span>}
                    {l.serviceName || (b.moda === 'pesawat' ? t('travel.flightWord') : b.moda === 'pelni' ? t('travel.shipWord') : t('travel.trainWord'))}
                  </p>
                  <p className="text-[11px] text-slate-500">{t('travel.codeWord')}: <span className="font-mono font-bold">{l.code}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center"><p className="font-bold text-slate-900">{l.departTime || '-'}</p><p className="text-[10px] text-slate-400">{l.origin}</p></div>
                <div className="flex-1 flex items-center gap-1.5"><div className="h-px flex-1 bg-slate-200" /><ArrowRight className="w-3.5 h-3.5 text-slate-300" /><div className="h-px flex-1 bg-slate-200" /></div>
                <div className="text-center"><p className="font-bold text-slate-900">{l.arriveTime || '-'}</p><p className="text-[10px] text-slate-400">{l.destination}</p></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{fmtDMY(l.departDate)} · {l.pax} {t('travel.paxWord')}{l.vendorBookingCode ? ` · PNR ${l.vendorBookingCode}` : ''}</p>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <p className="font-bold text-sm text-slate-900 mb-2.5">{t('travel.priceBreakdown')}</p>
          <div className="space-y-1.5 text-sm">
            {isRT ? (
              legs.map((l, i) => (
                <div key={l.id || i} className="flex justify-between"><span className="text-slate-500">{legLabel(l)} ({l.origin}→{l.destination})</span><span className="text-slate-900">{formatRupiah(l.totalPrice)}</span></div>
              ))
            ) : (
              <>
                <div className="flex justify-between"><span className="text-slate-500">{t('travel.ticketPriceLabel')}</span><span className="text-slate-900">{formatRupiah(b.vendorPrice)}</span></div>
                {b.markup > 0 && <div className="flex justify-between"><span className="text-slate-500">{t('travel.serviceFee')}</span><span className="text-slate-900">{formatRupiah(b.markup)}</span></div>}
                {b.adminFee > 0 && <div className="flex justify-between"><span className="text-slate-500">Biaya Admin</span><span className="text-slate-900">{formatRupiah(b.adminFee)}</span></div>}
              </>
            )}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">{t('travel.total')}</span><span className="font-bold text-brand">{formatRupiah(orderTotal)}</span></div>
          </div>
        </div>

        {err && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{err}</p></div>}

        {/* Transfer instructions (pending) */}
        {!issued && !failed && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3"><Building2 className="w-4.5 h-4.5 text-brand" /><p className="font-bold text-sm text-slate-900">{t('travel.bankTransfer')}</p></div>

            <div className="bg-brand/5 rounded-xl p-3.5 mb-3">
              <p className="text-[11px] text-slate-500 mb-0.5">{t('travel.exactTransferAmount')}</p>
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-bold text-brand">{formatRupiah(orderTotal)}</p>
                <button onClick={() => copy(Math.round(orderTotal), 'amt')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand/30 text-brand text-xs font-semibold bg-white">
                  {copied === 'amt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied === 'amt' ? t('travel.copiedShort') : t('travel.copyShort')}
                </button>
              </div>
            </div>

            {bank ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">{t('travel.bankLabel')}</span><span className="font-semibold text-slate-900">{bank.bankName}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">{t('travel.accountNumber')}</span>
                  <span className="flex items-center gap-2"><span className="font-bold text-slate-900">{bank.accountNumber}</span>
                    <button onClick={() => copy(bank.accountNumber, 'rek')} className="text-brand">{copied === 'rek' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">{t('travel.accountName')}</span><span className="font-semibold text-slate-900">{bank.accountName}</span></div>
              </div>
            ) : <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>}

            <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-700 mb-1">{t('travel.howToPayTitle')}</p>
              {t('travel.payStep1', { amount: formatRupiah(orderTotal) })}<br/>
              {t('travel.payStep2')}<br/>
              {t('travel.payStep3')}<br/>
              {t('travel.payStep4')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
