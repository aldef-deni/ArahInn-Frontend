import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDate, statusBadgeClass, statusLabel, getImageUrl } from '@/utils'
import { ChevronLeft, Calendar, MapPin, BedDouble, Users, Receipt, Hash, CalendarClock, X } from 'lucide-react'

/* Tanggal hari ini dalam waktu LOKAL.
   `toISOString()` memakai UTC, jadi di WIB ia masih menunjuk hari kemarin
   sampai pukul 07.00 — batas minimum kalender akan meleset sehari. */
const hariIni = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const selisihMalam = (masuk, keluar) => {
  if (!masuk || !keluar) return 0
  const a = new Date(`${masuk}T00:00:00`)
  const b = new Date(`${keluar}T00:00:00`)
  return Math.max(0, Math.round((b - a) / 86400000))
}

/* Dialog ubah tanggal.
   Memanggil useTranslation() SENDIRI — meminjam `t` dari induk lolos di dev
   lalu memunculkan layar putih di produksi (lihat CLAUDE.md). */
function UbahTanggalDialog({ booking, onClose, onConfirm, isLoading }) {
  const { t } = useTranslation()
  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')

  const minimal = hariIni()
  const malam   = selisihMalam(checkIn, checkOut)
  const sah     = checkIn && checkOut && checkOut > checkIn

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">{t('orderDetail.rescheduleTitle')}</h3>
            <p className="text-xs text-slate-500 font-mono truncate">{booking.bookingCode}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-600">
          <span className="font-medium text-slate-700">{t('orderDetail.rescheduleCurrent')}:</span>{' '}
          {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {t('orderDetail.rescheduleNewCheckin')}
            </label>
            <input
              type="date"
              value={checkIn}
              min={minimal}
              onChange={e => {
                setCheckIn(e.target.value)
                // Check-out yang sudah tidak masuk akal dikosongkan, supaya
                // tidak ada rentang terbalik yang diam-diam terkirim.
                if (checkOut && e.target.value >= checkOut) setCheckOut('')
              }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {t('orderDetail.rescheduleNewCheckout')}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || minimal}
              disabled={!checkIn}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
          {malam > 0 && (
            <p className="text-xs font-semibold text-slate-700">
              {t('orderDetail.rescheduleNights', { n: malam })}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">{t('orderDetail.rescheduleNote')}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {t('orderDetail.rescheduleCancel')}
          </button>
          <button
            onClick={() => onConfirm({ checkIn, checkOut })}
            disabled={!sah || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {isLoading ? t('orderDetail.rescheduleSaving') : t('orderDetail.rescheduleConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetail() {
  const { t }    = useTranslation()
  const { id }   = useParams()
  const navigate = useNavigate()

  const { toast } = useToast()
  const qc        = useQueryClient()
  const [ubahTanggal, setUbahTanggal] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn : () => bookingApi.getById(id).then(r => r.data.data),
  })

  const ubahMutation = useMutation({
    mutationFn: ({ checkIn, checkOut }) => bookingApi.reschedule(id, { checkIn, checkOut }),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['order-detail', id] })
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      toast({ title: t('orderDetail.rescheduleSuccess') })
      setUbahTanggal(false)
    },
    // Pesan dari backend dipakai apa adanya: ia menyebutkan sisa kamar pada
    // tanggal yang bentrok, dan itu jauh lebih berguna bagi tamu daripada
    // kalimat umum "gagal".
    onError: (e) => toast({
      title: t('orderDetail.rescheduleFailed'),
      description: e?.response?.data?.message,
      variant: 'destructive',
    }),
  })

  if (isLoading) return (
    <div className="container py-20 text-center">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  if (!booking) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">{t('orderDetail.notFound')}</p>
    </div>
  )

  const hotel  = booking.hotel
  const room   = booking.room
  const image  = hotel?.images?.[0]

  return (
    <div className="container py-4 sm:py-6 lg:py-8 max-w-2xl pb-24 lg:pb-8">
      <button onClick={() => navigate('/orders')}
        className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground active:scale-95 mb-4 sm:mb-6 transition-all">
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{t('orderDetail.backToHistory')}</span>
        <span className="sm:hidden">{t('orderDetail.back')}</span>
      </button>

      <h1 className="font-display text-xl sm:text-2xl font-bold mb-4 sm:mb-6 leading-tight">{t('orderDetail.title')}</h1>

      {/* Status & Booking Code */}
      <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4 shadow-card flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold ${statusBadgeClass(booking.status)}`}>
            {statusLabel(booking.status)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0">
          <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
          <span className="font-mono font-bold text-brand tracking-widest truncate">{booking.bookingCode}</span>
        </div>
      </div>

      {/* Hotel Info */}
      <div className="bg-white border rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-card">
        {image && (
          <div className="h-36 sm:h-44 overflow-hidden">
            <img src={getImageUrl(image)} alt={hotel?.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
          <div>
            <p className="font-bold text-base sm:text-lg leading-snug">{hotel?.name}</p>
            {hotel?.city && (
              <div className="flex items-center gap-1 sm:gap-1.5 mt-1 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="line-clamp-1">{hotel.address ? `${hotel.address}, ` : ''}{hotel.city}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <BedDouble className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate"><span className="text-muted-foreground">{t('orderDetail.room')}</span> {room?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">{t('orderDetail.guests')}</span> {booking.guests} {t('orderDetail.guestUnit')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">{t('orderDetail.checkin')}</span> {formatDate(booking.checkIn)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">{t('orderDetail.checkout')}</span> {formatDate(booking.checkOut)}</span>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground pt-1">{t('orderDetail.duration', { n: booking.totalNights })}</p>
          {booking.stayType && booking.stayType !== 'daily' && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              Paket {booking.stayLabel || (booking.stayType === 'weekly' ? 'Mingguan' : 'Bulanan')}
            </span>
          )}
        </div>
      </div>

      {/* Guest Info */}
      <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4 shadow-card">
        <h2 className="font-semibold mb-2.5 sm:mb-3 flex items-center gap-2 text-[11px] sm:text-sm uppercase tracking-wide text-muted-foreground">
          {t('orderDetail.guestData')}
        </h2>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground shrink-0">{t('orderDetail.name')}</span>
            <span className="font-medium text-right break-words min-w-0">{booking.guestName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground shrink-0">{t('orderDetail.email')}</span>
            <span className="font-medium text-right break-all min-w-0">{booking.guestEmail}</span>
          </div>
          {booking.guestPhone && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground shrink-0">{t('orderDetail.phone')}</span>
              <span className="font-medium text-right">{booking.guestPhone}</span>
            </div>
          )}
          {booking.notes && (
            <div className="flex justify-between gap-3 sm:gap-4">
              <span className="text-muted-foreground shrink-0">{t('orderDetail.notes')}</span>
              <span className="font-medium text-right break-words">{booking.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-card">
        <h2 className="font-semibold mb-2.5 sm:mb-3 flex items-center gap-2 text-[11px] sm:text-sm uppercase tracking-wide text-muted-foreground">
          <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('orderDetail.paymentBreakdown')}
        </h2>
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('orderDetail.hotelPrice', { n: booking.totalNights })}</span>
            <span className="text-right whitespace-nowrap">{formatRupiah(parseFloat(booking.basePrice) || 0)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{(parseFloat(booking.taxAmount) || 0) > 0 ? t('orderDetail.taxOthers') : t('orderDetail.otherFees')}</span>
            <span className="text-right whitespace-nowrap">{formatRupiah(
              (parseFloat(booking.markupAmount) || 0) +
              (parseFloat(booking.taxAmount) || 0) +
              (parseFloat(booking.priceSuffix) || 0)
            )}</span>
          </div>
          {parseFloat(booking.promoDiscount) > 0 && (
            <div className="flex justify-between gap-3 text-green-600">
              <span>{t('orderDetail.promoDiscount')}</span>
              <span className="text-right whitespace-nowrap">− {formatRupiah(parseFloat(booking.promoDiscount))}</span>
            </div>
          )}
          {parseFloat(booking.loyaltyDiscount) > 0 && (
            <div className="flex justify-between gap-3 text-green-600">
              <span>{t('orderDetail.pointDiscount')}</span>
              <span className="text-right whitespace-nowrap">− {formatRupiah(parseFloat(booking.loyaltyDiscount))}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2.5 sm:pt-3 border-t font-bold gap-3">
            <span className="text-sm sm:text-base">{t('orderDetail.totalPaid')}</span>
            <span className="price-tag text-base sm:text-lg">{formatRupiah(parseFloat(booking.totalPrice) || 0)}</span>
          </div>
        </div>
      </div>

      {/* Ubah tanggal — hanya untuk booking yang sudah dibayar dan BELUM
          dimulai. Backend mengizinkan pemilik booking melakukannya sendiri;
          selama ini tombolnya saja yang tidak pernah ada, sehingga tamu harus
          menghubungi admin. */}
      {['paid', 'issued', 'rescheduled'].includes(booking.status)
        && booking.checkIn && String(booking.checkIn).slice(0, 10) > hariIni() && (
        <button
          onClick={() => setUbahTanggal(true)}
          className="w-full mt-4 py-3 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <CalendarClock className="w-4 h-4" />
          {t('orderDetail.reschedule')}
        </button>
      )}

      {ubahTanggal && (
        <UbahTanggalDialog
          booking={booking}
          onClose={() => setUbahTanggal(false)}
          onConfirm={(v) => ubahMutation.mutate(v)}
          isLoading={ubahMutation.isPending}
        />
      )}

      {/* Actions */}
      {booking.status === 'pending' && (
        <>
          {/* Desktop inline */}
          <button onClick={() => navigate(`/payment/${booking.bookingCode || booking.id}`)}
            className="hidden lg:flex w-full mt-4 py-3 bg-brand text-white rounded-2xl font-bold hover:bg-brand-700 active:scale-[0.98] transition-all items-center justify-center">
            {t('orderDetail.completePayment')}
          </button>
          {/* Mobile sticky bottom */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] px-4 py-3">
            <button onClick={() => navigate(`/payment/${booking.bookingCode || booking.id}`)}
              className="w-full py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-700 active:scale-[0.98] transition-all">
              {t('orderDetail.completePayment')} · {formatRupiah(parseFloat(booking.totalPrice) || 0)}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
