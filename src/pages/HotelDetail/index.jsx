import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useAuthStore } from '@/store/authStore'
import { formatRupiah, diffDays, formatDate } from '@/utils'
import {
  MapPin, Star, Wifi, Car, Waves, Coffee, Dumbbell,
  ChevronLeft, Users, Calendar, Check, ArrowRight
} from 'lucide-react'
import { format, addDays } from 'date-fns'

const facilityIcons = { wifi:'📶', parking:'🚗', pool:'🏊', gym:'🏋️', spa:'💆', restaurant:'🍽️', bar:'🍸', breakfast:'☕' }

export default function HotelDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { token } = useAuthStore()

  const today    = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const [dates, setDates] = useState({ checkIn: today, checkOut: tomorrow })
  const [guests, setGuests] = useState(2)
  const [selImg, setSelImg] = useState(0)

  const { data: hotel, isLoading } = useQuery({
    queryKey: ['hotel', id],
    queryFn : () => hotelApi.getById(id).then(r => r.data.data),
  })

  const { data: availData } = useQuery({
    queryKey: ['avail', id, dates],
    queryFn : () => hotelApi.checkAvail(id, dates).then(r => r.data.data),
    enabled : !!dates.checkIn && !!dates.checkOut,
  })

  const nights = diffDays(dates.checkIn, dates.checkOut)

  const handleBook = (roomId) => {
    if (!token) return navigate('/login')
    navigate(`/checkout/${roomId}?hotelId=${id}&checkIn=${dates.checkIn}&checkOut=${dates.checkOut}&guests=${guests}`)
  }

  if (isLoading) return (
    <div className="container py-8 space-y-6">
      <div className="skeleton h-96 rounded-2xl" />
      <div className="skeleton h-8 w-1/2 rounded" />
      <div className="skeleton h-4 w-1/3 rounded" />
    </div>
  )

  if (!hotel) return (
    <div className="container py-20 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="font-semibold text-lg">Hotel tidak ditemukan.</p>
    </div>
  )

  const images = hotel.images?.length ? hotel.images : ['']

  return (
    <div className="container py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kembali ke hasil pencarian
      </button>

      {/* Images gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden">
        <div className="md:col-span-2 h-72 md:h-96 bg-muted overflow-hidden">
          {images[selImg] ? (
            <img src={images[selImg]} alt={hotel.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5 text-8xl">🏨</div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
          {images.slice(1, 3).map((img, i) => (
            <div key={i} className="h-32 md:h-auto bg-muted overflow-hidden rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelImg(i + 1)}>
              {img ? <img src={img} alt="" className="w-full h-full object-cover" /> :
                <div className="w-full h-full bg-muted/50" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Hotel info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl lg:text-3xl font-bold">{hotel.name}</h1>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gold/10 rounded-xl shrink-0">
                {Array(hotel.starRating || 0).fill(0).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-sm">{hotel.address}, {hotel.city}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-lg mb-3">Tentang Hotel</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{hotel.description || 'Tidak ada deskripsi.'}</p>
          </div>

          {/* Facilities */}
          {hotel.facilities?.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-3">Fasilitas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.facilities.map(f => (
                  <div key={f} className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl text-sm">
                    <span className="text-lg">{facilityIcons[f] || '✓'}</span>
                    <span className="font-medium capitalize">{f.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          <div>
            <h2 className="font-semibold text-lg mb-4">Pilihan Kamar</h2>
            <div className="space-y-4">
              {availData?.map(room => (
                <div key={room.id}
                  className={`border rounded-2xl p-5 transition-all ${room.available ? 'hover:shadow-card hover:border-brand/30' : 'opacity-60'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{room.name}</h3>
                        <span className="px-2 py-0.5 bg-muted text-xs rounded-full text-muted-foreground capitalize">{room.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Maks {room.maxGuests} tamu</span>
                      </div>
                      {room.facilities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {room.facilities.slice(0, 5).map(f => (
                            <span key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Check className="w-3 h-3 text-green-500" /> {f.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Mulai dari</p>
                      <p className="price-tag text-xl">{formatRupiah(room.basePrice)}</p>
                      <p className="text-xs text-muted-foreground mb-3">/ malam</p>
                      {nights > 1 && (
                        <p className="text-xs text-muted-foreground mb-2">~{formatRupiah(room.basePrice * nights)} / {nights} malam</p>
                      )}
                      <button onClick={() => handleBook(room.id)}
                        disabled={!room.available}
                        className="px-5 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:bg-muted disabled:text-muted-foreground transition-colors flex items-center gap-1.5">
                        {room.available ? <><ArrowRight className="w-4 h-4" /> Pesan</> : 'Tidak tersedia'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Date picker widget */}
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-5 shadow-card sticky top-24">
            <h3 className="font-semibold text-base mb-4">Cek Ketersediaan</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Check-in</label>
                <input type="date" value={dates.checkIn} min={today}
                  onChange={e => setDates({...dates, checkIn: e.target.value})}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Check-out</label>
                <input type="date" value={dates.checkOut} min={dates.checkIn}
                  onChange={e => setDates({...dates, checkOut: e.target.value})}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Jumlah Tamu</label>
                <select value={guests} onChange={e => setGuests(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-white">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Tamu</option>)}
                </select>
              </div>
            </div>
            {nights > 0 && (
              <div className="mt-4 p-3 bg-brand/5 rounded-xl border border-brand/20">
                <p className="text-sm text-brand-700 font-medium">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {nights} malam · {formatDate(dates.checkIn)} – {formatDate(dates.checkOut)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
