import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { promoApi } from '@/services/index'
import { propertyApi } from '@/services/propertyApi'
import { formatRupiah, formatDateShort, getImageUrl } from '@/utils'
import {
  Search, MapPin, Calendar, Users, ArrowRight,
  Zap, Shield, Headphones, Award, TrendingUp, Tag, Copy, Check, Clock, Building2,
  ChevronDown, Wallet,
} from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'
import HotelCard from '@/components/hotel/HotelCard'
import InteriorPenawaran from '@/components/InteriorPenawaran'
import PromoFlyerCarousel from '@/components/PromoFlyerCarousel'

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

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${style.grad} shadow-md hover:shadow-lg transition-shadow`}>
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

  const { data: activePromos } = useQuery({
    queryKey: ['active-promos'],
    queryFn : () => promoApi.getActive().then(r => r.data?.data),
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
    { value: '',             label: 'Semua Tipe' },
    { value: 'Hotel',        label: 'Hotel' },
    { value: 'Villa',        label: 'Villa' },
    { value: 'Kosan',        label: 'Kosan' },
    { value: 'Apartment',    label: 'Apartemen' },
    { value: 'Guest House',  label: 'Guest House' },
    { value: 'Resort',       label: 'Resort' },
    { value: 'Glamping',     label: 'Glamping' },
  ]

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
        <div className="container relative py-12 lg:py-16 flex flex-col gap-12 lg:gap-16">

          {/* Kategori */}
          <div className="text-center">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-6">
              {t('hero.categoryTitle')}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { labelKey: 'hero.catHotel',      img: '/hotel-kategori.png', cats: 'Hotel,Apartment'          },
                { labelKey: 'hero.catGuestHouse',  img: '/kosan-kategori.png', cats: 'Guest House,Kosan'        },
                { labelKey: 'hero.catVilla',       img: '/villa-kategori.png', cats: 'Villa,Resort,Glamping'    },
              ].map(({ labelKey, img, cats }) => (
                <button
                  key={cats}
                  onClick={() => navigate(`/search?categories=${encodeURIComponent(cats)}&checkIn=${today}&checkOut=${tomorrow}&guests=2`)}
                  className="group flex flex-col items-center justify-center gap-3 w-36 h-36 rounded-2xl bg-white/15 hover:bg-orange-500 border border-white/25 hover:border-orange-400 backdrop-blur-sm transition-all duration-200"
                >
                  <img src={img} alt={cats} className="w-12 h-12 object-contain" />
                  <span className="text-white text-xs font-semibold leading-snug text-center whitespace-pre-line">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search box — glass / Traveloka style */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
            <form onSubmit={handleSearch}
              className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/15">

              {/* Destination / Hotel Name */}
              <div className="flex-[2] flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors cursor-text">
                <MapPin className="w-5 h-5 text-white/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">KOTA / NAMA HOTEL</p>
                  <input
                    value={form.q}
                    onChange={e => setForm({...form, q: e.target.value})}
                    placeholder="Jakarta, Bali, nama hotel..."
                    className="w-full bg-transparent text-white placeholder:text-white/35 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Accommodation Type */}
              <div className="flex-[1.2] flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors">
                <Building2 className="w-5 h-5 text-white/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">TIPE AKOMODASI</p>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-transparent text-sm font-medium focus:outline-none [color-scheme:dark] cursor-pointer text-white"
                  >
                    {ACCOMMODATION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
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
                  className="w-full lg:w-auto px-7 py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap text-sm">
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

      {/* ── Promo Flyer Carousel (dari ArahInn) ──────────── */}
      <PromoFlyerCarousel />

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

      {/* ── Property Section ─────────────────────────────── */}
      <section className="bg-blue-50 py-14">
        <div className="container">

          {/* Search card */}
          <div className="bg-gradient-to-r from-[#1a56db] to-[#2563eb] rounded-2xl p-5 mb-8 shadow-xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPropForm(p => ({ ...p, listingType: 'sell' }))}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  propForm.listingType === 'sell'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                }`}>
                Jual Property
              </button>
              <button
                onClick={() => setPropForm(p => ({ ...p, listingType: 'rent' }))}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  propForm.listingType === 'rent'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                }`}>
                Beli
              </button>
            </div>

            {/* Search bar */}
            <div className="bg-white rounded-xl flex flex-col lg:flex-row items-stretch overflow-hidden shadow-sm">
              {/* Location */}
              <div className="flex items-center gap-3 px-4 py-3 flex-[2] border-b lg:border-b-0 lg:border-r border-slate-100">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">Cari lokasi property</p>
                  <input
                    value={propForm.location}
                    onChange={e => setPropForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Masukan Lokasi Property"
                    className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2 px-4 py-3 flex-[2] border-b lg:border-b-0 lg:border-r border-slate-100">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">Jenis Property</p>
                  <select
                    value={propForm.category}
                    onChange={e => setPropForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full text-sm text-slate-700 focus:outline-none bg-transparent cursor-pointer">
                    <option value="">Semua Jenis</option>
                    {PROP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2 px-4 py-3 flex-[2] border-b lg:border-b-0 lg:border-r border-slate-100">
                <Wallet className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">Range Harga</p>
                  <input
                    value={propForm.priceRange}
                    onChange={e => setPropForm(p => ({ ...p, priceRange: e.target.value }))}
                    placeholder="Masukan range harga"
                    className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={handlePropertySearch}
                className="flex items-center justify-center px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white transition-colors shrink-0">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 mb-5">
            Property dengan harga terbaik untuk investasimu!
          </h2>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-7">
            {[
              { label: '🏨 Hotel & Apartemen',       cats: ['Hotel','Apartment'] },
              { label: '🏠 Guest House & Kosan',      cats: ['Guest House','Kosan'] },
              { label: '🌴 Villa, Resort & Glamping', cats: ['Villa','Resort','Glamping'] },
              { label: '🏡 Hunian Keluarga',          cats: [] },
            ].map((g) => (
              <button key={g.label}
                onClick={() => {
                  setActivePropCat(g.label)
                  navigate(`/properti?categories=${encodeURIComponent(g.cats.join(','))}`)
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  activePropCat === g.label
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-orange-400 hover:text-orange-500'
                }`}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Property grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProperties?.data?.map(listing => {
              const img = listing.images?.[0]
              return (
                <div key={listing.id}
                  onClick={() => navigate(`/properti/${listing.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {img && !propImgErr[img] ? (
                      <img src={getImageUrl(img)} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setPropImgErr(p => ({ ...p, [img]: true }))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <Building2 className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {listing.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{listing.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">{listing.city}</span>
                    </div>
                    <p className="text-xs text-slate-500">Start : <span className="text-orange-500 font-bold">{formatRupiah(listing.price)}</span></p>
                  </div>
                </div>
              )
            })}
            {!featuredProperties && Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100">
                <div className="skeleton h-44" />
                <div className="p-4 space-y-2">
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
      <section className="bg-orange-50 py-14">
        <div className="container">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full mb-3">
            ✨ Layanan Premium
          </div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 mb-5">
            Furnish & Design Interior
          </h2>
          <InteriorPenawaran noCard />
        </div>
      </section>

      {/* ── App Banner ───────────────────────────────────── */}
      <section className="container py-8">
        <a href="/register" className="block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow mx-auto" style={{ maxWidth: '80%' }}>
          <img
            src="/app-banner.png"
            alt="New User Special Treats – ArahInn App"
            className="w-full h-auto object-cover"
          />
        </a>
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
