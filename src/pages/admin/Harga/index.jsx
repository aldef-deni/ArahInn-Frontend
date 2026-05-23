import { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import {
  Building2, Search, CalendarDays, Layers, Tag, Users, Calendar,
  RefreshCw, Receipt, Activity, ChevronDown,
} from 'lucide-react'
import { getImageUrl, cn } from '@/utils'

const SUB_MENUS = [
  { to: '/admin/harga/pricing-model',    label: 'Pricing Model',         icon: Layers    },
  { to: '/admin/harga/rate-plan',        label: 'Rate Plan',             icon: Tag       },
  { to: '/admin/harga/harga-anak',       label: 'Kebijakan & Harga untuk Anak', icon: Users },
  { to: '/admin/harga/atur',             label: 'Atur Harga & Ketersediaan', icon: Calendar },
  { to: '/admin/harga/bulk-update',      label: 'Bulk Update',           icon: RefreshCw },
  { to: '/admin/harga/biaya-tambahan',   label: 'Biaya Tambahan',        icon: Receipt   },
  { to: '/admin/harga/ketersediaan-now', label: 'Ketersediaan Now',      icon: Activity  },
]

export default function AdminHarga() {
  const location = useLocation()
  const [search, setSearch]             = useState('')
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [selectedHotel, setSelectedHotel] = useState(null)

  const { data: hotels, isLoading } = useQuery({
    queryKey: ['admin-harga-hotels'],
    queryFn: () => adminApi.hotels({ per_page: 100 }).then(r => r.data?.data?.data || r.data?.data || []),
  })

  const filtered = hotels?.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-4">
      {/* Hotel picker dropdown */}
      <div className="relative">
        <button
          onClick={() => setPickerOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 text-left shadow-sm transition-all',
            pickerOpen ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {selectedHotel?.images?.[0]
              ? <img src={getImageUrl(selectedHotel.images[0])} alt="" className="w-full h-full object-cover" />
              : <Building2 className="w-4 h-4 text-slate-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {selectedHotel?.name || 'Pilih properti...'}
            </p>
            {selectedHotel
              ? <p className="text-xs text-slate-400 truncate">{selectedHotel.city}</p>
              : <p className="text-xs text-slate-400">Klik untuk memilih properti</p>
            }
          </div>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', pickerOpen && 'rotate-180')} />
        </button>

        {pickerOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari hotel..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto custom-scroll divide-y divide-slate-50">
              {isLoading
                ? Array(3).fill(0).map((_, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <div className="skeleton w-9 h-9 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3.5 w-28 rounded" />
                        <div className="skeleton h-3 w-16 rounded" />
                      </div>
                    </div>
                  ))
                : filtered.map(h => (
                    <button
                      key={h.id}
                      onClick={() => { setSelectedHotel(h); setPickerOpen(false); setSearch('') }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        selectedHotel?.id === h.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {h.images?.[0]
                          ? <img src={getImageUrl(h.images[0])} alt="" className="w-full h-full object-cover" />
                          : <Building2 className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-semibold truncate', selectedHotel?.id === h.id ? 'text-blue-700' : 'text-slate-800')}>
                          {h.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{h.city}</p>
                      </div>
                    </button>
                  ))
              }
              {!isLoading && !filtered.length && (
                <div className="py-8 text-center text-sm text-slate-400">Tidak ada hotel ditemukan.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {!selectedHotel ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <CalendarDays className="w-7 h-7 text-blue-500" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">Pilih Hotel</p>
          <p className="text-sm text-slate-400">Pilih properti dari dropdown di atas untuk melihat konfigurasi harga</p>
        </div>
      ) : (
        <div className="flex gap-5 items-start">
          {/* Sidebar sub-menu */}
          <div className="w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Harga & Ketersediaan</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {SUB_MENUS.map(item => {
                  const active = location.pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors',
                        active
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Page content */}
          {/*
            key={selectedHotel.id} → force remount setiap kali hotel berganti.
            Tanpa key ini, state lokal di child (mis. selectedRoom, draft, editing)
            akan persist dari hotel sebelumnya — bikin tampilan tidak sinkron.
          */}
          <div className="flex-1 min-w-0" key={selectedHotel.id}>
            <Outlet context={{ hotel: selectedHotel, allHotels: hotels, setSelectedHotelId: () => {} }} />
          </div>
        </div>
      )}
    </div>
  )
}
