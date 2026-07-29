import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { Utensils, ShoppingBag, TrainFront, HeartPulse, Palmtree, BedDouble, MapPin, Loader2 } from 'lucide-react'

const CAT_ICON = {
  Kuliner: Utensils, Belanja: ShoppingBag, Transportasi: TrainFront, Kesehatan: HeartPulse, Wisata: Palmtree, Akomodasi: BedDouble,
}
const CAT_COLOR = {
  Kuliner: '#f97316', Belanja: '#8b5cf6', Transportasi: '#0ea5e9', Kesehatan: '#ef4444', Wisata: '#10b981', Akomodasi: '#2563eb',
}
// 637 → "637 m"; 1600 → "1,6 km"; 2000 → "2 km"
const fmtDist = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1).replace('.', ',')} km`)

export default function NearbyDestinations({ hotelId }) {
  const [tab, setTab] = useState('Terdekat')
  const [expanded, setExpanded] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['hotel-nearby', hotelId],
    queryFn: () => hotelApi.nearby(hotelId).then(r => r.data?.data ?? { categories: [], items: [] }),
    enabled: !!hotelId,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const items = data?.items ?? []
  // Sembunyikan section sepenuhnya bila tak ada data (mis. lokasi tak diketahui / Overpass kosong).
  if (!isLoading && items.length === 0) return null

  const tabs = ['Terdekat', ...(data?.categories ?? [])]
  const filtered = tab === 'Terdekat' ? items : items.filter(i => i.category === tab)
  const shown = expanded ? filtered : filtered.slice(0, 8)

  return (
    <section className="rounded-2xl sm:rounded-3xl lg:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm md:p-7">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-brand" />
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sekitar Lokasi</p>
      </div>
      <h2 className="mt-1.5 sm:mt-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">Destinasi Terdekat</h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-6"><Loader2 className="w-4 h-4 animate-spin" /> Memuat destinasi terdekat…</div>
      ) : (
        <>
          {/* Tab kategori */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {tabs.map(tb => {
              const active = tb === tab
              return (
                <button
                  key={tb}
                  onClick={() => { setTab(tb); setExpanded(false) }}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tb}
                </button>
              )
            })}
          </div>

          {/* Daftar destinasi */}
          <ul className="mt-3 divide-y divide-slate-100">
            {shown.map((it, i) => {
              const Icon = CAT_ICON[it.category] || MapPin
              const color = CAT_COLOR[it.category] || '#64748b'
              return (
                <li key={`${it.name}-${i}`} className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '1A' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{it.name}</p>
                    <p className="text-[11px] text-slate-400">{it.type}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 shrink-0">{fmtDist(it.distanceM ?? it.distance_m)}</span>
                </li>
              )
            })}
          </ul>

          {filtered.length > 8 && (
            <button onClick={() => setExpanded(v => !v)} className="mt-2 text-xs sm:text-sm font-semibold text-brand hover:underline">
              {expanded ? 'Tampilkan lebih sedikit' : `Lihat semua (${filtered.length})`}
            </button>
          )}

          <p className="mt-3 text-[11px] text-slate-400">Jarak diukur berdasarkan garis lurus, bukan rute perjalanan.</p>
        </>
      )}
    </section>
  )
}
