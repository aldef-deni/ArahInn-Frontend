import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { formatRupiah, statusBadgeClass, statusLabel } from '@/utils'
import { TrendingUp, ShoppingBag, BedDouble, Clock, ArrowUpRight, Star } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue  : 'bg-blue-50 text-blue-600',
    green : 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function OwnerDashboard() {
  const { hotel } = useOutletContext()

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['owner-bookings', hotel?.id],
    queryFn : () => bookingApi.getAll({ hotel_id: hotel?.id, limit: 10 }).then(r => r.data?.data),
    enabled : !!hotel?.id,
  })

  const orders   = bookings?.data || []
  const total    = bookings?.pagination?.total || 0
  const pending  = orders.filter(b => b.status === 'pending').length
  const revenue  = orders.filter(b => b.status !== 'canceled').reduce((s, b) => s + (b.totalPrice || 0), 0)
  const rooms    = hotel?.rooms?.length || 0

  return (
    <div className="space-y-6">

      {/* Hotel banner */}
      {hotel && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              {hotel.images?.[0]
                ? <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-slate-900 truncate">{hotel.name}</h2>
              <p className="text-sm text-slate-500 truncate">{hotel.address}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {hotel.starRating} Bintang
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  hotel.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {hotel.status === 'approved' ? 'Aktif' : 'Menunggu'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Total Pendapatan" value={formatRupiah(revenue)}    sub="Dari semua booking"    color="green"  />
        <StatCard icon={ShoppingBag} label="Total Pesanan"    value={total}                    sub="Semua waktu"           color="blue"   />
        <StatCard icon={Clock}       label="Menunggu Konfirm" value={pending}                  sub="Perlu ditindaklanjuti" color="orange" />
        <StatCard icon={BedDouble}   label="Tipe Kamar"       value={rooms}                    sub="Tersedia"              color="purple" />
      </div>

      {/* Recent bookings */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Pesanan Terbaru</h2>
          <span className="text-xs text-slate-400">10 terakhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Kode','Tamu','Kamar','Check-in','Check-out','Total','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                : orders.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700">{b.bookingCode}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{b.guestName || b.user?.name}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{b.room?.name}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(b.checkIn).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(b.checkOut).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(b.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!isLoading && !orders.length && (
            <div className="py-14 text-center text-slate-400 text-sm">Belum ada pesanan.</div>
          )}
        </div>
      </div>
    </div>
  )
}
