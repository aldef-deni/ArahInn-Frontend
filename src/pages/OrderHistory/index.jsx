import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort, statusBadgeClass, statusLabel, getImageUrl } from '@/utils'
import { ShoppingBag, Calendar, ChevronRight, XCircle } from 'lucide-react'

const TABS = [
  { value: '',          label: 'Semua' },
  { value: 'pending',   label: 'Menunggu Bayar' },
  { value: 'issued',    label: 'Dikonfirmasi' },
  { value: 'canceled',  label: 'Dibatalkan' },
]

export default function OrderHistory() {
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', activeTab, page],
    queryFn : () => bookingApi.myOrders({ status: activeTab || undefined, page, limit: 8 }).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      toast({ title: 'Booking dibatalkan.' })
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      const msg = e?.response?.data?.message || 'Gagal membatalkan booking.'
      toast({ title: 'Gagal membatalkan', description: msg, variant: 'destructive' })
    },
  })

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-brand-700" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Riwayat Pesanan</h1>
          <p className="text-muted-foreground text-sm">Semua booking Anda</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => { setActiveTab(tab.value); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${
              activeTab === tab.value
                ? 'bg-brand text-white border-brand'
                : 'hover:bg-muted border-transparent'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {isLoading
          ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white border rounded-2xl p-5 shadow-card">
                <div className="skeleton h-5 w-2/3 rounded mb-3" />
                <div className="skeleton h-4 w-1/2 rounded mb-2" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            ))
          : data?.data?.length
            ? data.data.map(order => (
                <div key={order.id} className="bg-white border rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                  {/* Status bar */}
                  <div className={`px-5 py-2 text-xs font-semibold flex items-center justify-between ${
                    order.status === 'issued' ? 'bg-blue-50 text-blue-700' :
                    order.status === 'paid'   ? 'bg-green-50 text-green-700' :
                    order.status === 'canceled' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-muted-foreground font-mono">{order.bookingCode}</span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                          {order.hotel?.images?.[0]
                            ? <img src={getImageUrl(order.hotel.images[0])} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
                        </div>
                        <div>
                          <p className="font-semibold">{order.hotel?.name}</p>
                          <p className="text-sm text-muted-foreground">{order.room?.name}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateShort(order.checkIn)} – {formatDateShort(order.checkOut)} · {order.totalNights} malam
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="price-tag text-base">{formatRupiah(order.totalPrice)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.guests} tamu</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button onClick={() => navigate(`/orders/${order.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                        Detail <ChevronRight className="w-4 h-4" />
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => navigate(`/payment/${order.id}`)}
                            className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
                            Bayar Sekarang
                          </button>
                          <button onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isPending}
                            className="px-3 py-2 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            : (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">📭</p>
                <p className="font-semibold text-lg">Belum ada pesanan</p>
                <p className="text-muted-foreground text-sm mt-1 mb-6">Mulai pesan hotel impian Anda sekarang!</p>
                <button onClick={() => navigate('/search')}
                  className="px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors">
                  Cari Hotel
                </button>
              </div>
            )}
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors border ${
                page === p ? 'bg-brand text-white border-brand' : 'hover:bg-muted'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
