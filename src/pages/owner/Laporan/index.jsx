import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import { TrendingUp, ShoppingBag, XCircle, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OwnerLaporan() {
  const { hotel } = useOutletContext()

  const { data, isLoading } = useQuery({
    queryKey: ['owner-laporan', hotel?.id],
    queryFn : () => bookingApi.getAll({ hotel_id: hotel?.id, limit: 100 }).then(r => r.data),
    enabled : !!hotel?.id,
  })

  const orders = data?.data || []

  const confirmed = orders.filter(b => ['paid','issued'].includes(b.status))
  const canceled  = orders.filter(b => b.status === 'canceled')
  const revenue   = confirmed.reduce((s, b) => s + (b.totalPrice || 0), 0)

  // Group by month
  const byMonth = orders.reduce((acc, b) => {
    const m = new Date(b.checkIn).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    if (!acc[m]) acc[m] = { month: m, revenue: 0, bookings: 0 }
    if (['paid','issued'].includes(b.status)) {
      acc[m].revenue   += b.totalPrice || 0
      acc[m].bookings  += 1
    }
    return acc
  }, {})
  const chartData = Object.values(byMonth).slice(-6)

  const stats = [
    { icon: TrendingUp,   label: 'Total Pendapatan',  value: formatRupiah(revenue),      color: 'text-green-600',  bg: 'bg-green-50' },
    { icon: ShoppingBag,  label: 'Total Booking',      value: orders.length,              color: 'text-blue-600',   bg: 'bg-blue-50' },
    { icon: CheckCircle,  label: 'Booking Sukses',     value: confirmed.length,           color: 'text-brand-600',  bg: 'bg-brand/10' },
    { icon: XCircle,      label: 'Dibatalkan',         value: canceled.length,            color: 'text-red-500',    bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Pendapatan per Bulan</h2>
        {isLoading ? (
          <div className="skeleton h-52 rounded-xl" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ownerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} />
              <Tooltip formatter={v => formatRupiah(v)} labelFormatter={l => `Bulan: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#ownerGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Belum ada data.</div>
        )}
      </div>
    </div>
  )
}
