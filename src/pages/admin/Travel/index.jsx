import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plane, TrainFront, Ship, Ticket, CheckCircle2, Loader2, Clock, XCircle, Search, RefreshCw, Trash2, RotateCcw,
  Power, AlertTriangle, CheckCircle,
} from 'lucide-react'

// Moda travel yang bisa dinonaktifkan sementara (mis. vendor gangguan).
const TRAVEL_MODAS = [
  { id: 'pesawat', label: 'Tiket Pesawat', Icon: Plane },
  { id: 'kereta',  label: 'Tiket Kereta',  Icon: TrainFront },
  { id: 'pelni',   label: 'Tiket Pelni',   Icon: Ship },
]
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
  expired:         { label: 'Kedaluwarsa',    cls: 'bg-orange-100 text-orange-700', Icon: Clock },
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

  // Pesan ulang OTOMATIS (server) — 2 langkah: PREVIEW (bandingkan data lama vs jadwal/harga
  // terkini) → CONFIRM (book ulang + terbitkan e-tiket atas customer asli).
  const [rebookData, setRebookData] = useState(null) // { id, preview }
  const previewMut = useMutation({
    mutationFn: (id) => travelApi.adminRebookPreview(id).then(r => r.data?.data),
    onSuccess: (data, id) => setRebookData({ id, preview: data }),
    onError: (e) => toast({ title: 'Gagal menyiapkan pesan ulang', description: e?.response?.data?.message || 'Coba lagi / proses manual.', variant: 'destructive' }),
  })
  const rebookMut = useMutation({
    mutationFn: (id) => travelApi.adminRebook(id),
    onSuccess: (r) => {
      setRebookData(null)
      toast({ title: 'Pesan ulang berhasil', description: r.data?.message })
      qc.invalidateQueries({ queryKey: ['admin-travel'] })
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['admin-travel'] })
      toast({ title: 'Gagal pesan ulang', description: e?.response?.data?.message || 'Coba lagi / proses manual.', variant: 'destructive' })
    },
  })

  // Cek status vendor & sinkronkan (read-only — TIDAK memotong saldo). Untuk kasus saldo
  // sudah terpotong tapi status kita masih 'Dibayar' (respons issue gagal/timeout).
  const syncMut = useMutation({
    mutationFn: (id) => travelApi.adminSyncVendor(id),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-travel'] })
      toast({ title: r.data?.synced ? 'Tersinkron — tiket terbit' : 'Status vendor', description: r.data?.message })
    },
    onError: (e) => {
      const d = e?.response?.data
      toast({ title: 'Belum bisa dipastikan terbit', description: d?.message || 'Cek manual di Rajabiller.', variant: 'destructive' })
    },
  })

  // ── Status layanan per moda (enable/disable saat vendor gangguan) ──
  const isSuperOrAdmin = ['superadmin', 'admin'].includes(user?.role)
  const { data: disabledModas = [] } = useQuery({
    queryKey: ['admin-travel-service-status'],
    queryFn : () => travelApi.adminServiceStatus().then(r => r.data?.data?.disabled ?? []),
    staleTime: 30_000,
  })
  const toggleModaMut = useMutation({
    mutationFn: (next) => travelApi.adminSetServiceStatus(next),
    onSuccess : (r, next) => {
      qc.setQueryData(['admin-travel-service-status'], r.data?.data?.disabled ?? next)
      qc.invalidateQueries({ queryKey: ['travel-service-status'] }) // sinkron ke landing & halaman cari
    },
    onError   : (e) => toast({ title: 'Gagal ubah status layanan', description: e?.response?.data?.message, variant: 'destructive' }),
  })
  const toggleModa = (id) => {
    const cur = (disabledModas || []).map(String)
    const next = cur.includes(String(id)) ? cur.filter(m => m !== String(id)) : [...cur, String(id)]
    toggleModaMut.mutate(next)
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

      {/* ── Status Layanan — nonaktifkan moda saat vendor gangguan ── */}
      {isSuperOrAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Power className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Status Layanan</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Matikan moda tiket saat vendor gangguan. Moda yang dimatikan tidak bisa dicari/dipesan &amp;
            memunculkan info gangguan di halaman customer (web &amp; app).
          </p>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_MODAS.map(({ id, label, Icon }) => {
              const down = (disabledModas || []).map(String).includes(String(id))
              return (
                <button
                  key={id}
                  onClick={() => toggleModa(id)}
                  disabled={toggleModaMut.isPending}
                  title={down ? 'Klik untuk mengaktifkan kembali' : 'Klik untuk menonaktifkan sementara'}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                    down
                      ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {down
                    ? <><AlertTriangle className="w-3.5 h-3.5" /> {label} · Nonaktif</>
                    : <><CheckCircle className="w-3.5 h-3.5" /> {label} · Aktif</>}
                </button>
              )
            })}
          </div>
        </div>
      )}

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
                    {(b.status === 'pending_payment' || b.status === 'paid' || (isAldeftech && b.status === 'expired')) && (
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
                    {isAldeftech && b.moda === 'pesawat' && !['issued', 'canceled'].includes(b.status) && (
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {b.status === 'paid' && (
                          <button onClick={() => syncMut.mutate(b.id)} disabled={syncMut.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-200 text-violet-600 hover:bg-violet-50 text-xs font-bold disabled:opacity-50"
                            title="Cek status ke vendor tanpa memotong saldo, lalu sinkronkan bila sudah terbit">
                            {syncMut.isPending && syncMut.variables === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Cek Status Vendor
                          </button>
                        )}
                        <button onClick={() => previewMut.mutate(b.id)} disabled={previewMut.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-200 text-sky-600 hover:bg-sky-50 text-xs font-bold disabled:opacity-50">
                          {previewMut.isPending && previewMut.variables === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Pesan Ulang & Terbitkan
                        </button>
                      </div>
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

      {/* Pratinjau Pesan Ulang: bandingkan data lama (expired) vs jadwal/harga terkini */}
      {rebookData && (() => {
        const { old: o, new: n, passengers, priceDiff, recipientEmail, customerName } = rebookData.preview || {}
        const diff = Number(priceDiff) || 0
        const fmtD = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !rebookMut.isPending && setRebookData(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Konfirmasi Pesan Ulang</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Periksa data agar tidak terjadi kesalahan sebelum menerbitkan e-tiket.</p>
                </div>
                <button onClick={() => setRebookData(null)} disabled={rebookMut.isPending} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-50"><XCircle className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Data Lama (Expired)</p>
                    <p className="text-sm font-bold text-slate-800">{o?.airline || '-'}</p>
                    <p className="font-mono text-[11px] font-semibold text-slate-400 mt-0.5">{o?.code}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{o?.origin} → {o?.destination}</p>
                    <p className="text-xs text-slate-500">{o?.flightCode || '-'} · {o?.class || '-'}</p>
                    <p className="text-xs text-slate-500">{fmtD(o?.date)}{o?.departTime ? ` · ${o.departTime}–${o.arriveTime || ''}` : ''}</p>
                    <p className="text-sm font-bold text-slate-700 mt-2">{formatRupiah(o?.totalPrice)}</p>
                  </div>
                  <div className="rounded-xl border-2 border-sky-300 bg-sky-50/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-sky-600 mb-2">Jadwal Baru (Terkini)</p>
                    <p className="text-sm font-bold text-sky-700">{n?.airline || '-'}</p>
                    <p className="font-mono text-[11px] font-semibold text-sky-400 mt-0.5">tiket baru</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{o?.origin} → {o?.destination}</p>
                    <p className="text-xs text-slate-500">{n?.flightCode || '-'} · {n?.class || '-'}</p>
                    <p className="text-xs text-slate-500">{fmtD(n?.date)}{n?.departTime ? ` · ${n.departTime}–${n.arriveTime || ''}` : ''}</p>
                    <p className="text-sm font-bold text-sky-700 mt-2">{formatRupiah(n?.totalPrice)}</p>
                  </div>
                </div>
                {diff !== 0 && (
                  <div className={`rounded-xl p-3 text-xs leading-relaxed ${diff > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
                    {diff > 0
                      ? <>Harga terkini <strong>lebih mahal {formatRupiah(diff)}</strong> dari yang dibayar customer. Selisih ditanggung sesuai kebijakan Anda.</>
                      : <>Harga terkini <strong>lebih murah {formatRupiah(Math.abs(diff))}</strong> dari yang dibayar customer.</>}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Penumpang ({passengers?.length || 0})</p>
                  <div className="space-y-1">
                    {(passengers || []).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm gap-2">
                        <span className="font-medium text-slate-800 truncate">{p.name || '-'}</span>
                        <span className="text-xs text-slate-400 shrink-0">{p.type}{p.id ? ` · ${p.id}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1">E-tiket &amp; voucher dikirim ke</p>
                  <p className="text-sm font-semibold text-slate-900 break-all">{recipientEmail || '—'}</p>
                  {customerName && <p className="text-xs text-slate-500 mt-0.5">a.n. {customerName}</p>}
                  {!recipientEmail && <p className="text-[11px] text-rose-600 mt-1">⚠️ Email customer tidak ditemukan — e-tiket bisa tidak terkirim. Cek data pemesan.</p>}
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-500 leading-relaxed">
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Sistem akan booking ulang penerbangan yang SAMA ke vendor & menerbitkan e-tiket langsung ke email customer di atas. Pastikan pembayaran sudah diterima.
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex gap-3">
                <button onClick={() => setRebookData(null)} disabled={rebookMut.isPending}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Batal</button>
                <button onClick={() => rebookMut.mutate(rebookData.id)} disabled={rebookMut.isPending}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {rebookMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menerbitkan…</> : <><CheckCircle2 className="w-4 h-4" /> Konfirmasi &amp; Terbitkan</>}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
