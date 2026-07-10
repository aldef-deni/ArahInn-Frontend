import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { ppobApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import {
  Receipt, RefreshCw, RotateCcw, AlertTriangle, Search, Wallet, X, CheckCircle, Trash2,
  Download, Calendar, Zap, ChevronLeft, ChevronRight, Eye, Copy,
} from 'lucide-react'

const STATUS_OPTS = [
  { v: '',           l: 'Semua Status' },
  { v: 'pending',    l: 'Menunggu Bayar' },
  { v: 'paid',       l: 'Dibayar' },
  { v: 'processing', l: 'Diproses' },
  { v: 'success',    l: 'Berhasil' },
  { v: 'failed',     l: 'Gagal' },
  { v: 'refundable', l: 'Perlu Refund' },
  { v: 'refunded',   l: 'Direfund' },
]

export default function AdminPpob() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isAldeftech = (user?.email || '').trim().toLowerCase() === 'aldeftech@gmail.com'

  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [detailTrx, setDetailTrx] = useState(null)

  const [status, setStatus]     = useState('')
  const [search, setSearch]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [page, setPage]         = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [refundTrx, setRefundTrx] = useState(null)
  const [refundNotes, setRefundNotes] = useState('')
  const [markPaidTrx, setMarkPaidTrx] = useState(null)
  const [markPaidNotes, setMarkPaidNotes] = useState('')

  const { data: txResp, isLoading, isFetching } = useQuery({
    queryKey: ['admin-ppob', status, search, dateFrom, dateTo, page],
    queryFn : () => ppobApi.adminTrx({ status, q: search, date_from: dateFrom || undefined, date_to: dateTo || undefined, page, limit: 30 }).then(r => r.data?.data ?? {}),
    refetchInterval: autoRefresh ? 30_000 : false,
    placeholderData: keepPreviousData,
  })
  const trxList     = txResp?.data ?? []
  const currentPage = txResp?.currentPage ?? txResp?.current_page ?? page
  const lastPage    = txResp?.lastPage ?? txResp?.last_page ?? 1
  const totalRows   = txResp?.total ?? trxList.length

  // Export CSV (semua yang cocok filter, bukan cuma halaman ini)
  const doExport = async () => {
    setExporting(true)
    try {
      const res = await ppobApi.adminTrx({ status, q: search, date_from: dateFrom || undefined, date_to: dateTo || undefined, limit: 100000 })
      const rows = res.data?.data?.data ?? []
      const header = ['TRX Code', 'Tanggal', 'User', 'Email', 'Produk', 'Kategori', 'No. Tujuan', 'Total', 'Status', 'RC', 'Alasan']
      const body = rows.map(t => [
        t.trxCode || t.trx_code || '',
        (t.createdAt || t.created_at || '').toString().slice(0, 19).replace('T', ' '),
        t.user?.name || '', t.user?.email || '',
        t.productName || t.product_name || '', t.category?.name || '',
        t.customerNumber || t.customer_number || '',
        t.totalAmount ?? t.total_amount ?? '',
        t.status || '', t.rc || '',
        (t.failureReason || t.failure_reason || '').toString().replace(/[\r\n]+/g, ' '),
      ])
      const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
      const csv = [header, ...body].map(r => r.map(esc).join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: `ppob-monitoring-${new Date().toISOString().slice(0, 10)}.csv` }).click()
      URL.revokeObjectURL(url)
      toast({ title: 'Export selesai', description: `${rows.length} transaksi diekspor ke CSV.` })
    } catch (e) {
      toast({ title: 'Gagal export', description: e?.response?.data?.message || 'Coba lagi.', variant: 'destructive' })
    } finally { setExporting(false) }
  }

  // ── Hapus massal (khusus aldeftech@gmail.com) ───────────────
  useEffect(() => { setSelectedIds([]); setPage(1) }, [status, search, dateFrom, dateTo])
  const allSelected = trxList.length > 0 && trxList.every(t => selectedIds.includes(t.id))
  const toggleAll = () => {
    if (allSelected) {
      const pageIds = new Set(trxList.map(t => t.id))
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...trxList.map(t => t.id)])])
    }
  }
  const toggleOne = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const bulkDeleteMutation = useMutation({
    mutationFn: () => ppobApi.adminBulkDelete(selectedIds),
    onSuccess : (r) => {
      qc.invalidateQueries({ queryKey: ['admin-ppob'] })
      toast({ title: 'Transaksi dihapus.', description: r.data?.message || `${selectedIds.length} data terhapus permanen.` })
      setSelectedIds([]); setShowBulkDelete(false)
    },
    onError: (e) => toast({ title: 'Gagal menghapus', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const forceFreshBalance = useRef(false)
  const { data: balance, refetch: refetchBalance, isFetching: balanceFetching } = useQuery({
    queryKey: ['admin-ppob-balance'],
    queryFn : () => { const f = forceFreshBalance.current; forceFreshBalance.current = false; return ppobApi.adminBalance(f).then(r => r.data) },
    refetchInterval: 120_000, // auto-refresh tiap 2 menit (saldo live, cache 90s di server)
  })
  // Tombol refresh manual → paksa ambil saldo live (bypass cache server).
  const refreshBalanceLive = () => { forceFreshBalance.current = true; refetchBalance() }

  const refundMutation = useMutation({
    mutationFn: ({ code, notes }) => ppobApi.adminRefund(code, { notes }),
    onSuccess: () => {
      toast({ title: 'Refund berhasil diproses.' })
      qc.invalidateQueries({ queryKey: ['admin-ppob'] })
      setRefundTrx(null); setRefundNotes('')
    },
    onError: (e) => toast({ title: 'Gagal refund', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const retryMutation = useMutation({
    mutationFn: (code) => ppobApi.adminRetry(code),
    onSuccess: (res) => {
      const st = res?.data?.data?.status
      const map = {
        success    : 'Re-hit BERHASIL ✅',
        refundable : 'Re-hit masih gagal — perlu refund',
        processing : 'Re-hit terkirim, sedang diproses (tunggu callback)',
      }
      toast({ title: map[st] || 'Re-hit dieksekusi.' })
      qc.invalidateQueries({ queryKey: ['admin-ppob'] })
    },
    onError: (e) => toast({ title: 'Gagal re-hit', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ code, notes }) => ppobApi.adminMarkPaid(code, { notes }),
    onSuccess: () => {
      toast({ title: 'Pembayaran diterima', description: 'Eksekusi vendor dimulai.' })
      qc.invalidateQueries({ queryKey: ['admin-ppob'] })
      setMarkPaidTrx(null); setMarkPaidNotes('')
    },
    onError: (e) => toast({ title: 'Gagal mark-paid', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ code, notes }) => ppobApi.adminCancel(code, { notes }),
    onSuccess: () => {
      toast({ title: 'Transaksi dibatalkan', description: 'Status telah di-set canceled.' })
      qc.invalidateQueries({ queryKey: ['admin-ppob'] })
      setMarkPaidTrx(null); setMarkPaidNotes('')
    },
    onError: (e) => toast({ title: 'Gagal batalkan', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const LOW_BALANCE = 5_000_000
  const bal = balance?.balance ?? 0
  const isLow = bal > 0 && bal < LOW_BALANCE

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PPOB Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau transaksi PPOB, refund manual, retry yang failed.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 border rounded-xl flex items-center gap-3 ${isLow ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-200'}`}>
            <Wallet className={`w-4 h-4 shrink-0 ${isLow ? 'text-red-600' : 'text-emerald-600'}`} />
            <div className="leading-tight">
              <p className={`text-[10px] font-bold uppercase ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>Saldo Raja Biller</p>
              <p className={`text-sm font-bold ${isLow ? 'text-red-700' : 'text-emerald-700'}`}>
                {bal > 0 ? formatRupiah(bal) : '—'}
              </p>
              {isLow && (
                <p className="text-[9px] text-red-600 font-bold flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> Saldo rendah — segera top up!
                </p>
              )}
              {balance?.updatedAt && (
                <p className={`text-[9px] ${isLow ? 'text-red-500/70' : 'text-emerald-600/70'}`}>
                  per {new Date(balance.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <button
              onClick={refreshBalanceLive}
              disabled={balanceFetching}
              title="Muat ulang saldo (live)"
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isLow ? 'hover:bg-red-100' : 'hover:bg-emerald-100'}`}
            >
              <RefreshCw className={`w-4 h-4 ${isLow ? 'text-red-600' : 'text-emerald-600'} ${balanceFetching ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="https://wr.rajabiller.com/login?callbackUrl=https%3A%2F%2Fwr.rajabiller.com%2Fhome"
              target="_blank"
              rel="noopener noreferrer"
              title="Buka web report Rajabiller"
              className={`text-[10px] font-semibold hover:underline whitespace-nowrap ${isLow ? 'text-red-700' : 'text-emerald-700'}`}
            >
              Web Report ↗
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex items-center gap-3 flex-wrap">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
          {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari TRX code / nomor pelanggan..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm" />
        </div>
        {/* Filter rentang tanggal */}
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo || undefined}
            className="px-2.5 py-2 border border-slate-200 rounded-xl text-sm" title="Dari tanggal" />
          <span className="text-slate-400">–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined}
            className="px-2.5 py-2 border border-slate-200 rounded-xl text-sm" title="Sampai tanggal" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} title="Reset tanggal"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
          )}
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-ppob'] })}
          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold flex items-center gap-1.5">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
        {/* Toggle auto-refresh 30 detik */}
        <button onClick={() => setAutoRefresh(v => !v)}
          title={autoRefresh ? 'Auto-refresh tiap 30 detik AKTIF' : 'Auto-refresh MATI'}
          className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-colors ${
            autoRefresh ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}>
          <Zap className={`w-4 h-4 ${autoRefresh ? 'fill-emerald-500 text-emerald-600' : ''}`} /> Auto {autoRefresh ? 'On' : 'Off'}
        </button>
        {/* Export CSV (semua yang cocok filter) */}
        <button onClick={doExport} disabled={exporting}
          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
          {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
        </button>
        {isAldeftech && selectedIds.length > 0 && (
          <button onClick={() => setShowBulkDelete(true)}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 flex items-center gap-1.5 shadow-sm">
            <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {isAldeftech && (
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} title="Pilih semua"
                    className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer align-middle" />
                </th>
              )}
              <th className="text-left px-4 py-3 font-semibold text-slate-700">TRX Code</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">User</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Produk</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">No. Tujuan</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-700">Total</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={isAldeftech ? 8 : 7} className="text-center py-12 text-slate-400">Loading...</td></tr>
            )}
            {!isLoading && trxList.length === 0 && (
              <tr><td colSpan={isAldeftech ? 8 : 7} className="text-center py-12 text-slate-400">Tidak ada transaksi.</td></tr>
            )}
            {trxList.map(trx => (
              <tr key={trx.id} className={`border-b border-slate-100 ${selectedIds.includes(trx.id) ? 'bg-red-50/60' : 'hover:bg-slate-50/50'}`}>
                {isAldeftech && (
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(trx.id)} onChange={() => toggleOne(trx.id)}
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer align-middle" />
                  </td>
                )}
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{trx.trxCode || trx.trx_code}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-700">{trx.user?.name || '-'}</p>
                  <p className="text-[10px] text-slate-400">{trx.user?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-700">{trx.productName || trx.product_name}</p>
                  <p className="text-[10px] text-slate-400">{trx.category?.name}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{trx.customerNumber || trx.customer_number}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">
                  {formatRupiah(trx.totalAmount || trx.total_amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={trx.status} />
                  {['failed', 'refundable', 'processing'].includes(trx.status) && (() => {
                    const reason = trx.paymentResponse?.status || trx.failureReason || trx.rcMessage
                    if (!reason) return null
                    return (
                      <p className="text-[10px] text-slate-400 mt-1 mx-auto max-w-[170px] leading-tight line-clamp-2"
                        title={`RC ${trx.rc || '-'}: ${reason}`}>
                        {trx.rc ? <span className="font-mono text-slate-500">RC {trx.rc}</span> : null} {reason}
                      </p>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setDetailTrx(trx)}
                      title="Lihat detail (ref Rajabiller, token listrik, dll)"
                      className="p-2 rounded-lg hover:bg-brand/10 text-brand">
                      <Eye className="w-4 h-4" />
                    </button>
                    {trx.status === 'pending' && (
                      <button onClick={() => { setMarkPaidTrx(trx); setMarkPaidNotes('') }}
                        title="Tandai pembayaran diterima → eksekusi ke Raja Biller"
                        className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {(trx.status === 'failed' || trx.status === 'paid' || trx.status === 'refundable') && (
                      <button onClick={() => {
                        const code = trx.trxCode || trx.trx_code
                        if (window.confirm(`Re-hit transaksi ${code} (${trx.productName || trx.product_name}) ke Raja Biller?\n\nSistem akan kirim ulang dengan nomor referensi BARU. Lakukan hanya jika produk sudah open kembali.`))
                          retryMutation.mutate(code)
                      }}
                        disabled={retryMutation.isPending}
                        title="Re-hit ke Raja Biller (kirim ulang, ref baru)"
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {(trx.status === 'failed' || trx.status === 'refundable') && (
                      <button onClick={() => { setRefundTrx(trx); setRefundNotes('') }}
                        title="Manual refund"
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <p className="text-xs text-slate-500">
          Menampilkan {trxList.length} dari <b>{Number(totalRows).toLocaleString('id-ID')}</b> transaksi · Halaman {currentPage} / {lastPage}
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1 || isFetching}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>
          <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={currentPage >= lastPage || isFetching}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1">
            Berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail transaksi modal */}
      {detailTrx && (() => {
        const trx    = detailTrx
        const struk  = trx.templateStruk || trx.template_struk || {}
        const kwh    = struk.jumlah_kwh || struk.jumlahKwh
        const tarif  = struk.tarif_daya || struk.tarifDaya
        const sn     = trx.serialNumber || trx.serial_number
        const isPln  = /pln|listrik|token/i.test(`${trx.productName || trx.product_name || ''} ${trx.category?.name || ''}`)
        const reason = trx.failureReason || trx.failure_reason || trx.paymentResponse?.status
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetailTrx(null)}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Detail Transaksi</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{trx.trxCode || trx.trx_code}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={trx.status} />
                  <button onClick={() => setDetailTrx(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* Token listrik — ditonjolkan */}
                {sn && (
                  <div className={`rounded-xl border-2 p-3.5 ${isPln ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${isPln ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isPln ? '⚡ Token Listrik' : 'Token / Nomor Seri (SN)'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-slate-900 break-all flex-1">{isPln ? formatToken(sn) : sn}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(String(sn).replace(/\D/g, '') || String(sn)); toast({ title: 'Token disalin' }) }}
                        className="p-2 rounded-lg hover:bg-white/70 text-slate-500 shrink-0"><Copy className="w-4 h-4" /></button>
                    </div>
                    {(kwh || tarif) && (
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {kwh ? <>Jumlah: <b>{kwh} kWh</b></> : null}{kwh && tarif ? ' · ' : ''}{tarif ? <>Tarif/Daya: <b>{tarif}</b></> : null}
                      </p>
                    )}
                  </div>
                )}
                {/* Info transaksi */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  <DetailItem label="Kode Transaksi (kita)" value={trx.trxCode || trx.trx_code} mono copy toast={toast} />
                  <DetailItem label="Ref ke Rajabiller" value={trx.ref1 || '-'} mono copy toast={toast} />
                  <DetailItem label="Ref Rajabiller (vendor)" value={trx.rajaBillerRef || trx.raja_biller_ref || '-'} mono copy toast={toast} />
                  <DetailItem label="RC Vendor" value={trx.rc || '-'} mono />
                  <DetailItem label="Produk" value={trx.productName || trx.product_name} />
                  <DetailItem label="Kategori" value={trx.category?.name || '-'} />
                  <DetailItem label={isPln ? 'No. Meter / ID Pelanggan' : 'No. Tujuan'} value={trx.customerNumber || trx.customer_number} mono copy toast={toast} />
                  <DetailItem label="Nama Pelanggan" value={trx.customerName || trx.customer_name || '-'} />
                  <DetailItem label="Total" value={formatRupiah(trx.totalAmount || trx.total_amount)} />
                  <DetailItem label="Pemesan" value={trx.user?.name || '-'} sub={trx.user?.email} />
                </div>
                {reason && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-rose-600 mb-0.5">Alasan Gagal {trx.rc ? `(RC ${trx.rc})` : ''}</p>
                    <p className="text-sm text-rose-800">{reason}</p>
                  </div>
                )}
                {(trx.strukUrl || trx.struk_url) && (
                  <a href={trx.strukUrl || trx.struk_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
                    Lihat struk / bukti ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Mark Paid modal */}
      {markPaidTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-slate-900">Verifikasi Pembayaran</h3>
              <button onClick={() => setMarkPaidTrx(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-emerald-700 font-semibold mb-1">Verifikasi mutasi rekening sebelum mark-paid:</p>
              <p className="text-sm text-slate-700">Trx: <b className="font-mono">{markPaidTrx.trxCode || markPaidTrx.trx_code}</b></p>
              <p className="text-sm text-slate-700">Nominal: <b>{formatRupiah(markPaidTrx.totalAmount || markPaidTrx.total_amount)}</b></p>
              <p className="text-sm text-slate-700">Produk: {markPaidTrx.productName || markPaidTrx.product_name} → <span className="font-mono">{markPaidTrx.customerNumber || markPaidTrx.customer_number}</span></p>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
              Setelah klik &quot;Ya, Mark Paid&quot;, sistem akan auto eksekusi ke Raja Biller untuk kirim pulsa/token. <strong>Pastikan dana sudah benar masuk rekening.</strong>
            </p>
            <textarea
              value={markPaidNotes}
              onChange={e => setMarkPaidNotes(e.target.value)}
              placeholder="Catatan (opsional) — mis. nominal+kode unik cocok, jam mutasi BCA xxx..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 mb-4"
            />
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={() => setMarkPaidTrx(null)}
                disabled={markPaidMutation.isPending || cancelMutation.isPending}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Tutup
              </button>
              <button
                onClick={() => {
                  if (!confirm('Yakin membatalkan transaksi ini? Status akan jadi canceled dan tidak bisa dipulihkan.')) return
                  cancelMutation.mutate({ code: markPaidTrx.trxCode || markPaidTrx.trx_code, notes: markPaidNotes || 'Dibatalkan via PPOB monitoring' })
                }}
                disabled={cancelMutation.isPending || markPaidMutation.isPending}
                className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 disabled:opacity-50">
                {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan'}
              </button>
              <button
                onClick={() => markPaidMutation.mutate({ code: markPaidTrx.trxCode || markPaidTrx.trx_code, notes: markPaidNotes })}
                disabled={markPaidMutation.isPending || cancelMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                {markPaidMutation.isPending ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-slate-900">Konfirmasi Refund</h3>
              <button onClick={() => setRefundTrx(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Refund transaksi <b className="font-mono">{refundTrx.trxCode || refundTrx.trx_code}</b> sebesar <b>{formatRupiah(refundTrx.totalAmount || refundTrx.total_amount)}</b>?
              <br/>Pastikan transfer manual ke customer sudah dilakukan via bank.
            </p>
            {(() => {
              const reason = refundTrx.paymentResponse?.status || refundTrx.failureReason || refundTrx.rcMessage
              if (!reason) return null
              const processing = /(SEDANG DIPROSES|DALAM PROSES|MASIH DIPROSES|PENDING|MENUNGGU)/i.test(reason)
              return (
                <div className={`rounded-xl px-3 py-2.5 mb-4 text-xs border ${processing ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <span className="font-semibold">Alasan gagal {refundTrx.rc ? `(RC ${refundTrx.rc})` : ''}:</span> {reason}
                  {processing && <p className="mt-1 font-semibold">⚠️ Vendor menyatakan masih DIPROSES — sebaiknya jangan refund dulu, tunggu hasil akhir agar tidak double.</p>}
                </div>
              )
            })()}
            <textarea
              value={refundNotes}
              onChange={e => setRefundNotes(e.target.value)}
              placeholder="Catatan refund (opsional) — mis. bukti transfer BCA xxx..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRefundTrx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button
                onClick={() => refundMutation.mutate({ code: refundTrx.trxCode || refundTrx.trx_code, notes: refundNotes })}
                disabled={refundMutation.isPending}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                {refundMutation.isPending ? 'Memproses...' : 'Ya, Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm (khusus aldeftech@gmail.com) */}
      {showBulkDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus {selectedIds.length} Transaksi?</h3>
            <p className="text-sm text-slate-500 mb-1">
              {selectedIds.length} data transaksi PPOB terpilih akan <strong className="text-red-600">dihapus permanen</strong> dari database.
            </p>
            <p className="text-xs text-slate-400 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkDelete(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
                Batal
              </button>
              <button onClick={() => bulkDeleteMutation.mutate()} disabled={bulkDeleteMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {bulkDeleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending     : ['Menunggu',  'amber'],
    paid        : ['Dibayar',   'blue'],
    processing  : ['Diproses',  'blue'],
    success     : ['Berhasil',  'emerald'],
    failed      : ['Gagal',     'red'],
    refundable  : ['Perlu Refund', 'amber'],
    refunded    : ['Direfund',  'red'],
    canceled    : ['Dibatalkan','red'],
  }
  const [label, color] = map[status] || [status, 'slate']
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>
      {label}
    </span>
  )
}

// Format token PLN ke grup 4 digit: "1234567890123456" → "1234 5678 9012 3456"
function formatToken(raw) {
  if (!raw) return ''
  const d = String(raw).replace(/\D/g, '')
  if (d.length < 8) return String(raw)
  return d.match(/.{1,4}/g)?.join(' ') || String(raw)
}

function DetailItem({ label, value, mono, copy, toast, sub }) {
  const hasVal = value !== undefined && value !== null && value !== '' && value !== '-'
  const doCopy = () => { try { navigator.clipboard?.writeText(String(value)) } catch { /* noop */ }; toast?.({ title: 'Disalin' }) }
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{hasVal ? value : '-'}</span>
        {copy && hasVal && (
          <button onClick={doCopy} className="p-1 rounded hover:bg-slate-100 text-slate-400 shrink-0"><Copy className="w-3.5 h-3.5" /></button>
        )}
      </div>
      {sub && <p className="text-[10px] text-slate-400 truncate">{sub}</p>}
    </div>
  )
}
