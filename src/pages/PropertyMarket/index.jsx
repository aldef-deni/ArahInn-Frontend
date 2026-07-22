import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import i18n from '@/i18n'
import { propertyApi } from '@/services/propertyApi'
import { formatRupiah, getImageUrl } from '@/utils'
import { Search, MapPin, SlidersHorizontal, X, Building2, Home, Trees, Hotel, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, Navigation } from 'lucide-react'
import SEO from '@/components/SEO'
import bannerProperti from '@/assets/banners/properti.webp'

const CATEGORIES = [
  { label: 'Semua Kategori', value: '' },
  { label: 'Hotel', value: 'Hotel' },
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Kosan', value: 'Kosan' },
  { label: 'Guest House', value: 'Guest House' },
  { label: 'Villa', value: 'Villa' },
  { label: 'Resort', value: 'Resort' },
]

const CATEGORY_GROUPS = [
  { label: 'Hotel & Apartemen',          value: ['Hotel', 'Apartment'] },
  { label: 'Guest House & Kosan',         value: ['Guest House', 'Kosan'] },
  { label: 'Villa Resort & Glamping',     value: ['Villa', 'Resort'] },
  { label: 'Hunian Keluarga',             value: [] },
]

const LISTING_TABS = [
  { label: 'Semua',   value: '' },
  { label: 'Dijual',  value: 'sell' },
  { label: 'Disewa',  value: 'rent' },
]

const MAX_PRICE = 5000000000 // 5 Miliar
const FACILITY_OPTIONS = [
  { key: 'taman', labelKey: 'propertyMarket.facTaman' },
  { key: 'kolam', labelKey: 'propertyMarket.facKolam' },
  { key: 'gym', labelKey: 'propertyMarket.facGym' },
  { key: 'parkir', labelKey: 'propertyMarket.facParkir' },
  { key: 'security', labelKey: 'propertyMarket.facSecurity' },
  { key: 'ac', labelKey: 'propertyMarket.facAc' },
  { key: 'wifi', labelKey: 'propertyMarket.facWifi' },
  { key: 'laundry', labelKey: 'propertyMarket.facLaundry' },
]

const POPULAR_FILTERS = [
  { key: 'best_price', labelKey: 'propertyMarket.popBestPrice' },
  { key: 'promo_special', labelKey: 'propertyMarket.popPromo' },
  { key: 'bisa_nego', labelKey: 'propertyMarket.popNego' },
]

const RATING_OPTIONS = [5, 4, 3, 2, 1]

