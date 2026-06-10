import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { promoApi, campaignApi } from '@/services/index'
import { propertyApi } from '@/services/propertyApi'
import { formatRupiah, formatDateShort, getImageUrl } from '@/utils'
import {
  Search, MapPin, Calendar, Users, ArrowRight,
  Zap, Shield, Headphones, Award, TrendingUp, Tag, Copy, Check, Clock, Building2,
  ChevronDown, Wallet, Hotel, Smartphone, Lightbulb, Receipt, Sofa, BadgePercent,
  Plane, Ship, TrainFront, Megaphone, Mountain, Dumbbell,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, addDays, parseISO } from 'date-fns'
import HotelCard from '@/components/hotel/HotelCard'
import InteriorPenawaran from '@/components/InteriorPenawaran'
import PromoFlyerCarousel from '@/components/PromoFlyerCarousel'
import CampaignFlyerCarousel from '@/components/CampaignFlyerCarousel'
import CampaignBanner from '@/components/CampaignBanner'
import SEO from '@/components/SEO'

/**
 * ServiceCategoryTabs — horizontal scrollable kategori utama di atas hero.
 * Pattern umum di booking site: tap kategori → ke landing page kategori itu.
 */
function ServiceCategoryTabs() {
  const { t } = useTranslation()
  const items = [
    { label: t('services.akomodasi'),     Icon: Hotel,        to: '/search',                            accent: '#ffffff' },
    { label: t('services.tiketPesawat'),  Icon: Plane,        to: '/tiket/pesawat',                     accent: '#7dd3fc' },
    { label: t('services.tiketPelni'),    Icon: Ship,         to: '/tiket/pelni',                       accent: '#67e8f9' },
    { label: t('services.tiketKereta'),   Icon: TrainFront,   to: '/tiket/kereta',                      accent: '#fdba74' },
    { label: t('services.pulsaData'),     Icon: Smartphone,   to: '/topup-tagihan/pulsa-data',          accent: '#60a5fa' },
    { label: t('services.listrikPln'),    Icon: Lightbulb,    to: '/topup-tagihan/pln',                 accent: '#fbbf24' },
    { label: t('services.bayarTagihan'),  Icon: Receipt,      to: '/topup-tagihan/tagihan',             accent: '#34d399' },
    { label: t('services.eWallet'),       Icon: Wallet,       to: '/topup-tagihan/ewallet',             accent: '#a78bfa' },
    { label: t('services.properti'),      Icon: Building2,    to: '/properti',                          accent: '#f87171' },
    { label: t('services.interior'),      Icon: Sofa,         to: '/interior',                          accent: '#fb923c' },
    { label: t('services.wisata'),        Icon: Mountain,     to: '/coming-soon?feature=wisata',        accent: '#86efac' },
    { label: t('services.sports'),        Icon: Dumbbell,     to: '/sports',                            accent: '#fca5a5' },
  ]
  return (
    <div className="overflow-x-auto scrollbar-hide lg:overflow-visible">
      <div className="flex lg:flex-wrap items-start justify-start lg:justify-center gap-1 sm:gap-2 lg:gap-x-3 lg:gap-y-4 min-w-max lg:min-w-0">
        {items.map(({ label, Icon, to, accent }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col items-center gap-2 w-[72px] sm:w-[84px] lg:w-[92px] shrink-0 py-1.5 rounded-2xl hover:bg-white/5 transition-colors active:scale-95"
          >
            <span className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-white/12 group-hover:bg-white/22 border border-white/15 group-hover:border-white/30 backdrop-blur-md shadow-sm flex items-center justify-center group-hover:-translate-y-0.5 group-hover:shadow-md transition-all">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" style={{ color: accent }} />
            </span>
            <span className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-white/95 text-center leading-tight line-clamp-2">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const PROMO_STYLES = {
  flash_sale : { grad: 'from-orange-500 to-red-500',    sub: 'text-orange-100', icon: Zap,   iconBg: 'bg-white/20' },
  voucher    : { grad: 'from-blue-500 to-indigo-600',   sub: 'text-blue-100',   icon: Tag,   iconBg: 'bg-white/20' },
  loyalty    : { grad: 'from-purple-500 to-violet-600', sub: 'text-purple-100', icon: Award, iconBg: 'bg-white/20' },
}

function useCountdown(endDate) {
  const [timeLeft, setTimeLeft] = useState(null)
  useEffect(() => {
    if (!endDate) return
    const target = new Date(endDate)
    const tick = () => {
      const diff = target - new Date()
      if (diff <= 0) { setTimeLeft(null); return }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endDate])
  return timeLeft
}

function CountdownBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg w-10 h-10 flex items-center justify-center">
        <span className="text-white font-black text-base leading-none">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-white/60 text-[10px] mt-1 font-medium">{label}</span>
    </div>
  )
}

function PromoCard({ promo, onShop, t }) {
  const [copied, setCopied] = useState(false)
  const style    = PROMO_STYLES[promo.type] || PROMO_STYLES.voucher
  const Icon     = style.icon
  const countdown = useCountdown(promo.endDate)
  const usedPct  = promo.quota > 0 ? Math.min(100, ((promo.usedCount || 0) / promo.quota) * 100) : 0

  const copyCode = () => {
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const discountLabel = promo.discountType === 'percent'
    ? `${promo.discountValue}% OFF`
    : `${formatRupiah(promo.discountValue)} OFF`

  // Promo "akan datang" (start_date di masa depan) — tetap ditampilkan sebagai info
  const _today = new Date(); _today.setHours(0, 0, 0, 0)
  const _start = promo.startDate ? new Date(promo.startDate) : null
  if (_start) _start.setHours(0, 0, 0, 0)
  const isUpcoming = !!(_start && _start > _today)

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${style.grad} shadow-md hover:shadow-lg transition-shadow`}>
      {isUpcoming && (
        <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full text-[10px] font-bold shadow-sm">
          <Clock className="w-3 h-3" /> Segera Hadir
        </span>
      )}
      <div className="flex items-center gap-0 p-5 lg:p-6">

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0 mr-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Dashed divider */}
        <div className="border-l-2 border-dashed border-white/25 self-stretch mx-4 shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-base leading-snug">{promo.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium capitalize shrink-0">
              {promo.type.replace('_', ' ')}
            </span>
          </div>

          <div className={`flex flex-wrap gap-x-4 gap-y-0.5 text-xs ${style.sub} mb-2.5`}>
            {promo.minPurchase > 0 && <span>{t('home.promoMinPurchase')} {formatRupiah(promo.minPurchase)}</span>}
            {isUpcoming && promo.startDate && <span className="font-semibold text-white">Mulai {formatDateShort(promo.startDate)}</span>}
            {promo.endDate         && <span>{t('home.promoUntil')} {formatDateShort(promo.endDate)}</span>}
            {promo.quota           && <span>{t('home.promoQuota')} {Math.max(0, promo.quota - (promo.usedCount || 0))} / {promo.quota}</span>}
          </div>

          {promo.code && (
            <button onClick={copyCode}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
              <span className="font-mono font-bold text-sm tracking-widest text-white">{promo.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
              <span className={`text-xs ${style.sub}`}>{copied ? t('home.promoCopied') : t('home.promoCopyCode')}</span>
            </button>
          )}

          {promo.quota > 0 && (
            <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-2.5 max-w-xs">
              <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${usedPct}%` }} />
            </div>
          )}
        </div>

        {/* Right: countdown + discount + CTA */}
        <div className="flex flex-col items-center gap-3 pl-6 border-l border-white/20 shrink-0 ml-4">
          {countdown && (
            <div className="flex items-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/60 mb-2.5 shrink-0" />
              {countdown.d > 0 && <CountdownBox value={countdown.d} label={t('countdown.days')} />}
              <CountdownBox value={countdown.h} label={t('countdown.hours')} />
              <CountdownBox value={countdown.m} label={t('countdown.minutes')} />
              <CountdownBox value={countdown.s} label={t('countdown.seconds')} />
            </div>
          )}
          <span className="text-white font-black text-2xl whitespace-nowrap leading-none">{discountLabel}</span>
          <button onClick={onShop}
            className="px-6 py-2 rounded-xl bg-white font-semibold text-xs hover:opacity-90 transition-opacity text-gray-700 whitespace-nowrap">
            {t('home.promoShop')}
          </button>
        </div>
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
    q: '', category: '', checkIn: today, checkOut: tomorrow, guests: 2
  })

  const { data: featured } = useQuery({
    queryKey: ['hotels-featured'],
    queryFn : () => hotelApi.search({ page: 1, limit: 6 }).then(r => r.data),
  })

  const { data: featuredProperties } = useQuery({
    queryKey: ['home-properties'],
    queryFn : () => propertyApi.search({ limit: 4, status: 'approved' }).then(r => r.data),
  })

  const [propForm, setPropForm] = useState({ listingType: '', location: '', category: '', priceRange: '' })
  const [propImgErr, setPropImgErr] = useState({})
  const [activePropCat, setActivePropCat] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (form.q)        params.set('q', form.q)
    if (form.category) params.set('category', form.category)
    params.set('checkIn',  form.checkIn)
    params.set('checkOut', form.checkOut)
    params.set('guests',   form.guests)
    navigate(`/search?${params}`)
  }

  const handlePropertySearch = () => {
    const params = new URLSearchParams()
    if (propForm.location)  params.set('city', propForm.location)
    if (propForm.category)  params.set('category', propForm.category)
    if (propForm.priceRange) params.set('maxPrice', propForm.priceRange)
    params.set('listingType', propForm.listingType)
    navigate(`/properti?${params}`)
  }

  const PROP_CATEGORIES = ['Hotel', 'Apartemen', 'Kosan', 'Guest House', 'Villa', 'Resort']

  const popularCities = ['Jakarta','Bali','Yogyakarta','Surabaya','Bandung','Lombok']

  const ACCOMMODATION_TYPES = [
    { value: '',             label: t('search.allTypes') },
    { value: 'Hotel',        label: t('search.hotelTypes.Hotel') },
    { value: 'Villa',        label: t('search.hotelTypes.Villa') },
    { value: 'Kosan',        label: t('search.hotelTypes.Kosan') },
    { value: 'Apartment',    label: t('search.hotelTypes.Apartment') },
    { value: 'Guest House',  label: t('search.hotelTypes.Guest House') },
    { value: 'Resort',       label: t('search.hotelTypes.Resort') },
    { value: 'Glamping',     label: t('search.hotelTypes.Glamping') },
  ]

  const features = [
    { icon: Zap,        title: t('home.instantBooking'),  desc: t('home.instantBookingDesc') },
    { icon: Shield,     title: t('home.securePay'),       desc: t('home.securePayDesc') },
    { icon: Headphones, title: t('home.cs247'),           desc: t('home.cs247Desc') },
    { icon: Award,      title: t('home.bestPrice'),       desc: t('home.bestPriceDesc') },
  ]

  return (
    <div>
      <SEO url="/" />
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-6 sm:py-8 lg:py-12 flex flex-col gap-6 sm:gap-8 lg:gap-12">

          {/* Kategori akomodasi */}
          <div className="text-center">
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
              {t('hero.categoryTitle')}
            </h2>
            <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
              {[
                { labelKey: 'hero.catHotel',      img: '/hotel-kategori.png', cats: 'Hotel,Apartment'          },
                { labelKey: 'hero.catGuestHouse',  img: '/kosan-kategori.png', cats: 'Guest House,Kosan'        },
                { labelKey: 'hero.catVilla',       img: '/villa-kategori.png', cats: 'Villa,Resort,Glamping'    },
              ].map(({ labelKey, img, cats }) => (
                <button
                  key={cats}
                  onClick={() => navigate(`/search?categories=${encodeURIComponent(cats)}&checkIn=${today}&checkOut=${tomorrow}&guests=2`)}
                  className="group flex flex-col items-center justify-center gap-2 sm:gap-3 w-full h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-xl sm:rounded-2xl bg-white/15 hover:bg-orange-500 border border-white/25 hover:border-orange-400 backdrop-blur-sm active:scale-95 transition-all duration-200"
                >
                  <img src={img} alt={cats} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                  <span className="text-white text-[11px] sm:text-xs font-semibold leading-snug text-center whitespace-pre-line px-1">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search box — glass / Traveloka style */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
            <form onSubmit={handleSearch}
              className="flex flex-col lg:flex-row lg:items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/15">

              {/* Destination */}
              <div className="lg:flex-[2] flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/5 transition-colors cursor-text">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5 sm:mb-1">{t('hero.cityHotelLabel')}</p>
                  <input
                    value={form.q}
                    onChange={e => setForm({...form, q: e.target.value})}
                    placeholder={t('hero.cityHotelPlaceholder')}
                    className="w-full bg-transparent text-white placeholder:text-white/35 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile-only grid wrapper for fields below destination */}
              <div className="grid grid-cols-2 lg:contents divide-x divide-white/15 lg:divide-x-0">

                {/* Accommodation Type */}
                <div className="lg:flex-[1.2] flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/5 transition-colors">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5 sm:mb-1">{t('hero.typeLabel')}</p>
                    <select
                      value={form.category}
                      onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full bg-transparent text-sm font-medium focus:outline-none [color-scheme:dark] cursor-pointer text-white"
                    >
                      {ACCOMMODATION_TYPES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Check-in */}
                <div className="lg:flex-1 flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/5 transition-colors border-t lg:border-t-0 border-white/15">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5 sm:mb-1">{t('search.checkin')}</p>
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
                <div className="lg:flex-1 flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/5 transition-colors border-t lg:border-t-0 border-white/15">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5 sm:mb-1">{t('search.checkout')}</p>
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
                <div className="lg:flex-1 flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/5 transition-colors col-span-2 lg:col-span-1 border-t lg:border-t-0 border-white/15">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5 sm:mb-1">{t('search.guests')}</p>
                    <select value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}
                      className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark] cursor-pointer">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {t('search.guestUnit')}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Search button — inline on lg+, full-width on mobile */}
              <div className="flex items-center px-3 sm:px-4 py-3 lg:py-2.5 lg:pl-3">
                <button type="submit"
                  className="w-full lg:w-auto px-6 lg:px-7 py-3 lg:py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap text-sm">
                  <Search className="w-4 h-4" />
                  {t('hero.cta')}
                </button>
              </div>
            </form>

            {/* Popular cities */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-t border-white/15 items-center">
              <span className="text-[11px] sm:text-xs text-white/45 font-medium">{t('home.popular')}:</span>
              {popularCities.map(city => (
                <button key={city} onClick={() => navigate(`/search?city=${city}&checkIn=${today}&checkOut=${tomorrow}&guests=2`)}
                  className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/65 hover:text-white transition-all font-medium border border-white/15">
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* ── Horizontal Service Category Tabs (PPOB & lainnya) ── */}
          <ServiceCategoryTabs />
        </div>
      </section>

      {/* ── Campaign Banner Landscape (di bawah banner utama) ── */}
      <CampaignBanner />

      {/* ── Promo Flyer Carousel (dari ArahInn) ──────────── */}
      <PromoFlyerCarousel />

      {/* ── Campaign Carousel (dari ArahInn) ──────────────── */}
      <CampaignFlyerCarousel />

      {/* ── Featured Hotels ───────────────────────────────── */}
      <section className="container py-8 sm:py-10 lg:py-12">
        <div className="flex items-end justify-between gap-3 mb-5 sm:mb-7 lg:mb-8">
          <div className="min-w-0">
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">{t('home.featuredHotels')}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-none">{t('home.featuredSubtitle')}</p>
          </div>
          <button onClick={() => navigate('/search')}
            className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-brand hover:text-brand-700 transition-colors shrink-0">
            <span className="hidden sm:inline">{t('home.viewAll')}</span>
            <span className="sm:hidden">{t('home.viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
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

      {/* ── Property Section ─────────────────────────────── */}
      <section className="bg-blue-50 py-10 sm:py-12 lg:py-14">
        <div className="container">

          {/* Search card */}
          <div className="bg-gradient-to-r from-[#1a56db] to-[#2563eb] rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 shadow-xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-3 sm:mb-4">
              <button
                onClick={() => setPropForm(p => ({ ...p, listingType: 'sell' }))}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  propForm.listingType === 'sell'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                }`}>
                {t('property.sellTab')}
              </button>
              <button
                onClick={() => setPropForm(p => ({ ...p, listingType: 'rent' }))}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  propForm.listingType === 'rent'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                }`}>
                {t('property.buyTab')}
              </button>
            </div>

            {/* Search bar */}
            <div className="bg-white rounded-xl flex flex-col lg:flex-row items-stretch overflow-hidden shadow-sm">
              {/* Location */}
              <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 flex-[2] border-b lg:border-b-0 lg:border-r border-slate-100">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">{t('property.locationLabel')}</p>
                  <input
                    value={propForm.location}
                    onChange={e => setPropForm(p => ({ ...p, location: e.target.value }))}
                    placeholder={t('property.locationPlaceholder')}
                    className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 flex-[2] border-b lg:border-b-0 lg:border-r border-slate-100">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">{t('property.categoryLabel')}</p>
                  <select
                    value={propForm.category}
                    onChange={e => setPropForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full text-sm text-slate-700 focus:outline-none bg-transparent cursor-pointer">
                    <option value="">{t('property.allCategories')}</option>
                    {PROP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 flex-[2] border-b lg:border-b-0 lg:border-r border-slate-100">
                <Wallet className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">{t('property.priceRangeLabel')}</p>
                  <input
                    value={propForm.priceRange}
                    onChange={e => setPropForm(p => ({ ...p, priceRange: e.target.value }))}
                    placeholder={t('property.priceRangePlaceholder')}
                    className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={handlePropertySearch}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white transition-all shrink-0 text-sm font-bold">
                <Search className="w-5 h-5" />
                <span className="lg:hidden">{t('property.searchCta')}</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-4 sm:mb-5 leading-tight">
            {t('property.sectionTitle')}
          </h2>

          {/* Category pills — horizontal scroll on mobile */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-thin mb-5 sm:mb-7">
            <div className="flex sm:flex-wrap gap-2 min-w-max sm:min-w-0">
              {[
                { label: t('property.pillHotel'),      cats: ['Hotel','Apartment'] },
                { label: t('property.pillGuestHouse'), cats: ['Guest House','Kosan'] },
                { label: t('property.pillVilla'),      cats: ['Villa','Resort','Glamping'] },
                { label: t('property.pillFamily'),     cats: [] },
              ].map((g) => (
                <button key={g.label}
                  onClick={() => {
                    setActivePropCat(g.label)
                    navigate(`/properti?categories=${encodeURIComponent(g.cats.join(','))}`)
                  }}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all border active:scale-95 whitespace-nowrap ${
                    activePropCat === g.label
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-400 hover:text-orange-500'
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Property grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {featuredProperties?.data?.map(listing => {
              const img = listing.images?.[0]
              return (
                <div key={listing.id}
                  onClick={() => navigate(`/properti/${listing.id}`)}
                  className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer group">
                  <div className="relative h-36 sm:h-44 bg-slate-100 overflow-hidden">
                    {img && !propImgErr[img] ? (
                      <img src={getImageUrl(img)} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setPropImgErr(p => ({ ...p, [img]: true }))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <Building2 className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {listing.category}
                    </span>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 mb-1">{listing.title}</h3>
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2">
                      <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">{listing.city}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500">{t('property.startsFrom')}: <span className="text-orange-500 font-bold">{formatRupiah(listing.price)}</span></p>
                  </div>
                </div>
              )
            })}
            {!featuredProperties && Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100">
                <div className="skeleton h-36 sm:h-44" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-4 w-1/3 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Furnish & Design Interior ─────────────────────── */}
      <section className="bg-orange-50 py-10 sm:py-12 lg:py-14">
        <div className="container">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-orange-100 text-orange-700 text-[11px] sm:text-xs font-semibold rounded-full mb-2 sm:mb-3">
            {t('interiorHome.premiumBadge')}
          </div>
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-4 sm:mb-5 leading-tight">
            {t('interiorHome.sectionTitle')}
          </h2>
          <InteriorPenawaran noCard />
        </div>
      </section>

      {/* ── App Banner ───────────────────────────────────── */}
      <section className="container py-6 sm:py-8">
        <a href="/register" className="block rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl active:scale-[0.99] transition-all max-w-full lg:max-w-[80%] mx-auto">
          <img
            src="/app-banner.png"
            alt="New User Special Treats – ArahInn App"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </a>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="bg-muted/50 border-y">
        <div className="container py-10 sm:py-12 lg:py-16">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{t('home.whyTitle')}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">{t('home.whySubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-card hover:shadow-card-hover transition-shadow group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-brand/15 transition-colors">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-700" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 leading-snug">{title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
