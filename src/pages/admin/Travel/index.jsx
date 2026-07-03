import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plane, TrainFront, Ship, Ticket, CheckCircle2, Loader2, Clock, XCircle, Search, RefreshCw, Trash2,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'

const MODA = {
  pesawat: { label: 'Pesawat', Icon: Plane,      cls: 'text-sky-600 bg-sky-50' },
  kereta:  { label: 'Kereta',  Icon: TrainFront,  cls: 'text-amber-600 bg-amber-50' },
  pelni:   { label: 'Kapal',   Icon: Ship,        cls: 'text-cyan-600 bg-cyan-50' },
}
const STATUS = {
  pending_payment: { label: 'Menunggu Bayar', cls: 'bg-amber-100 text-amber-700',  Icon: Clock },
  paid:            { label: 'Dibayar',        cls: 'bg-blue-100 text-blue-700',    Icon: Clock },
  issued:          { label: 'E-Tiket Terbit', cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  failed:          { label: 'Gagal',          cls: 'bg-rose-100 text-rose-600',    Icon: XCircle },
  canceled:        { label: 'Dibatalkan',     cls: 'bg-slate-100 text-slate-500',  Icon: XCircle },
}
const TABS = [
  { value: 'pending_payment', label: 'Menunggu Bayar' },
  { value: 'issued',          label: 'Terbit' },
  { value: '',                label: 'Semua' },
]
const fmt = (d) => d ? new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'

export default function AdminTravel() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isAldeftech = (user?.email || '').trim().toLowerCase() === 'aldeftech@gmail.com'
  const [status, setStatus] = useState('pending_payment')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-travel', status, search],
    queryFn: () => travelApi.adminBookings({ status: status || undefined, search: search || undefined, limit: 30 }).then(r => r.data?.data),
  })
  const rows = data?.data ?? []

  // ── Hapus massal (khusus aldeftech@gmail.com) ───────────────
  useEffect(() => { setSelectedIds([]) }, [status, search])
  const allSelected = rows.length > 0 && rows.every(b => selectedIds.includes(b.id))
  const toggleAll = () => {
    if (allSelected) {
      const ids = new Set(rows.map(b => b.id))
      setSelectedIds(prev => prev.filter(id => !ids.has(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...rows.map(b => b.id)])])
    }
  }
  const toggleOne = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const bulkDeleteMut = useMutation({
    mutationFn: () => travelApi.adminBulkDelete(selectedIds),
    onSuccess : (r) => {
      qc.invalidateQueries({ queryKey: ['admin-travel'] })
      toast({ title: 'Pesanan dihapus.', description: r.data?.message || `${selectedIds.length} data terhapus permanen.` })
      setSelectedIds([]); setShowBulkDelete(false)
    },
    onError: (e) => toast({ title: 'Gagal menghapus', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const issueMut = useMutation({
    mutationFn: (id) => travelApi.adminIssue(id, { simulate: false }),
    onSuccess: (r) => {
      toast({ title: 'E-tiket diterbitkan', description: r.data?.message })
      qc.invalidateQueries({ queryKey: ['admin-travel'] })
    },
    onError: (e) => {
      // Termasuk kasus PARTIAL (422): refresh daftar agar admin lihat leg yang terbit vs gagal.
      qc.invalidateQueries({ queryKey: ['admin-travel'] })
      toast({ title: 'Gagal / sebagian terbit', description: e?.response?.data?.message || 'Coba lagi.', variant: 'destructive' })
    },
  })

  const confirmIssue = (b) => {
    if (!window.confirm(`Terbitkan e-tiket untuk ${b.code}?\n\nPastikan transfer ${formatRupiah(b.totalPrice)} sudah masuk ke rekening. Tindakan ini menerbitkan tiket ke operator (memotong saldo).`)) return
    issueMut.mutate(b.id)
  }

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }) => travelApi.adminCancel(id, { reason }),
    onSuccess: (r) => {
      toast({ title: 'Pesanan dibatalkan', description: r.data?.message })
      qc.invalidateQueries({ queryKey: ['admin-travel'] })
    },
    onError: (e) => toast({ title: 'Gagal membatalkan', description: e?.response?.data?.message || 'Coba lagi.', variant: 'destructive' }),
  })

  const confirmCancel = (b) => {
    const reason = window.prompt(`Batalkan pesanan ${b.code}?\n\nPesanan yang dibatalkan tidak bisa diterbitkan lagi.\n(Opsional) Tulis alasan pembatalan:`, '')
    if (reason === null) return // user menekan Cancel
    cancelMut.mutate({ id: b.id, reason })
  }

  return (
    <div className="container py-4 sm:py-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center"><Ticket className="w-5 h-5 text-brand-700" /></div>
        <div className="flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-bold">Tiket Travel</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Verifikasi pembayaran & terbitkan e-tiket pesawat / kereta / kapal.</p>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg border hover:bg-muted"><RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /></button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border ${status === t.value ? 'bg-brand text-white border-brand' : 'hover:bg-muted border-transparent'}`}>
            {t.label}
          </button>
        ))}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode / rute..."
            className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
        {isAldeftech && rows.length > 0 && (
          <button onClick={toggleAll}
            className="px-3 py-1.5 rounded-xl border text-sm font-medium hover:bg-muted flex items-center gap-2">
            <input type="checkbox" checked={allSelected} readOnly
              className="w-4 h-4 rounded border-slate-300 text-red-600 pointer-events-none" />
            Pilih semua
          </button>
        )}
        {isAldeftech && selectedIds.length > 0 && (
          <button onClick={() => setShowBulkDelete(true)}
            className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 flex items-center gap-1.5 shadow-sm">
            <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Ticket className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">Tidak ada pesanan.</p></div>
      ) : (
        <div className="space-y-3">
          {rows.map(b => {
            const m = MODA[b.moda] || MODA.pesawat
            const st = STATUS[b.status] || STATUS.pending_payment
            const M = m.Icon, S = st.Icon
            return (
              <div key={b.id} className={`bg-white border rounded-2xl p-4 shadow-card transition-colors ${selectedIds.includes(b.id) ? 'border-red-300 ring-2 ring-red-200' : ''}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex gap-3 min-w-0">
                    {isAldeftech && (
                      <input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleOne(b.id)}
                        className="w-4 h-4 mt-3 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer shrink-0" />
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.cls}`}><M className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm">{b.code}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}><S className="w-3 h-3" /> {st.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{b.originName || b.origin} → {b.destinationName || b.destination}</p>
                      <p className="text-xs text-slate-500">{b.serviceName} · {b.class || '-'} · {b.pax} pax · {fmt(b.departDate)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{b.user?.name} · {b.user?.email} · dibuat {fmt(b.createdAt)}</p>
                      {b.meta?.book?.contact?.email && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-600">Pemesan:</span> {b.meta.book.contact.name || '-'} · {b.meta.book.contact.phone || '-'} · {b.meta.book.contact.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="price-tag text-base">{formatRupiah(b.totalPrice)}</p>
                    {(b.status === 'pending_payment' || b.status === 'paid') && (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button onClick={() => confirmCancel(b)} disabled={cancelMut.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold disabled:opacity-50">
                          {cancelMut.isPending && cancelMut.variables?.id === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Batalkan
                        </button>
                        <button onClick={() => confirmIssue(b)} disabled={issueMut.isPending}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">
                          {issueMut.isPending && issueMut.variables === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Verifikasi & Terbitkan
                        </button>
                      </div>
                    )}
                    {b.status === 'issued' && b.urlEtiket && (
                      <a href={b.urlEtiket} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-emerald-600 font-semibold">Lihat e-tiket →</a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bulk delete confirm (khusus aldeftech@gmail.com) */}
      {showBulkDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus {selectedIds.length} Pesanan?</h3>
            <p className="text-sm text-slate-500 mb-1">
              {selectedIds.length} pesanan tiket travel terpilih akan <strong className="text-red-600">dihapus permanen</strong> dari database.
            </p>
            <p className="text-xs text-slate-400 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkDelete(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
                Batal
              </button>
              <button onClick={() => bulkDeleteMut.mutate()} disabled={bulkDeleteMut.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {bulkDeleteMut.isPending ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
