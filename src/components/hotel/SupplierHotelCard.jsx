import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Utensils, ShieldCheck, Ban } from 'lucide-react'
import { formatRupiah } from '@/services/api'

/**
 * Kartu hotel dari supplier mitra (RateHawk) di halaman hasil pencarian.
 *
 * Bentuk datanya sudah dinormalisasi backend, jadi komponen ini tidak tahu
 * (dan tidak perlu tahu) skema RateHawk. Branding tetap ArahInn — nama
 * supplier tidak ditampilkan ke customer.
 */
export default function SupplierHotelCard({ hotel, checkIn, checkOut, guests }) {
  const qs = new URLSearchParams({
    ...(checkIn  ? { checkIn }  : {}),
    ...(checkOut ? { checkOut } : {}),
    ...(guests   ? { guests }   : {}),
  }).toString()

  // Sebagian besar hotel mitra tidak punya foto sama sekali (dari 742 hotel
  // yang tersinkron, 424 dikirim tanpa gambar oleh supplier), dan yang punya
  // pun sering hanya satu. Jadi kondisi "tanpa gambar" di sini bukan kasus
  // langka — tampilannya harus terlihat disengaja, bukan seperti gagal muat.
  const [imgError, setImgError] = useState(false)
  const image = hotel.images?.[0]
  const meal  = hotel.meal

  return (
    <Link
      to={`/mitra/hotel/${hotel.providerHotelId}${qs ? `?${qs}` : ''}`}
      className="group flex flex-col sm:flex-row bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden hover:border-brand/40 hover:shadow-lg transition-all"
    >
      <div className="relative w-full h-40 sm:w-44 sm:h-auto shrink-0 bg-muted">
        {image && !imgError ? (
          <img
            src={image} alt={hotel.name} loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-brand/20 to-brand/5">
            <span className="text-3xl sm:text-4xl">🏨</span>
            <span className="text-[10px] font-medium text-brand-700/60">Foto belum tersedia</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-bold text-sm sm:text-base text-slate-800 leading-snug line-clamp-2 group-hover:text-brand transition-colors">
            {hotel.name}
          </h3>
          {hotel.starRating > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {hotel.starRating}
            </span>
          )}
        </div>

        {(hotel.city || hotel.address) && (
          <p className="mt-1 flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 line-clamp-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {hotel.city || hotel.address}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {meal?.hasBreakfast && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
              <Utensils className="w-3 h-3" /> {meal.label}
            </span>
          )}
          {hotel.freeCancellation ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
              <ShieldCheck className="w-3 h-3" /> Bisa dibatalkan gratis
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              <Ban className="w-3 h-3" /> Tidak dapat dibatalkan
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <p className="text-[10px] text-slate-400">
            {hotel.ratesCount > 1 ? `${hotel.ratesCount} pilihan kamar` : 'Mulai dari'}
          </p>
          <div className="text-right">
            <p className="text-base sm:text-lg font-extrabold text-brand leading-none">
              {formatRupiah(hotel.minPrice)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">per kamar / malam</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