function PropertyCard({ listing, onClick }) {
  const { t } = useTranslation()
  const [imgErr, setImgErr] = useState(false)
  const img = listing.images?.[0]

  const listingTypeLabel = listing.listingType === 'rent' ? t('propertyMarket.forRent') : t('propertyMarket.forSale')
  const listingTypeColor = listing.listingType === 'rent' ? 'bg-blue-500' : 'bg-orange-500'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md active:scale-[0.99] sm:active:scale-100 transition-all cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative w-full sm:w-60 lg:w-64 h-44 sm:h-auto bg-slate-100 overflow-hidden">
          {img && !imgErr ? (
            <img
              src={getImageUrl(img)}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Building2 className="w-12 h-12 text-slate-300" />
            </div>
          )}
          {/* Category badge */}
          <span className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 bg-orange-500 text-white text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
            {listing.category}
          </span>
          {/* Listing type badge */}
          <span className={`absolute top-2.5 sm:top-3 right-2.5 sm:right-3 ${listingTypeColor} text-white text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full`}>
            {listingTypeLabel}
          </span>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3.5 sm:p-5 lg:p-6">
          <div className="flex flex-col h-full justify-between gap-3">
            {/* Title and Location */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base lg:text-lg leading-snug line-clamp-2 mb-1.5 sm:mb-2">
                {listing.title}
              </h3>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                <span className="truncate">{listing.city}{listing.province ? `, ${listing.province}` : ''}</span>
                {listing.distanceKm != null && !isNaN(Number(listing.distanceKm)) && (
                  <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold text-[10px]">
                    {Number(listing.distanceKm) < 1 ? `${Math.round(Number(listing.distanceKm) * 1000)} m` : `${Number(listing.distanceKm).toFixed(1)} km`}
                  </span>
                )}
              </div>
            </div>

            {/* Facilities and Specs */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {listing.bedrooms != null && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-700 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium">
                  {listing.bedrooms} {t('propertyMarket.bedShort')}
                </span>
              )}
              {listing.bathrooms != null && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-700 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium">
                  {listing.bathrooms} {t('propertyMarket.bathShort')}
                </span>
              )}
              {listing.area && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-700 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium">
                  {listing.area} m²
                </span>
              )}
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="min-w-0">
                <p className="text-orange-600 font-bold text-base sm:text-lg lg:text-xl leading-tight truncate">
                  {formatRupiah(listing.price)}
                </p>
                {listing.priceNegotiable && (
                  <span className="inline-block mt-1 text-[10px] sm:text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 sm:py-1 rounded-full">
                    {t('propertyMarket.nego')}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-orange-600 active:scale-95 transition-all text-xs sm:text-sm whitespace-nowrap shrink-0"
              >
                {t('propertyMarket.detail')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceRangeSlider({ minVal, maxVal, onChange }) {
  const minPct = (minVal / MAX_PRICE) * 100
  const maxPct = (maxVal / MAX_PRICE) * 100
  return (
    <div>
      <div className="relative h-5 mb-3">
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-slate-200">
          <div className="absolute h-full rounded-full bg-blue-500"
            style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
        </div>
        <input type="range" min={0} max={MAX_PRICE} step={100000000} value={minVal}
          onChange={e => onChange(Math.min(+e.target.value, maxVal - 100000000), maxVal)}
          className="absolute w-full h-1.5 top-1/2 -translate-y-1/2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm"
        />
        <input type="range" min={0} max={MAX_PRICE} step={100000000} value={maxVal}
          onChange={e => onChange(minVal, Math.max(+e.target.value, minVal + 100000000))}
          className="absolute w-full h-1.5 top-1/2 -translate-y-1/2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white text-center">
          {formatRupiah(minVal)}
        </div>
        <div className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white text-center">
          {formatRupiah(maxVal)}
        </div>
      </div>
    </div>
  )
}

function SidebarSection({ title, onReset, children }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {onReset && (
          <button onClick={onReset} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> {t('propertyMarket.reset')}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-64 h-48 sm:h-auto bg-slate-200" />
        <div className="flex-1 p-4 sm:p-6 space-y-3">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-12 rounded" />
            <div className="skeleton h-6 w-12 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="skeleton h-6 w-24 rounded" />
            <div className="skeleton h-8 w-20 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PropertyMarket() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [mobileFilter, setMobileFilter] = useState(false)
  
  // Form state from URL params
  const [form, setForm] = useState({
    city: params.get('city') || '',
    category: params.get('category') || '',
    listingType: params.get('listing_type') || '',
  })
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE])
  const [selectedPopularFilters, setSelectedPopularFilters] = useState([])
  const [selectedFacilities, setSelectedFacilities] = useState([])
  const [selectedRatings, setSelectedRatings] = useState([])
  const [page, setPage] = useState(1)

  // Lock body scroll when mobile filter sheet open
  useEffect(() => {
    document.body.style.overflow = mobileFilter ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileFilter])

  // Sync URL params with state
  useEffect(() => {
    const minPrice = params.get('min_price')
    const maxPrice = params.get('max_price')
    if (minPrice || maxPrice) {
      setPriceRange([
        minPrice ? parseInt(minPrice) : 0,
        maxPrice ? parseInt(maxPrice) : MAX_PRICE
      ])
    }
  }, [])
  
  const query = {
    status      : 'approved',
    city        : form.city || undefined,
    category    : form.category || undefined,
    listing_type: form.listingType || undefined,
    min_price   : priceRange[0] > 0 ? priceRange[0] : undefined,
    max_price   : priceRange[1] < MAX_PRICE ? priceRange[1] : undefined,
    facilities  : selectedFacilities.length ? selectedFacilities.join(',') : undefined,
    lat         : params.get('lat') || undefined,
    lng         : params.get('lng') || undefined,
    page,
    limit       : 12,
  }

  const [geoLoading, setGeoLoading] = useState(false)
  const handleNearMe = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        const next = new URLSearchParams(params)
        next.set('lat', pos.coords.latitude); next.set('lng', pos.coords.longitude); next.delete('city')
        setParams(next); setForm(f => ({ ...f, city: '' })); setPage(1)
      },
      () => { setGeoLoading(false); alert('Tidak bisa akses lokasi. Izinkan akses lokasi di browser.') },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  const nearMeActive = !!(params.get('lat') && params.get('lng'))

  const { data, isLoading } = useQuery({
    queryKey: ['property-market', query],
    queryFn : () => propertyApi.search(query).then(r => r.data),
    keepPreviousData: true,
  })

  const listings    = data?.data || []
  const pagination  = data?.pagination
  const totalPages  = pagination?.totalPages || 1
  const total       = pagination?.total || 0

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Update URL params
    const newParams = new URLSearchParams()
    if (form.city) newParams.set('city', form.city)
    if (form.category) newParams.set('category', form.category)
    if (form.listingType) newParams.set('listing_type', form.listingType)
    if (priceRange[0] > 0) newParams.set('min_price', priceRange[0])
    if (priceRange[1] < MAX_PRICE) newParams.set('max_price', priceRange[1])
    if (selectedFacilities.length) newParams.set('facilities', selectedFacilities.join(','))
    setParams(newParams)
  }

  const togglePopularFilter = (filter) => {
    setSelectedPopularFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    )
  }

  const toggleFacility = (facility) => {
    setSelectedFacilities(prev => 
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    )
  }

  const toggleRating = (rating) => {
    setSelectedRatings(prev => 
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    )
  }

  const resetPrice = () => setPriceRange([0, MAX_PRICE])
  const resetFilters = () => {
    setSelectedPopularFilters([])
    setSelectedFacilities([])
    setSelectedRatings([])
  }

  const hasFilters = form.city || form.category || form.listingType || 
                    priceRange[0] > 0 || priceRange[1] < MAX_PRICE ||
                    selectedPopularFilters.length || selectedFacilities.length || selectedRatings.length

  const Sidebar = () => (
    <div className="space-y-4 w-full">
      {/* Range Harga */}
      <SidebarSection title={t('propertyMarket.priceRange')} onReset={resetPrice}>
        <p className="text-xs text-slate-500 mb-3">{t('propertyMarket.priceRangeHint')}</p>
        <PriceRangeSlider
          minVal={priceRange[0]} maxVal={priceRange[1]}
          onChange={(min, max) => setPriceRange([min, max])}
        />
      </SidebarSection>

      {/* Filter Populer */}
      <SidebarSection title={t('propertyMarket.popularFilter')} onReset={() => setSelectedPopularFilters([])}>
        <div className="space-y-2.5">
          {POPULAR_FILTERS.map(filter => (
            <label key={filter.key} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedPopularFilters.includes(filter.key)}
                onChange={() => togglePopularFilter(filter.key)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-slate-700">{t(filter.labelKey)}</span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Fasilitas */}
      <SidebarSection title={t('propertyMarket.facilities')} onReset={() => setSelectedFacilities([])}>
        <div className="space-y-2.5">
          {FACILITY_OPTIONS.map(({ key, labelKey }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFacilities.includes(key)}
                onChange={() => toggleFacility(key)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-slate-700">{t(labelKey)}</span>
            </label>
          ))}
        </div>
      </SidebarSection>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={t('propertyMarket.seoTitle')}
        description={t('propertyMarket.seoDesc')}
        url="/properti"
      />

      {/* Header banner Properti Jual-Beli */}
      <img src={bannerProperti} alt="Properti Jual-Beli ArahInn" width="1774" height="887"
        className="block w-full h-auto" loading="eager" fetchpriority="high" />

      {/* ── Search bar top ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="container py-3 sm:py-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            {/* City — always full width */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('propertyMarket.cityLocation')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    placeholder={t('propertyMarket.cityPlaceholder')}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-slate-50"
                  />
                </div>
                <button type="button" onClick={handleNearMe} disabled={geoLoading}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                    nearMeActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                  }`}>
                  <Navigation className={`w-4 h-4 ${geoLoading ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">{geoLoading ? 'Mencari…' : 'Dekat saya'}</span>
                </button>
              </div>
              {nearMeActive && (
                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" /> Diurutkan dari lokasi terdekat Anda
                  <button type="button" onClick={() => { const n = new URLSearchParams(params); n.delete('lat'); n.delete('lng'); setParams(n) }}
                    className="ml-1 underline text-slate-400">reset</button>
                </p>
              )}
            </div>

            {/* Category + Type: 2-col grid on mobile, inline on lg+ */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('propertyMarket.category')}</label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.value === '' ? t('propertyMarket.allCategories') : c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('propertyMarket.type')}</label>
                <select
                  value={form.listingType}
                  onChange={e => setForm({...form, listingType: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                >
                  <option value="">{t('propertyMarket.all')}</option>
                  <option value="sell">{t('propertyMarket.forSale')}</option>
                  <option value="rent">{t('propertyMarket.forRent')}</option>
                </select>
              </div>
            </div>

            <button type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 active:scale-[0.98] transition-all shadow-sm text-sm whitespace-nowrap">
              <Search className="w-4 h-4" /> {t('propertyMarket.searchProperty')}
            </button>
          </form>
        </div>
      </div>

      <div className="container py-4 sm:py-6">
        <div className="flex gap-6 items-start">

          {/* ── Sidebar (desktop) ── */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-40">
            <Sidebar />
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

          {/* Tabs + Results header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Tabs */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-full sm:w-auto">
              {LISTING_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => { setForm({...form, listingType: tab.value}); setPage(1) }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                    form.listingType === tab.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.value === '' ? t('propertyMarket.all') : tab.value === 'sell' ? t('propertyMarket.forSale') : t('propertyMarket.forRent')}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              {/* Results count */}
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                {isLoading ? t('propertyMarket.searching') : t('propertyMarket.propertiesCount', { n: total.toLocaleString(i18n.language === 'en' ? 'en-US' : 'id') })}
              </p>

              {/* Filter toggle mobile */}
              <button
                onClick={() => setMobileFilter(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 hover:bg-slate-50 active:scale-95 shadow-sm lg:hidden transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" /> {t('propertyMarket.filter')}
              </button>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={() => {
                    setForm({ city: '', category: '', listingType: '' })
                    setPriceRange([0, MAX_PRICE])
                    setSelectedPopularFilters([])
                    setSelectedFacilities([])
                    setSelectedRatings([])
                    setPage(1)
                  }}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs sm:text-sm font-medium hover:bg-red-100 active:scale-95 transition-all"
                >
                  <X className="w-3.5 h-3.5" /> {t('propertyMarket.reset')}
                </button>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {form.city && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  <MapPin className="w-3 h-3" /> {form.city}
                  <button onClick={() => setForm({...form, city: ''})}><X className="w-3 h-3" /></button>
                </span>
              )}
              {form.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                  {form.category}
                  <button onClick={() => setForm({...form, category: ''})}><X className="w-3 h-3" /></button>
                </span>
              )}
              {form.listingType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  {form.listingType === 'sell' ? t('propertyMarket.forSale') : t('propertyMarket.forRent')}
                  <button onClick={() => setForm({...form, listingType: ''})}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : listings.length > 0 ? (
              listings.map(listing => (
                <PropertyCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => navigate(`/properti/${listing.slug || listing.id}`)}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 py-14 sm:py-24 text-center shadow-sm px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 sm:mb-5">
                  <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-base sm:text-lg text-slate-700">{t('propertyMarket.noResults')}</p>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">{t('propertyMarket.noResultsHint')}</p>
                {hasFilters && (
                  <button onClick={() => {
                    setForm({ city: '', category: '', listingType: '' })
                    setPriceRange([0, MAX_PRICE])
                    setSelectedPopularFilters([])
                    setSelectedFacilities([])
                    setSelectedRatings([])
                    setPage(1)
                  }}
                    className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all">
                    {t('propertyMarket.resetFilter')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination — smart compact */}
          {totalPages > 1 && (
            <PropertyPagination
              current={page}
              total={totalPages}
              onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Bottom Sheet ── */}
      {mobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end" onClick={() => setMobileFilter(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in-fast" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-slate-50 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up-fast"
          >
            <div className="shrink-0 px-5 pt-3 pb-3 bg-white rounded-t-3xl border-b border-slate-100">
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('propertyMarket.filter')}</p>
                  <h2 className="font-display text-lg font-bold text-slate-900">{t('propertyMarket.filterProperty')}</h2>
                </div>
                <button onClick={() => setMobileFilter(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                  aria-label={t('propertyMarket.close')}>
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Sidebar />
            </div>
            <div className="shrink-0 p-4 bg-white border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setForm({ city: '', category: '', listingType: '' })
                  setPriceRange([0, MAX_PRICE])
                  setSelectedPopularFilters([])
                  setSelectedFacilities([])
                  setSelectedRatings([])
                  setPage(1)
                }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                {t('propertyMarket.reset')}
              </button>
              <button
                onClick={() => { setPage(1); setMobileFilter(false) }}
                className="flex-[1.5] py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
              >
                {t('propertyMarket.applyFilter')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up-fast {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-slide-up-fast { animation: slide-up-fast 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
        .animate-fade-in-fast  { animation: fade-in-fast 0.2s ease-out; }
      `}</style>
    </div>
  )
}

function PropertyPagination({ current, total, onChange }) {
  const win = 1
  const pages = new Set([1, total, current])
  for (let i = current - win; i <= current + win; i++) {
    if (i > 1 && i < total) pages.add(i)
  }
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  const items = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) items.push('…')
    items.push(p)
    prev = p
  }

  return (
    <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8">
      <button onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {items.map((it, i) => (
        it === '…' ? (
          <span key={`e${i}`} className="w-7 sm:w-9 text-center text-slate-400 text-sm">…</span>
        ) : (
          <button key={it} onClick={() => onChange(it)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-all border active:scale-95 ${
              current === it ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}>
            {it}
          </button>
        )
      ))}
      <button onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
