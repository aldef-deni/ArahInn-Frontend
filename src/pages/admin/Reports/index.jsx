import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { formatRupiah, formatDateShort } from '@/utils'
import { exportExcel, exportPdf } from '@/utils/reportExport'
import {
  Download, Calendar, Building2, User, ChevronDown, X,
  FileSpreadsheet, FileText, Loader2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { cn } from '@/utils'

// ── compact select component ──────────────────────────
function FilterSelect({ icon: Icon, value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <div className={cn(
        'flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm transition-all cursor-pointer bg-white',
        value ? 'border-brand/50 ring-1 ring-brand/20 bg-brand/5' : 'border-slate-200 hover:border-slate-300'
      )}>
        <Icon className={cn('w-4 h-4 shrink-0', value ? 'text-brand-600' : 'text-slate-400')} />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none bg-transparent outline-none text-sm pr-5 max-w-[180px] truncate cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {value ? (
          <button type="button" onClick={e => { e.stopPropagation(); onChange('') }}
            className="shrink-0 p-0.5 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-3 h-3 text-slate-500" />
          </button>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
        )}
      </div>
    </div>
  )
}

// ── date helpers ──────────────────────────────────────
const iso = (d) => d.toISOString().split('T')[0]
const PRESETS = [
  { key: 'today', label: 'Hari ini',  from: () => iso(new Date()), to: () => iso(new Date()) },
  { key: '7',     label: '7 hari',    from: () => { const d = new Date(); d.setDate(d.getDate() - 6); return iso(d) }, to: () => iso(new Date()) },
  { key: 'month', label: 'Bulan ini', from: () => iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: () => iso(new Date()) },
  { key: '30',    label: '30 hari',   from: () => { const d = new Date(); d.setDate(d.getDate() - 29); return iso(d) }, to: () => iso(new Date()) },
  { key: 'year',  label: 'Tahun ini', from: () => `${new Date().getFullYear()}-01-01`, to: () => iso(new Date()) },
]

export default function AdminReports() {
  const [tab,     setTab]     = useState('revenue')
  const today          = iso(new Date())
  const firstOfMonth   = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [from,    setFrom]    = useState(firstOfMonth)
  const [to,      setTo]      = useState(today)
  const [preset,  setPreset]  = useState('month')
  const [hotelId, setHotelId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [exporting, setExporting] = useState('')

  const applyPreset = (p) => { setPreset(p.key); setFrom(p.from()); setTo(p.to()) }

  // ── fetch hotels (includes owner data) ──
  const { data: hotelsRaw } = useQuery({
    queryKey: ['report-hotels-list'],
    queryFn : () => adminApi.hotels({ limit: 500 }).then(r => r.data?.data || []),
    staleTime: 5 * 60 * 1000,
  })

  const ownerOptions = useMemo(() => {
    const map = new Map()
    ;(hotelsRaw || []).forEach(h => {
      const id = h.owner?.id, name = h.owner?.name
      if (id && name && !map.has(id)) map.set(id, name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ value: String(id), label: name }))
  }, [hotelsRaw])

  const hotelOptions = useMemo(() => {
    const list = hotelsRaw || []
    const filtered = ownerId ? list.filter(h => String(h.owner?.id) === String(ownerId)) : list
    return filtered.map(h => ({ value: String(h.id), label: h.name }))
  }, [hotelsRaw, ownerId])

  const handleOwnerChange = (val) => { setOwnerId(val); setHotelId('') }

  const params = {
    from, to,
    ...(hotelId && { hotel_id: hotelId }),
    ...(ownerId && { owner_id: ownerId }),
  }

  // ── report queries ──
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['report-revenue', params],
    queryFn : () => adminApi.revenue(params).then(r => r.data.data),
    enabled : tab === 'revenue',
  })

  const { data: profit } = useQuery({
    queryKey: ['report-profit', params],
    queryFn : () => adminApi.profit(params).then(r => r.data?.data),
    enabled : tab === 'revenue',
  })

  const { data: canceled } = useQuery({
    queryKey: ['report-canceled', params],
    queryFn : () => adminApi.canceled(params).then(r => r.data.data),
    enabled : tab === 'canceled',
  })

  const { data: ppob } = useQuery({
    queryKey: ['report-ppob', { from, to }],
    queryFn : () => adminApi.reportPpob({ from, to }).then(r => r.data.data),
    enabled : tab === 'ppob',
  })

  const { data: travel } = useQuery({
    queryKey: ['report-travel', { from, to }],
    queryFn : () => adminApi.reportTravel({ from, to }).then(r => r.data.data),
    enabled : tab === 'travel',
  })

  const tabs = [
    { id: 'revenue',  label: 'Akomodasi' },
    { id: 'ppob',     label: 'PPOB' },
    { id: 'travel',   label: 'Tiket Travel' },
    { id: 'canceled', label: 'Pembatalan' },
  ]

  const hotelLabel = hotelOptions.find(o => o.value === hotelId)?.label
  const ownerLabel = ownerOptions.find(o => o.value === ownerId)?.label
  const activeFilters = [
    hotelId && `Properti: ${hotelLabel || hotelId}`,
    ownerId && `Owner: ${ownerLabel || ownerId}`,
  ].filter(Boolean)

  // ── build export payloads ──
  const periodStr = `Periode: ${formatDateShort(from)} – ${formatDateShort(to)}`
  const metaLines = [
    `Properti: ${hotelLabel || 'Semua Properti'}`,
    `Owner: ${ownerLabel || 'Semua Owner'}`,
  ]

  const buildRevenue = () => {
    const txns = revenue?.transactions || []
    const avg = revenue?.totalTransactions ? (revenue.totalRevenue || 0) / revenue.totalTransactions : 0
    return {
      filename: `laporan-pendapatan-${from}_${to}`,
      title   : 'Laporan Pendapatan',
      subtitle: 'ArahInn — Ringkasan transaksi terbayar',
      period  : periodStr,
      meta    : metaLines,
      summary : [
        { label: 'Total Pendapatan',     value: formatRupiah(revenue?.totalRevenue || 0) },
        { label: 'Jumlah Transaksi',     value: (revenue?.totalTransactions || 0).toLocaleString('id-ID') },
        { label: 'Rata-rata / Transaksi',value: formatRupiah(avg) },
        { label: 'Laba Komisi ArahInn',  value: formatRupiah(profit?.totalProfit || 0) },
      ],
      columns : [
        { key: 'code',   header: 'Kode Booking', width: 16 },
        { key: 'guest',  header: 'Tamu',         width: 22 },
        { key: 'hotel',  header: 'Hotel',        width: 26 },
        { key: 'method', header: 'Metode',       width: 14 },
        { key: 'date',   header: 'Tgl Bayar',    width: 14 },
        { key: 'amount', header: 'Jumlah',       width: 16, money: true },
      ],
      rows: txns.map(t => ({
        code  : t.booking?.bookingCode || '-',
        guest : t.booking?.guestName || '-',
        hotel : t.booking?.hotel?.name || '-',
        method: t.method || '-',
        date  : t.paidAt ? formatDateShort(t.paidAt) : '-',
        amount: t.amount || 0,
      })),
    }
  }

  const buildCanceled = () => {
    const rows = [
      ...(canceled?.canceled || []).map(b => ({ ...b, _status: 'Dibatalkan' })),
      ...(canceled?.refunded || []).map(b => ({ ...b, _status: 'Direfund' })),
    ]
    return {
      filename: `laporan-pembatalan-${from}_${to}`,
      title   : 'Laporan Pembatalan & Refund',
      subtitle: 'ArahInn — Booking dibatalkan & direfund',
      period  : periodStr,
      meta    : metaLines,
      summary : [
        { label: 'Total Dibatalkan',  value: (canceled?.totalCanceled || 0).toLocaleString('id-ID') },
        { label: 'Total Direfund',    value: (canceled?.totalRefunded || 0).toLocaleString('id-ID') },
        { label: 'Pendapatan Hilang', value: formatRupiah(canceled?.lostRevenue || 0) },
      ],
      columns : [
        { key: 'code',   header: 'Kode',   width: 16 },
        { key: 'guest',  header: 'Tamu',   width: 22 },
        { key: 'hotel',  header: 'Hotel',  width: 26 },
        { key: 'date',   header: 'Tanggal',width: 14 },
        { key: 'status', header: 'Status', width: 14 },
        { key: 'total',  header: 'Total',  width: 16, money: true },
      ],
      rows: rows.map(b => ({
        code  : b.bookingCode || `#${b.id}`,
        guest : b.guestName || b.user?.name || '-',
        hotel : b.hotel?.name || '-',
        date  : formatDateShort(b.canceledAt || b.updatedAt),
        status: b._status,
        total : b.totalPrice || 0,
      })),
    }
  }

  const buildPpob = () => {
    const txns = ppob?.transactions || []
    return {
      filename: `laporan-ppob-${from}_${to}`,
      title   : 'Laporan PPOB',
      subtitle: 'ArahInn — Transaksi PPOB berhasil',
      period  : periodStr,
      meta    : [],
      summary : [
        { label: 'Total Omzet PPOB',  value: formatRupiah(ppob?.totalOmzet || 0) },
        { label: 'Jumlah Transaksi',  value: (ppob?.totalTransactions || 0).toLocaleString('id-ID') },
        { label: 'Laba PPOB',         value: formatRupiah(ppob?.totalProfit || 0) },
      ],
      columns : [
        { key: 'code',    header: 'Kode',       width: 16 },
        { key: 'product', header: 'Produk',     width: 26 },
        { key: 'number',  header: 'No. Tujuan', width: 16 },
        { key: 'user',    header: 'User',       width: 20 },
        { key: 'date',    header: 'Tanggal',    width: 14 },
        { key: 'amount',  header: 'Total',      width: 16, money: true },
      ],
      rows: txns.map(t => ({
        code   : t.trxCode || '-',
        product: t.productName || '-',
        number : t.customerNumber || '-',
        user   : t.userName || '-',
        date   : t.createdAt ? formatDateShort(t.createdAt) : '-',
        amount : t.totalAmount || 0,
      })),
    }
  }

  const buildTravel = () => {
    const txns = travel?.transactions || []
    return {
      filename: `laporan-travel-${from}_${to}`,
      title   : 'Laporan Tiket Travel',
      subtitle: 'ArahInn — E-tiket travel terbit',
      period  : periodStr,
      meta    : [],
      summary : [
        { label: 'Total Omzet Travel', value: formatRupiah(travel?.totalOmzet || 0) },
        { label: 'Jumlah Tiket',       value: (travel?.totalTransactions || 0).toLocaleString('id-ID') },
        { label: 'Laba Travel',        value: formatRupiah(travel?.totalProfit || 0) },
      ],
      columns : [
        { key: 'code',    header: 'Kode',          width: 16 },
        { key: 'moda',    header: 'Moda',          width: 12 },
        { key: 'route',   header: 'Rute',          width: 16 },
        { key: 'service', header: 'Layanan',       width: 18 },
        { key: 'user',    header: 'User',          width: 20 },
        { key: 'date',    header: 'Tgl Berangkat', width: 14 },
        { key: 'amount',  header: 'Total',         width: 16, money: true },
      ],
      rows: txns.map(t => ({
        code   : t.code || '-',
        moda   : t.moda || '-',
        route  : `${t.origin || ''}→${t.destination || ''}`,
        service: t.serviceName || '-',
        user   : t.userName || '-',
        date   : t.departDate ? formatDateShort(t.departDate) : '-',
        amount : t.totalPrice || 0,
      })),
    }
  }

  const currentPayload = () =>
    tab === 'revenue' ? buildRevenue()
    : tab === 'ppob'  ? buildPpob()
    : tab === 'travel'? buildTravel()
    : buildCanceled()
  const hasData = tab === 'revenue'
    ? (revenue?.transactions?.length > 0)
    : tab === 'ppob'
    ? (ppob?.transactions?.length > 0)
    : tab === 'travel'
    ? (travel?.transactions?.length > 0)
    : ((canceled?.canceled?.length || 0) + (canceled?.refunded?.length || 0) > 0)

  const handleExport = async (type) => {
    if (exporting) return
    setExporting(type)
    try {
      const payload = currentPayload()
      if (type === 'xlsx') await exportExcel(payload)
      else                 await exportPdf(payload)
    } catch (e) {
      console.error('Export gagal:', e)
      alert('Gagal membuat file export.')
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="space-y-6">

      {/* Header controls */}
      <div className="bg-white border rounded-2xl p-4 shadow-card space-y-3">
        {/* Row 1: tabs + date range */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input type="date" value={from} max={to} onChange={e => { setFrom(e.target.value); setPreset('') }}
              className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
            <span className="text-muted-foreground">–</span>
            <input type="date" value={to} min={from} max={today} onChange={e => { setTo(e.target.value); setPreset('') }}
              className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
          </div>
        </div>

        {/* Row 2: date presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                preset === p.key ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand/40'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Row 3: property + owner filters + export */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          {['revenue', 'canceled'].includes(tab) && (<>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filter:</span>
          <FilterSelect icon={Building2} value={hotelId} onChange={setHotelId} options={hotelOptions} placeholder="Semua Properti" />
          <FilterSelect icon={User} value={ownerId} onChange={handleOwnerChange} options={ownerOptions} placeholder="Semua Owner" />

          {activeFilters.length > 0 && (
            <button onClick={() => { setHotelId(''); setOwnerId('') }}
              className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Reset filter
            </button>
          )}
          </>)}

          {/* Export buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => handleExport('xlsx')} disabled={!hasData || exporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {exporting === 'xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
              Excel
            </button>
            <button onClick={() => handleExport('pdf')} disabled={!hasData || exporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Revenue report ── */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Pendapatan',      value: formatRupiah(revenue?.totalRevenue || 0),             icon: '💰' },
              { label: 'Jumlah Transaksi',      value: (revenue?.totalTransactions || 0).toLocaleString('id-ID'), icon: '🧾' },
              { label: 'Rata-rata / Transaksi', value: revenue?.totalTransactions
                  ? formatRupiah((revenue.totalRevenue || 0) / revenue.totalTransactions) : 'Rp 0',          icon: '📊' },
              { label: 'Laba Komisi ArahInn',   value: formatRupiah(profit?.totalProfit || 0),               icon: '📈', accent: true },
            ].map(({ label, value, icon, accent }) => (
              <div key={label} className={cn('bg-white border rounded-2xl p-5 shadow-card', accent && 'ring-1 ring-emerald-200 bg-emerald-50/40')}>
                <p className="text-2xl mb-3">{icon}</p>
                <p className={cn('font-display text-xl lg:text-2xl font-bold break-all', accent && 'text-emerald-700')}>{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold">Grafik Pendapatan Harian</h2>
                {activeFilters.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">Difilter: {activeFilters.join(' · ')}</p>
                )}
              </div>
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
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                Tidak ada data untuk periode dan filter ini.
              </div>
            )}
          </div>

          {revenue?.transactions?.length > 0 && (
            <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b font-semibold text-sm flex items-center justify-between">
                <span>Daftar Transaksi</span>
                <span className="text-xs text-muted-foreground font-normal">{revenue.transactions.length} transaksi</span>
              </div>
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
                    {revenue.transactions.slice(0, 50).map(t => (
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
                {revenue.transactions.length > 50 && (
                  <div className="px-5 py-3 text-center text-xs text-muted-foreground border-t">
                    Menampilkan 50 dari {revenue.transactions.length} transaksi — ekspor untuk data lengkap.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PPOB report ── */}
      {tab === 'ppob' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Omzet PPOB', value: formatRupiah(ppob?.totalOmzet || 0), icon: '⚡' },
              { label: 'Jumlah Transaksi', value: (ppob?.totalTransactions || 0).toLocaleString('id-ID'), icon: '🧾' },
              { label: 'Laba PPOB',        value: formatRupiah(ppob?.totalProfit || 0), icon: '📈', accent: true },
            ].map(({ label, value, icon, accent }) => (
              <div key={label} className={cn('bg-white border rounded-2xl p-5 shadow-card', accent && 'ring-1 ring-amber-200 bg-amber-50/40')}>
                <p className="text-2xl mb-3">{icon}</p>
                <p className={cn('font-display text-xl lg:text-2xl font-bold break-all', accent && 'text-amber-700')}>{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-card">
            <h2 className="font-semibold mb-5">Grafik Omzet PPOB Harian</h2>
            {ppob?.daily?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={ppob.daily}>
                  <defs>
                    <linearGradient id="ppobGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}jt` : `${(v/1e3).toFixed(0)}rb`} />
                  <Tooltip formatter={v => formatRupiah(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="amount" name="Omzet PPOB" stroke="#f59e0b" strokeWidth={2} fill="url(#ppobGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Tidak ada data untuk periode ini.</div>
            )}
          </div>

          {ppob?.transactions?.length > 0 && (
            <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b font-semibold text-sm flex items-center justify-between">
                <span>Daftar Transaksi PPOB</span>
                <span className="text-xs text-muted-foreground font-normal">{ppob.transactions.length} transaksi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>{['Kode','Produk','No. Tujuan','User','Tanggal','Total'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {ppob.transactions.slice(0, 50).map(t => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-brand">{t.trxCode}</td>
                        <td className="px-4 py-3 max-w-[180px] truncate">{t.productName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.customerNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[130px] truncate">{t.userName || '–'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{t.createdAt ? formatDateShort(t.createdAt) : '–'}</td>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(t.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ppob.transactions.length > 50 && (
                  <div className="px-5 py-3 text-center text-xs text-muted-foreground border-t">Menampilkan 50 dari {ppob.transactions.length} — ekspor untuk data lengkap.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Travel report ── */}
      {tab === 'travel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Omzet Travel', value: formatRupiah(travel?.totalOmzet || 0), icon: '✈️' },
              { label: 'Jumlah Tiket',       value: (travel?.totalTransactions || 0).toLocaleString('id-ID'), icon: '🎟️' },
              { label: 'Laba Travel',        value: formatRupiah(travel?.totalProfit || 0), icon: '📈', accent: true },
            ].map(({ label, value, icon, accent }) => (
              <div key={label} className={cn('bg-white border rounded-2xl p-5 shadow-card', accent && 'ring-1 ring-teal-200 bg-teal-50/40')}>
                <p className="text-2xl mb-3">{icon}</p>
                <p className={cn('font-display text-xl lg:text-2xl font-bold break-all', accent && 'text-teal-700')}>{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-card">
            <h2 className="font-semibold mb-5">Grafik Omzet Tiket Travel Harian</h2>
            {travel?.daily?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={travel.daily}>
                  <defs>
                    <linearGradient id="travelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}jt` : `${(v/1e3).toFixed(0)}rb`} />
                  <Tooltip formatter={v => formatRupiah(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="amount" name="Omzet Travel" stroke="#14b8a6" strokeWidth={2} fill="url(#travelGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Tidak ada data untuk periode ini.</div>
            )}
          </div>

          {travel?.transactions?.length > 0 && (
            <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b font-semibold text-sm flex items-center justify-between">
                <span>Daftar Tiket Travel</span>
                <span className="text-xs text-muted-foreground font-normal">{travel.transactions.length} tiket</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>{['Kode','Moda','Rute','Layanan','User','Berangkat','Total'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {travel.transactions.slice(0, 50).map(t => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-brand">{t.code}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{t.moda}</td>
                        <td className="px-4 py-3 font-mono text-xs">{t.origin}→{t.destination}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[130px] truncate">{t.serviceName || '–'}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">{t.userName || '–'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{t.departDate ? formatDateShort(t.departDate) : '–'}</td>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(t.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {travel.transactions.length > 50 && (
                  <div className="px-5 py-3 text-center text-xs text-muted-foreground border-t">Menampilkan 50 dari {travel.transactions.length} — ekspor untuk data lengkap.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Canceled report ── */}
      {tab === 'canceled' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Dibatalkan',  value: canceled?.totalCanceled || 0,             icon: '❌' },
              { label: 'Total Direfund',    value: canceled?.totalRefunded  || 0,             icon: '↩️' },
              { label: 'Pendapatan Hilang', value: formatRupiah(canceled?.lostRevenue || 0),  icon: '📉' },
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

          {!canceled?.canceled?.length && !canceled?.refunded?.length && (
            <div className="bg-white border rounded-2xl p-12 text-center text-muted-foreground text-sm shadow-card">
              Tidak ada pembatalan/refund pada periode & filter ini.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
