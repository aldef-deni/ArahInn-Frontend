import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { bookingApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, diffDays, getImageUrl } from '@/utils'
import { Tag, ChevronLeft, User, Phone, Mail } from 'lucide-react'

export default function Checkout() {
  const { roomId } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toast } = useToast()

  const hotelId = sp.get('hotelId')
  const checkIn = sp.get('checkIn')
  const checkOut = sp.get('checkOut')
  const guests = sp.get('guests') || 2
  const roomCount = parseInt(sp.get('roomCount') || '1', 10)
  const nights = diffDays(checkIn, checkOut)

  const [form, setForm] = useState({
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: user?.phone || '',
    notes: '',
    promoCode: '',
    usePoints: false,
  })
  const [pricing, setPricing] = useState(null)
  const [promoApplied, setPromoApplied] = useState(false)

  const { data: hotel } = useQuery({
    queryKey: ['hotel-checkout', hotelId],
    queryFn: () => hotelApi.getById(hotelId).then(r => r.data.data),
  })

  const room = hotel?.rooms?.find(r => String(r.id) === String(roomId))

  const calcMutation = useMutation({
    mutationFn: () =>
      bookingApi.calcPrice({
        roomId,
        checkIn,
        checkOut,
        promoCode: form.promoCode,
        usePoints: form.usePoints,
      }),
    onSuccess: (r) => {
      setPricing(r.data.data)
      setPromoApplied(!!form.promoCode)
    },
    onError: (e) =>
      toast({
        title: 'Gagal',
        description: e?.response?.data?.message || 'Kode promo tidak valid.',
        variant: 'destructive',
      }),
  })

  const bookMutation = useMutation({
    mutationFn: () =>
      bookingApi.create({
        roomId,
        hotelId,
        checkIn,
        checkOut,
        guests: parseInt(guests, 10),
        guestName: form.guestName,
        guestEmail: form.guestEmail,
        guestPhone: form.guestPhone,
        notes: form.notes,
        promoCode: form.promoCode || undefined,
        usePoints: form.usePoints,
      }),
    onSuccess: (r) => navigate(`/payment/${r.data.data.booking.id}`),
    onError: (e) =>
      toast({
        title: 'Gagal membuat booking',
        description: e?.response?.data?.message,
        variant: 'destructive',
      }),
  })

  const handleApplyPromo = () => calcMutation.mutate()

  return (
    <div className="container max-w-5xl py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali
      </button>
      <h1 className="mb-8 font-display text-2xl font-bold">Lengkapi Data Pemesanan</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-card">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">
              <User className="h-5 w-5 text-brand" /> Data Tamu
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  key: 'guestName',
                  label: 'Nama Lengkap',
                  icon: User,
                  type: 'text',
                  placeholder: 'Masukkan nama lengkap',
                },
                {
                  key: 'guestEmail',
                  label: 'Email',
                  icon: Mail,
                  type: 'email',
                  placeholder: 'email@contoh.com',
                },
                {
                  key: 'guestPhone',
                  label: 'No. Telepon',
                  icon: Phone,
                  type: 'tel',
                  placeholder: '08xxxxxxxxxx',
                },
              ].map(({ key, label, icon: Icon, type, placeholder }) => (
                <div key={key} className={key === 'guestName' ? 'sm:col-span-2' : ''}>
                  <label className="mb-1.5 block text-sm font-medium">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={type}
                      value={form[key]}
                      placeholder={placeholder}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Catatan (opsional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Permintaan khusus, waktu tiba, dll..."
                  className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-card">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">
              <Tag className="h-5 w-5 text-brand" /> Kode Promo
            </h2>
            <div className="flex gap-3">
              <input
                value={form.promoCode}
                onChange={e => setForm({ ...form, promoCode: e.target.value })}
                placeholder="Masukkan kode promo..."
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              <button
                onClick={handleApplyPromo}
                disabled={!form.promoCode || calcMutation.isPending}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {calcMutation.isPending ? '...' : 'Gunakan'}
              </button>
            </div>
            {promoApplied && pricing?.promoDiscount > 0 && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
                Promo berhasil diterapkan - hemat {formatRupiah(pricing.promoDiscount)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-24 rounded-2xl border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-base font-semibold">Ringkasan Pesanan</h2>

            {hotel && (
              <div className="mb-4 flex gap-3 border-b pb-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {hotel.images?.[0] ? (
                    <img src={getImageUrl(hotel.images[0])} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">H</div>
                  )}
                </div>
                <div>
                  <p className="line-clamp-1 text-sm font-semibold">{hotel.name}</p>
                  <p className="text-xs text-muted-foreground">{room?.name} - {room?.type}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {checkIn} sampai {checkOut} - {nights} malam
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {guests} tamu - {roomCount} kamar
                  </p>
                </div>
              </div>
            )}

            {pricing ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga Hotel</span>
                  <span>{formatRupiah(pricing.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PPN & Others</span>
                  <span>{formatRupiah((pricing.markupAmount || 0) + (pricing.taxAmount || 0) + (pricing.priceSuffix || 0))}</span>
                </div>
                {pricing.promoDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon Promo</span>
                    <span className="font-medium text-green-600">- {formatRupiah(pricing.promoDiscount)}</span>
                  </div>
                )}
                {pricing.loyaltyDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon Poin</span>
                    <span className="font-medium text-green-600">- {formatRupiah(pricing.loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3 text-base font-bold">
                  <span>Total</span>
                  <span className="price-tag">{formatRupiah(pricing.totalPrice)}</span>
                </div>
              </div>
            ) : room && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {formatRupiah(room.basePrice)} x {nights} malam x {roomCount} kamar
                  </span>
                  <span>{formatRupiah(room.basePrice * nights * roomCount)}</span>
                </div>
                <button
                  onClick={() => calcMutation.mutate()}
                  className="mt-2 w-full rounded-lg border border-brand/30 py-2 text-xs text-brand transition-colors hover:bg-brand/5"
                >
                  Hitung harga detail
                </button>
              </div>
            )}

            <button
              onClick={() => bookMutation.mutate()}
              disabled={!form.guestName || !form.guestEmail || bookMutation.isPending}
              className="mt-5 w-full rounded-xl bg-brand py-3 font-bold text-white shadow-brand/30 shadow-md transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {bookMutation.isPending ? 'Memproses...' : 'Lanjutkan Pembayaran'}
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Dengan melanjutkan, Anda menyetujui syarat & ketentuan kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
