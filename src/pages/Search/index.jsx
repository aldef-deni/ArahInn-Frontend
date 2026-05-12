import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { formatRupiah } from '@/utils'
import { Search, MapPin, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import HotelCardRow from '@/components/hotel/HotelCardRow'

const MAX_PRICE = 7000000
const STAR_OPTIONS = [5, 4, 3, 2, 1]
const FACILITY_KEYS = ['ac','no_smoking','playground','pool','restaurant','bathtub','hot_water','wifi','parking','gym']
const SORT_KEYS = [
  { value: 'popular',    tKey: 'search.sortPopular'   },
  { value: 'price_asc',  tKey: 'search.sortPriceAsc'  },
  { value: 'price_desc', tKey: 'search.sortPriceDesc' },
  { value: 'rating',     tKey: 'search.sortRating'    },
]

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
        <input type="range" min={0} max={MAX_PRICE} step={100000} value={minVal}
          onChange={e => onChange(Math.min(+e.target.value, maxVal - 100000), maxVal)}
          className="absolute w-full h-1.5 top-1/2 -translate-y-1/2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm"
        />
        <input type="range" min={0} max={MAX_PRICE} step={100000} value={maxVal}
          onChange={e => onChange(minVal, Math.max(+e.target.value, minVal + 100000))}
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
            <RotateCcw className="w-3 h-3" /> {t('search.reset')}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

export default function SearchPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [mobileFilter, setMobileFilter] = useState(false)
  const facilityOptions = FACILITY_KEYS.map(k => ({ key: k, label: t(`facilities.${k}`) }))
  const sortOptions     = SORT_KEYS.map(o => ({ value: o.value, label: t(o.tKey) }))

  const today    = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    q       : params.get('q')       || params.get('city') || '',
    category: params.get('category')|| '',
    checkIn : params.get('checkIn') || today,
    checkOut: params.get('checkOut')|| tomorrow,
    guests  : params.get('guests')  || 2,
  })

  const [priceRange,   setPriceRange]   = useState([0, MAX_PRICE])
  const [selectedStars, setSelectedStars] = useState([])
  const [selectedFacilities, setSelectedFacilities] = useState([])
  const [sortBy, setSortBy] = useState('popular')
  const [page,   setPage]   = useState(1)

  const query = {
    q         : form.q || undefined,
    checkIn   : form.checkIn,
    checkOut  : form.checkOut,
    guests    : form.guests,
    categories: params.get('categories') || undefined,
    category  : !params.get('categories') ? (form.category || params.get('category') || undefined) : undefined,
    min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
    max_price: priceRange[1] < MAX_PRICE ? priceRange[1] : undefined,
    star_ratings: selectedStars.length ? selectedStars.join(',') : undefined,
    facilities  : selectedFacilities.length ? selectedFacilities.join(',') : undefined,
    sort_by  : sortBy,
    page,
    limit    : 10,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['hotels-search', query],
    queryFn : () => hotelApi.search(query).then(r => r.data),
    keepPreviousData: true,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    const p = { checkIn: form.checkIn, checkOut: form.checkOut, guests: form.guests }
    if (form.q)        p.q        = form.q
    if (form.category) p.category = form.category
    setParams(p)
  }

  const toggleStar = (s) =>
    setSelectedStars(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleFacility = (f) =>
    setSelectedFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const resetPrice = () => setPriceRange([0, MAX_PRICE])
  const resetFilters = () => { setSelectedStars([]); setSelectedFacilities([]) }

  const totalResults = data?.pagination?.total || 0

  const Sidebar = () => (
    <div className="space-y-4 w-full">
      {/* Range Harga */}
      <SidebarSection title={t('search.priceRange')} onReset={resetPrice}>
        <p className="text-xs text-slate-500 mb-3">{t('search.pricePerNight')}</p>
        <PriceRangeSlider
          minVal={priceRange[0]} maxVal={priceRange[1]}
          onChange={(min, max) => setPriceRange([min, max])}
        />
      </SidebarSection>

      {/* Filter Populer */}
      <SidebarSection title={t('search.popularFilter')} onReset={resetFilters}>
        <div className="space-y-2.5">
          {STAR_OPTIONS.map(s => (
            <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={selectedStars.includes(s)}
                onChange={() => toggleStar(s)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" />
              <div className="flex items-center gap-0.5">
                {Array.from({ length: s }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Fasilitas */}
      <SidebarSection title={t('search.facilitiesFilter')} onReset={() => setSelectedFacilities([])}>
        <div className="space-y-2.5">
          {facilityOptions.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={selectedFacilities.includes(key)}
                onChange={() => toggleFacility(key)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" />
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">KOTA / NAMA HOTEL</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.q} onChange={e => setForm({...form, q: e.target.value})}
                  placeholder="Kota, nama hotel..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-slate-50" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TIPE AKOMODASI</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand/30 min-w-[140px]">
                <option value="">Semua Tipe</option>
                {['Hotel','Villa','Kosan','Apartment','Guest House','Resort','Glamping'].map(c => (
                  <option key={c} value={c}>{c === 'Apartment' ? 'Apartemen' : c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('search.checkin')}</label>
              <input type="date" value={form.checkIn} min={today}
                onChange={e => setForm({...form, checkIn: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-slate-50" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('search.checkout')}</label>
              <input type="date" value={form.checkOut} min={form.checkIn}
                onChange={e => setForm({...form, checkOut: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-slate-50" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('search.guests')}</label>
              <select value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand/30">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {t('search.guestUnit')}</option>)}
              </select>
            </div>
            <button type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm text-sm whitespace-nowrap">
              <Search className="w-4 h-4" /> {t('search.search')}
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

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-slate-900">
                  {isLoading ? t('search.searching') : (
                    <>{(form.q || form.category) && (
                      <span className="text-slate-500">
                        {[form.q, form.category].filter(Boolean).join(' · ')}{' '}
                      </span>
                    )}
                    <span className="text-slate-900">{totalResults.toLocaleString('id')} {t('search.hotelsCount')}</span></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile filter toggle */}
                <button onClick={() => setMobileFilter(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 bg-white hover:bg-slate-50">
                  <SlidersHorizontal className="w-4 h-4" /> {t('search.filter')}
                </button>
                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 whitespace-nowrap hidden md:block">{t('search.sortByLabel')}</span>
                  <div className="relative">
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer">
                      {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel list */}
            <div className="space-y-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex h-40">
                    <div className="skeleton w-44 shrink-0" />
                    <div className="flex-1 p-4 space-y-3">
                      <div className="skeleton h-5 w-2/3 rounded" />
                      <div className="skeleton h-4 w-1/3 rounded" />
                      <div className="skeleton h-4 w-1/2 rounded" />
                    </div>
                  </div>
                ))
              ) : data?.data?.length ? (
                data.data.map(hotel => <HotelCardRow key={hotel.id} hotel={hotel} />)
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
                  <p className="text-4xl mb-4">🔍</p>
                  <p className="font-semibold text-lg text-slate-700">{t('search.noResults')}</p>
                  <p className="text-slate-400 text-sm mt-1">{t('search.noResultsHint')}</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {data?.pagination?.total_pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: data.pagination.total_pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors border ${
                      page === p ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilter(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-50 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{t('search.filter')}</h2>
              <button onClick={() => setMobileFilter(false)}
                className="p-2 rounded-xl hover:bg-slate-200 transition-colors">✕</button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  )
}
