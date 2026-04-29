import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { bookingApi, paymentApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateTime } from '@/utils'
import { Clock, Copy, CheckCircle, XCircle, CreditCard, Building, Smartphone } from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'bca',     label: 'BCA Virtual Account',     icon: '🏦', group: 'va' },
  { id: 'mandiri', label: 'Mandiri Virtual Account',  icon: '🏛️', group: 'va' },
  { id: 'bni',     label: 'BNI Virtual Account',      icon: '🏦', group: 'va' },
  { id: 'bri',     label: 'BRI Virtual Account',      icon: '🏦', group: 'va' },
  { id: 'gopay',   label: 'GoPay',                    icon: '💚', group: 'ewallet' },
  { id: 'ovo',     label: 'OVO',                      icon: '💜', group: 'ewallet' },
  { id: 'qris',    label: 'QRIS',                     icon: '📱', group: 'qris' },
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
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return { secs, display: `${m}:${s}`, expired: secs === 0 }
}

export default function Payment() {
  const { bookingId } = useParams()
  const navigate      = useNavigate()
  const { toast }     = useToast()
  const [method, setMethod] = useState('bca')
  const [copied, setCopied] = useState(false)
  const [vaNumber, setVaNumber] = useState(null)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-payment', bookingId],
    queryFn : () => bookingApi.getById(bookingId).then(r => r.data.data),
  })

  const { secs, display: countdown, expired } = useCountdown(booking?.expiresAt)

  // Poll payment status
  const { data: paymentData } = useQuery({
    queryKey: ['payment-status', bookingId],
    queryFn : () => paymentApi.status(bookingId).then(r => r.data.data),
    refetchInterval: vaNumber ? 5000 : false,
  })

  const latestPayment = paymentData?.[0]
  const isPaid = latestPayment?.status === 'settlement' || booking?.status === 'issued'

  const initMutation = useMutation({
    mutationFn: () => paymentApi.initiate({ bookingId, paymentMethod: method }),
    onSuccess : (r) => {
      const va = r.data.data?.gatewayResponse?.va_numbers?.[0]?.va_number
        || r.data.data?.gatewayResponse?.payment_code
      setVaNumber(va || '8880000123456')
      toast({ title: 'Pembayaran dimulai', description: 'Segera selesaikan dalam batas waktu.' })
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const copyVA = () => {
    navigator.clipboard.writeText(vaNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return (
    <div className="container py-20 text-center">
      <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  if (isPaid) return (
    <div className="container py-20 max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h1 className="font-display text-2xl font-bold mb-2 text-green-700">Pembayaran Berhasil!</h1>
      <p className="text-muted-foreground mb-2">Booking <strong>{booking?.bookingCode}</strong> dikonfirmasi.</p>
      <p className="text-sm text-muted-foreground mb-8">Tiket telah dikirim ke <strong>{booking?.guestEmail}</strong></p>
      <button onClick={() => navigate('/orders')}
        className="px-8 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors">
        Lihat Pesanan Saya
      </button>
    </div>
  )

  if (expired && !vaNumber) return (
    <div className="container py-20 max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="font-display text-2xl font-bold mb-2 text-red-600">Waktu Habis</h1>
      <p className="text-muted-foreground mb-8">Batas waktu pembayaran telah lewat. Silakan buat booking baru.</p>
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
        secs < 300 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-orange-50 border border-orange-200 text-orange-700'
      }`}>
        <Clock className="w-5 h-5 shrink-0 animate-pulse" />
        <span>Bayar sebelum waktu habis:</span>
        <span className="font-mono text-xl font-bold ml-auto">{countdown}</span>
      </div>

      {/* Order summary */}
      <div className="bg-white border rounded-2xl p-5 mb-6 shadow-card">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold">{booking?.hotel?.name}</p>
            <p className="text-sm text-muted-foreground">{booking?.room?.name} · {booking?.totalNights} malam</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Kode Booking</p>
            <p className="font-mono font-bold text-brand">{booking?.bookingCode}</p>
          </div>
        </div>
        <div className="pt-3 border-t flex justify-between items-center">
          <span className="font-semibold">Total Tagihan</span>
          <span className="price-tag text-xl">{formatRupiah(booking?.totalPrice)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-right">
          *Termasuk 3 digit unik: <strong>{booking?.priceSuffix}</strong>
        </p>
      </div>

      {!vaNumber ? (
        <>
          {/* Method selector */}
          <div className="bg-white border rounded-2xl p-5 mb-6 shadow-card">
            <h2 className="font-semibold mb-4">Pilih Metode Pembayaran</h2>
            {[
              { group: 'va',     label: 'Virtual Account', icon: Building },
              { group: 'ewallet',label: 'E-Wallet',        icon: Smartphone },
              { group: 'qris',   label: 'QRIS',            icon: CreditCard },
            ].map(({ group, label, icon: Icon }) => (
              <div key={group} className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.filter(m => m.group === group).map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all ${
                        method === m.id
                          ? 'border-brand bg-brand/5 text-brand-700 font-medium shadow-sm'
                          : 'hover:bg-muted hover:border-muted-foreground/30'
                      }`}>
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-xs leading-tight">{m.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}
            className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-base hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-brand/30 shadow-lg">
            {initMutation.isPending ? 'Memproses...' : `💳 Bayar ${formatRupiah(booking?.totalPrice)}`}
          </button>
        </>
      ) : (
        /* VA Number display */
        <div className="bg-white border rounded-2xl p-6 shadow-card text-center">
          <p className="text-muted-foreground mb-2">Nomor Virtual Account</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="font-mono text-3xl font-bold tracking-widest text-foreground">{vaNumber}</span>
            <button onClick={copyVA}
              className="p-2 rounded-xl hover:bg-muted transition-colors">
              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Transfer tepat <strong>{formatRupiah(booking?.totalPrice)}</strong> ke nomor di atas</p>
          <div className="space-y-2 text-sm text-left bg-muted/50 rounded-xl p-4">
            {[
              'Buka aplikasi mobile banking Anda',
              'Pilih menu Transfer → Virtual Account',
              `Masukkan nomor VA: ${vaNumber}`,
              `Transfer tepat ${formatRupiah(booking?.totalPrice)}`,
              'Konfirmasi pembayaran',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Halaman ini akan otomatis diperbarui setelah pembayaran diterima.</p>
        </div>
      )}
    </div>
  )
}
