import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { hotelApi } from '@/services/hotelApi'
import { bookingApi, promoApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, diffDays, getImageUrl } from '@/utils'
import { Tag, ChevronLeft, User, Phone, Mail, X, ArrowRight, Star } from 'lucide-react'

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
  const stayType = sp.get('stayType') || 'daily'
  const isLongStay = stayType === 'weekly' || stayType === 'monthly'
  const nights = diffDays(checkIn, checkOut)

  const [form, setForm] = useState({
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: user?.phone || '',
    notes: '',
    promoCode: '',
    usePoints: false,
    pointsInput: '',
  })
  const [pricing, setPricing] = useState(null)
  const [basePricing, setBasePricing] = useState(null)   // harga tanpa promo (untuk reset instan)
  const [appliedPromo, setAppliedPromo] = useState('')   // kode yang BENAR-BENAR diterapkan
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [appliedPoints, setAppliedPoints] = useState(0)  // poin yang BENAR-BENAR dipakai
  const [pointsLoading, setPointsLoading] = useState(false)
  const [pointsError, setPointsError] = useState('')

  const { data: hotel } = useQuery({
    queryKey: ['hotel-checkout', hotelId],
    queryFn: () => hotelApi.getById(hotelId).then(r => r.data.data),
  })

  // Saldo poin loyalitas customer (untuk fitur redeem)
  const { data: pointBalance = 0 } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: () => promoApi.loyalty.balance().then(r => r.data?.data?.balance ?? 0),
    enabled: !!user,
  })

  // Recalc harga dengan kombinasi kode promo + poin (eksplisit, hindari state async)
  const recalcWith = (code, points) =>
    bookingApi.calcPrice({
      roomId, checkIn, checkOut, roomCount, stayType,
      promoCode: code || undefined,
      pointsToRedeem: points || 0,
      usePoints: (points || 0) > 0,
    }).then(r => { setPricing(r.data.data); return r.data.data })

  const handleApplyPoints = async () => {
    const want = Math.max(0, parseInt(form.pointsInput || '0', 10) || 0)
    if (want <= 0) { setPointsError('Masukkan jumlah poin.'); return }
    if (want > pointBalance) { setPointsError(`Poin Anda hanya ${pointBalance.toLocaleString('id-ID')}.`); return }
    setPointsError('')
    setPointsLoading(true)
    try {
      const data = await recalcWith(appliedPromo, want)
      const used = Number(data.loyaltyDiscount) || 0
      setAppliedPoints(used)
      setForm(f => ({ ...f, pointsInput: String(used), usePoints: used > 0 }))
    } catch (e) {
      setPointsError(e?.response?.data?.message || 'Gagal menerapkan poin.')
    } finally { setPointsLoading(false) }
  }

  const clearPoints = async () => {
    setAppliedPoints(0); setPointsError('')
    setForm(f => ({ ...f, pointsInput: '', usePoints: false }))
    setPointsLoading(true)
    try { await recalcWith(appliedPromo, 0) } catch { /* noop */ } finally { setPointsLoading(false) }
  }

  const room = hotel?.rooms?.find(r => String(r.id) === String(roomId))

  const calcMutation = useMutation({
    // Auto-calc SELALU tanpa promo → ini "harga dasar". Promo hanya via tombol "Gunakan".
    mutationFn: () =>
      bookingApi.calcPrice({
        roomId,
        checkIn,
        checkOut,
        roomCount,
        stayType,
        usePoints: form.usePoints,
      }),
    onSuccess: (r) => {
      const data = r.data.data
      setPricing(data)
      setBasePricing(data)
      // Ganti tanggal/jumlah kamar → promo & poin yang sudah diterapkan direset (apply ulang)
      setAppliedPromo('')
      setPromoApplied(false)
      setAppliedPoints(0)
      setPointsError('')
      setForm(f => ({ ...f, pointsInput: '', usePoints: false }))
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
        stayType,
        guestName: form.guestName,
        guestEmail: form.guestEmail,
        guestPhone: form.guestPhone,
        notes: form.notes,
        promoCode: appliedPromo || undefined,
        usePoints: appliedPoints > 0,
        pointsToRedeem: appliedPoints,
      }),
    onSuccess: (r) => navigate(`/payment/${r.data.data.booking.bookingCode || r.data.data.booking.id}`),
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
        stayType,
        promoCode: code,
        usePoints: appliedPoints > 0,
        pointsToRedeem: appliedPoints,
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
      setAppliedPromo(form.promoCode.trim())  // tandai kode yang diterapkan
      setPromoApplied(true)
      setPromoError('')
    },
    onError: (e) => {
      setPromoError(e?.response?.data?.message || 'Kode promo salah.')
    },
  })

  const handleApplyPromo = () => {
    if (!form.promoCode?.trim()) return
    setPromoError('')
    applyPromoMutation.mutate(form.promoCode.trim())
  }

  // Saat kode promo diedit setelah diterapkan → batalkan diskon SEKETIKA
  // (kembalikan ke harga dasar). Diskon baru hanya muncul setelah klik "Gunakan" lagi.
  const resetAppliedPromo = () => {
    setPromoApplied(false)
    setAppliedPromo('')
    setPromoError('')
    // Kalau poin sedang dipakai, hitung ulang tanpa promo tapi tetap pakai poin.
    if (appliedPoints > 0) { recalcWith('', appliedPoints) }
    else if (basePricing) setPricing(basePricing)
  }

  // Auto-calc harga saat halaman pertama dibuka & saat roomCount/tanggal berubah
  useEffect(() => {
    if (roomId && checkIn && checkOut) {
      calcMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, checkIn, checkOut, roomCount])

  // Lock body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) navigate(-1)
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 animate-fade-in-checkout"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-3xl max-h-[94vh] sm:max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up-checkout"
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="shrink-0 px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 bg-white border-b border-slate-100">
          <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Konfirmasi</p>
              <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold leading-tight text-slate-900">
                {t('checkout.title')}
              </h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all shrink-0"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

          {/* Order Summary (compact card at top) */}
          {hotel && (
            <div className="bg-gradient-to-br from-brand/5 to-blue-50 border border-brand/15 rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
              <div className="flex gap-3">
                <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {hotel.images?.[0] ? (
                    <img src={getImageUrl(hotel.images[0])} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">🏨</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm sm:text-base font-bold text-slate-900">{hotel.name}</p>
                  <p className="text-xs text-slate-600 truncate">{room?.name}{room?.type ? ` · ${room.type}` : ''}</p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 truncate">
                    {checkIn} {t('checkout.until')} {checkOut} · {nights} {t('checkout.nights')} · {guests} {t('checkout.guests')} · {roomCount} {t('checkout.rooms')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guest Info Card */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
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

          {/* Promo Code Card — disembunyikan untuk menginap mingguan/bulanan (harga tetap, tanpa promo) */}
          {!isLongStay && (
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-brand" /> {t('checkout.promoCode')}
            </h2>
            <div className="flex gap-2 sm:gap-3">
              <input
                value={form.promoCode}
                onChange={e => {
                  setForm({ ...form, promoCode: e.target.value })
                  if (promoError) setPromoError('')
                  if (appliedPromo) resetAppliedPromo()
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
            {promoApplied && pricing?.codeDiscount > 0 && !promoError && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-green-700">
                {t('checkout.promoSuccess', { amount: formatRupiah(pricing.codeDiscount) })}
              </div>
            )}
          </div>
          )}

          {/* Redeem Poin Card — tepat di bawah Kode Promo */}
          {user && pointBalance > 0 && (
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="mb-1 flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /> {t('checkout.redeemTitle')}
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                {t('checkout.pointsAvailable', { points: pointBalance.toLocaleString('id-ID') })}
                <button type="button" onClick={() => { setForm({ ...form, pointsInput: String(pointBalance) }); setPointsError('') }}
                  className="ml-2 font-semibold text-amber-600 hover:underline">{t('checkout.useMax')}</button>
              </p>
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="number" min={0} max={pointBalance} inputMode="numeric"
                  value={form.pointsInput}
                  onChange={e => { setForm({ ...form, pointsInput: e.target.value }); if (pointsError) setPointsError('') }}
                  placeholder={t('checkout.redeemPh')}
                  className={`flex-1 min-w-0 rounded-xl border px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    pointsError ? 'border-red-300 focus:ring-red-200' : 'focus:ring-amber-300'
                  }`}
                />
                {appliedPoints > 0 ? (
                  <button onClick={clearPoints} disabled={pointsLoading}
                    className="rounded-xl bg-slate-100 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 shrink-0">
                    {pointsLoading ? '...' : t('checkout.clear')}
                  </button>
                ) : (
                  <button onClick={handleApplyPoints} disabled={!form.pointsInput || pointsLoading}
                    className="rounded-xl bg-amber-500 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50 shrink-0">
                    {pointsLoading ? '...' : t('checkout.apply')}
                  </button>
                )}
              </div>
              {pointsError && (
                <div className="mt-2 flex items-start gap-1.5 text-xs sm:text-sm text-red-600">
                  <span className="font-semibold">⚠</span><span>{pointsError}</span>
                </div>
              )}
              {appliedPoints > 0 && !pointsError && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-amber-700">
                  {t('checkout.redeemApplied', { points: appliedPoints.toLocaleString('id-ID'), amount: formatRupiah(appliedPoints) })}
                </div>
              )}
            </div>
          )}

          {/* Price Breakdown Card */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-3 sm:mb-4 text-sm sm:text-base font-bold text-slate-900">{t('checkout.summary')}</h2>

            {pricing ? (() => {
              // Harga Hotel = base_price (SUDAH dipotong diskon campaign + kode promo).
              // Harga asli (original) ditampilkan dicoret bila ada diskon — tanpa baris
              // diskon terpisah agar tidak terlihat dipotong dua kali.
              const promoDiscount  = Number(pricing.promoDiscount) || 0
              const hasPromo       = promoDiscount > 0
              const basePriceFinal = Number(pricing.basePrice) || 0
              const originalBase   = Number(pricing.originalBasePrice) || basePriceFinal
              const loyaltyDisc    = Number(pricing.loyaltyDiscount) || 0

              return (
              <div className="space-y-2 text-sm">
                {/* Harga hotel — sudah termasuk diskon; harga asli dicoret bila ada potongan */}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground">{t('checkout.hotelPrice')}</span>
                  <div className="text-right">
                    {hasPromo && (
                      <p className="text-xs text-slate-400 line-through leading-tight">{formatRupiah(originalBase)}</p>
                    )}
                    <p className={hasPromo ? 'font-semibold text-green-600' : ''}>{formatRupiah(basePriceFinal)}</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {(pricing.taxAmount || 0) > 0 ? t('checkout.taxOthers') : t('checkout.othersOnly')}
                  </span>
                  <span>{formatRupiah((pricing.markupAmount || 0) + (pricing.taxAmount || 0) + (pricing.priceSuffix || 0))}</span>
                </div>
                {/* Potongan poin loyalitas — satu-satunya potongan yang benar2 mengurangi total */}
                {loyaltyDisc > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.pointDiscount')}</span>
                    <span className="font-medium text-green-600">- {formatRupiah(loyaltyDisc)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-base font-bold">
                    <span>{t('checkout.total')}</span>
                    <span className="price-tag">{formatRupiah(pricing.totalPrice)}</span>
                  </div>
                  {hasPromo && (
                    <p className="mt-1 text-[11px] text-green-600 font-semibold">
                      {t('checkout.youSaved', { amount: formatRupiah(promoDiscount) })}
                    </p>
                  )}
                  {pricing.campaign?.title && (
                    <p className="mt-1 text-[11px] text-orange-600 font-semibold">
                      ✦ {pricing.campaign.title} {t('checkout.autoApplied')}
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

          </div>
        </div>

        {/* ── Sticky Modal Footer (Total + CTA) ─────────────── */}
        <div className="shrink-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">{t('checkout.total')}</p>
              <p className="text-base sm:text-lg font-black text-orange-600 leading-tight truncate">
                {pricing ? formatRupiah(pricing.totalPrice) : '—'}
              </p>
            </div>
            <button
              onClick={() => bookMutation.mutate()}
              disabled={!form.guestName || !form.guestEmail || bookMutation.isPending}
              className="px-5 sm:px-6 py-3 bg-brand text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-700 active:scale-95 disabled:opacity-50 transition-all shrink-0 flex items-center gap-1.5"
            >
              {bookMutation.isPending ? '...' : t('checkout.proceedPayment')}
              {!bookMutation.isPending && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">
            {t('checkout.agreement')}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-up-checkout {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fade-in-checkout {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes slide-up-checkout {
            from { transform: scale(0.95); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
        }
        .animate-slide-up-checkout { animation: slide-up-checkout 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
        .animate-fade-in-checkout  { animation: fade-in-checkout 0.2s ease-out; }
      `}</style>
    </div>
  )
}
