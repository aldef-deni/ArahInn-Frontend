import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts'
import {
  Users, ShoppingBag, DollarSign, TrendingUp, TrendingDown,
  Calendar, Activity, Filter, BarChart3, Hotel, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

const RANGES = [
  { value: 7,   label: '7 hari' },
  { value: 30,  label: '30 hari' },
  { value: 90,  label: '90 hari' },
  { value: 365, label: '1 tahun' },
]

const STATUS_COLORS = {
  pending:  '#f59e0b',
  paid:     '#3b82f6',
  issued:   '#10b981',
  canceled: '#ef4444',
  refunded: '#6b7280',
}

const ROLE_COLORS = {
  user:           '#3b82f6',
  owner:          '#10b981',
  admin:          '#8b5cf6',
  superadmin:     '#f59e0b',
  finance:        '#06b6d4',
  admin_property: '#ec4899',
  design_interior: '#f97316',
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30)

  const params = { days }

  const { data: overview, isLoading: l1 } = useQuery({
    queryKey: ['analytics-overview', days],
    queryFn : () => adminApi.analyticsOverview(params).then(r => r.data?.data),
  })

  const { data: users, isLoading: l2 } = useQuery({
    queryKey: ['analytics-users', days],
    queryFn : () => adminApi.analyticsUsers(params).then(r => r.data?.data),
  })

  const { data: bookings, isLoading: l3 } = useQuery({
    queryKey: ['analytics-bookings', days],
    queryFn : () => adminApi.analyticsBookings(params).then(r => r.data?.data),
  })

  const { data: topHotels, isLoading: l4 } = useQuery({
    queryKey: ['analytics-top-hotels', days],
    queryFn : () => adminApi.analyticsTopHotels({ ...params, limit: 10 }).then(r => r.data?.data),
  })

  const isLoading = l1 || l2 || l3 || l4

  const pctChange = (current, prev) => {
    if (!prev || prev === 0) return current > 0 ? 100 : 0
    return Math.round(((current - prev) / prev) * 100)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Metrics user, booking, dan revenue.</p>
        </div>

        {/* Range filter */}
        <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          {RANGES.map(r => (
            <button key={r.value} onClick={() => setDays(r.value)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                days === r.value
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="New Users"
          value={overview?.newUsers ?? 0}
          delta={pctChange(overview?.newUsers, overview?.newUsersPrev)}
          icon={Users}
          color="from-blue-500 to-blue-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Users"
          value={overview?.totalUsers ?? 0}
          subtitle={`${overview?.dau ?? 0} active today`}
          icon={Activity}
          color="from-emerald-500 to-emerald-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Bookings"
          value={overview?.bookings ?? 0}
          delta={pctChange(overview?.bookings, overview?.bookingsPrev)}
          subtitle={`${overview?.paidBookings ?? 0} paid (${overview?.conversionRate ?? 0}%)`}
          icon={ShoppingBag}
          color="from-orange-500 to-orange-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Revenue"
          value={formatRupiah(overview?.revenue ?? 0)}
          delta={pctChange(overview?.revenue, overview?.revenuePrev)}
          icon={DollarSign}
          color="from-violet-500 to-violet-600"
          isLoading={isLoading}
          isMoney
        />
      </div>

      {/* User Growth Chart */}
      <ChartCard title="User Growth & Activity" subtitle="Daily signups & active users">
        {isLoading ? (
          <div className="h-64 skeleton rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={users?.series || []}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8"
                tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="signups" stroke="#3b82f6" strokeWidth={2}
                fill="url(#signupGrad)" name="New Signups" />
              <Area type="monotone" dataKey="dau" stroke="#10b981" strokeWidth={2}
                fill="url(#dauGrad)" name="Active Users" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Booking + Revenue Chart */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <ChartCard title="Bookings per Day" subtitle="Total vs paid breakdown">
          {isLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bookings?.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8"
                  tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                <Bar dataKey="canceled" stackId="a" fill="#ef4444" name="Canceled" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Revenue per Day" subtitle="Pendapatan dari booking terkonfirmasi">
          {isLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={bookings?.series || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8"
                  tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8"
                  tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<ChartTooltip formatValue={formatRupiah} />} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2}
                  fill="url(#revGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Funnel + Role breakdown + Status pie */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <ChartCard title="Conversion Funnel" subtitle="Booking → Payment → Voucher">
          {isLoading ? (
            <div className="h-56 skeleton rounded-xl" />
          ) : (
            <div className="space-y-3 mt-2">
              {(bookings?.funnel || []).map((f, i) => {
                const max = bookings?.funnel?.[0]?.count || 1
                const pct = Math.round((f.count / max) * 100)
                const isFirst = i === 0
                return (
                  <div key={f.stage}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">{f.stage}</span>
                      <span className="text-xs text-slate-500">
                        {f.count.toLocaleString('id-ID')}
                        {!isFirst && f.count > 0 && (
                          <span className="ml-1.5 text-[10px] text-slate-400">({pct}%)</span>
                        )}
                      </span>
                    </div>
                    <div className="h-7 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg transition-all flex items-center justify-end pr-2 text-[10px] font-bold text-white ${
                          i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-emerald-500' : 'bg-violet-500'
                        }`}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        {f.count > 0 && `${pct}%`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard title="User by Role" subtitle="Composition pengguna sistem">
          {isLoading ? (
            <div className="h-56 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={Object.entries(users?.roleBreakdown || {}).map(([role, count]) => ({
                    name: role, value: count,
                  }))}
                  cx="50%" cy="50%" outerRadius={70} innerRadius={36}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {Object.entries(users?.roleBreakdown || {}).map(([role], i) => (
                    <Cell key={role} fill={ROLE_COLORS[role] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Booking Status" subtitle="Distribusi status pemesanan">
          {isLoading ? (
            <div className="h-56 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={Object.entries(bookings?.statusBreakdown || {}).map(([s, c]) => ({
                    name: s, value: c,
                  }))}
                  cx="50%" cy="50%" outerRadius={70} innerRadius={36}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {Object.keys(bookings?.statusBreakdown || {}).map(s => (
                    <Cell key={s} fill={STATUS_COLORS[s] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top Hotels Table */}
      <ChartCard title="Top 10 Hotels" subtitle="Berdasarkan jumlah booking">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded" />)}
          </div>
        ) : topHotels?.hotels?.length ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">#</th>
                  <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Hotel</th>
                  <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Bookings</th>
                  <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right hidden sm:table-cell">Paid</th>
                  <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topHotels.hotels.map((h, i) => (
                  <tr key={h.hotelId || h.hotel_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {h.hotel?.name || `Hotel #${h.hotelId || h.hotel_id}`}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{h.hotel?.city || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {(h.bookingCount || h.booking_count || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium hidden sm:table-cell">
                      {(h.paidCount || h.paid_count || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right text-orange-600 font-bold">
                      {formatRupiah(parseFloat(h.revenue) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-sm text-slate-400">
            <Hotel className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            Belum ada data booking di range ini
          </div>
        )}
      </ChartCard>
    </div>
  )
}

/* ──────────────────── Helpers ──────────────────── */

function StatCard({ label, value, delta, subtitle, icon: Icon, color, isLoading, isMoney }) {
  const isPositive = delta > 0
  const isNeg = delta < 0
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
          {isLoading ? (
            <div className="skeleton h-7 w-24 rounded" />
          ) : (
            <p className={`font-bold text-slate-900 leading-tight ${isMoney ? 'text-base sm:text-xl' : 'text-xl sm:text-2xl'}`}>
              {value}
            </p>
          )}
          {subtitle && !isLoading && (
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      {delta !== undefined && !isLoading && (
        <div className={`mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
          isPositive ? 'bg-emerald-50 text-emerald-700'
          : isNeg ? 'bg-red-50 text-red-700'
          : 'bg-slate-100 text-slate-500'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNeg ? <ArrowDownRight className="w-3 h-3" /> : null}
          {Math.abs(delta)}% vs sebelum
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-sm sm:text-base text-slate-900">{title}</h3>
        {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function ChartTooltip({ active, payload, label, formatValue }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1.5 capitalize">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="text-slate-600 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-900">
            {formatValue ? formatValue(p.value) : (typeof p.value === 'number' ? p.value.toLocaleString('id-ID') : p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
