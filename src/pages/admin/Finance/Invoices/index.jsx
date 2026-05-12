import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/services/index'
import { formatRupiah, formatDateShort } from '@/utils'
import { Download, FileText, Printer } from 'lucide-react'

const STATUS_STYLE = {
  paid      : 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending   : 'bg-amber-50 text-amber-700 border-amber-200',
  canceled  : 'bg-red-50 text-red-700 border-red-200',
  refunded  : 'bg-purple-50 text-purple-700 border-purple-200',
}
const STATUS_LABEL = { paid: 'Lunas', pending: 'Belum Bayar', canceled: 'Dibatalkan', refunded: 'Direfund' }

function InvoicePrintView({ order, onClose }) {
  const inv  = `INV-${order.bookingCode}`
  const date = formatDateShort(order.paidAt || order.createdAt)
  const tax  = Math.round((order.totalPrice || 0) * 0.11)
  const base = (order.totalPrice || 0) - tax

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
          <h3 className="font-bold text-lg">Preview Invoice</h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm hover:bg-muted transition-colors">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button onClick={onClose}
              className="px-3 py-2 border rounded-xl text-sm hover:bg-muted transition-colors">✕</button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <img src="/logo-arahin.png" alt="ArahInn" className="h-10 mb-2" />
              <p className="text-xs text-muted-foreground">ArahInn.com</p>
              <p className="text-xs text-muted-foreground">help@arahinn.com</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-brand">{inv}</p>
              <p className="text-xs text-muted-foreground">Tanggal: {date}</p>
              <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[order.status]}`}>
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Tagihan Kepada</p>
              <p className="font-medium">{order.guestName || order.user?.name}</p>
              <p className="text-muted-foreground text-xs">{order.guestEmail || order.user?.email}</p>
              {order.guestPhone && <p className="text-muted-foreground text-xs">{order.guestPhone}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Detail Properti</p>
              <p className="font-medium">{order.hotel?.name}</p>
              <p className="text-muted-foreground text-xs">{order.hotel?.city}</p>
              <p className="text-muted-foreground text-xs">Kamar: {order.room?.name}</p>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Deskripsi</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{order.hotel?.name} – {order.room?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(order.checkIn)} → {formatDateShort(order.checkOut)} · {order.nights || 1} malam
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatRupiah(base)}</td>
                </tr>
                <tr className="border-t bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground">PPN 11%</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{formatRupiah(tax)}</td>
                </tr>
                <tr className="border-t font-bold">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-4 py-2.5 text-right text-brand">{formatRupiah(order.totalPrice)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Dokumen ini dibuat secara otomatis oleh sistem ArahInn.com · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FinanceInvoices() {
  const today        = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [filterStatus, setFilterStatus] = useState('paid')
  const [from, setFrom]                 = useState(firstOfMonth)
  const [to, setTo]                     = useState(today)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [preview, setPreview]           = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['finance-invoices', filterStatus, from, to, page],
    queryFn : () => bookingApi.getAll({
      status: filterStatus || undefined,
      from  : from || undefined,
      to    : to   || undefined,
      page, limit: 15,
    }).then(r => r.data),
  })

  const filtered = data?.data?.filter(b =>
    !search || b.bookingCode?.toLowerCase().includes(search.toLowerCase()) ||
    (b.guestName || b.user?.name)?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalRevenue = filtered.reduce((s, b) => s + (b.totalPrice || 0), 0)

  const exportCSV = () => {
    const csv = ['No Invoice,Kode Booking,Tamu,Hotel,Tanggal,Total,Status',
      ...filtered.map(b => [
        `INV-${b.bookingCode}`, b.bookingCode, b.guestName || b.user?.name,
        b.hotel?.name, formatDateShort(b.paidAt || b.createdAt), b.totalPrice, b.status
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'invoices.csv' }).click()
  }

  return (
    <div className="space-y-5">

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Invoice',    value: data?.pagination?.total || 0, icon: '🧾' },
          { label: 'Total Nilai',      value: formatRupiah(totalRevenue),   icon: '💰' },
          { label: 'Periode',          value: `${from} – ${to}`,            icon: '📅' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white border rounded-2xl p-5 shadow-card">
            <p className="text-2xl mb-2">{icon}</p>
            <p className="font-display text-xl font-bold truncate">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 shadow-card flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode / nama tamu..."
          className="px-3 py-2.5 border rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-brand/50" />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{data?.pagination?.total || 0} invoice</span>
        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4" /> Ekspor CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['No. Invoice','Kode Booking','Tamu','Hotel','Kamar','Tanggal Bayar','Total','Status','Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array(7).fill(0).map((_, i) => (
                    <tr key={i}>{Array(9).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
                  ))
                : filtered.map(order => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand whitespace-nowrap">
                        INV-{order.bookingCode}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {order.bookingCode}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium whitespace-nowrap">{order.guestName || order.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.guestEmail || order.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[130px]">
                        <p className="font-medium truncate">{order.hotel?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.hotel?.city}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{order.room?.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {order.paidAt ? formatDateShort(order.paidAt) : '–'}
                      </td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(order.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[order.status] || ''}`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setPreview(order)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                          <FileText className="w-3.5 h-3.5" /> Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && !filtered.length && (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Tidak ada invoice ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                page === p ? 'bg-brand text-white border-brand' : 'hover:bg-muted'
              }`}>{p}</button>
          ))}
        </div>
      )}

      {preview && <InvoicePrintView order={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
