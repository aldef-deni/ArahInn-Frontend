import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ownerApi } from '@/services/index'
import { formatRupiah, statusBadgeClass, statusLabel, getImageUrl } from '@/utils'
import { TrendingUp, ShoppingBag, BedDouble, Clock, ArrowUpRight, Star, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'

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

  const { data, isLoading } = useQuery({
    queryKey: ['owner-dashboard', hotel?.id],
    queryFn : () => ownerApi.dashboard({ hotelId: hotel.id }).then(r => r.data?.data),
    enabled : !!hotel?.id,
    refetchInterval: 60_000,
  })

  const summary    = data?.summary    || {}
  const orders     = data?.recentBookings    || []
  const byStatus   = data?.bookingsByStatus  || {}
  const dailyRevenue = data?.dailyRevenue    || []

  const statusData = [
    { name: 'Menunggu', value: byStatus.pending  || 0, color: '#f59e0b' },
    { name: 'Dibayar',  value: byStatus.paid     || 0, color: '#10b981' },
    { name: 'Issued',   value: byStatus.issued   || 0, color: '#3b82f6' },
    { name: 'Batal',    value: byStatus.canceled || 0, color: '#ef4444' },
  ]

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Hotel banner */}
      {hotel && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              {hotel.images?.[0]
                ? <img src={getImageUrl(hotel.images[0])} alt={hotel.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-slate-900 truncate">{hotel.name}</h2>
              <p className="text-sm text-slate-500 truncate">{hotel.address}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {hotel.starRating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {hotel.starRating} Bintang
                  </span>
                )}
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
        <StatCard
          icon={TrendingUp}
          label="Total Pendapatan"
          value={formatRupiah(summary.totalRevenue || 0)}
          sub={`Bulan ini: ${formatRupiah(summary.revenueThisMonth || 0)}`}
          color="green"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Pesanan"
          value={(summary.totalBookings || 0).toLocaleString('id')}
          sub={`Bulan ini: ${summary.bookingsThisMonth || 0}`}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Menunggu Konfirm"
          value={summary.pendingBookings || 0}
          sub="Perlu ditindaklanjuti"
          color="orange"
        />
        <StatCard
          icon={BedDouble}
          label="Kamar Aktif"
          value={summary.activeRooms || 0}
          sub="Tersedia saat ini"
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Pendapatan Bulan Ini</h2>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="ownerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} />
                <Tooltip formatter={v => formatRupiah(v)} labelFormatter={l => `Tgl: ${l}`} />
                <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} fill="url(#ownerGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Belum ada transaksi bulan ini.
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Status Pesanan</h2>
          {statusData.some(s => s.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={statusData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-500">{s.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
              Belum ada pesanan.
            </div>
          )}
        </div>
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
              {orders.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{b.bookingCode}</td>
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
              ))}
            </tbody>
          </table>
          {!orders.length && (
            <div className="py-14 text-center text-slate-400 text-sm">Belum ada pesanan.</div>
          )}
        </div>
      </div>
    </div>
  )
}
