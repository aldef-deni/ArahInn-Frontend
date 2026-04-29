import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort, statusBadgeClass, statusLabel } from '@/utils'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'

const STATUSES = ['','pending','paid','issued','canceled','refunded','rescheduled']

export default function AdminOrders() {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [dateFrom, setFrom]   = useState('')
  const [dateTo, setTo]       = useState('')
  const [page, setPage]       = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, dateFrom, dateTo, page],
    queryFn : () => bookingApi.getAll({
      status : status || undefined,
      from   : dateFrom || undefined,
      to     : dateTo   || undefined,
      page, limit: 15,
    }).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess : () => { qc.invalidateQueries(['admin-orders']); toast({ title: 'Booking dibatalkan.' }) },
  })

  const exportCSV = () => {
    const rows = data?.data?.map(b =>
      [b.bookingCode, b.guestName, b.hotel?.name, formatDateShort(b.checkIn), formatDateShort(b.checkOut), b.totalPrice, b.status].join(',')
    )
    const csv  = ['Kode,Tamu,Hotel,CheckIn,CheckOut,Total,Status', ...(rows || [])].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'orders.csv' }).click()
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 shadow-card flex flex-wrap gap-3 items-center">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
          <option value="">Semua Status</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" value={dateTo} onChange={e => setTo(e.target.value)}
            className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{data?.pagination?.total || 0} pesanan</span>
        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4" /> Ekspor CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Kode Booking','Tamu','Hotel','Kamar','Check-in','Check-out','Total','Status','Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array(8).fill(0).map((_, i) => (
                    <tr key={i}>{Array(9).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
                  ))
                : data?.data?.map(order => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand whitespace-nowrap">{order.bookingCode}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium whitespace-nowrap">{order.guestName || order.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{order.guestEmail || order.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[140px]">
                        <p className="font-medium truncate">{order.hotel?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.hotel?.city}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{order.room?.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateShort(order.checkIn)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateShort(order.checkOut)}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(order.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {['pending','paid'].includes(order.status) && (
                          <button onClick={() => cancelMutation.mutate(order.id)}
                            className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && !data?.data?.length && (
            <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada pesanan.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(data.pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
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
