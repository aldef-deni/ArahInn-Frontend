import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Wifi, Car, Waves } from 'lucide-react'
import { formatRupiah, getImageUrl, hotelDetailUrl } from '@/utils'
import { useTranslation } from 'react-i18next'

const facilityIcons = { wifi: Wifi, parking: Car, pool: Waves }

export default function HotelCard({ hotel }) {
  const { t } = useTranslation()
  const lowestPrice = hotel.rooms?.[0]?.basePrice
  // Harga setelah promo platform yang di-follow owner (jika ada)
  const discountedPrice = hotel.discountedPrice
  const appliedPromo    = hotel.appliedPromo
  const hasPromo        = discountedPrice != null && lowestPrice && discountedPrice < lowestPrice
  const [imgError, setImgError] = useState(false)

  return (
    <Link to={hotelDetailUrl(hotel)}
      className="group bg-white rounded-2xl overflow-hidden border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {hotel.images?.[0] && !imgError ? (
          <img src={getImageUrl(hotel.images[0])} alt={hotel.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5">
            <span className="text-5xl">🏨</span>
          </div>
        )}
        {/* Star badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold shadow-sm">
          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
          <span>{hotel.starRating || '–'}</span>
        </div>
        {/* City badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium shadow-sm">
          {hotel.city}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-brand-700 transition-colors">
          {hotel.name}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{hotel.address}</span>
        </div>

        {/* Facilities */}
        {hotel.facilities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hotel.facilities.slice(0, 4).map(f => (
              <span key={f} className="px-2 py-0.5 bg-muted text-xs rounded-full text-muted-foreground">
                {t(`facilities.${f}`, { defaultValue: f })}
              </span>
            ))}
            {hotel.facilities.length > 4 && (
              <span className="px-2 py-0.5 bg-muted text-xs rounded-full text-muted-foreground">
                +{hotel.facilities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between mt-4 pt-3 border-t">
          <div>
            {lowestPrice ? (
              <>
                <p className="text-xs text-muted-foreground">{t('hotel.startFrom')}</p>
                {hasPromo ? (
                  <>
                    <p className="text-xs text-slate-400 line-through leading-tight">{formatRupiah(lowestPrice)}</p>
                    <p className="price-tag text-lg text-orange-600">{formatRupiah(discountedPrice)}</p>
                    {appliedPromo && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">
                        {appliedPromo.discountType === 'percent'
                          ? `${Number(appliedPromo.discountValue)}% OFF`
                          : `Hemat ${formatRupiah(appliedPromo.discountValue)}`}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{t('hotel.perNight')}</p>
                  </>
                ) : (
                  <>
                    <p className="price-tag text-lg">{formatRupiah(lowestPrice)}</p>
                    <p className="text-xs text-muted-foreground">{t('hotel.perNight')}</p>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('hotel.contactUs')}</p>
            )}
          </div>
          <span className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg group-hover:bg-brand-700 transition-colors">
            {t('hotel.viewDetail')}
          </span>
        </div>
      </div>
    </Link>
  )
}
