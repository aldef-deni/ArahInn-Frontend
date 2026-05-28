import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, ThumbsUp, ChevronRight } from 'lucide-react'
import { formatRupiah, getImageUrl, hotelDetailUrl } from '@/utils'
import { useTranslation } from 'react-i18next'

const CATEGORY_COLORS = {
  Hotel      : 'bg-blue-100 text-blue-700',
  Apartment  : 'bg-purple-100 text-purple-700',
  Kosan      : 'bg-green-100 text-green-700',
  'Guest House': 'bg-teal-100 text-teal-700',
  Villa      : 'bg-amber-100 text-amber-700',
  Resort     : 'bg-rose-100 text-rose-700',
}

export default function HotelCardRow({ hotel }) {
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)
  const lowestPrice     = hotel.rooms?.[0]?.basePrice
  const discountedPrice = hotel.discountedPrice
  const appliedPromo    = hotel.appliedPromo
  const hasPromo        = discountedPrice != null && lowestPrice && discountedPrice < lowestPrice
  const catColor = CATEGORY_COLORS[hotel.category] || 'bg-slate-100 text-slate-600'

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md active:scale-[0.99] sm:active:scale-100 transition-all overflow-hidden flex flex-col sm:flex-row">

      {/* ── Image ── */}
      <Link to={hotelDetailUrl(hotel)} className="relative w-full sm:w-44 sm:shrink-0 block group">
        {hotel.images?.[0] && !imgError ? (
          <img
            src={getImageUrl(hotel.images[0])}
            alt={hotel.name}
            onError={() => setImgError(true)}
            className="w-full h-44 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-44 sm:h-full sm:min-h-[160px] flex items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5">
            <span className="text-5xl">🏨</span>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[11px] sm:text-xs font-semibold text-center py-1 sm:py-1.5 flex items-center justify-center gap-1">
          {t('hotel.viewMore')} <ChevronRight className="w-3 h-3" />
        </div>
      </Link>

      {/* ── Detail ── */}
      <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-3 sm:gap-4 p-3.5 sm:p-4">

        {/* Middle — info */}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
          <Link to={hotelDetailUrl(hotel)}>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 hover:text-brand transition-colors line-clamp-2 leading-snug">
              {hotel.name}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {hotel.category && (
              <span className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold ${catColor}`}>
                {hotel.category}
              </span>
            )}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px] sm:text-xs">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{hotel.city}{hotel.province ? `, ${hotel.province}` : ''}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-medium rounded-lg">
            <ThumbsUp className="w-3 h-3" />
            {t('hotel.bestPriceClass')}
          </div>

          {hotel.facilities?.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {hotel.facilities.slice(0, 6).map(f => (
                <span key={f} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full capitalize">
                  {f.replace(/_/g, ' ')}
                </span>
              ))}
              {hotel.facilities.length > 6 && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-xs rounded-full">
                  {t('hotel.moreItems', { count: hotel.facilities.length - 6 })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right — price + CTA */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between shrink-0 sm:min-w-[150px] pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-left sm:text-right">
            {lowestPrice ? (
              <>
                {hasPromo ? (
                  <>
                    <p className="text-[11px] sm:text-xs text-slate-400 line-through leading-tight">{formatRupiah(lowestPrice)}</p>
                    <p className="text-lg sm:text-xl font-bold text-orange-600 leading-tight">{formatRupiah(discountedPrice)}</p>
                    {appliedPromo && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">
                        {appliedPromo.discountType === 'percent'
                          ? `${Number(appliedPromo.discountValue)}% OFF`
                          : `Hemat ${formatRupiah(appliedPromo.discountValue)}`}
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-lg sm:text-xl font-bold text-orange-500">{formatRupiah(lowestPrice)}</p>
                )}
                {hotel.rooms?.[0]?.totalUnits && (
                  <p className="text-[10px] sm:text-xs font-semibold text-red-500 mt-0.5">
                    {t('hotel.roomsLeft', { count: hotel.rooms[0].totalUnits })}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{t('hotel.includeTax')}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">{t('hotel.contactUs')}</p>
            )}
          </div>

          <Link
            to={hotelDetailUrl(hotel)}
            className="ml-3 sm:ml-0 sm:mt-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap shadow-sm"
          >
            {t('hotel.book')}
          </Link>
        </div>
      </div>
    </div>
  )
}
