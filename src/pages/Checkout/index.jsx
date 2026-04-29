import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { bookingApi, promoApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, diffDays } from '@/utils'
import { Tag, ChevronLeft, User, Phone, Mail, Info } from 'lucide-react'

export default function Checkout() {
  const { roomId }    = useParams()
  const [sp]          = useSearchParams()
  const navigate      = useNavigate()
  const { user }      = useAuthStore()
  const { toast }     = useToast()

  const hotelId  = sp.get('hotelId')
  const checkIn  = sp.get('checkIn')
  const checkOut = sp.get('checkOut')
  const guests   = sp.get('guests') || 2
  const nights   = diffDays(checkIn, checkOut)

  const [form, setForm] = useState({
    guestName : user?.name  || '',
    guestEmail: user?.email || '',
    guestPhone: user?.phone || '',
    notes     : '',
    promoCode : '',
    usePoints : false,
  })
  const [pricing, setPricing] = useState(null)
  const [promoApplied, setPromoApplied] = useState(false)

  const { data: hotel } = useQuery({
    queryKey: ['hotel-checkout', hotelId],
    queryFn : () => hotelApi.getById(hotelId).then(r => r.data.data),
  })

  const room = hotel?.rooms?.find(r => r.id === roomId)

  // Calculate price mutation
  const calcMutation = useMutation({
    mutationFn: () => bookingApi.calcPrice({ roomId, checkIn, checkOut, promoCode: form.promoCode, usePoints: form.usePoints }),
    onSuccess : (r) => { setPricing(r.data.data); setPromoApplied(!!form.promoCode) },
    onError   : (e) => toast({ title: 'Gagal', description: e?.response?.data?.message || 'Kode promo tidak valid.', variant: 'destructive' }),
  })

  // Create booking mutation
  const bookMutation = useMutation({
    mutationFn: () => bookingApi.create({
      roomId, hotelId, checkIn, checkOut, guests: parseInt(guests),
      guestName: form.guestName, guestEmail: form.guestEmail,
      guestPhone: form.guestPhone, notes: form.notes,
      promoCode: form.promoCode || undefined,
      usePoints: form.usePoints,
    }),
    onSuccess: (r) => navigate(`/payment/${r.data.data.booking.id}`),
    onError  : (e) => toast({ title: 'Gagal membuat booking', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const handleApplyPromo = () => calcMutation.mutate()

  return (
    <div className="container py-8 max-w-5xl">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kembali
      </button>
      <h1 className="font-display text-2xl font-bold mb-8">Lengkapi Data Pemesanan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest info */}
          <div className="bg-white border rounded-2xl p-6 shadow-card">
            <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-brand" /> Data Tamu
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'guestName',  label: 'Nama Lengkap', icon: User, type: 'text', placeholder: 'Masukkan nama lengkap' },
                { key: 'guestEmail', label: 'Email',        icon: Mail, type: 'email', placeholder: 'email@contoh.com' },
                { key: 'guestPhone', label: 'No. Telepon',  icon: Phone, type: 'tel', placeholder: '08xxxxxxxxxx' },
              ].map(({ key, label, icon: Icon, type, placeholder }) => (
                <div key={key} className={key === 'guestName' ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium mb-1.5">{label} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type={type} value={form[key]} placeholder={placeholder}
                      onChange={e => setForm({...form, [key]: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Catatan (opsional)</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  rows={3} placeholder="Permintaan khusus, waktu tiba, dll..."
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none" />
              </div>
            </div>
          </div>

          {/* Promo code */}
          <div className="bg-white border rounded-2xl p-6 shadow-card">
            <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand" /> Kode Promo
            </h2>
            <div className="flex gap-3">
              <input value={form.promoCode} onChange={e => setForm({...form, promoCode: e.target.value})}
                placeholder="Masukkan kode promo..."
                className="flex-1 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 uppercase" />
              <button onClick={handleApplyPromo} disabled={!form.promoCode || calcMutation.isPending}
                className="px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {calcMutation.isPending ? '...' : 'Gunakan'}
              </button>
            </div>
            {promoApplied && pricing?.promoDiscount > 0 && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                ✓ Promo berhasil diterapkan — hemat {formatRupiah(pricing.promoDiscount)}
              </div>
            )}
          </div>
        </div>

        {/* Booking Summary */}
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-5 shadow-card sticky top-24">
            <h2 className="font-semibold text-base mb-4">Ringkasan Pesanan</h2>

            {hotel && (
              <div className="flex gap-3 mb-4 pb-4 border-b">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                  {hotel.images?.[0]
                    ? <img src={hotel.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
                </div>
                <div>
                  <p className="font-semibold text-sm line-clamp-1">{hotel.name}</p>
                  <p className="text-xs text-muted-foreground">{room?.name} · {room?.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{checkIn} → {checkOut} · {nights} malam</p>
                </div>
              </div>
            )}

            {pricing ? (
              <div className="space-y-2 text-sm">
                {[
                  ['Harga Dasar', pricing.basePrice],
                  ['Biaya Layanan', pricing.markupAmount],
                  ...(pricing.promoDiscount > 0 ? [['Diskon Promo', -pricing.promoDiscount]] : []),
                  ['Pajak (11%)', pricing.taxAmount],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={val < 0 ? 'text-green-600 font-medium' : ''}>{formatRupiah(Math.abs(val))}</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="price-tag">{formatRupiah(pricing.totalPrice)}</span>
                </div>
                {pricing.priceSuffix && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Termasuk {pricing.priceSuffix} digit unik untuk transfer
                  </p>
                )}
              </div>
            ) : room && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{formatRupiah(room.basePrice)} × {nights} malam</span>
                  <span>{formatRupiah(room.basePrice * nights)}</span>
                </div>
                <button onClick={() => calcMutation.mutate()}
                  className="w-full mt-2 py-2 text-xs text-brand border border-brand/30 rounded-lg hover:bg-brand/5 transition-colors">
                  Hitung harga detail
                </button>
              </div>
            )}

            <button
              onClick={() => bookMutation.mutate()}
              disabled={!form.guestName || !form.guestEmail || bookMutation.isPending}
              className="w-full mt-5 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-brand/30 shadow-md">
              {bookMutation.isPending ? 'Memproses...' : '🔐 Lanjutkan Pembayaran'}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Dengan melanjutkan, Anda menyetujui syarat & ketentuan kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
