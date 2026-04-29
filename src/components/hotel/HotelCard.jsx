import { Link } from 'react-router-dom'
import { Star, MapPin, Wifi, Car, Waves } from 'lucide-react'
import { formatRupiah } from '@/utils'

const facilityIcons = { wifi: Wifi, parking: Car, pool: Waves }
const facilityLabels = { wifi: 'WiFi', parking: 'Parkir', pool: 'Kolam', gym: 'Gym', spa: 'Spa', restaurant: 'Resto' }

export default function HotelCard({ hotel }) {
  const lowestPrice = hotel.rooms?.[0]?.basePrice

  return (
    <Link to={`/hotel/${hotel.id}`}
      className="group bg-white rounded-2xl overflow-hidden border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {hotel.images?.[0] ? (
          <img src={hotel.images[0]} alt={hotel.name}
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
                {facilityLabels[f] || f}
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
                <p className="text-xs text-muted-foreground">Mulai dari</p>
                <p className="price-tag text-lg">{formatRupiah(lowestPrice)}</p>
                <p className="text-xs text-muted-foreground">/ malam</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Hubungi kami</p>
            )}
          </div>
          <span className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg group-hover:bg-brand-700 transition-colors">
            Lihat →
          </span>
        </div>
      </div>
    </Link>
  )
}
