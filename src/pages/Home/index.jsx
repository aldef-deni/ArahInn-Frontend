import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { promoApi } from '@/services/index'
import { formatRupiah, formatDateShort } from '@/utils'
import {
  Search, MapPin, Calendar, Users, ArrowRight,
  Zap, Shield, Headphones, Award, TrendingUp, Tag, Copy, Check
} from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'
import HotelCard from '@/components/hotel/HotelCard'

const PROMO_STYLES = {
  flash_sale : { grad: 'from-orange-500 to-red-500',   sub: 'text-orange-100',  btnText: 'text-orange-600', icon: Zap  },
  voucher    : { grad: 'from-blue-500 to-indigo-600',  sub: 'text-blue-100',    btnText: 'text-blue-600',   icon: Tag  },
  loyalty    : { grad: 'from-purple-500 to-violet-600',sub: 'text-purple-100',  btnText: 'text-purple-600', icon: Award},
}

function PromoCard({ promo, onShop, t }) {
  const [copied, setCopied] = useState(false)
  const style = PROMO_STYLES[promo.type] || PROMO_STYLES.voucher
  const Icon  = style.icon

  const copyCode = () => {
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const discountLabel = promo.discountType === 'percent'
    ? `${promo.discountValue}% OFF`
    : `${formatRupiah(promo.discountValue)} OFF`

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${style.grad} shadow-lg flex items-stretch`}>
      {/* Left icon strip */}
      <div className="flex items-center justify-center px-6 bg-black/10 shrink-0">
        <Icon className="w-8 h-8 text-white" />
      </div>

      {/* dashed divider */}
      <div className="w-px border-l-2 border-dashed border-white/25 my-4 shrink-0" />

      {/* Center info */}
      <div className="flex-1 px-5 py-4 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-bold text-base leading-tight">{promo.name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium capitalize shrink-0`}>
            {promo.type.replace('_', ' ')}
          </span>
        </div>

        <div className={`flex flex-wrap gap-x-4 gap-y-0.5 text-xs ${style.sub} mb-2`}>
          {promo.minPurchase > 0 && <span>{t('home.promoMinPurchase')} {formatRupiah(promo.minPurchase)}</span>}
          {promo.endDate      &&    <span>{t('home.promoUntil')} {formatDateShort(promo.endDate)}</span>}
          {promo.quota        &&    <span>{t('home.promoQuota')} {Math.max(0, promo.quota - (promo.usedCount || 0))} / {promo.quota}</span>}
        </div>

        {promo.code && (
          <button onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
            <span className="font-mono font-bold text-sm tracking-widest text-white">{promo.code}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white/70" />}
            <span className={`text-xs ${style.sub}`}>{copied ? t('home.promoCopied') : t('home.promoCopyCode')}</span>
          </button>
        )}

        {promo.quota > 0 && (
          <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-2.5 max-w-xs">
            <div className="h-full bg-white/60 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((promo.usedCount || 0) / promo.quota) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Right: discount + CTA */}
      <div className="flex flex-col items-center justify-center gap-2 px-6 bg-black/10 shrink-0">
        <span className="text-white font-black text-2xl whitespace-nowrap">{discountLabel}</span>
        <button onClick={onShop}
          className={`px-5 py-1.5 rounded-xl bg-white font-semibold text-xs hover:opacity-90 transition-opacity ${style.btnText}`}>
          {t('home.promoShop')}
        </button>
      </div>
    </div>
  )
}

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

  const { data: activePromos } = useQuery({
    queryKey: ['active-promos'],
    queryFn : () => promoApi.getActive().then(r => r.data?.data),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(form)
    navigate(`/search?${params}`)
  }

  const popularCities = ['Jakarta','Bali','Yogyakarta','Surabaya','Bandung','Lombok']

  const features = [
    { icon: Zap,        title: t('home.instantBooking'),  desc: t('home.instantBookingDesc') },
    { icon: Shield,     title: t('home.securePay'),       desc: t('home.securePayDesc') },
    { icon: Headphones, title: t('home.cs247'),           desc: t('home.cs247Desc') },
    { icon: Award,      title: t('home.bestPrice'),       desc: t('home.bestPriceDesc') },
  ]

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-14 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
              <TrendingUp className="w-4 h-4" /> {t('home.hotelsAvailable')}
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-white leading-tight mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-blue-200 text-lg lg:text-xl mb-10 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Search box — glass / Traveloka style */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
            <form onSubmit={handleSearch}
              className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/15">

              {/* Destination */}
              <div className="flex-[2] flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors cursor-text">
                <MapPin className="w-5 h-5 text-white/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{t('search.destination')}</p>
                  <input
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    placeholder="Jakarta, Bali..."
                    className="w-full bg-transparent text-white placeholder:text-white/35 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Check-in */}
              <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors">
                <Calendar className="w-5 h-5 text-white/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{t('search.checkin')}</p>
                  <div className="relative">
                    <span className="block text-white text-sm font-medium pointer-events-none">
                      {form.checkIn ? format(parseISO(form.checkIn), 'dd/MM/yyyy') : ''}
                    </span>
                    <input type="date" value={form.checkIn} min={today}
                      onChange={e => setForm({...form, checkIn: e.target.value})}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Check-out */}
              <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors">
                <Calendar className="w-5 h-5 text-white/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{t('search.checkout')}</p>
                  <div className="relative">
                    <span className="block text-white text-sm font-medium pointer-events-none">
                      {form.checkOut ? format(parseISO(form.checkOut), 'dd/MM/yyyy') : ''}
                    </span>
                    <input type="date" value={form.checkOut} min={form.checkIn}
                      onChange={e => setForm({...form, checkOut: e.target.value})}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Guests */}
              <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors">
                <Users className="w-5 h-5 text-white/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{t('search.guests')}</p>
                  <select value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}
                    className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark] cursor-pointer">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {t('search.guestUnit')}</option>)}
                  </select>
                </div>
              </div>

              {/* Search button */}
              <div className="flex items-center px-4 py-4 lg:pl-3">
                <button type="submit"
                  className="w-full lg:w-auto px-7 py-3.5 bg-brand text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap text-sm">
                  <Search className="w-4 h-4" />
                  {t('hero.cta')}
                </button>
              </div>
            </form>

            {/* Popular cities */}
            <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-white/15 items-center">
              <span className="text-xs text-white/45 font-medium">{t('home.popular')}:</span>
              {popularCities.map(city => (
                <button key={city} onClick={() => navigate(`/search?city=${city}&checkIn=${today}&checkOut=${tomorrow}&guests=2`)}
                  className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white/65 hover:text-white transition-colors font-medium border border-white/15">
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Promos & Campaigns ───────────────────────────── */}
      {activePromos?.length > 0 && (
        <section className="container py-10">
          <div className="flex flex-col gap-3">
            {activePromos.map(promo => (
              <PromoCard key={promo.id} promo={promo} t={t} onShop={() => navigate('/search')} />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Hotels ───────────────────────────────── */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">{t('home.featuredHotels')}</h2>
            <p className="text-muted-foreground mt-1">{t('home.featuredSubtitle')}</p>
          </div>
          <button onClick={() => navigate('/search')}
            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-700 transition-colors">
            {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
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
            <h2 className="font-display text-2xl lg:text-3xl font-bold">{t('home.whyTitle')}</h2>
            <p className="text-muted-foreground mt-2">{t('home.whySubtitle')}</p>
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
