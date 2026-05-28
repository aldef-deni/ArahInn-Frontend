import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { formatRupiah, formatDate, statusBadgeClass, statusLabel, getImageUrl } from '@/utils'
import { ChevronLeft, Calendar, MapPin, BedDouble, Users, Receipt, Hash } from 'lucide-react'

export default function OrderDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const { data: booking, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn : () => bookingApi.getById(id).then(r => r.data.data),
  })

  if (isLoading) return (
    <div className="container py-20 text-center">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  if (!booking) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">Pesanan tidak ditemukan.</p>
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
        <span className="hidden sm:inline">Kembali ke Riwayat Pesanan</span>
        <span className="sm:hidden">Kembali</span>
      </button>

      <h1 className="font-display text-xl sm:text-2xl font-bold mb-4 sm:mb-6 leading-tight">Detail Pesanan</h1>

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
              <span className="truncate"><span className="text-muted-foreground">Kamar:</span> {room?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">Tamu:</span> {booking.guests} orang</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">Check-in:</span> {formatDate(booking.checkIn)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">Check-out:</span> {formatDate(booking.checkOut)}</span>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground pt-1">Durasi: {booking.totalNights} malam</p>
        </div>
      </div>

      {/* Guest Info */}
      <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4 shadow-card">
        <h2 className="font-semibold mb-2.5 sm:mb-3 flex items-center gap-2 text-[11px] sm:text-sm uppercase tracking-wide text-muted-foreground">
          Data Tamu
        </h2>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground shrink-0">Nama</span>
            <span className="font-medium text-right break-words min-w-0">{booking.guestName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground shrink-0">Email</span>
            <span className="font-medium text-right break-all min-w-0">{booking.guestEmail}</span>
          </div>
          {booking.guestPhone && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground shrink-0">Telepon</span>
              <span className="font-medium text-right">{booking.guestPhone}</span>
            </div>
          )}
          {booking.notes && (
            <div className="flex justify-between gap-3 sm:gap-4">
              <span className="text-muted-foreground shrink-0">Catatan</span>
              <span className="font-medium text-right break-words">{booking.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-card">
        <h2 className="font-semibold mb-2.5 sm:mb-3 flex items-center gap-2 text-[11px] sm:text-sm uppercase tracking-wide text-muted-foreground">
          <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Rincian Pembayaran
        </h2>
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Harga Hotel ({booking.totalNights} malam)</span>
            <span className="text-right whitespace-nowrap">{formatRupiah(parseFloat(booking.basePrice) || 0)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">PPN &amp; Others</span>
            <span className="text-right whitespace-nowrap">{formatRupiah(
              (parseFloat(booking.markupAmount) || 0) +
              (parseFloat(booking.taxAmount) || 0) +
              (parseFloat(booking.priceSuffix) || 0)
            )}</span>
          </div>
          {parseFloat(booking.promoDiscount) > 0 && (
            <div className="flex justify-between gap-3 text-green-600">
              <span>Diskon Promo</span>
              <span className="text-right whitespace-nowrap">− {formatRupiah(parseFloat(booking.promoDiscount))}</span>
            </div>
          )}
          {parseFloat(booking.loyaltyDiscount) > 0 && (
            <div className="flex justify-between gap-3 text-green-600">
              <span>Diskon Poin</span>
              <span className="text-right whitespace-nowrap">− {formatRupiah(parseFloat(booking.loyaltyDiscount))}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2.5 sm:pt-3 border-t font-bold gap-3">
            <span className="text-sm sm:text-base">Total Dibayar</span>
            <span className="price-tag text-base sm:text-lg">{formatRupiah(parseFloat(booking.totalPrice) || 0)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {booking.status === 'pending' && (
        <>
          {/* Desktop inline */}
          <button onClick={() => navigate(`/payment/${booking.id}`)}
            className="hidden lg:flex w-full mt-4 py-3 bg-brand text-white rounded-2xl font-bold hover:bg-brand-700 active:scale-[0.98] transition-all items-center justify-center">
            Selesaikan Pembayaran
          </button>
          {/* Mobile sticky bottom */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] px-4 py-3">
            <button onClick={() => navigate(`/payment/${booking.id}`)}
              className="w-full py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-700 active:scale-[0.98] transition-all">
              Selesaikan Pembayaran · {formatRupiah(parseFloat(booking.totalPrice) || 0)}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
