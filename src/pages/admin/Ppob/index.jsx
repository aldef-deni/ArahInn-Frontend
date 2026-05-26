import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ppobApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import {
  Receipt, RefreshCw, RotateCcw, AlertTriangle, Search, Wallet, X,
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

  const { data: txResp, isLoading } = useQuery({
    queryKey: ['admin-ppob', status, search],
    queryFn : () => ppobApi.adminTrx({ status, q: search, limit: 30 }).then(r => r.data?.data ?? {}),
    refetchInterval: 30_000,
  })
  const trxList = txResp?.data ?? []

  const { data: balance } = useQuery({
    queryKey: ['admin-ppob-balance'],
    queryFn : () => ppobApi.adminBalance().then(r => r.data),
    refetchInterval: 60_000,
  })

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
    onSuccess: () => {
      toast({ title: 'Retry dieksekusi.' })
      qc.invalidateQueries({ queryKey: ['admin-ppob'] })
    },
    onError: (e) => toast({ title: 'Gagal retry', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PPOB Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau transaksi PPOB, refund manual, retry yang failed.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Saldo Raja Biller</p>
              <p className="text-sm font-bold text-emerald-700">{formatRupiah(balance?.balance ?? 0)}</p>
            </div>
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
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {(trx.status === 'failed' || trx.status === 'paid') && (
                      <button onClick={() => retryMutation.mutate(trx.trxCode || trx.trx_code)}
                        disabled={retryMutation.isPending}
                        title="Retry ke Raja Biller"
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
            <p className="text-sm text-slate-600 mb-4">
              Refund transaksi <b className="font-mono">{refundTrx.trxCode || refundTrx.trx_code}</b> sebesar <b>{formatRupiah(refundTrx.totalAmount || refundTrx.total_amount)}</b>?
              <br/>Pastikan transfer manual ke customer sudah dilakukan via bank.
            </p>
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
    refunded    : ['Direfund',  'slate'],
    canceled    : ['Dibatalkan','slate'],
  }
  const [label, color] = map[status] || [status, 'slate']
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>
      {label}
    </span>
  )
}
