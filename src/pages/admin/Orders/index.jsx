import { useDeferredValue, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, bookingApi, paymentApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort, statusBadgeClass, statusLabel } from '@/utils'
import { Download, CheckCircle2, X, AlertTriangle, RefreshCw, Calendar, Building2, Search } from 'lucide-react'

const STATUSES = ['','pending','paid','issued','canceled','refunded','rescheduled']

// ── Confirm approve dialog ────────────────────────────────
function ApproveConfirm({ order, onClose, onConfirm, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Konfirmasi Pesanan?</h3>
        <p className="text-sm text-slate-500 mb-1">
          Kode booking: <span className="font-mono font-bold text-brand">{order.bookingCode}</span>
        </p>
        <p className="text-sm text-slate-500 mb-1">{order.guestName || order.user?.name}</p>
        <p className="text-xs text-slate-400 mb-6">
          Status akan berubah ke <strong className="text-emerald-600">Issued</strong>.
          Email konfirmasi + poin loyalitas akan dikirim otomatis ke tamu.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Memproses...' : 'Ya, Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cancel confirm dialog ─────────────────────────────────
function CancelConfirm({ order, onClose, onConfirm, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Batalkan Pesanan?</h3>
        <p className="text-sm text-slate-500 mb-1">
          Kode booking: <span className="font-mono font-bold text-brand">{order.bookingCode}</span>
        </p>
        <p className="text-sm text-slate-500 mb-1">{order.guestName || order.user?.name}</p>
        <p className="text-xs text-slate-400 mb-6">
          Email pembatalan akan dikirim ke tamu dan owner hotel.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Kembali
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Reschedule dialog ─────────────────────────────────────
function RescheduleDialog({ order, onClose, onConfirm, isLoading }) {
  const [checkIn,  setCheckIn]  = useState('')
  const [checkOut, setCheckOut] = useState('')

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Jadwal Ulang Pesanan</h3>
            <p className="text-xs text-slate-500 font-mono">{order.bookingCode}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-500 space-y-1">
          <p><span className="font-medium text-slate-700">Tamu:</span> {order.guestName || order.user?.name}</p>
          <p><span className="font-medium text-slate-700">Jadwal saat ini:</span> {formatDateShort(order.checkIn)} → {formatDateShort(order.checkOut)}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Check-in Baru <span className="text-red-500">*</span>
            </label>
            <input type="date" value={checkIn} min={today}
              onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut('') }}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Check-out Baru <span className="text-red-500">*</span>
            </label>
            <input type="date" value={checkOut} min={checkIn || today}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand" />
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Email notifikasi penjadwalan ulang akan dikirim ke tamu dan owner hotel secara otomatis.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button
            onClick={() => onConfirm({ checkIn, checkOut })}
            disabled={!checkIn || !checkOut || isLoading}
            className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
            {isLoading ? 'Menyimpan...' : 'Simpan Jadwal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const { user }  = useAuthStore()
  const { toast } = useToast()
  const qc        = useQueryClient()
  const isSuperAdmin = user?.role === 'superadmin'

  const [status, setStatus]           = useState('')
  const [dateFrom, setFrom]           = useState('')
  const [dateTo, setTo]               = useState('')
  const [propertySearch, setPropertySearch] = useState('')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [page, setPage]               = useState(1)
  const [approveTarget, setApprove]   = useState(null)
  const [cancelTarget, setCancel]     = useState(null)
  const [rescheduleTarget, setReschedule] = useState(null)
  const deferredPropertySearch = useDeferredValue(propertySearch.trim())
  const shouldSearchProperty = !selectedProperty && deferredPropertySearch.length >= 3

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, dateFrom, dateTo, selectedProperty?.id, page],
    queryFn : () => bookingApi.getAll({
      status : status || undefined,
      from   : dateFrom || undefined,
      to     : dateTo   || undefined,
      hotelId: selectedProperty?.id || undefined,
      page, limit: 15,
    }).then(r => r.data),
  })

  const { data: propertyOptions = [], isFetching: isSearchingProperty } = useQuery({
    queryKey: ['finance-transaction-properties', deferredPropertySearch],
    enabled : shouldSearchProperty,
    queryFn : () => adminApi.hotels({
      search: deferredPropertySearch,
      status: 'approved',
      page: 1,
      limit: 8,
    }).then(r => r.data?.data || []),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast({ title: 'Booking dibatalkan.', description: 'Email notifikasi dikirim ke tamu dan owner hotel.' })
      setCancel(null)
    },
    onError: (e) => toast({ title: 'Gagal membatalkan', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => bookingApi.updateStatus(id, { status: 'issued' }),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast({ title: 'Pesanan dikonfirmasi.', description: 'Email & poin loyalitas telah dikirim ke tamu.' })
      setApprove(null)
    },
    onError: (e) => toast({ title: 'Gagal konfirmasi', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  // Manual transfer mode: konfirmasi pembayaran masuk rekening
  const confirmPayMutation = useMutation({
    mutationFn: (id) => paymentApi.confirmManual(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast({ title: 'Pembayaran dikonfirmasi.', description: 'Voucher e-mail otomatis terkirim ke tamu.' })
    },
    onError: (e) => toast({ title: 'Gagal konfirmasi pembayaran', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, checkIn, checkOut }) => bookingApi.reschedule(id, { checkIn, checkOut }),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast({ title: 'Jadwal diperbarui.', description: 'Email notifikasi dikirim ke tamu dan owner hotel.' })
      setReschedule(null)
    },
    onError: (e) => toast({ title: 'Gagal reschedule', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const exportCSV = () => {
    const rows = data?.data?.map(b =>
      [b.bookingCode, b.guestName, b.hotel?.name, formatDateShort(b.checkIn), formatDateShort(b.checkOut), b.totalPrice, b.status].join(',')
    )
    const csv  = ['Kode,Tamu,Hotel,CheckIn,CheckOut,Total,Status', ...(rows || [])].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'orders.csv' }).click()
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 shadow-card flex flex-wrap gap-3 items-center">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
          <option value="">Semua Status</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={selectedProperty ? selectedProperty.name : propertySearch}
            onChange={(e) => {
              setSelectedProperty(null)
              setPropertySearch(e.target.value)
              setPage(1)
            }}
            placeholder="Filter by properti..."
            className="w-full rounded-xl border px-9 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
          {(selectedProperty || propertySearch) && (
            <button
              type="button"
              onClick={() => {
                setSelectedProperty(null)
                setPropertySearch('')
                setPage(1)
              }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {selectedProperty && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <Building2 className="h-4 w-4" />
              <span className="truncate font-medium">{selectedProperty.name}</span>
              <span className="truncate text-xs text-blue-600">{selectedProperty.city}</span>
            </div>
          )}

          {!selectedProperty && propertySearch.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border bg-white shadow-xl">
              {propertySearch.trim().length < 3 ? (
                <div className="px-4 py-3 text-sm text-slate-500">
                  Ketik minimal 3 huruf untuk mencari properti.
                </div>
              ) : isSearchingProperty ? (
                <div className="px-4 py-3 text-sm text-slate-500">
                  Mencari properti...
                </div>
              ) : propertyOptions.length ? (
                propertyOptions.map((hotel) => (
                  <button
                    key={hotel.id}
                    type="button"
                    onClick={() => {
                      setSelectedProperty(hotel)
                      setPropertySearch(hotel.name)
                      setPage(1)
                    }}
                    className="flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                  >
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{hotel.name}</p>
                      <p className="truncate text-xs text-slate-500">{hotel.city}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500">
                  Properti tidak ditemukan.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" value={dateTo} onChange={e => setTo(e.target.value)}
            className="px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{data?.pagination?.total || 0} pesanan</span>
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
                {['Kode Booking','Tamu','Hotel','Kamar','Check-in','Check-out','Total','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array(8).fill(0).map((_, i) => (
                    <tr key={i}>{Array(isSuperAdmin ? 9 : 8).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
                  ))
                : data?.data?.map(order => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand whitespace-nowrap">{order.bookingCode}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium whitespace-nowrap">{order.guestName || order.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{order.guestEmail || order.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[140px]">
                        <p className="font-medium truncate">{order.hotel?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.hotel?.city}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{order.room?.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateShort(order.checkIn)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateShort(order.checkOut)}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(order.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Konfirmasi Pembayaran — manual transfer mode, for pending only */}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Konfirmasi pembayaran ${order.bookingCode}? Pastikan transfer sudah masuk rekening.`)) {
                                    confirmPayMutation.mutate(order.id)
                                  }
                                }}
                                disabled={confirmPayMutation.isPending}
                                title="Tandai pembayaran transfer manual sudah masuk → otomatis kirim voucher"
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium whitespace-nowrap disabled:opacity-50">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Bayar
                              </button>
                            )}
                            {/* Konfirmasi (issue) — for paid */}
                            {['pending','paid'].includes(order.status) && (
                              <button onClick={() => setApprove(order)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium whitespace-nowrap">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Issue Voucher
                              </button>
                            )}
                            {/* Batalkan — for pending/paid/issued */}
                            {['pending','paid','issued'].includes(order.status) && (
                              <button onClick={() => setCancel(order)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
                                <X className="w-3.5 h-3.5" /> Batalkan
                              </button>
                            )}
                            {/* Reschedule — only for issued */}
                            {order.status === 'issued' && (
                              <button onClick={() => setReschedule(order)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap">
                                <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && !data?.data?.length && (
            <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada pesanan.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(data.pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                page === p ? 'bg-brand text-white border-brand' : 'hover:bg-muted'
              }`}>{p}</button>
          ))}
        </div>
      )}

      {/* Approve confirm dialog */}
      {approveTarget && (
        <ApproveConfirm
          order={approveTarget}
          onClose={() => setApprove(null)}
          onConfirm={() => approveMutation.mutate(approveTarget.id)}
          isLoading={approveMutation.isPending}
        />
      )}

      {/* Cancel confirm dialog */}
      {cancelTarget && (
        <CancelConfirm
          order={cancelTarget}
          onClose={() => setCancel(null)}
          onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
          isLoading={cancelMutation.isPending}
        />
      )}

      {/* Reschedule dialog */}
      {rescheduleTarget && (
        <RescheduleDialog
          order={rescheduleTarget}
          onClose={() => setReschedule(null)}
          onConfirm={({ checkIn, checkOut }) => rescheduleMutation.mutate({ id: rescheduleTarget.id, checkIn, checkOut })}
          isLoading={rescheduleMutation.isPending}
        />
      )}
    </div>
  )
}
