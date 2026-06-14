import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ppobApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import {
  Receipt, RefreshCw, RotateCcw, AlertTriangle, Search, Wallet, X, CheckCircle,
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

  const [status, setStatus]     = useState('')
  const [search, setSearch]     = useState('')
  const [refundTrx, setRefundTrx] = useState(null)
  const [refundNotes, setRefundNotes] = useState('')
  const [markPaidTrx, setMarkPaidTrx] = useState(null)
  const [markPaidNotes, setMarkPaidNotes] = useState('')

  const { data: txResp, isLoading } = useQuery({
    queryKey: ['admin-ppob', status, search],
    queryFn : () => ppobApi.adminTrx({ status, q: search, limit: 30 }).then(r => r.data?.data ?? {}),
    refetchInterval: 30_000,
  })
  const trxList = txResp?.data ?? []

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
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-ppob'] })}
          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
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
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">Loading...</td></tr>
            )}
            {!isLoading && trxList.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">Tidak ada transaksi.</td></tr>
            )}
            {trxList.map(trx => (
              <tr key={trx.id} className="border-b border-slate-100 hover:bg-slate-50/50">
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
