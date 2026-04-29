import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useTranslation } from 'react-i18next'
import { Search, SlidersHorizontal, MapPin, Star, X, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import HotelCard from '@/components/hotel/HotelCard'

export default function SearchPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const navigate            = useNavigate()
  const [showFilter, setShowFilter] = useState(false)

  const [form, setForm] = useState({
    city     : params.get('city')     || '',
    checkIn  : params.get('checkIn')  || format(new Date(), 'yyyy-MM-dd'),
    checkOut : params.get('checkOut') || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
    guests   : params.get('guests')   || 2,
  })
  const [filters, setFilters] = useState({
    starRating: '', minPrice: '', maxPrice: '', sortBy: 'popular',
  })

  const query = {
    ...form,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page: params.get('page') || 1,
    limit: 12,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['hotels-search', query],
    queryFn : () => hotelApi.search(query).then(r => r.data),
    keepPreviousData: true,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setParams({ ...form, ...filters, page: 1 })
  }

  const stars = [5, 4, 3, 2, 1]
  const sortOptions = [
    { value: 'popular',   label: 'Terpopuler' },
    { value: 'price_asc', label: 'Harga Terendah' },
    { value: 'price_desc','label': 'Harga Tertinggi' },
    { value: 'rating',    label: 'Rating Tertinggi' },
  ]

  return (
    <div className="container py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch}
        className="bg-white border rounded-2xl p-4 shadow-card mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Kota</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
              placeholder="Kota tujuan..."
              className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Check-in</label>
          <input type="date" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Check-out</label>
          <input type="date" value={form.checkOut} min={form.checkIn}
            onChange={e => setForm({...form, checkOut: e.target.value})}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Tamu</label>
          <select value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-white">
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Tamu</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm">
            <Search className="w-4 h-4" /> Cari
          </button>
          <button type="button" onClick={() => setShowFilter(!showFilter)}
            className="p-2.5 border rounded-xl hover:bg-muted transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Filters panel */}
      {showFilter && (
        <div className="bg-white border rounded-2xl p-5 mb-6 shadow-card animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Bintang</label>
              <div className="flex flex-wrap gap-2">
                {stars.map(s => (
                  <button key={s} type="button"
                    onClick={() => setFilters({...filters, starRating: filters.starRating == s ? '' : s})}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      filters.starRating == s ? 'bg-brand text-white border-brand' : 'hover:bg-muted'
                    }`}>
                    <Star className="w-3.5 h-3.5" /> {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Harga Min</label>
              <input type="number" placeholder="Rp 0" value={filters.minPrice}
                onChange={e => setFilters({...filters, minPrice: e.target.value})}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Harga Max</label>
              <input type="number" placeholder="Rp 999.999" value={filters.maxPrice}
                onChange={e => setFilters({...filters, maxPrice: e.target.value})}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Urutkan</label>
              <select value={filters.sortBy} onChange={e => setFilters({...filters, sortBy: e.target.value})}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold">
            {isLoading ? 'Mencari...' : `${data?.pagination?.total || 0} Hotel Ditemukan`}
          </h2>
          {form.city && <p className="text-muted-foreground text-sm mt-0.5">di {form.city}</p>}
        </div>
      </div>

      {/* Hotel grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border">
                <div className="skeleton h-48" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-6 w-1/3 rounded mt-3" />
                </div>
              </div>
            ))
          : data?.data?.length
            ? data.data.map(hotel => <HotelCard key={hotel.id} hotel={hotel} />)
            : (
              <div className="col-span-3 text-center py-20">
                <p className="text-5xl mb-4">🔍</p>
                <p className="font-semibold text-lg">{t('search.noResults')}</p>
                <p className="text-muted-foreground text-sm mt-1">Coba ubah filter atau kota tujuan</p>
              </div>
            )
        }
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setParams({ ...Object.fromEntries(params), page: p })}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors border ${
                params.get('page') == p || (!params.get('page') && p === 1)
                  ? 'bg-brand text-white border-brand'
                  : 'hover:bg-muted'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
