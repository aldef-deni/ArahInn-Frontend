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
    <div className="bg-slate-50 sm:bg-transparent min-h-[60vh] pb-6">
      {/* Sticky header mobile */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 sm:hidden">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/ppob" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all" aria-label="Kembali">
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="font-bold text-slate-900 text-base leading-tight flex-1">
            Riwayat PPOB
          </h1>
        </div>
      </header>

      <div className="container py-4 sm:py-6 max-w-3xl">
        <div className="hidden sm:block">
          <Link to="/ppob" className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand mb-3">
            <ChevronLeft className="w-4 h-4" /> Kembali ke PPOB
          </Link>
          <h1 className="text-2xl font-display font-bold text-slate-900 mb-6">Riwayat Transaksi PPOB</h1>
        </div>

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
          const trxCode    = trx.trxCode
          const productName = trx.product?.name || '-'
          const customer   = trx.customer?.number || '-'
          const total      = Number(trx.pricing?.totalAmount || 0)
          const createdAt  = trx.timestamps?.createdAt
          // SN hanya ditampilkan kalau benar-benar ada token/serial (bukan "-" atau kosong)
          const rawSn = trx.serialNumber
          const sn = (rawSn && String(rawSn).trim() && String(rawSn).trim() !== '-') ? rawSn : null

          const target = ['pending', 'paid', 'processing', 'inquired'].includes(trx.status)
            ? `/ppob/pay/${trxCode}`
            : null

          const CardBody = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 truncate">{productName}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-${meta.color}-100 text-${meta.color}-700`}>
                      <StatusIcon className="w-3 h-3" /> {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ke <span className="font-mono">{customer}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{trxCode}</p>
                  {sn && (
                    <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 font-mono break-all">
                      SN: {sn}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{formatRupiah(total)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {createdAt
                      ? new Date(createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </p>
                </div>
              </div>
            </>
          )

          return target ? (
            <Link key={trx.id || trxCode} to={target}
              className="block bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 hover:border-brand active:scale-[0.99] transition-all">
              {CardBody}
            </Link>
          ) : (
            <div key={trx.id || trxCode} className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 hover:border-brand transition-colors">
              {CardBody}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
