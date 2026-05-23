import { useOutletContext, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { bookingApi, chatApi } from '@/services/index'
import { formatRupiah, statusBadgeClass, statusLabel } from '@/utils'
import { Search, Download, MessageSquare, Filter, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const STATUS_OPTIONS = [
  { value: '',         label: 'Semua Status' },
  { value: 'pending',  label: 'Menunggu' },
  { value: 'paid',     label: 'Dibayar' },
  { value: 'issued',   label: 'Issued' },
  { value: 'canceled', label: 'Dibatalkan' },
]

const DATE_TYPE_OPTIONS = [
  { value: 'check_in',  label: 'Check-in' },
  { value: 'check_out', label: 'Check-out' },
  { value: 'created_at', label: 'Tgl Booking' },
]

export default function OwnerPesanan() {
  const { hotel }   = useOutletContext()
  const navigate    = useNavigate()
  const { toast }   = useToast()

  const [status,    setStatus]   = useState('')
  const [dateType,  setDateType] = useState('check_in')
  const [startDate, setStart]    = useState('')
  const [endDate,   setEnd]      = useState('')
  const [search,    setSearch]   = useState('')
  const [applied,   setApplied]  = useState({})
  const [page,      setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['owner-orders', hotel?.id, applied, page],
    queryFn : () => bookingApi.getAll({
      hotel_id   : hotel?.id,
      status     : applied.status || undefined,
      date_type  : applied.dateType || undefined,
      start_date : applied.startDate || undefined,
      end_date   : applied.endDate || undefined,
      search     : applied.search || undefined,
      page,
      limit: 15,
    }).then(r => r.data),
    enabled: !!hotel?.id,
  })

  const orders     = data?.data || []
  const pagination = data?.pagination || {}

  // Track booking yang sedang download voucher (loading state)
  const [downloadingId, setDownloadingId] = useState(null)
  const VOUCHER_STATUSES = ['paid', 'issued', 'rescheduled']

  const handleDownloadVoucher = async (booking) => {
    if (!VOUCHER_STATUSES.includes(booking.status)) {
      toast({
        title: 'Voucher belum tersedia',
        description: 'Voucher hanya bisa diunduh setelah booking dibayar.',
        variant: 'destructive',
      })
      return
    }
    setDownloadingId(booking.id)
    try {
      const res = await bookingApi.downloadVoucher(booking.id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `E-Voucher-${booking.bookingCode}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      const msg = e?.response?.data?.message || 'Gagal mengunduh voucher.'
      toast({ title: 'Gagal', description: msg, variant: 'destructive' })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleGo = () => {
    setApplied({ status, dateType, startDate, endDate, search })
    setPage(1)
  }

  const handleReset = () => {
    setStatus(''); setDateType('check_in'); setStart(''); setEnd(''); setSearch('')
    setApplied({}); setPage(1)
  }

  const exportCsv = () => {
    if (!orders.length) return
    const headers = ['Kode Booking','Tamu','Email','Kamar','Check-in','Check-out','Total','Status']
    const rows = orders.map(b => [
      b.bookingCode,
      b.guestName || b.user?.name,
      b.user?.email || '',
      b.room?.name || '',
      new Date(b.checkIn).toLocaleDateString('id-ID'),
      new Date(b.checkOut).toLocaleDateString('id-ID'),
      b.totalPrice,
      statusLabel(b.status),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a   = document.createElement('a'); a.href = url; a.download = `pesanan-${hotel?.id}-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const openChatMutation = useMutation({
    mutationFn: (b) => chatApi.createRoom({ bookingId: b.id, hotelId: hotel.id }),
    onSuccess : (r) => navigate(`/owner/chat?room=${r.data?.data?.id}`),
    onError   : () => toast({ title: 'Gagal membuka chat.', variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipe Tanggal</label>
            <select value={dateType} onChange={e => setDateType(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
              {DATE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={e => setEnd(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Cari (Kode / Nama Tamu)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGo()}
                placeholder="Masukkan kode booking atau nama tamu..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGo}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> Tampilkan
            </button>
            <button onClick={handleReset}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{pagination.total || 0} pesanan ditemukan</p>
        <button onClick={exportCsv} disabled={!orders.length}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-40">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['No.','Kode Booking','Tamu','Kamar','Check-in','Check-out','Total','Status','Voucher Reservasi','Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>{Array(10).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-16" /></td>
                    ))}</tr>
                  ))
                : orders.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{(page - 1) * 15 + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand-700">{b.bookingCode}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{b.guestName || b.user?.name}</p>
                        <p className="text-xs text-slate-400">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{b.room?.name}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(b.checkIn).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(b.checkOut).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatRupiah(b.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      {/* Voucher Reservasi */}
                      <td className="px-4 py-3">
                        {VOUCHER_STATUSES.includes(b.status) ? (
                          <button
                            onClick={() => handleDownloadVoucher(b)}
                            disabled={downloadingId === b.id}
                            title="Download voucher reservasi (PDF)"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold disabled:opacity-60"
                          >
                            {downloadingId === b.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <FileText className="w-3.5 h-3.5" />}
                            {downloadingId === b.id ? 'Memuat...' : 'Download PDF'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">— belum tersedia</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openChatMutation.mutate(b)}
                          disabled={openChatMutation.isPending}
                          title="Chat dengan tamu"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold">
                          <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!isLoading && !orders.length && (
            <div className="py-14 text-center space-y-2">
              <Search className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-slate-400 text-sm">Tidak ada pesanan ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium border transition-colors ${
                page === p ? 'bg-brand text-white border-brand' : 'border-slate-200 hover:bg-slate-50'
              }`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
