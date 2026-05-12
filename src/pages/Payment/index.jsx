import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { bookingApi, paymentApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Clock, Copy, CheckCircle, XCircle, Building2 } from 'lucide-react'

const BANKS = [
  { id: 'bca',     label: 'BCA',     logo: '🏦', color: 'blue' },
  { id: 'mandiri', label: 'Mandiri', logo: '🏛️', color: 'yellow' },
  { id: 'bni',     label: 'BNI',     logo: '🏦', color: 'orange' },
  { id: 'bri',     label: 'BRI',     logo: '🏦', color: 'blue' },
  { id: 'permata', label: 'Permata', logo: '🏦', color: 'red' },
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
  const { bookingId } = useParams()
  const navigate      = useNavigate()
  const { toast }     = useToast()

  const [bank, setBank]       = useState('bca')
  const [copied, setCopied]   = useState(false)
  const [vaInfo, setVaInfo]   = useState(null) // { vaNumber, bank, expiredAt }

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-payment', bookingId],
    queryFn : () => bookingApi.getById(bookingId).then(r => r.data.data),
  })

  const vaExpiresAt = vaInfo?.expiredAt ?? booking?.expiresAt
  const { secs, display: countdown, expired } = useCountdown(vaExpiresAt)

  const { data: paymentData } = useQuery({
    queryKey: ['payment-status', bookingId],
    queryFn : () => paymentApi.status(bookingId).then(r => r.data.data),
    refetchInterval: vaInfo ? 5000 : false,
  })

  const latestPayment = paymentData?.[0]
  const isPaid = latestPayment?.status === 'settlement' || booking?.status === 'issued'

  const initMutation = useMutation({
    mutationFn: () => paymentApi.initiate({ bookingId, paymentMethod: bank }),
    onSuccess : (r) => {
      setVaInfo(r.data.data)
      toast({ title: 'Virtual account dibuat', description: 'Segera selesaikan pembayaran sebelum waktu habis.' })
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const copyVA = () => {
    if (!vaInfo?.vaNumber) return
    navigator.clipboard.writeText(vaInfo.vaNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="container py-20 text-center">
      <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  // ── Paid ─────────────────────────────────────────────────────────────────
  if (isPaid) return (
    <div className="container py-20 max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h1 className="font-display text-2xl font-bold mb-2 text-green-700">Pembayaran Berhasil!</h1>
      <p className="text-muted-foreground mb-2">
        Booking <strong>{booking?.bookingCode}</strong> dikonfirmasi.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Tiket dikirim ke <strong>{booking?.guestEmail}</strong>
      </p>
      <button onClick={() => navigate('/orders')}
        className="px-8 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors">
        Lihat Pesanan Saya
      </button>
    </div>
  )

  // ── Expired (before VA generated) ────────────────────────────────────────
  if (expired && !vaInfo) return (
    <div className="container py-20 max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="font-display text-2xl font-bold mb-2 text-red-600">Waktu Habis</h1>
      <p className="text-muted-foreground mb-8">Batas waktu pembayaran telah lewat.</p>
      <button onClick={() => navigate('/search')}
        className="px-8 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors">
        Cari Hotel Lagi
      </button>
    </div>
  )

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">Selesaikan Pembayaran</h1>

      {/* Countdown */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
        secs < 600 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-orange-50 border border-orange-200 text-orange-700'
      }`}>
        <Clock className="w-5 h-5 shrink-0 animate-pulse" />
        <span>{vaInfo ? 'Bayar sebelum waktu habis:' : 'Sisa waktu memilih pembayaran:'}</span>
        <span className="font-mono text-xl font-bold ml-auto">{countdown}</span>
      </div>

      {/* Order summary */}
      <div className="bg-white border rounded-2xl p-5 mb-6 shadow-card">
        {/* Hotel & booking info */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-semibold">{booking?.hotel?.name}</p>
            <p className="text-sm text-muted-foreground">
              {booking?.room?.name} · {booking?.totalNights} malam
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Kode Booking</p>
            <p className="font-mono font-bold text-brand">{booking?.bookingCode}</p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Harga Hotel ({booking?.totalNights} malam)</span>
            <span>{formatRupiah(parseFloat(booking?.basePrice) || 0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>PPN & Others</span>
            <span>{formatRupiah((parseFloat(booking?.markupAmount) || 0) + (parseFloat(booking?.taxAmount) || 0) + (parseFloat(booking?.priceSuffix) || 0))}</span>
          </div>

          {booking?.promoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon promo</span>
              <span>− {formatRupiah(booking.promoDiscount)}</span>
            </div>
          )}
          {booking?.loyaltyDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon poin loyalitas</span>
              <span>− {formatRupiah(booking.loyaltyDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t font-bold text-base">
            <span>Total Tagihan</span>
            <span className="price-tag text-xl">{formatRupiah(booking?.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* ── Before VA generated: bank selector ── */}
      {!vaInfo ? (
        <>
          <div className="bg-white border rounded-2xl p-5 mb-6 shadow-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" /> Pilih Bank Virtual Account
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {BANKS.map(b => (
                <button key={b.id} onClick={() => setBank(b.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 border rounded-xl text-sm transition-all ${
                    bank === b.id
                      ? 'border-brand bg-brand/5 text-brand-700 font-semibold shadow-sm'
                      : 'hover:bg-muted hover:border-muted-foreground/30'
                  }`}>
                  <span className="text-2xl">{b.logo}</span>
                  <span className="text-xs font-medium">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}
            className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-base hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-brand/30 shadow-lg">
            {initMutation.isPending
              ? 'Membuat Virtual Account...'
              : `💳 Bayar via VA ${BANKS.find(b => b.id === bank)?.label} — ${formatRupiah(booking?.totalPrice)}`}
          </button>
        </>
      ) : (
        /* ── VA Number display ── */
        <div className="bg-white border rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground">Nomor Virtual Account</p>
            <span className="text-sm font-semibold text-brand">{vaInfo.bank} VA</span>
          </div>

          <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 mb-4">
            <span className="font-mono text-2xl font-bold tracking-widest flex-1 text-foreground">
              {vaInfo.vaNumber}
            </span>
            <button onClick={copyVA}
              className="p-2 rounded-xl hover:bg-white transition-colors shrink-0">
              {copied
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <Copy className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>

          <p className="text-sm text-center text-muted-foreground mb-5">
            Transfer tepat <strong>{formatRupiah(booking?.totalPrice)}</strong> ke nomor di atas
          </p>

          {/* How to pay */}
          <div className="space-y-2 text-sm bg-muted/30 rounded-xl p-4">
            {[
              `Buka aplikasi mobile banking ${vaInfo.bank}`,
              'Pilih menu Transfer → Virtual Account',
              `Masukkan nomor VA: ${vaInfo.vaNumber}`,
              `Pastikan jumlah transfer tepat ${formatRupiah(booking?.totalPrice)}`,
              'Konfirmasi dan selesaikan pembayaran',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">{i + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Halaman ini otomatis diperbarui setelah pembayaran diterima.
          </p>
        </div>
      )}
    </div>
  )
}
