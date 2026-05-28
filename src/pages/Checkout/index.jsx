import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { hotelApi } from '@/services/hotelApi'
import { bookingApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, diffDays, getImageUrl } from '@/utils'
import { Tag, ChevronLeft, User, Phone, Mail } from 'lucide-react'

export default function Checkout() {
  const { t } = useTranslation()
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
  const [promoError, setPromoError] = useState('')

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
        roomCount,
        promoCode: form.promoCode,
        usePoints: form.usePoints,
      }),
    onSuccess: (r) => {
      setPricing(r.data.data)
      setPromoApplied(!!form.promoCode)
    },
    onError: (e) =>
      toast({
        title: t('common.error'),
        description: e?.response?.data?.message || t('checkout.promoFailed'),
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
        roomCount,
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
        title: t('checkout.bookingFailed'),
        description: e?.response?.data?.message,
        variant: 'destructive',
      }),
  })

  // Apply promo dengan handler khusus — kalau gagal, reset field + tampil inline error
  const applyPromoMutation = useMutation({
    mutationFn: (code) =>
      bookingApi.calcPrice({
        roomId,
        checkIn,
        checkOut,
        roomCount,
        promoCode: code,
        usePoints: form.usePoints,
      }),
    onSuccess: (r) => {
      const data = r.data.data
      // BE sukses tapi promo tidak menghasilkan diskon → anggap kode tidak valid
      if (!data?.promoDiscount || data.promoDiscount <= 0) {
        setPromoError('Kode promo salah atau tidak berlaku.')
        setForm(prev => ({ ...prev, promoCode: '' }))
        return
      }
      setPricing(data)
      setPromoApplied(true)
      setPromoError('')
    },
    onError: (e) => {
      setPromoError(e?.response?.data?.message || 'Kode promo salah.')
      setForm(prev => ({ ...prev, promoCode: '' }))
    },
  })

  const handleApplyPromo = () => {
    if (!form.promoCode?.trim()) return
    setPromoError('')
    applyPromoMutation.mutate(form.promoCode.trim())
  }

  // Auto-calc harga saat halaman pertama dibuka & saat roomCount/tanggal berubah
  useEffect(() => {
    if (roomId && checkIn && checkOut) {
      calcMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, checkIn, checkOut, roomCount])

  return (
    <div className="container max-w-5xl py-4 sm:py-6 lg:py-8 pb-28 lg:pb-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground transition-all hover:text-foreground active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="mb-5 sm:mb-8 font-display text-xl sm:text-2xl font-bold leading-tight">{t('checkout.title')}</h1>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <div className="rounded-xl sm:rounded-2xl border bg-white p-4 sm:p-5 lg:p-6 shadow-card">
            <h2 className="mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base font-semibold">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-brand" /> {t('checkout.guestInfo')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {[
                {
                  key: 'guestName',
                  label: t('checkout.fullName'),
                  icon: User,
                  type: 'text',
                  placeholder: t('checkout.fullNamePh'),
                },
                {
                  key: 'guestEmail',
                  label: t('checkout.email'),
                  icon: Mail,
                  type: 'email',
                  placeholder: t('checkout.emailPh'),
                },
                {
                  key: 'guestPhone',
                  label: t('checkout.phone'),
                  icon: Phone,
                  type: 'tel',
                  placeholder: t('checkout.phonePh'),
                },
              ].map(({ key, label, icon: Icon, type, placeholder }) => (
                <div key={key} className={key === 'guestName' ? 'sm:col-span-2' : ''}>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium">
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
                <label className="mb-1.5 block text-xs sm:text-sm font-medium">{t('checkout.notes')} ({t('common.optional')})</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder={t('checkout.notesPh')}
                  className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border bg-white p-4 sm:p-5 lg:p-6 shadow-card">
            <h2 className="mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base font-semibold">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-brand" /> {t('checkout.promoCode')}
            </h2>
            <div className="flex gap-2 sm:gap-3">
              <input
                value={form.promoCode}
                onChange={e => {
                  setForm({ ...form, promoCode: e.target.value })
                  if (promoError) setPromoError('')
                }}
                placeholder={t('checkout.promoPh')}
                className={`flex-1 min-w-0 rounded-xl border px-3 sm:px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 ${
                  promoError
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'focus:ring-brand/50'
                }`}
              />
              <button
                onClick={handleApplyPromo}
                disabled={!form.promoCode || applyPromoMutation.isPending}
                className="rounded-xl bg-brand px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50 shrink-0"
              >
                {applyPromoMutation.isPending ? '...' : t('checkout.apply')}
              </button>
            </div>
            {promoError && (
              <div className="mt-2 flex items-start gap-1.5 text-xs sm:text-sm text-red-600">
                <span className="font-semibold">⚠</span>
                <span>{promoError}</span>
              </div>
            )}
            {promoApplied && pricing?.promoDiscount > 0 && !promoError && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-green-700">
                {t('checkout.promoSuccess', { amount: formatRupiah(pricing.promoDiscount) })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="lg:sticky lg:top-24 rounded-xl sm:rounded-2xl border bg-white p-4 sm:p-5 shadow-card">
            <h2 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold">{t('checkout.summary')}</h2>

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
                    {checkIn} {t('checkout.until')} {checkOut} - {nights} {t('checkout.nights')}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {guests} {t('checkout.guests')} - {roomCount} {t('checkout.rooms')}
                  </p>
                </div>
              </div>
            )}

            {pricing ? (() => {
              // BE sekarang return original_base_price (sebelum promo) & base_price (setelah promo).
              // Promo discount diaplikasikan di base price agar konsisten dengan card.
              const hasPromo          = (pricing.promoDiscount || 0) > 0
              const originalBase      = Number(pricing.originalBasePrice ?? pricing.basePrice) || 0
              const basePriceFinal    = Number(pricing.basePrice) || 0
              const promoDiscount     = Number(pricing.promoDiscount) || 0
              const showInlineDiscount = hasPromo && !form.promoCode

              // Persen: prioritaskan nilai dari promo (sumber kebenaran owner),
              // fallback ke hitungan rasio kalau bukan tipe percent.
              const promoPct = pricing.promo?.discountType === 'percent'
                ? Math.round(Number(pricing.promo.discountValue) || 0)
                : (originalBase > 0 ? Math.round((promoDiscount / originalBase) * 100) : 0)

              return (
              <div className="space-y-2 text-sm">
                {/* Harga hotel — tampilkan coret + harga diskon kalau ada promo otomatis */}
                <div className="flex justify-between items-start gap-3">
                  <span className="text-muted-foreground">{t('checkout.hotelPrice')}</span>
                  <div className="text-right">
                    {showInlineDiscount ? (
                      <>
                        <p className="text-xs text-slate-400 line-through leading-tight">
                          {formatRupiah(originalBase)}
                        </p>
                        <p className="font-bold text-orange-600">{formatRupiah(basePriceFinal)}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">
                          {promoPct}% OFF
                        </span>
                      </>
                    ) : (
                      <p>{formatRupiah(basePriceFinal)}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('checkout.taxOthers')}</span>
                  <span>{formatRupiah((pricing.markupAmount || 0) + (pricing.taxAmount || 0) + (pricing.priceSuffix || 0))}</span>
                </div>
                {/* Hanya tampilkan baris diskon promo terpisah kalau pakai KODE MANUAL.
                    Untuk promo otomatis, diskon sudah tergabung di baris "Harga hotel" di atas */}
                {hasPromo && form.promoCode && (
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('checkout.promoDiscount')}</span>
                    </div>
                    <span className="font-medium text-green-600 whitespace-nowrap">- {formatRupiah(promoDiscount)}</span>
                  </div>
                )}
                {pricing.loyaltyDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.pointDiscount')}</span>
                    <span className="font-medium text-green-600">- {formatRupiah(pricing.loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  {hasPromo && (
                    <div className="flex justify-between text-xs text-slate-400 line-through mb-1">
                      <span>Total tanpa promo</span>
                      <span>{formatRupiah(pricing.totalPrice + promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold">
                    <span>{t('checkout.total')}</span>
                    <span className="price-tag">{formatRupiah(pricing.totalPrice)}</span>
                  </div>
                  {showInlineDiscount && pricing.promo?.name && (
                    <p className="mt-1 text-[11px] text-orange-600 font-semibold">
                      ✦ {pricing.promo.name} otomatis diterapkan
                    </p>
                  )}
                </div>
              </div>
              )
            })() : room && (() => {
              const unitPrice = Number(room.discountedPrice ?? room.basePrice)
              const hasPromo  = room.discountedPrice && room.discountedPrice < room.basePrice
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3 items-start">
                    <span className="text-muted-foreground">
                      {t('checkout.perRoomNight', { price: formatRupiah(unitPrice), nights, rooms: roomCount })}
                    </span>
                    <div className="text-right">
                      {hasPromo && (
                        <p className="text-xs text-slate-400 line-through leading-tight">
                          {formatRupiah(room.basePrice * nights * roomCount)}
                        </p>
                      )}
                      <p className={hasPromo ? 'font-bold text-orange-600' : ''}>
                        {formatRupiah(unitPrice * nights * roomCount)}
                      </p>
                    </div>
                  </div>
                  {hasPromo && room.appliedPromo && (
                    <div className="text-[11px] text-orange-600 font-semibold flex items-center gap-1">
                      ✦ {room.appliedPromo.name}
                      <span className="px-1.5 py-0.5 rounded-md bg-orange-100">
                        {room.appliedPromo.discountType === 'percent'
                          ? `${Number(room.appliedPromo.discountValue)}% OFF`
                          : `Hemat ${formatRupiah(room.appliedPromo.discountValue)}`}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => calcMutation.mutate()}
                    className="mt-2 w-full rounded-lg border border-brand/30 py-2 text-xs text-brand transition-colors hover:bg-brand/5"
                  >
                    {t('checkout.calcDetail')}
                  </button>
                </div>
              )
            })()}

            <button
              onClick={() => bookMutation.mutate()}
              disabled={!form.guestName || !form.guestEmail || bookMutation.isPending}
              className="mt-4 sm:mt-5 hidden lg:flex w-full items-center justify-center rounded-xl bg-brand py-3 font-bold text-white shadow-brand/30 shadow-md transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
            >
              {bookMutation.isPending ? t('checkout.processing') : t('checkout.proceedPayment')}
            </button>

            <p className="mt-3 text-center text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {t('checkout.agreement')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom CTA (hidden on lg+) ───────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="container py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t('checkout.total')}</p>
            <p className="text-base font-black text-orange-600 leading-tight truncate">
              {pricing ? formatRupiah(pricing.totalPrice) : '—'}
            </p>
          </div>
          <button
            onClick={() => bookMutation.mutate()}
            disabled={!form.guestName || !form.guestEmail || bookMutation.isPending}
            className="px-5 py-2.5 bg-brand text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-700 active:scale-95 disabled:opacity-50 transition-all shrink-0"
          >
            {bookMutation.isPending ? '...' : t('checkout.proceedPayment')}
          </button>
        </div>
      </div>
    </div>
  )
}
