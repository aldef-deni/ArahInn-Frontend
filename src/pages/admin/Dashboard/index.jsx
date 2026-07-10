import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { formatRupiah, statusBadgeClass, statusLabel } from '@/utils'
import {
  Users, Hotel, ShoppingBag, TrendingUp, Wallet,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Zap, Plane, Layers,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from 'recharts'

// Palet kategori channel — divalidasi CVD-safe (ΔE 66.7). Warna mengikuti ENTITAS,
// bukan urutan; jangan diputar. Identitas selalu didukung legend + label (bukan warna saja).
const CHANNELS = {
  akomodasi: { label: 'Akomodasi',    color: '#2563eb', icon: Hotel },
  ppob:      { label: 'PPOB',         color: '#f59e0b', icon: Zap },
  travel:    { label: 'Tiket Travel', color: '#14b8a6', icon: Plane },
}

function TrendBadge({ trend }) {
  if (trend === undefined || trend === null) return null
  const up = trend >= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {Math.abs(trend)}%
    </span>
  )
}

function ChannelCard({ ch, d }) {
  const Icon = ch.icon
  return (
    <div className="bg-white rounded-2xl border shadow-card overflow-hidden">
      <div className="h-1" style={{ background: ch.color }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ch.color}1a`, color: ch.color }}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">{ch.label}</span>
          </div>
          <TrendBadge trend={d?.trend} />
        </div>
        <p className="font-display text-xl font-bold">{formatRupiah(d?.omzet || 0)}</p>
        <p className="text-xs text-muted-foreground">Omzet total</p>
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs">
          <div>
            <p className="text-muted-foreground">Bulan ini</p>
            <p className="font-semibold text-sm">{formatRupiah(d?.omzetMonth || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Transaksi</p>
            <p className="font-semibold text-sm">{(d?.count || 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

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

  const monthRange = () => {
    const from = new Date(); from.setDate(1)
    return { from: from.toISOString(), to: new Date().toISOString() }
  }

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn : () => adminApi.revenue(monthRange()).then(r => r.data.data),
  })

  const { data: profitData } = useQuery({
    queryKey: ['admin-profit-chart'],
    queryFn : () => adminApi.profit(monthRange()).then(r => r.data?.data),
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

  // Gabung data harian gross (revenue) + komisi ArahInn (profit) per tanggal
  const chartMap = {}
  ;(revenueData?.daily || []).forEach(d => {
    chartMap[d.date] = { date: d.date, revenue: d.amount || 0, commission: 0 }
  })
  ;(profitData?.daily || []).forEach(d => {
    chartMap[d.date] = { ...(chartMap[d.date] || { date: d.date, revenue: 0 }), commission: d.profit || 0 }
  })
  const chartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date))

  // ── Semua channel (akomodasi + PPOB + travel) ──
  const totalsAll = data?.totalsAll || {}
  const channels  = data?.channels || {}
  const monthLabel = (m) => { if (!m) return ''; const [y, mo] = m.split('-'); return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('id-ID', { month: 'short' }) }
  const areaData = (data?.monthlyByChannel || []).map(d => ({ month: monthLabel(d.month), akomodasi: d.akomodasi || 0, ppob: d.ppob || 0, travel: d.travel || 0 }))
  const shareBase = ['akomodasi', 'ppob', 'travel'].map(k => ({ key: k, value: channels[k]?.omzet || 0 }))
  const shareTotal = shareBase.reduce((s, x) => s + x.value, 0) || 1
  const jtFmt = (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}M` : v >= 1e6 ? `${(v / 1e6).toFixed(0)}jt` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}rb` : `${v}`

  return (
    <div className="space-y-6">
      {/* Stat cards — GABUNGAN semua channel (akomodasi + PPOB + travel) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          icon={Layers}
          title="Total Omzet (Semua Channel)"
          value={formatRupiah(totalsAll.omzet || 0)}
          sub={`Bulan ini: ${formatRupiah(totalsAll.omzetMonth || 0)}`}
          color="blue"
          trend={totalsAll.omzetTrend}
        />
        <StatCard
          icon={Wallet}
          title="Laba ArahInn (Semua Channel)"
          value={formatRupiah(totalsAll.profit || 0)}
          sub={`Bulan ini: ${formatRupiah(totalsAll.profitMonth || 0)}`}
          color="green"
        />
        <StatCard
          icon={ShoppingBag}
          title="Total Transaksi"
          value={(totalsAll.count || 0).toLocaleString('id-ID')}
          sub={`Bulan ini: ${(totalsAll.countMonth || 0).toLocaleString('id-ID')}`}
          color="purple"
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

      {/* Kartu per channel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ChannelCard ch={CHANNELS.akomodasi} d={channels.akomodasi} />
        <ChannelCard ch={CHANNELS.ppob}      d={channels.ppob} />
        <ChannelCard ch={CHANNELS.travel}    d={channels.travel} />
      </div>

      {/* Omzet 6 bulan per channel (stacked area) + kontribusi channel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold text-base">Omzet 6 Bulan Terakhir per Channel</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Akomodasi + PPOB + Tiket Travel (bertumpuk = total omzet)</p>
            </div>
          </div>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={jtFmt} width={44} />
                <Tooltip formatter={(v, n) => [formatRupiah(v), CHANNELS[n]?.label || n]} labelFormatter={l => `Bulan: ${l}`} />
                <Legend formatter={(v) => CHANNELS[v]?.label || v} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="akomodasi" stackId="1" stroke={CHANNELS.akomodasi.color} strokeWidth={2} fill={CHANNELS.akomodasi.color} fillOpacity={0.14} />
                <Area type="monotone" dataKey="ppob"      stackId="1" stroke={CHANNELS.ppob.color}      strokeWidth={2} fill={CHANNELS.ppob.color}      fillOpacity={0.14} />
                <Area type="monotone" dataKey="travel"    stackId="1" stroke={CHANNELS.travel.color}    strokeWidth={2} fill={CHANNELS.travel.color}    fillOpacity={0.14} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Belum ada data.</div>
          )}
        </div>

        {/* Kontribusi omzet per channel */}
        <div className="bg-white border rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-base mb-1">Kontribusi Omzet</h2>
          <p className="text-xs text-muted-foreground mb-5">Porsi tiap channel dari total omzet</p>
          <div className="space-y-4">
            {shareBase.map(s => {
              const pct = Math.round((s.value / shareTotal) * 100)
              const ch = CHANNELS[s.key]
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: ch.color }} /> {ch.label}
                    </span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ch.color }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatRupiah(s.value)}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Omzet</span>
            <span className="font-bold">{formatRupiah(totalsAll.omzet || 0)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue + commission chart */}
        <div className="lg:col-span-2 bg-white border rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold text-base">Akomodasi — Transaksi &amp; Komisi Harian</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Bulan ini · bruto transaksi (biru) vs laba komisi (hijau)</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(summary.commissionThisMonth || 0)}</p>
              <p className="text-[11px] text-muted-foreground">komisi bulan ini</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}jt` : `${(v/1e3).toFixed(0)}rb`} />
                <Tooltip formatter={(v, n) => [formatRupiah(v), n === 'revenue' ? 'Transaksi' : 'Komisi ArahInn']} labelFormatter={l => `Tanggal: ${l}`} />
                <Legend formatter={(v) => v === 'revenue' ? 'Transaksi (bruto)' : 'Komisi ArahInn'} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#gradRev)" />
                <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} fill="url(#gradComm)" />
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
