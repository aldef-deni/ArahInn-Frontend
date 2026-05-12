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
    <div className="container py-8 max-w-2xl">
      <button onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Riwayat Pesanan
      </button>

      <h1 className="font-display text-2xl font-bold mb-6">Detail Pesanan</h1>

      {/* Status & Booking Code */}
      <div className="bg-white border rounded-2xl p-5 mb-4 shadow-card flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadgeClass(booking.status)}`}>
            {statusLabel(booking.status)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono font-bold text-brand tracking-widest">{booking.bookingCode}</span>
        </div>
      </div>

      {/* Hotel Info */}
      <div className="bg-white border rounded-2xl overflow-hidden mb-4 shadow-card">
        {image && (
          <div className="h-44 overflow-hidden">
            <img src={getImageUrl(image)} alt={hotel?.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5 space-y-3">
          <div>
            <p className="font-bold text-lg">{hotel?.name}</p>
            {hotel?.city && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {hotel.address ? `${hotel.address}, ` : ''}{hotel.city}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2 text-sm">
              <BedDouble className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">Kamar:</span> {room?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">Tamu:</span> {booking.guests} orang</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">Check-in:</span> {formatDate(booking.checkIn)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span><span className="text-muted-foreground">Check-out:</span> {formatDate(booking.checkOut)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">Durasi: {booking.totalNights} malam</p>
        </div>
      </div>

      {/* Guest Info */}
      <div className="bg-white border rounded-2xl p-5 mb-4 shadow-card">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          Data Tamu
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{booking.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{booking.guestEmail}</span>
          </div>
          {booking.guestPhone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telepon</span>
              <span className="font-medium">{booking.guestPhone}</span>
            </div>
          )}
          {booking.notes && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Catatan</span>
              <span className="font-medium text-right">{booking.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white border rounded-2xl p-5 shadow-card">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Receipt className="w-4 h-4" /> Rincian Pembayaran
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Harga Hotel ({booking.totalNights} malam)</span>
            <span>{formatRupiah(parseFloat(booking.basePrice) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PPN & Others</span>
            <span>{formatRupiah(
              (parseFloat(booking.markupAmount) || 0) +
              (parseFloat(booking.taxAmount) || 0) +
              (parseFloat(booking.priceSuffix) || 0)
            )}</span>
          </div>
          {parseFloat(booking.promoDiscount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Promo</span>
              <span>− {formatRupiah(parseFloat(booking.promoDiscount))}</span>
            </div>
          )}
          {parseFloat(booking.loyaltyDiscount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Poin</span>
              <span>− {formatRupiah(parseFloat(booking.loyaltyDiscount))}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t font-bold text-base">
            <span>Total Dibayar</span>
            <span className="price-tag text-lg">{formatRupiah(parseFloat(booking.totalPrice) || 0)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {booking.status === 'pending' && (
        <button onClick={() => navigate(`/payment/${booking.id}`)}
          className="w-full mt-4 py-3 bg-brand text-white rounded-2xl font-bold hover:bg-brand-700 transition-colors">
          Selesaikan Pembayaran
        </button>
      )}
    </div>
  )
}
