import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { bookingApi, paymentApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Clock, Copy, Check, CheckCircle, XCircle, Building2, X, ArrowLeft, ListOrdered, Info, ChevronDown, Wallet, QrCode, CreditCard, ShieldCheck, Loader2, RefreshCw } from 'lucide-react'

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

// Muat Snap.js Midtrans sekali, pakai client key + environment dari respons initiate.
function loadSnap(clientKey, isProduction) {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve(window.snap)
    const existing = document.getElementById('midtrans-snap')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.snap), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id  = 'midtrans-snap'
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', clientKey || '')
    script.onload  = () => resolve(window.snap)
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'))
    document.body.appendChild(script)
  })
}

// Reset TOTAL Snap: tutup popup + buang iframe/script + window.snap, supaya inisialisasi
// berikutnya benar-benar bersih. Penting untuk kasus VA (transaksi terlanjur dibuat →
// state snap.js nyangkut di halaman VA; hide() saja tak cukup, harus re-init).
function resetSnap() {
  try { window.snap?.hide?.() } catch { /* noop */ }
  try {
    document.querySelectorAll('iframe[src*="midtrans"], #snap-midtrans, .snap-container, #snap-container')
      .forEach(el => el.remove())
    const scr = document.getElementById('midtrans-snap')
    if (scr) scr.remove()
    try { delete window.snap } catch { window.snap = undefined }
  } catch { /* noop */ }
}

