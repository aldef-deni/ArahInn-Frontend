import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { formatRupiah, formatDateShort } from '@/utils'
import {
  TrendingUp, Wallet, Percent, Building2, ReceiptText, Landmark,
  CalendarDays, Loader2, Info, BarChart3,
} from 'lucide-react'

const todayStr     = () => new Date().toISOString().slice(0, 10)
const monthStart   = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
const daysAgo      = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
const yearStart    = () => `${new Date().getFullYear()}-01-01`

const ALL_START = '2000-01-01' // cukup jauh untuk mencakup semua data

const PRESETS = [
  { key: 'all',   label: 'Semua',     from: () => ALL_START, to: todayStr },
  { key: 'month', label: 'Bulan ini', from: monthStart, to: todayStr },
  { key: '30',    label: '30 hari',   from: () => daysAgo(30), to: todayStr },
  { key: 'year',  label: 'Tahun ini', from: yearStart, to: todayStr },
]

function StatCard({ icon: Icon, label, value, sub, accent = 'brand', big }) {
  const tones = {
    brand:   'from-blue-600 to-indigo-600',
    emerald: 'from-emerald-500 to-green-600',
    amber:   'from-amber-500 to-orange-500',
    slate:   'from-slate-500 to-slate-600',
  }
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm ${big ? 'sm:col-span-2' : ''}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tones[accent]} flex items-center justify-center shrink-0`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      <p className={`font-black text-slate-900 ${big ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'} leading-tight break-all`}>{value}</p>
      {sub && <p className="text-[11px] sm:text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function FinanceProfit() {
  const [from, setFrom]   = useState(ALL_START)
  const [to, setTo]       = useState(todayStr())
  const [preset, setPreset] = useState('all')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-profit', from, to],
    queryFn : () => adminApi.profit({ from, to }).then(r => r.data?.data),
    keepPreviousData: true,
  })

  const applyPreset = (p) => {
    setPreset(p.key)
    setFrom(p.from())
    setTo(p.to())
  }

  const d = data || {}
  const daily   = d.daily || []
  const byHotel = (d.byHotel || []).slice(0, 8)
  const items   = d.items || []
  const maxDaily = useMemo(() => Math.max(1, ...daily.map(x => x.profit || 0)), [daily])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" /> Laba Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Keuntungan ArahInn dari komisi akomodasi (markup − PPh 2%).
          </p>
        </div>
        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => applyPreset(p)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  preset === p.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 lg:ml-auto">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Dari</label>
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-2">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <input type="date" value={from} max={to}
                  onChange={e => { setFrom(e.target.value); setPreset('') }}
                  className="text-xs text-slate-700 focus:outline-none bg-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Sampai</label>
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-2">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <input type="date" value={to} min={from} max={todayStr()}
                  onChange={e => { setTo(e.target.value); setPreset('') }}
                  className="text-xs text-slate-700 focus:outline-none bg-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard big accent="emerald" icon={Wallet} label="Total Laba Komisi"
              value={formatRupiah(d.totalProfit || 0)}
              sub={`${d.bookingCount || 0} pesanan terbayar · ${preset === 'all' ? 'semua waktu' : `periode ${formatDateShort(from)} – ${formatDateShort(to)}`}`} />
            <StatCard accent="brand" icon={Percent} label="Rata-rata Komisi"
              value={`${d.avgCommissionPct || 0}%`} sub="dari harga kamar" />
            <StatCard accent="slate" icon={Building2} label="Pendapatan Owner"
              value={formatRupiah(d.totalBase || 0)} sub="harga kamar (bukan laba platform)" />
          </div>

          {/* Secondary breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard accent="brand"  icon={ReceiptText} label="Total Markup"  value={formatRupiah(d.totalMarkup || 0)} sub="komisi + PPh" />
            <StatCard accent="amber"  icon={Landmark}    label="PPh 2%"        value={formatRupiah(d.totalPph || 0)}   sub="disetor, bukan laba" />
            <StatCard accent="slate"  icon={Wallet}      label="Total Dibayar Customer" value={formatRupiah(d.totalGross || 0)} />
            <StatCard accent="emerald" icon={BarChart3}  label="Jumlah Pesanan" value={(d.bookingCount || 0).toLocaleString('id-ID')} />
          </div>

          {/* Note */}
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-3.5 py-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Laba dihitung dari pembayaran yang sudah <strong>settlement</strong> (uang masuk), mengecualikan pesanan dibatalkan/refund.
              Persentase komisi diambil dari menu <strong>Akomodasi → Atur Komisi</strong> per hotel.
            </p>
          </div>

          {/* Daily trend */}
          {daily.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Tren Laba Harian
              </h2>
              <div className="flex items-end gap-1.5 h-40 overflow-x-auto pb-1">
                {daily.map(x => (
                  <div key={x.date} className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 26 }}>
                    <div className="flex-1 w-full flex items-end">
                      <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-green-400"
                        style={{ height: `${Math.max(4, (x.profit / maxDaily) * 130)}px` }}
                        title={`${x.date}: ${formatRupiah(x.profit)} (${x.count} pesanan)`} />
                    </div>
                    <span className="text-[8px] text-slate-400 -rotate-45 origin-center whitespace-nowrap mt-1">{x.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top hotels */}
          {byHotel.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Hotel Penyumbang Laba Terbesar
              </h2>
              <div className="space-y-2">
                {byHotel.map((h, i) => {
                  const pct = d.totalProfit > 0 ? (h.profit / d.totalProfit) * 100 : 0
                  return (
                    <div key={h.hotelId || i} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-slate-400 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{h.hotelName || '-'}</p>
                          <p className="text-xs font-bold text-emerald-600 shrink-0">{formatRupiah(h.profit)}</p>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 w-14 text-right">{h.count} pesanan</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Detail table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Rincian per Pesanan</h2>
            </div>
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Belum ada laba pada periode ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                      <th className="px-3 sm:px-5 py-2.5 font-semibold">Kode / Hotel</th>
                      <th className="px-3 py-2.5 font-semibold">Tgl</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Harga Kamar</th>
                      <th className="px-3 py-2.5 font-semibold text-right hidden sm:table-cell">Markup</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Komisi %</th>
                      <th className="px-3 sm:px-5 py-2.5 font-semibold text-right">Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.slice().reverse().map((it) => (
                      <tr key={it.bookingId} className="hover:bg-slate-50">
                        <td className="px-3 sm:px-5 py-2.5">
                          <p className="font-mono font-bold text-brand text-[11px]">{it.bookingCode}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{it.hotelName}</p>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{formatDateShort(it.date)}</td>
                        <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">{formatRupiah(it.basePrice)}</td>
                        <td className="px-3 py-2.5 text-right text-slate-500 whitespace-nowrap hidden sm:table-cell">{formatRupiah(it.markupAmount)}</td>
                        <td className="px-3 py-2.5 text-right text-slate-500">{it.commissionPct}%</td>
                        <td className="px-3 sm:px-5 py-2.5 text-right font-bold text-emerald-600 whitespace-nowrap">{formatRupiah(it.commissionProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-100 bg-slate-50 font-bold">
                      <td className="px-3 sm:px-5 py-3" colSpan={2}>Total ({d.bookingCount || 0} pesanan)</td>
                      <td className="px-3 py-3 text-right text-slate-700">{formatRupiah(d.totalBase || 0)}</td>
                      <td className="px-3 py-3 text-right text-slate-500 hidden sm:table-cell">{formatRupiah(d.totalMarkup || 0)}</td>
                      <td className="px-3 py-3 text-right text-slate-500">{d.avgCommissionPct || 0}%</td>
                      <td className="px-3 sm:px-5 py-3 text-right text-emerald-600">{formatRupiah(d.totalProfit || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
