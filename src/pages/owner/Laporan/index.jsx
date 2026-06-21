import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { formatRupiah, formatDateShort, statusLabel } from '@/utils'
import {
  TrendingUp, ShoppingBag, XCircle, CheckCircle, Building2,
  Loader2, Download, Filter, RotateCcw,
} from 'lucide-react'
import RevenueChart from '@/components/owner/RevenueChart'
import { useAuthStore } from '@/store/authStore'

const STATUS_OPTIONS = [
  { value: '',         label: 'Semua Status' },
  { value: 'success',  label: 'Sukses (Paid + Issued)' },
  { value: 'paid',     label: 'Dibayar' },
  { value: 'issued',   label: 'Issued / Confirmed' },
  { value: 'pending',  label: 'Menunggu Pembayaran' },
  { value: 'canceled', label: 'Dibatalkan' },
  { value: 'refunded', label: 'Refunded' },
]

const todayISO = () => new Date().toISOString().slice(0, 10)
const daysAgoISO = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function OwnerLaporan() {
  const user = useAuthStore(s => s.user)

  // Filters
  const [filters, setFilters] = useState({
    from   : daysAgoISO(30),
    to     : todayISO(),
    status : 'success',
    hotelId: '',
  })

  const upd = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const resetFilters = () => setFilters({
    from: daysAgoISO(30), to: todayISO(), status: 'success', hotelId: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['owner-laporan-all'],
    queryFn : () => bookingApi.getAll({ limit: 1000 }).then(r => r.data),
  })

  const allOrders = data?.data || []

  // Derive hotel list dari orders (semua hotel yang ada bookingnya)
  const allHotels = useMemo(() => {
    const map = new Map()
    allOrders.forEach(b => {
      const id = b.hotel?.id ?? b.hotelId
      if (id && !map.has(id)) {
        map.set(id, { id, name: b.hotel?.name ?? 'Hotel', city: b.hotel?.city ?? '' })
      }
    })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [allOrders])

  // Apply filters
  const orders = useMemo(() => {
    return allOrders.filter(b => {
      // Date filter berdasarkan createdAt
      const created = (b.createdAt || '').slice(0, 10)
      if (filters.from && created < filters.from) return false
      if (filters.to   && created > filters.to)   return false

      // Status filter
      if (filters.status) {
        if (filters.status === 'success') {
          if (!['paid', 'issued'].includes(b.status)) return false
        } else if (b.status !== filters.status) return false
      }

      // Hotel filter
      if (filters.hotelId) {
        const hid = String(b.hotel?.id ?? b.hotelId ?? '')
        if (hid !== String(filters.hotelId)) return false
      }
      return true
    })
  }, [allOrders, filters])

  const confirmed = orders.filter(b => ['paid', 'issued'].includes(b.status))
  const canceled  = orders.filter(b => b.status === 'canceled')
  const revenue   = confirmed.reduce((s, b) => s + (b.totalPrice || 0), 0)

  // Chart: pendapatan per bulan
  const chartData = useMemo(() => {
    const byMonth = orders.reduce((acc, b) => {
      if (!['paid', 'issued'].includes(b.status)) return acc
      const d = b.checkIn ? new Date(b.checkIn) : new Date(b.createdAt)
      const m = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      if (!acc[m]) acc[m] = { month: m, revenue: 0, bookings: 0 }
      acc[m].revenue  += b.totalPrice || 0
      acc[m].bookings += 1
      return acc
    }, {})
    return Object.values(byMonth)
  }, [orders])

  // Group by hotel
  const hotelRows = useMemo(() => {
    const byHotel = confirmed.reduce((acc, b) => {
      const id = b.hotel?.id ?? b.hotelId ?? 'unknown'
      if (!acc[id]) acc[id] = { id, name: b.hotel?.name ?? 'Hotel', city: b.hotel?.city ?? '', revenue: 0, bookings: 0 }
      acc[id].revenue  += b.totalPrice || 0
      acc[id].bookings += 1
      return acc
    }, {})
    return Object.values(byHotel).sort((a, b) => b.revenue - a.revenue)
  }, [confirmed])

  const stats = [
    { icon: TrendingUp,  label: 'Total Pendapatan', value: formatRupiah(revenue), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: ShoppingBag, label: 'Total Booking',    value: orders.length,         color: 'text-blue-600',  bg: 'bg-blue-50' },
    { icon: CheckCircle, label: 'Booking Sukses',   value: confirmed.length,      color: 'text-orange-600',bg: 'bg-orange-50' },
    { icon: XCircle,     label: 'Dibatalkan',       value: canceled.length,       color: 'text-red-500',   bg: 'bg-red-50' },
  ]

  const handleExportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable  = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 36
    let y = margin

    // Header
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('Laporan Pendapatan', margin, y); y += 18
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
    doc.text(`Pemilik: ${user?.name || '-'}`, margin, y); y += 14
    doc.text(`Periode: ${formatDateShort(filters.from)} - ${formatDateShort(filters.to)}`, margin, y); y += 14
    const statusText  = STATUS_OPTIONS.find(o => o.value === filters.status)?.label || 'Semua'
    const hotelText   = filters.hotelId
      ? (allHotels.find(h => String(h.id) === String(filters.hotelId))?.name || 'Hotel')
      : 'Semua Akomodasi'
    doc.text(`Status: ${statusText}`, margin, y); y += 14
    doc.text(`Akomodasi: ${hotelText}`, margin, y); y += 14
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, margin, y); y += 20

    // Summary box
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y, pageW - margin * 2, 78, 6, 6, 'FD')
    const cellW = (pageW - margin * 2) / 4
    const labels = ['Total Pendapatan', 'Total Booking', 'Booking Sukses', 'Dibatalkan']
    const values = [formatRupiah(revenue), String(orders.length), String(confirmed.length), String(canceled.length)]
    labels.forEach((lab, i) => {
      const cx = margin + cellW * i + cellW / 2
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
      doc.text(lab, cx, y + 22, { align: 'center' })
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(15, 23, 42)
      doc.text(values[i], cx, y + 48, { align: 'center' })
    })
    y += 96

    // Per-hotel breakdown
    if (hotelRows.length) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42)
      doc.text('Akumulasi per Akomodasi', margin, y); y += 6
      autoTable(doc, {
        startY: y + 6,
        head  : [['Akomodasi', 'Kota', 'Booking Sukses', 'Pendapatan']],
        body  : hotelRows.map(h => [h.name, h.city || '-', h.bookings, formatRupiah(h.revenue)]),
        styles    : { fontSize: 9, cellPadding: 6, textColor: [15, 23, 42] },
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: margin, right: margin },
      })
      y = doc.lastAutoTable.finalY + 24
    }

    // Detail bookings
    if (orders.length) {
      if (y > 720) { doc.addPage(); y = margin }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42)
      doc.text('Detail Pesanan', margin, y)
      autoTable(doc, {
        startY: y + 8,
        head  : [['Kode', 'Tanggal', 'Tamu', 'Akomodasi', 'Kamar', 'Menginap', 'Status', 'Total']],
        body  : orders.map(b => [
          b.bookingCode || `#${b.id}`,
          formatDateShort(b.createdAt),
          b.guestName || b.user?.name || '-',
          b.hotel?.name || '-',
          b.room?.name  || '-',
          b.stayLabel || 'Harian',
          statusLabel(b.status),
          formatRupiah(b.totalPrice),
        ]),
        styles     : { fontSize: 8, cellPadding: 5 },
        headStyles : { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 6: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: margin, right: margin },
      })
    }

    // Page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8); doc.setTextColor(148, 163, 184)
      doc.text(
        `ArahInn · Halaman ${i} dari ${pageCount}`,
        pageW - margin, doc.internal.pageSize.getHeight() - 18,
        { align: 'right' },
      )
    }

    doc.save(`laporan-${filters.from}_${filters.to}.pdf`)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Laporan Pendapatan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Filter dan ekspor laporan transaksi properti Anda.</p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={!orders.length}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Filters card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-blue-600" />
          <p className="font-semibold text-slate-900 text-sm">Filter Laporan</p>
          <button onClick={resetFilters}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Dari Tanggal</label>
            <input type="date" value={filters.from} onChange={e => upd('from', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Sampai Tanggal</label>
            <input type="date" value={filters.to} onChange={e => upd('to', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status Pesanan</label>
            <select value={filters.status} onChange={e => upd('status', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Akomodasi</label>
            <select value={filters.hotelId} onChange={e => upd('hotelId', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="">Semua Akomodasi</option>
              {allHotels.map(h => (
                <option key={h.id} value={h.id}>{h.name}{h.city ? ` — ${h.city}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Menampilkan <span className="font-semibold text-slate-700">{orders.length}</span> pesanan
          {filters.from || filters.to ? ` periode ${formatDateShort(filters.from)} – ${formatDateShort(filters.to)}` : ''}
        </p>
      </div>

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
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-semibold text-slate-900">Pendapatan per Bulan</h2>
            <p className="text-xs text-slate-500 mt-0.5">Berdasarkan filter yang dipilih</p>
          </div>
          <p className="text-sm font-bold text-blue-600">{formatRupiah(revenue)}</p>
        </div>
        <RevenueChart data={chartData} xKey="month" yKey="revenue" labelPrefix="Bulan" height={240} />
      </div>

      {/* Breakdown per hotel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Akumulasi per Akomodasi</h2>
          <p className="text-xs text-slate-500 mt-0.5">Total pendapatan dari setiap properti dalam periode terpilih.</p>
        </div>
        {hotelRows.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {hotelRows.map((h, idx) => (
              <div key={h.id} className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{h.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {h.city || '—'} · {h.bookings} booking sukses
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-600">{formatRupiah(h.revenue)}</p>
                  {idx === 0 && hotelRows.length > 1 && (
                    <p className="text-[10px] uppercase tracking-wide text-amber-600 font-semibold mt-0.5">Top Performer</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">Tidak ada data sesuai filter.</div>
        )}
      </div>
    </div>
  )
}
