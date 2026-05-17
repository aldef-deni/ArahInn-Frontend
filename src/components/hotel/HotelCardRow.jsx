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
  const lowestPrice = hotel.rooms?.[0]?.basePrice
  const catColor = CATEGORY_COLORS[hotel.category] || 'bg-slate-100 text-slate-600'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex">

      {/* ── Image ── */}
      <Link to={hotelDetailUrl(hotel)} className="relative w-44 shrink-0 block group">
        {hotel.images?.[0] && !imgError ? (
          <img
            src={getImageUrl(hotel.images[0])}
            alt={hotel.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full min-h-[160px] flex items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5">
            <span className="text-5xl">🏨</span>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-1">
          {t('hotel.viewMore')} <ChevronRight className="w-3 h-3" />
        </div>
      </Link>

      {/* ── Detail ── */}
      <div className="flex flex-1 min-w-0 gap-4 p-4">

        {/* Middle — info */}
        <div className="flex-1 min-w-0 space-y-2">
          <Link to={hotelDetailUrl(hotel)}>
            <h3 className="font-bold text-base text-slate-900 hover:text-brand transition-colors line-clamp-2 leading-snug">
              {hotel.name}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {hotel.category && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${catColor}`}>
                {hotel.category}
              </span>
            )}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{hotel.city}{hotel.province ? `, ${hotel.province}` : ''}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
            <ThumbsUp className="w-3 h-3" />
            {t('hotel.bestPriceClass')}
          </div>

          {hotel.facilities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
        <div className="flex flex-col items-end justify-between shrink-0 min-w-[150px]">
          <div className="text-right">
            {lowestPrice ? (
              <>
                <p className="text-xl font-bold text-orange-500">{formatRupiah(lowestPrice)}</p>
                {hotel.rooms?.[0]?.totalUnits && (
                  <p className="text-xs font-semibold text-red-500 mt-0.5">
                    {t('hotel.roomsLeft', { count: hotel.rooms[0].totalUnits })}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">{t('hotel.includeTax')}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">{t('hotel.contactUs')}</p>
            )}
          </div>

          <Link
            to={hotelDetailUrl(hotel)}
            className="mt-3 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            {t('hotel.book')}
          </Link>
        </div>
      </div>
    </div>
  )
}
