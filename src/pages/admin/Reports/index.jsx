import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { formatRupiah, formatDateShort } from '@/utils'
import { BarChart2, TrendingUp, Download, Calendar } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function AdminReports() {
  const [tab, setTab]   = useState('revenue')
  const today           = new Date().toISOString().split('T')[0]
  const firstOfMonth    = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo]     = useState(today)

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['report-revenue', from, to],
    queryFn : () => adminApi.revenue({ from, to }).then(r => r.data.data),
    enabled : tab === 'revenue',
  })

  const { data: canceled } = useQuery({
    queryKey: ['report-canceled', from, to],
    queryFn : () => adminApi.canceled({ from, to }).then(r => r.data.data),
    enabled : tab === 'canceled',
  })

  const exportCSV = (rows, name) => {
    const csv  = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${name}.csv` }).click()
  }

  const tabs = [
    { id: 'revenue',  label: 'Pendapatan' },
    { id: 'canceled', label: 'Pembatalan' },
  ]

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-white border rounded-2xl p-4 shadow-card flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>{t.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
          <span className="text-muted-foreground">–</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
        </div>
      </div>

      {/* Revenue report */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Pendapatan',   value: formatRupiah(revenue?.totalRevenue || 0),      icon: '💰' },
              { label: 'Jumlah Transaksi',   value: (revenue?.totalTransactions || 0).toLocaleString(), icon: '🧾' },
              { label: 'Rata-rata / Transaksi', value: revenue?.totalTransactions
                ? formatRupiah((revenue.totalRevenue || 0) / revenue.totalTransactions) : 'Rp 0', icon: '📊' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white border rounded-2xl p-5 shadow-card">
                <p className="text-2xl mb-3">{icon}</p>
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Grafik Pendapatan Harian</h2>
              <button onClick={() => exportCSV(
                ['Tanggal,Jumlah Transaksi,Total Pendapatan',
                ...(revenue?.daily?.map(d => `${d.date},${d.count},${d.amount}`) || [])],
                'revenue-report'
              )} className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium hover:bg-muted transition-colors">
                <Download className="w-3.5 h-3.5" /> Ekspor
              </button>
            </div>
            {revLoading ? (
              <div className="skeleton h-56 rounded-xl" />
            ) : revenue?.daily?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenue.daily}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(1)}jt`} />
                  <Tooltip formatter={v => formatRupiah(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="amount" name="Pendapatan" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Tidak ada data untuk periode ini.</div>
            )}
          </div>

          {/* Transaction table */}
          {revenue?.transactions?.length > 0 && (
            <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b font-semibold text-sm">Daftar Transaksi</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {['Kode Booking','Tamu','Hotel','Metode','Tanggal Bayar','Jumlah'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {revenue.transactions.slice(0, 20).map(t => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-brand">{t.booking?.bookingCode}</td>
                        <td className="px-4 py-3">{t.booking?.guestName}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[130px] truncate">{t.booking?.hotel?.name}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{t.method || '–'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{t.paidAt ? formatDateShort(t.paidAt) : '–'}</td>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Canceled report */}
      {tab === 'canceled' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Dibatalkan', value: canceled?.totalCanceled || 0, icon: '❌' },
              { label: 'Total Direfund',   value: canceled?.totalRefunded  || 0, icon: '↩️' },
              { label: 'Pendapatan Hilang', value: formatRupiah(canceled?.lostRevenue || 0), icon: '📉' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white border rounded-2xl p-5 shadow-card">
                <p className="text-2xl mb-3">{icon}</p>
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {[
            { title: 'Booking Dibatalkan', data: canceled?.canceled, color: 'text-red-600' },
            { title: 'Booking Direfund',   data: canceled?.refunded, color: 'text-purple-600' },
          ].map(({ title, data: rows, color }) => rows?.length > 0 && (
            <div key={title} className="bg-white border rounded-2xl shadow-card overflow-hidden">
              <div className={`px-5 py-4 border-b font-semibold text-sm ${color}`}>{title}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>{['Kode','Tamu','Hotel','Tanggal','Total'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map(b => (
                      <tr key={b.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs font-bold">{b.bookingCode}</td>
                        <td className="px-4 py-3">{b.guestName || b.user?.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.hotel?.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateShort(b.canceledAt || b.updatedAt)}</td>
                        <td className="px-4 py-3 font-semibold">{formatRupiah(b.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
