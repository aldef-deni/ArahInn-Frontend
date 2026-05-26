import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ppobApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import { Receipt, ChevronLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

const STATUS_META = {
  pending     : { label: 'Menunggu Bayar', color: 'amber',  Icon: Clock },
  paid        : { label: 'Dibayar',        color: 'blue',   Icon: Clock },
  processing  : { label: 'Diproses',       color: 'blue',   Icon: Clock },
  success     : { label: 'Berhasil',       color: 'emerald',Icon: CheckCircle },
  failed      : { label: 'Gagal',          color: 'red',    Icon: XCircle },
  refundable  : { label: 'Akan Direfund',  color: 'amber',  Icon: RotateCcw },
  refunded    : { label: 'Direfund',       color: 'slate',  Icon: RotateCcw },
  canceled    : { label: 'Dibatalkan',     color: 'slate',  Icon: XCircle },
}

export default function PpobHistory() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['ppob-my-trx'],
    queryFn : () => ppobApi.myTransactions({ limit: 30 }).then(r => r.data?.data ?? { data: [] }),
  })
  const trxList = response?.data ?? []

  return (
    <div className="container py-6 max-w-3xl">
      <Link to="/ppob" className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand mb-3">
        <ChevronLeft className="w-4 h-4" /> Kembali ke PPOB
      </Link>

      <h1 className="text-2xl font-display font-bold text-slate-900 mb-6">Riwayat Transaksi PPOB</h1>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      )}

      {!isLoading && trxList.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Belum ada transaksi.</p>
          <Link to="/ppob" className="inline-block mt-4 text-sm font-semibold text-brand hover:underline">
            Mulai transaksi pertama →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {trxList.map(trx => {
          const meta = STATUS_META[trx.status] || STATUS_META.pending
          const StatusIcon = meta.Icon
          return (
            <div key={trx.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-brand transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 truncate">{trx.productName || trx.product_name}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-${meta.color}-100 text-${meta.color}-700`}>
                      <StatusIcon className="w-3 h-3" /> {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ke <span className="font-mono">{trx.customerNumber || trx.customer_number}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{trx.trxCode || trx.trx_code}</p>
                  {trx.serialNumber && (
                    <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 font-mono break-all">
                      SN: {trx.serialNumber}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{formatRupiah(trx.totalAmount || trx.total_amount)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(trx.createdAt || trx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