const MIDTRANS_METHODS = [
  { id: 'virtual_account', availabilityKey: 'virtualAccount', label: 'Virtual Account', caption: 'Bank yang aktif di Midtrans', icon: Building2 },
  { id: 'qris', availabilityKey: 'qris', label: 'QRIS', caption: 'Scan melalui GoPay QRIS', icon: QrCode },
  { id: 'ewallet', availabilityKey: 'ewallet', label: 'E-Wallet', caption: 'Dompet digital yang tersedia', icon: Wallet },
  { id: 'credit_card', availabilityKey: 'creditCard', label: 'Kartu Kredit', caption: 'Visa, Mastercard & JCB', icon: CreditCard },
]

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
  const [detailOpen, setDetailOpen] = useState(false) // dropdown rincian pembayaran
  // Deadline countdown (ms, di-anchor ke jam CLIENT) — diisi SETELAH klik "Lanjut ke
  // Instruksi Transfer" agar countdown mulai tepat (mis. 1:00:00) & tidak muncul sebelum klik.
  const [paymentDeadline, setPaymentDeadline] = useState(null)
  const [snapPending, setSnapPending] = useState(false) // Midtrans: popup Snap sudah dibuka
  const [snapToken, setSnapToken]     = useState(null)  // simpan token utk buka ulang popup
  const [midtransChannel, setMidtransChannel] = useState('qris')

  // Cek mode pembayaran (doku/manual) — backend yang nentuin
  const { data: modeData } = useQuery({
    queryKey: ['payment-mode'],
    queryFn : () => paymentApi.mode().then(r => r.data?.data),
    staleTime: 60_000,
  })
  const paymentMode = modeData?.mode ?? 'doku'
  const manualBank  = modeData?.bank
  const midtransAvailability = modeData?.midtrans?.availableChannels
  const selectedMidtransMethod = MIDTRANS_METHODS.find(method => method.id === midtransChannel)
  const selectedMidtransAvailable = midtransAvailability?.[selectedMidtransMethod?.availabilityKey] !== false

  const { data: booking, isLoading, refetch: refetchBooking } = useQuery({
    queryKey: ['booking-payment', bookingId],
    queryFn : () => bookingApi.getById(bookingId).then(r => r.data.data),
    // Poll status booking selama pembayaran aktif → tangkap saat superadmin
    // konfirmasi (status → issued) walau tidak membuat baris payment settlement.
    refetchInterval: (q) => {
      const st = q.state.data?.status
      if (st === 'issued' || st === 'expired' || st === 'cancelled') return false
      return (vaInfo || manualInfo || snapPending) ? 5000 : false
    },
  })
  // URL memakai KODE booking; ID numerik untuk panggilan payment diambil dari booking.
  const realId = booking?.id

  // Bila halaman dibuka via ID numerik (mis. /payment/39), ganti URL ke kode booking
  // (mis. /payment/ARHMQEP3PU) tanpa menambah history — agar ID tidak terlihat di URL.
  useEffect(() => {
    if (booking?.bookingCode && /^\d+$/.test(String(bookingId))) {
      navigate(`/payment/${booking.bookingCode}`, { replace: true })
    }
  }, [booking?.bookingCode, bookingId, navigate])

  const { secs, display: countdown, expired } = useCountdown(paymentDeadline)

  const hasActivePayment = !!(vaInfo || manualInfo || snapPending)

  const { data: paymentData, refetch: refetchPayment } = useQuery({
    queryKey: ['payment-status', realId],
    queryFn : () => paymentApi.status(realId).then(r => r.data.data),
    enabled : !!realId,
    refetchInterval: hasActivePayment ? 5000 : false,
  })

  const latestPayment = paymentData?.[0]
  const isPaid = latestPayment?.status === 'settlement' || booking?.status === 'issued'

  const initMutation = useMutation({
    mutationFn: () => {
      // Manual mode: bypass payment_method (backend selalu pakai bank_transfer)
      const payload = paymentMode === 'manual'
        ? { bookingId: realId }
        : { bookingId: realId, paymentMethod: bank }
      return paymentApi.initiate(payload)
    },
    onSuccess : (r) => {
      const data = r.data.data
      // Mulai countdown dari durasi server (expiresInSeconds) yang di-anchor ke jam client
      // → mulai TEPAT (mis. 3600 dtk = 1:00:00). Fallback ke timestamp absolut bila tak ada.
      const secsLeft = Number(data?.expiresInSeconds)
      if (Number.isFinite(secsLeft) && secsLeft > 0) setPaymentDeadline(Date.now() + secsLeft * 1000)
      else if (data?.expiredAt) setPaymentDeadline(new Date(data.expiredAt).getTime())
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

  // ── Midtrans Snap ─────────────────────────────────────────────────────────
  const openSnapPopup = (snap, token) => {
    snap.pay(token, {
      onSuccess: () => { setSnapPending(true); toast({ title: 'Pembayaran diterima', description: 'Sedang memproses pesananmu…' }) },
      onPending: () => { setSnapPending(true); toast({ title: 'Menunggu pembayaran', description: 'Selesaikan sesuai instruksi. Halaman ini update otomatis.' }) },
      onError:   () => toast({ title: 'Pembayaran gagal', description: 'Silakan coba lagi.', variant: 'destructive' }),
      onClose:   () => { /* user menutup popup tanpa menyelesaikan — biarkan bisa dibuka lagi */ },
    })
  }

  const midtransMutation = useMutation({
    mutationFn: () => paymentApi.initiate({ bookingId: realId, midtransChannel }),
    onSuccess : async (r) => {
      const data = r.data.data
      const secsLeft = Number(data?.expiresInSeconds)
      if (Number.isFinite(secsLeft) && secsLeft > 0) setPaymentDeadline(Date.now() + secsLeft * 1000)
      else if (data?.expiredAt) setPaymentDeadline(new Date(data.expiredAt).getTime())
      setSnapToken(data.snapToken)
      setSnapPending(true)
      try {
        const snap = await loadSnap(data.clientKey, data.isProduction)
        openSnapPopup(snap, data.snapToken)
      } catch {
        toast({ title: 'Gagal memuat pembayaran', description: 'Periksa koneksi, lalu coba lagi.', variant: 'destructive' })
      }
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const reopenSnap = () => {
    if (window.snap && snapToken) openSnapPopup(window.snap, snapToken)
    else midtransMutation.mutate()
  }

  const checkMidtransMutation = useMutation({
    mutationFn: () => paymentApi.checkMidtrans(realId),
    onSuccess: async (r) => {
      const status = r.data?.data
      await Promise.all([refetchPayment(), refetchBooking()])
      if (status?.paid) {
        toast({ title: 'Pembayaran berhasil', description: 'Pembayaran telah diterima dan pesanan sedang diproses.' })
      } else {
        toast({
          title: 'Pembayaran belum diterima',
          description: 'Jika baru saja membayar, tunggu beberapa saat lalu cek kembali.',
        })
      }
    },
    onError: (e) => toast({
      title: 'Gagal mengecek status',
      description: e?.response?.data?.message || 'Silakan coba kembali.',
      variant: 'destructive',
    }),
  })

  const changeMidtransMethod = () => {
    resetSnap()
    setSnapPending(false)
    setSnapToken(null)
    setPaymentDeadline(null)
    toast({ title: 'Silakan pilih metode pembayaran baru' })
  }

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

  // ── Auto-redirect saat pembayaran dikonfirmasi ────────────────────────────
  // Begitu superadmin submit/konfirmasi pembayaran (manual transfer) atau gateway
  // mengirim settlement, status booking → issued / payment → settlement. Polling
  // 5 dtk di atas menangkap perubahan ini, lalu halaman otomatis dialihkan ke
  // detail pesanan (yang menampilkan status sudah dibayar) tanpa perlu klik tombol.
  useEffect(() => {
    if (!isPaid) return
    const t = setTimeout(() => navigate('/orders', { replace: true }), 2000)
    return () => clearTimeout(t)
  }, [isPaid, navigate])

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
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 break-words">
        {t('payment.paidNote')} <strong>{booking?.guestEmail}</strong>
      </p>
      <p className="text-[11px] sm:text-xs text-muted-foreground mb-6 sm:mb-8 flex items-center justify-center gap-2">
        <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        Mengalihkan ke daftar pesanan…
      </p>
      <button onClick={() => navigate('/orders', { replace: true })}
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

      {/* Countdown batas waktu pembayaran — muncul SETELAH klik "Lanjut ke Instruksi
          Transfer" (paymentDeadline terisi), mulai tepat dari durasi setting (mis. 1:00:00). */}
      {paymentDeadline && !isPaid && (
        <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm font-medium ${
          expired
            ? 'bg-red-50 border border-red-200 text-red-700'
            : secs < 600 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-orange-50 border border-orange-200 text-orange-700'
        }`}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-pulse" />
          <span className="truncate">{expired ? t('payment.expiredNote') : (vaInfo ? t('payment.remainingBeforePayment') : t('payment.remainingTime') + ':')}</span>
          {!expired && <span className="font-mono text-base sm:text-xl font-bold ml-auto">{countdown}</span>}
        </div>
      )}

      {/* Order summary (ringkas + dropdown rincian) */}
      <div className="bg-white border rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-card overflow-hidden">
        {/* Header selalu tampil: nama properti + total + panah dropdown */}
        <button
          type="button"
          onClick={() => setDetailOpen(o => !o)}
          aria-expanded={detailOpen}
          className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-slate-50/60 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base line-clamp-2">{booking?.hotel?.name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {booking?.room?.name} · {booking?.totalNights} malam
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('payment.totalBill')}</p>
              <p className="price-tag font-bold text-base sm:text-xl leading-tight">{formatRupiah(booking?.totalPrice)}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ${detailOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Detail muncul saat dropdown dibuka */}
        {detailOpen && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="flex justify-between items-center gap-3 pb-3 mb-2 border-b text-[11px] sm:text-xs">
          <span className="text-muted-foreground">{t('payment.bookingCode')}</span>
          <span className="font-mono font-bold text-brand">{booking?.bookingCode}</span>
        </div>
        {/* Price breakdown — Harga Hotel = base_price (SUDAH termasuk diskon campaign+kode).
            Harga asli dicoret bila ada diskon; TANPA baris diskon terpisah agar tidak
            terlihat dipotong dua kali (konsisten dengan halaman Checkout). */}
        {(() => {
          const promoDiscount  = Number(booking?.promoDiscount) || 0
          const hasPromo       = promoDiscount > 0
          const basePriceFinal = parseFloat(booking?.basePrice) || 0
          const originalBase   = basePriceFinal + promoDiscount   // base_price = original − promo
          const loyaltyDisc    = Number(booking?.loyaltyDiscount) || 0
          const fees           = (parseFloat(booking?.markupAmount) || 0) + (parseFloat(booking?.taxAmount) || 0) + (parseFloat(booking?.priceSuffix) || 0)
          return (
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-start gap-3">
              <span className="text-muted-foreground">{t('payment.hotelPrice')} ({booking?.totalNights} malam)</span>
              <div className="text-right">
                {hasPromo && <p className="text-[11px] text-slate-400 line-through leading-tight">{formatRupiah(originalBase)}</p>}
                <p className={hasPromo ? 'font-semibold text-green-600' : 'text-muted-foreground'}>{formatRupiah(basePriceFinal)}</p>
              </div>
            </div>
            <div className="flex justify-between items-start gap-3 text-muted-foreground">
              <span>{(parseFloat(booking?.taxAmount) || 0) > 0 ? t('payment.tax') : t('payment.othersOnly')}</span>
              <span className="text-right">{formatRupiah(fees)}</span>
            </div>
            {loyaltyDisc > 0 && (
              <div className="flex justify-between items-start gap-3 text-green-600">
                <span>{t('payment.loyaltyDiscount')}</span>
                <span className="text-right whitespace-nowrap">− {formatRupiah(loyaltyDisc)}</span>
              </div>
            )}
            <div className="pt-2.5 sm:pt-3 border-t">
              <div className="flex justify-between items-center font-bold gap-3">
                <span className="text-sm sm:text-base">{t('payment.totalBill')}</span>
                <span className="price-tag text-base sm:text-xl">{formatRupiah(booking?.totalPrice)}</span>
              </div>
              {hasPromo && (
                <p className="mt-1.5 text-[10px] sm:text-[11px] text-orange-600 font-semibold">
                  ✦ {t('payment.savings')} {formatRupiah(promoDiscount)} {t('payment.withPromo')}
                </p>
              )}
            </div>
          </div>
          )
        })()}
        </div>
        )}
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

      {/* ═════ MIDTRANS SNAP MODE ═════ */}
      {paymentMode === 'midtrans' && !snapPending && (
        <>
          <div className="relative overflow-hidden bg-white border rounded-xl sm:rounded-2xl p-5 sm:p-6 mb-4 sm:mb-6 shadow-card">
            {/* aksen dekoratif */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand/5 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand/10 text-brand shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm sm:text-base leading-tight">Pembayaran Aman</h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Diproses dengan aman &amp; terenkripsi</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Pilih metode pembayaran, lalu lanjutkan dengan aman melalui Midtrans.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {MIDTRANS_METHODS.map(({ id, availabilityKey, icon: Icon, label, caption }) => {
                  const available = midtransAvailability?.[availabilityKey] !== false
                  return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMidtransChannel(id)}
                    disabled={!available}
                    aria-pressed={midtransChannel === id}
                    title={available ? `Pilih ${label}` : `${label} belum aktif di akun Midtrans`}
                    className={`group relative min-h-[92px] flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-center transition-all active:scale-[0.97] ${
                      !available
                        ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                        : midtransChannel === id
                        ? 'border-brand bg-brand/5 shadow-sm ring-2 ring-brand/10'
                        : 'border-slate-200 bg-white hover:border-brand/40 hover:bg-slate-50'
                    }`}
                  >
                    {midtransChannel === id && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      midtransChannel === id ? 'bg-brand text-white' : 'bg-slate-100 text-brand group-hover:bg-brand/10'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">{label}</span>
                    <span className="hidden sm:block text-[9px] text-slate-400 leading-tight line-clamp-2">
                      {available ? caption : 'Belum aktif di Midtrans'}
                    </span>
                  </button>
                  )
                })}
              </div>

              <p className="mt-4 text-[10px] sm:text-[11px] text-brand flex items-center gap-1.5 leading-relaxed font-medium">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                {selectedMidtransMethod?.caption}
              </p>
            </div>
          </div>

          <button onClick={() => midtransMutation.mutate()} disabled={midtransMutation.isPending || !selectedMidtransAvailable}
            className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-brand to-brand-700 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg shadow-brand/25 flex items-center justify-center gap-2">
            {midtransMutation.isPending
              ? (<><Loader2 className="w-5 h-5 animate-spin" /> Menyiapkan pembayaran…</>)
              : (<>Lanjutkan dengan {selectedMidtransMethod?.label} — {formatRupiah(booking?.totalPrice)}</>)}
          </button>

          <p className="text-[11px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Transaksi terlindungi. Kami tidak menyimpan data kartu Anda.
          </p>
        </>
      )}

      {paymentMode === 'midtrans' && snapPending && (
        <div className="bg-white border rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-card text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-brand animate-spin" />
          </div>
          <h2 className="font-semibold text-base sm:text-lg mb-1.5">Menyelesaikan pembayaran</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 leading-relaxed max-w-sm mx-auto">
            Selesaikan pembayaran pada jendela yang terbuka. Halaman ini akan diperbarui otomatis begitu pembayaran diterima.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
            <button onClick={reopenSnap}
              className="w-full px-5 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 active:scale-95 transition-all text-sm inline-flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> Buka pembayaran
            </button>
            <button
              onClick={() => checkMidtransMutation.mutate()}
              disabled={checkMidtransMutation.isPending}
              className="w-full px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 disabled:opacity-60 transition-all text-sm inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checkMidtransMutation.isPending ? 'animate-spin' : ''}`} />
              {checkMidtransMutation.isPending ? 'Mengecek…' : 'Cek Status Pembayaran'}
            </button>
            <button
              onClick={changeMidtransMethod}
              className="sm:col-span-2 w-full px-5 py-3 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-semibold hover:border-brand/40 hover:text-brand active:scale-[0.98] transition-all text-sm inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Ganti Metode Pembayaran
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4">
            Setelah transfer berhasil, tutup jendela Midtrans lalu tekan “Cek Status Pembayaran”.
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
                    // Reset penuh Snap agar pilihan pembayaran langsung tampil bersih (tanpa refresh),
                    // termasuk kasus VA yang state-nya nyangkut.
                    resetSnap()
                    setVaInfo(null)
                    setManualInfo(null)
                    setSnapPending(false)
                    setSnapToken(null)
                    setPaymentDeadline(null)
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
