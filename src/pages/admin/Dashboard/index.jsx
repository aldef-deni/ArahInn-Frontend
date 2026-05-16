import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { formatRupiah, statusBadgeClass, statusLabel } from '@/utils'
import {
  Users, Hotel, ShoppingBag, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'

function StatCard({ title, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue  : 'bg-blue-50 text-blue-600',
    green : 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn : () => adminApi.dashboard().then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn : () => {
      const from = new Date(); from.setDate(1)
      return adminApi.revenue({ from: from.toISOString(), to: new Date().toISOString() }).then(r => r.data.data)
    },
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
      <div className="skeleton h-72 rounded-2xl" />
    </div>
  )

  const summary  = data?.summary || {}
  const trends = summary?.trends || {}
  const byStatus = data?.bookingsByStatus ?? data?.bookings_by_status ?? {}
  const hotelCount = summary.activeHotels ?? summary.totalHotels ?? 0
  const pendingHotels = summary.pendingHotels ?? 0

  const statusData = [
    { name: 'Menunggu', value: byStatus.pending  || 0, color: '#f59e0b' },
    { name: 'Dibayar',  value: byStatus.paid     || 0, color: '#10b981' },
    { name: 'Issued',   value: byStatus.issued   || 0, color: '#3b82f6' },
    { name: 'Batal',    value: byStatus.canceled || 0, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          title="Total Pendapatan"
          value={formatRupiah(summary.totalRevenue)}
          sub={`Bulan ini: ${formatRupiah(summary.revenueThisMonth)}`}
          color="green"
          trend={trends.revenue}
        />
        <StatCard
          icon={ShoppingBag}
          title="Total Booking"
          value={summary.totalBookings?.toLocaleString() || '0'}
          sub={`Bulan ini: ${summary.bookingsThisMonth || 0}`}
          color="blue"
          trend={trends.bookings}
        />
        <StatCard
          icon={Users}
          title="Total Pengguna"
          value={summary.totalUsers?.toLocaleString() || '0'}
          sub="Terdaftar"
          color="purple"
          trend={trends.users}
        />
        <StatCard
          icon={Hotel}
          title="Hotel Aktif"
          value={hotelCount.toLocaleString()}
          sub={`${pendingHotels} hotel menunggu persetujuan`}
          color="orange"
          trend={trends.hotels}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white border rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-base mb-5">Pendapatan Bulan Ini</h2>
          {revenueData?.daily?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData.daily}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} />
                <Tooltip formatter={(v) => formatRupiah(v)} labelFormatter={l => `Tanggal: ${l}`} />
                <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Belum ada data.</div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white border rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-base mb-5">Status Booking</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusData.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Booking Terbaru</h2>
          <span className="text-xs text-muted-foreground">10 terakhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Kode','Tamu','Hotel','Check-in','Total','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.recentBookings?.map(b => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand">{b.bookingCode}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{b.guestName}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{b.hotel?.name || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(b.checkIn).toLocaleDateString('id-ID')}</td>
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
          {!data?.recentBookings?.length && (
            <div className="py-12 text-center text-muted-foreground text-sm">Belum ada booking.</div>
          )}
        </div>
      </div>

    </div>
  )
}
