import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { propertyApi } from '@/services/propertyApi'
import { formatRupiah, getImageUrl } from '@/utils'
import { Search, MapPin, SlidersHorizontal, X, Building2, Home, Trees, Hotel, RotateCcw, ChevronDown } from 'lucide-react'

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
  { key: 'taman', label: 'Taman Bermain' },
  { key: 'kolam', label: 'Kolam Renang' },
  { key: 'gym', label: 'Fitness Center' },
  { key: 'parkir', label: 'Area Parkir' },
  { key: 'security', label: 'Security 24 Jam' },
  { key: 'ac', label: 'AC' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'laundry', label: 'Laundry' },
]

const POPULAR_FILTERS = [
  { key: 'best_price', label: 'Best Price' },
  { key: 'promo_special', label: 'Promo Special' },
  { key: 'bisa_nego', label: 'Bisa Nego' },
]

const RATING_OPTIONS = [5, 4, 3, 2, 1]

function PropertyCard({ listing, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  const img = listing.images?.[0]

  const listingTypeLabel = listing.listingType === 'rent' ? 'Disewa' : 'Dijual'
  const listingTypeColor = listing.listingType === 'rent' ? 'bg-blue-500' : 'bg-orange-500'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative w-full sm:w-64 h-48 sm:h-auto bg-slate-100 overflow-hidden">
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
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {listing.category}
          </span>
          {/* Listing type badge */}
          <span className={`absolute top-3 right-3 ${listingTypeColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full`}>
            {listingTypeLabel}
          </span>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col h-full justify-between">
            {/* Title and Location */}
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug line-clamp-2 mb-2">
                {listing.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{listing.city}{listing.province ? `, ${listing.province}` : ''}</span>
              </div>
            </div>

            {/* Facilities and Specs */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {listing.bedrooms != null && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                    {listing.bedrooms} KT
                  </span>
                )}
                {listing.bathrooms != null && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                    {listing.bathrooms} KM
                  </span>
                )}
                {listing.area && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                    {listing.area} m²
                  </span>
                )}
              </div>
              {listing.facilities && listing.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {listing.facilities.slice(0, 4).map((facility, index) => (
                    <span key={index} className="text-xs text-slate-500">
                      {facility}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-bold text-lg sm:text-xl leading-tight">
                  {formatRupiah(listing.price)}
                </p>
                {listing.priceNegotiable && (
                  <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                    Bisa Nego
                  </span>
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm whitespace-nowrap"
              >
                Lihat Detail
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
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {onReset && (
          <button onClick={onReset} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
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
    page,
    limit       : 12,
  }

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
      <SidebarSection title="Range Harga" onReset={resetPrice}>
        <p className="text-xs text-slate-500 mb-3">Rentang harga properti</p>
        <PriceRangeSlider
          minVal={priceRange[0]} maxVal={priceRange[1]}
          onChange={(min, max) => setPriceRange([min, max])}
        />
      </SidebarSection>

      {/* Filter Populer */}
      <SidebarSection title="Filter Populer" onReset={() => setSelectedPopularFilters([])}>
        <div className="space-y-2.5">
          {POPULAR_FILTERS.map(filter => (
            <label key={filter.key} className="flex items-center gap-2.5 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedPopularFilters.includes(filter.key)}
                onChange={() => togglePopularFilter(filter.key)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" 
              />
              <span className="text-sm text-slate-700">{filter.label}</span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Fasilitas */}
      <SidebarSection title="Fasilitas" onReset={() => setSelectedFacilities([])}>
        <div className="space-y-2.5">
          {FACILITY_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedFacilities.includes(key)}
                onChange={() => toggleFacility(key)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" 
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </SidebarSection>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Search bar top ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-4">
          <form onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
            <div className="flex-[2] relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kota / Lokasi</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={form.city} 
                  onChange={e => setForm({...form, city: e.target.value})}
                  placeholder="Jakarta, Bali, Yogyakarta..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-slate-50" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipe</label>
              <select 
                value={form.listingType} 
                onChange={e => setForm({...form, listingType: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
              >
                <option value="">Semua</option>
                <option value="sell">Dijual</option>
                <option value="rent">Disewa</option>
              </select>
            </div>
            <button type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm text-sm whitespace-nowrap">
              <Search className="w-4 h-4" /> Cari Properti
            </button>
          </form>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex gap-6 items-start">

          {/* ── Sidebar (desktop) ── */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-4">
            <Sidebar />
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

          {/* Tabs + Results header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            {/* Tabs */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              {LISTING_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => { setForm({...form, listingType: tab.value}); setPage(1) }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    form.listingType === tab.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Results count */}
              <p className="text-sm text-slate-500">
                {isLoading ? 'Mencari...' : `${total.toLocaleString('id')} properti ditemukan`}
              </p>

              {/* Filter toggle mobile */}
              <button
                onClick={() => setMobileFilter(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 shadow-sm lg:hidden"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filter
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
                  className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Reset
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
                  {form.listingType === 'sell' ? 'Dijual' : 'Disewa'}
                  <button onClick={() => setForm({...form, listingType: ''})}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex flex-col gap-4">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : listings.length > 0 ? (
              listings.map(listing => (
                <PropertyCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => navigate(`/properti/${listing.id}`)}
                />
              ))
            ) : (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 py-24 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                  <Building2 className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-lg text-slate-700">Belum ada properti ditemukan</p>
                <p className="text-slate-400 text-sm mt-1">Coba ubah filter pencarian Anda</p>
                {hasFilters && (
                  <button onClick={() => {
                    setForm({ city: '', category: '', listingType: '' })
                    setPriceRange([0, MAX_PRICE])
                    setSelectedPopularFilters([])
                    setSelectedFacilities([])
                    setSelectedRatings([])
                    setPage(1)
                  }}
                    className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors border ${
                    page === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {mobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilter(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-slate-900">Filter</h3>
              <button onClick={() => setMobileFilter(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <Sidebar />
            </div>
            <div className="p-5 border-t flex gap-3">
              <button
                onClick={() => {
                  setForm({ city: '', category: '', listingType: '' })
                  setPriceRange([0, MAX_PRICE])
                  setSelectedPopularFilters([])
                  setSelectedFacilities([])
                  setSelectedRatings([])
                  setPage(1)
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => { setPage(1); setMobileFilter(false) }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
