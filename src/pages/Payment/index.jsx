import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { bookingApi, paymentApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Clock, Copy, CheckCircle, XCircle, Building2, X, ArrowLeft, ListOrdered, Info } from 'lucide-react'

const BANKS = [
  { id: 'bca',     label: 'BCA',     logo: '/banks/bca.png' },
  { id: 'mandiri', label: 'Mandiri', logo: '/banks/mandiri.png' },
  { id: 'bri',     label: 'BRI',     logo: '/banks/bri.svg' },
  { id: 'bsi',     label: 'BSI',     logo: '/banks/bank_bsi.png' },
]

function useCountdown(expiresAt) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
    setSecs(calc())
    const t = setInterval(() => setSecs(calc()), 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return { secs, display: `${h}:${m}:${s}`, expired: secs === 0 && !!expiresAt }
}

export default function Payment() {
  const { t } = useTranslation()
  const { bookingId } = useParams()
  const navigate      = useNavigate()
  const { toast }     = useToast()

  const [bank, setBank]       = useState('bca')
  const [copied, setCopied]   = useState(false)
  const [copiedField, setCopiedField] = useState('')
  const [vaInfo, setVaInfo]   = useState(null) // { vaNumber, bank, expiredAt } untuk DOKU
  const [manualInfo, setManualInfo] = useState(null) // { bankName, accountNumber, accountName, finalAmount, expiredAt }
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  // Cek mode pembayaran (doku/manual) — backend yang nentuin
  const { data: modeData } = useQuery({
    queryKey: ['payment-mode'],
    queryFn : () => paymentApi.mode().then(r => r.data?.data),
    staleTime: 60_000,
  })
  const paymentMode = modeData?.mode ?? 'doku'
  const manualBank  = modeData?.bank

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-payment', bookingId],
    queryFn : () => bookingApi.getById(bookingId).then(r => r.data.data),
  })

  const activeExpiresAt = vaInfo?.expiredAt ?? manualInfo?.expiredAt ?? booking?.expiresAt
  const { secs, display: countdown, expired } = useCountdown(activeExpiresAt)

  const hasActivePayment = !!(vaInfo || manualInfo)

  const { data: paymentData } = useQuery({
    queryKey: ['payment-status', bookingId],
    queryFn : () => paymentApi.status(bookingId).then(r => r.data.data),
    refetchInterval: hasActivePayment ? 5000 : false,
  })

  const latestPayment = paymentData?.[0]
  const isPaid = latestPayment?.status === 'settlement' || booking?.status === 'issued'

  const initMutation = useMutation({
    mutationFn: () => {
      // Manual mode: bypass payment_method (backend selalu pakai bank_transfer)
      const payload = paymentMode === 'manual'
        ? { bookingId }
        : { bookingId, paymentMethod: bank }
      return paymentApi.initiate(payload)
    },
    onSuccess : (r) => {
      const data = r.data.data
      if (paymentMode === 'manual') {
        setManualInfo(data)
        toast({ title: 'Instruksi transfer dibuat', description: 'Transfer sesuai nominal & rekening di bawah ini.' })
      } else {
        setVaInfo(data)
        toast({ title: 'Virtual account dibuat', description: 'Segera selesaikan pembayaran sebelum waktu habis.' })
      }
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const copyText = (text, fieldKey = 'va') => {
    if (!text) return
    navigator.clipboard.writeText(String(text))
    setCopied(true)
    setCopiedField(fieldKey)
    setTimeout(() => { setCopied(false); setCopiedField('') }, 2000)
  }
  const copyVA = () => copyText(vaInfo?.vaNumber, 'va')

  // ── Cegat tombol "Back" browser setelah VA dibuat ────────────────────────
  // Push history entry palsu sehingga popstate ter-trigger saat user back,
  // lalu tampilkan modal konfirmasi sebelum benar-benar keluar.
  useEffect(() => {
    if (!hasActivePayment || isPaid) return

    window.history.pushState({ payment_guard: true }, '')

    const onPop = () => {
      window.history.pushState({ payment_guard: true }, '')
      setShowLeaveModal(true)
    }
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; return '' }

    window.addEventListener('popstate', onPop)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [hasActivePayment, isPaid])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="container py-20 text-center">
      <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  // ── Paid ─────────────────────────────────────────────────────────────────
  if (isPaid) return (
    <div className="container py-12 sm:py-16 lg:py-20 max-w-md mx-auto text-center px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-bold mb-2 text-green-700">{t('payment.paid')}</h1>
      <p className="text-sm sm:text-base text-muted-foreground mb-1 sm:mb-2">
        Booking <strong>{booking?.bookingCode}</strong>.
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 break-words">
        {t('payment.paidNote')} <strong>{booking?.guestEmail}</strong>
      </p>
      <button onClick={() => navigate('/orders')}
        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 active:scale-95 transition-all text-sm sm:text-base">
        {t('payment.viewOrders')}
      </button>
    </div>
  )

  // ── Expired check disabled untuk manual transfer mode ──
  // (booking pending tetap bisa diakses; admin yang verify mutasi rekening)

  return (
    <div className="container py-4 sm:py-6 lg:py-8 max-w-2xl">
      <h1 className="font-display text-xl sm:text-2xl font-bold mb-2 leading-tight">{t('payment.title')}</h1>

      {/* Countdown — hanya tampil untuk DOKU mode (manual transfer tidak butuh urgency) */}
      {paymentMode === 'doku' && (
        <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm font-medium ${
          secs < 600 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-orange-50 border border-orange-200 text-orange-700'
        }`}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-pulse" />
          <span className="truncate">{vaInfo ? t('payment.remainingBeforePayment') : t('payment.remainingTime') + ':'}</span>
          <span className="font-mono text-base sm:text-xl font-bold ml-auto">{countdown}</span>
        </div>
      )}

      {/* Order summary */}
      <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-card">
        {/* Hotel & booking info */}
        <div className="flex justify-between items-start gap-3 mb-3 sm:mb-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base line-clamp-2">{booking?.hotel?.name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {booking?.room?.name} · {booking?.totalNights} malam
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('payment.bookingCode')}</p>
            <p className="font-mono font-bold text-brand text-xs sm:text-sm">{booking?.bookingCode}</p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-start gap-3 text-muted-foreground">
            <span>{t('payment.hotelPrice')} ({booking?.totalNights} malam)</span>
            <span className="text-right">{formatRupiah(parseFloat(booking?.basePrice) || 0)}</span>
          </div>
          <div className="flex justify-between items-start gap-3 text-muted-foreground">
            <span>{(parseFloat(booking?.taxAmount) || 0) > 0 ? t('payment.tax') : t('payment.othersOnly')}</span>
            <span className="text-right">{formatRupiah((parseFloat(booking?.markupAmount) || 0) + (parseFloat(booking?.taxAmount) || 0) + (parseFloat(booking?.priceSuffix) || 0))}</span>
          </div>

          {booking?.promoDiscount > 0 && (
            <div className="flex justify-between items-start gap-3 text-green-600">
              <span className="min-w-0">
                {t('payment.promoDiscount')}
                {booking?.voucherCode ? ` (${booking.voucherCode})` : ''}
              </span>
              <span className="text-right whitespace-nowrap">− {formatRupiah(booking.promoDiscount)}</span>
            </div>
          )}
          {booking?.loyaltyDiscount > 0 && (
            <div className="flex justify-between items-start gap-3 text-green-600">
              <span>{t('payment.loyaltyDiscount')}</span>
              <span className="text-right whitespace-nowrap">− {formatRupiah(booking.loyaltyDiscount)}</span>
            </div>
          )}

          <div className="pt-2.5 sm:pt-3 border-t">
            {booking?.promoDiscount > 0 && (
              <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-400 line-through mb-1">
                <span>{t('payment.totalWithoutPromo')}</span>
                <span>{formatRupiah((parseFloat(booking?.totalPrice) || 0) + (parseFloat(booking?.promoDiscount) || 0))}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold gap-3">
              <span className="text-sm sm:text-base">{t('payment.totalBill')}</span>
              <span className="price-tag text-base sm:text-xl">{formatRupiah(booking?.totalPrice)}</span>
            </div>
            {booking?.promoDiscount > 0 && (
              <p className="mt-1.5 text-[10px] sm:text-[11px] text-orange-600 font-semibold">
                ✦ {t('payment.savings')} {formatRupiah(booking.promoDiscount)} {t('payment.withPromo')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═════ MANUAL TRANSFER MODE ═════ */}
      {paymentMode === 'manual' && !manualInfo && (
        <button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}
          className="w-full py-3.5 sm:py-4 bg-brand text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-brand/30 shadow-lg">
          {initMutation.isPending
            ? t('payment.loading')
            : `${t('payment.continueInstructions')} — ${formatRupiah(booking?.totalPrice)}`}
        </button>
      )}

      {paymentMode === 'manual' && manualInfo && (
        <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card">
          {/* Nominal unik */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Transfer</p>
            <span className="text-[10px] sm:text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">NOMINAL UNIK</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 bg-muted/50 rounded-xl px-3 sm:px-4 py-3 sm:py-4 mb-2">
            <span className="font-mono text-xl sm:text-3xl font-black tracking-tight flex-1 min-w-0 text-foreground truncate">
              {formatRupiah(manualInfo.finalAmount)}
            </span>
            <button onClick={() => copyText(manualInfo.finalAmount, 'amount')}
              className="p-2 rounded-xl hover:bg-white active:scale-90 transition-all shrink-0">
              {copied && copiedField === 'amount'
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <Copy className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 sm:mb-5 flex items-start gap-2 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Transfer <strong>tepat {formatRupiah(manualInfo.finalAmount)}</strong> (termasuk 3 digit kode unik <strong>{String(manualInfo.uniqueCode).padStart(3, '0')}</strong>) supaya admin lebih cepat verifikasi.
            </span>
          </p>

          {/* Bank info */}
          <div className="space-y-2 mb-4 sm:mb-5">
            <FieldRow label="Bank Tujuan" value={manualInfo.bankName} />
            <FieldRow label="Nomor Rekening" value={manualInfo.accountNumber}
              onCopy={() => copyText(manualInfo.accountNumber, 'rek')}
              copied={copied && copiedField === 'rek'} mono />
            <FieldRow label="Atas Nama" value={manualInfo.accountName} />
          </div>

          {/* How to pay */}
          <div className="space-y-2 text-xs sm:text-sm bg-muted/30 rounded-xl p-3.5 sm:p-4 mb-4 sm:mb-5">
            <p className="font-semibold text-slate-700 mb-2">Cara Pembayaran:</p>
            {[
              `Transfer ke ${manualInfo.bankName} ${manualInfo.accountNumber} a.n. ${manualInfo.accountName}`,
              `Nominal harus PERSIS ${formatRupiah(manualInfo.finalAmount)} (jangan dibulatkan)`,
              'Tunggu admin verifikasi mutasi rekening (max 1×24 jam)',
              'Voucher dikirim ke email otomatis setelah pembayaran dikonfirmasi admin',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] sm:text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">{i + 1}</span>
                <span className="text-muted-foreground leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] sm:text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Halaman ini otomatis update saat admin sudah konfirmasi pembayaran.
          </p>
        </div>
      )}

      {/* ═════ DOKU VA MODE (default) ═════ */}
      {paymentMode === 'doku' && !vaInfo && (
        <>
          <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-card">
            <h2 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-brand" /> Pilih Bank Virtual Account
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {BANKS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setBank(b.id)}
                  title={b.label}
                  className={`group flex items-center justify-center h-16 sm:h-20 px-3 sm:px-4 bg-white border-2 rounded-xl sm:rounded-2xl transition-all active:scale-95 ${
                    bank === b.id
                      ? 'border-brand shadow-md ring-2 ring-brand/15'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <img src={b.logo} alt={b.label}
                    className="max-h-8 sm:max-h-10 w-auto object-contain transition-transform group-hover:scale-105" />
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}
            className="w-full py-3.5 sm:py-4 bg-brand text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-brand/30 shadow-lg">
            {initMutation.isPending
              ? 'Membuat Virtual Account...'
              : `💳 Bayar via VA ${BANKS.find(b => b.id === bank)?.label} — ${formatRupiah(booking?.totalPrice)}`}
          </button>
        </>
      )}

      {paymentMode === 'doku' && vaInfo && (
        <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Nomor Virtual Account</p>
            <span className="text-xs sm:text-sm font-semibold text-brand">{vaInfo.bank} VA</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 bg-muted/50 rounded-xl px-3 sm:px-4 py-3 mb-3 sm:mb-4">
            <span className="font-mono text-base sm:text-2xl font-bold tracking-widest flex-1 min-w-0 text-foreground truncate">
              {vaInfo.vaNumber}
            </span>
            <button onClick={copyVA} className="p-2 rounded-xl hover:bg-white active:scale-90 transition-all shrink-0">
              {copied && copiedField === 'va'
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <Copy className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-center text-muted-foreground mb-4 sm:mb-5">
            Transfer tepat <strong>{formatRupiah(booking?.totalPrice)}</strong> ke nomor di atas
          </p>

          <div className="space-y-2 text-xs sm:text-sm bg-muted/30 rounded-xl p-3.5 sm:p-4">
            {[
              `Buka aplikasi mobile banking ${vaInfo.bank}`,
              'Pilih menu Transfer → Virtual Account',
              `Masukkan nomor VA: ${vaInfo.vaNumber}`,
              `Pastikan jumlah transfer tepat ${formatRupiah(booking?.totalPrice)}`,
              'Konfirmasi dan selesaikan pembayaran',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] sm:text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">{i + 1}</span>
                <span className="text-muted-foreground leading-relaxed break-all">{step}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] sm:text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Halaman ini otomatis diperbarui setelah pembayaran diterima.
          </p>
        </div>
      )}

      {/* ── Leave Page Confirmation Modal ── */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLeaveModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                Anda yakin ingin meninggalkan<br />halaman ini?
              </h2>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1.5 -m-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="px-6 py-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                Dengan meninggalkan halaman ini, Anda dapat mengubah metode pembayaran atau lihat daftar pembelian.
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pt-3 pb-6 space-y-2.5">
              <button
                onClick={() => {
                  setShowLeaveModal(false)
                  if (paymentMode === 'manual') {
                    navigate('/', { replace: true })
                  } else {
                    setVaInfo(null)
                    setManualInfo(null)
                  }
                }}
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {paymentMode === 'manual' ? 'Kembali ke Halaman Utama' : 'Ubah metode pembayaran'}
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false)
                  navigate('/orders', { replace: true })
                }}
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <ListOrdered className="w-4 h-4" />
                Lihat Daftar Pembelian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: row label + value + optional copy button
function FieldRow({ label, value, onCopy, copied, mono }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-bold text-slate-900 ${mono ? 'font-mono' : ''} truncate`}>{value || '-'}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors shrink-0">
          {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}
