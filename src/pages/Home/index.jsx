import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { promoApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import {
  Search, MapPin, Calendar, Users, Star, ArrowRight,
  Zap, Shield, Headphones, Award, TrendingUp
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import HotelCard from '@/components/hotel/HotelCard'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const today    = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    city: '', checkIn: today, checkOut: tomorrow, guests: 2
  })

  const { data: featured } = useQuery({
    queryKey: ['hotels-featured'],
    queryFn : () => hotelApi.search({ page: 1, limit: 6 }).then(r => r.data),
  })

  const { data: flashSales } = useQuery({
    queryKey: ['flash-sales'],
    queryFn : () => promoApi.flashSales().then(r => r.data?.data),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(form)
    navigate(`/search?${params}`)
  }

  const popularCities = ['Jakarta','Bali','Yogyakarta','Surabaya','Bandung','Lombok']

  const features = [
    { icon: Zap,        title: 'Booking Instan',     desc: 'Konfirmasi langsung dalam hitungan detik' },
    { icon: Shield,     title: 'Bayar Aman',          desc: 'Enkripsi 256-bit untuk setiap transaksi' },
    { icon: Headphones, title: 'CS 24/7',             desc: 'Tim kami siap membantu kapan saja' },
    { icon: Award,      title: 'Harga Terjamin',      desc: 'Kami cocokkan harga terbaik untuk Anda' },
  ]

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
              <TrendingUp className="w-4 h-4" /> 500+ hotel tersedia hari ini
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-white leading-tight mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-blue-200 text-lg lg:text-xl mb-10 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Search box */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 lg:p-6 max-w-4xl">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3 lg:gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />{t('search.destination')}
                </label>
                <input
                  value={form.city}
                  onChange={e => setForm({...form, city: e.target.value})}
                  placeholder="Jakarta, Bali..."
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />{t('search.checkin')}
                </label>
                <input type="date" value={form.checkIn} min={today}
                  onChange={e => setForm({...form, checkIn: e.target.value})}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />{t('search.checkout')}
                </label>
                <input type="date" value={form.checkOut} min={form.checkIn}
                  onChange={e => setForm({...form, checkOut: e.target.value})}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <Users className="w-3.5 h-3.5 inline mr-1" />{t('search.guests')}
                  </label>
                  <select value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}
                    className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-white">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Tamu</option>)}
                  </select>
                </div>
                <button type="submit"
                  className="px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-brand/30 shadow-md flex items-center gap-2 whitespace-nowrap">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('hero.cta')}</span>
                </button>
              </div>
            </form>

            {/* Popular cities */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground font-medium self-center">Populer:</span>
              {popularCities.map(city => (
                <button key={city} onClick={() => navigate(`/search?city=${city}&checkIn=${today}&checkOut=${tomorrow}&guests=2`)}
                  className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-brand/10 hover:text-brand-700 transition-colors font-medium">
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Flash Sale ────────────────────────────────────── */}
      {flashSales?.length > 0 && (
        <section className="container py-12">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">⚡</div>
              <div>
                <p className="font-semibold text-lg">{flashSales[0].name}</p>
                <p className="text-orange-100 text-sm">Hingga {flashSales[0].discountValue}% OFF · Berlaku terbatas!</p>
              </div>
            </div>
            <button onClick={() => navigate('/search')}
              className="shrink-0 px-6 py-2.5 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors">
              Klaim Sekarang →
            </button>
          </div>
        </section>
      )}

      {/* ── Featured Hotels ───────────────────────────────── */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Hotel Pilihan</h2>
            <p className="text-muted-foreground mt-1">Properti terpopuler minggu ini</p>
          </div>
          <button onClick={() => navigate('/search')}
            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-700 transition-colors">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured?.data?.map(hotel => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
          {!featured && Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border">
              <div className="skeleton h-48" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-6 w-1/3 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="bg-muted/50 border-y">
        <div className="container py-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl lg:text-3xl font-bold">Kenapa Pilih OTASystem?</h2>
            <p className="text-muted-foreground mt-2">Kami mengutamakan kenyamanan dan kepercayaan Anda</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition-colors">
                  <Icon className="w-6 h-6 text-brand-700" />
                </div>
                <h3 className="font-semibold text-base mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
