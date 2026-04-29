import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { adminApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { Plus, Search, CheckCircle, XCircle, Star, MapPin, Eye, Hotel } from 'lucide-react'

const STATUS_COLORS = {
  approved: 'bg-green-100 text-green-700',
  pending : 'bg-yellow-100 text-yellow-700',
  blocked : 'bg-red-100 text-red-700',
}

export default function AdminHotels() {
  const { user }  = useAuthStore()
  const { toast } = useToast()
  const qc        = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hotels', search, status, page],
    queryFn : () => hotelApi.search({ city: search, status: status || undefined, page, limit: 10 }).then(r => r.data),
  })

  const { data: pending } = useQuery({
    queryKey: ['pending-hotels'],
    queryFn : () => adminApi.pending().then(r => r.data.data),
    enabled : ['superadmin'].includes(user?.role),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => hotelApi.approve(id),
    onSuccess : () => { qc.invalidateQueries(['admin-hotels']); qc.invalidateQueries(['pending-hotels']); toast({ title: 'Hotel disetujui.' }) },
    onError   : () => toast({ title: 'Gagal menyetujui.', variant: 'destructive' }),
  })

  const blockMutation = useMutation({
    mutationFn: (id) => hotelApi.block(id),
    onSuccess : () => { qc.invalidateQueries(['admin-hotels']); toast({ title: 'Hotel diblokir.' }) },
    onError   : () => toast({ title: 'Gagal memblokir.', variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      {/* Pending approval banner */}
      {pending?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Hotel className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-yellow-800">
              {pending.length} hotel menunggu persetujuan
            </p>
          </div>
          <button onClick={() => setStatus('pending')}
            className="text-xs text-yellow-700 font-semibold hover:underline">
            Lihat Semua →
          </button>
        </div>
      )}

      {/* Search & filter */}
      <div className="bg-white border rounded-2xl p-4 shadow-card flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama / kota..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
          <option value="">Semua Status</option>
          <option value="approved">Disetujui</option>
          <option value="pending">Menunggu</option>
          <option value="blocked">Diblokir</option>
        </select>
        <span className="self-center text-sm text-muted-foreground">
          {data?.pagination?.total || 0} hotel
        </span>
      </div>

      {/* Hotels table */}
      <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Hotel','Kota','Rating','Pemilik','Status','Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                      ))}
                    </tr>
                  ))
                : data?.data?.map(hotel => (
                    <tr key={hotel.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0">
                            {hotel.images?.[0]
                              ? <img src={hotel.images[0]} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-lg">🏨</div>}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{hotel.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{hotel.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" /> {hotel.city}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          {hotel.starRating || '–'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{hotel.owner?.name || '–'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[hotel.status]}`}>
                          {hotel.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <a href={`/hotel/${hotel.id}`} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </a>
                          {hotel.status === 'pending' && (
                            <button onClick={() => approveMutation.mutate(hotel.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 transition-colors">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          {hotel.status !== 'blocked' && (
                            <button onClick={() => blockMutation.mutate(hotel.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                              <XCircle className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && !data?.data?.length && (
            <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada hotel ditemukan.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                page === p ? 'bg-brand text-white border-brand' : 'hover:bg-muted'
              }`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
