import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ppobApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import { Receipt, Clock, CheckCircle, XCircle, RotateCcw, Zap, Download, Loader2 } from 'lucide-react'

/**
 * Reusable PPOB transaction list — dipakai di PpobHistory page + OrderHistory tab.
 * Tanpa header/back button supaya bisa di-embed di tempat lain.
 */

const STATUS_META = {
  pending     : { label: 'Menunggu Bayar', color: 'amber',   Icon: Clock },
  paid        : { label: 'Dibayar',        color: 'blue',    Icon: Clock },
  processing  : { label: 'Diproses',       color: 'blue',    Icon: Clock },
  success     : { label: 'Berhasil',       color: 'emerald', Icon: CheckCircle },
  failed      : { label: 'Gagal',          color: 'red',     Icon: XCircle },
  refundable  : { label: 'Akan Direfund',  color: 'amber',   Icon: RotateCcw },
  refunded    : { label: 'Direfund',       color: 'slate',   Icon: RotateCcw },
  canceled    : { label: 'Dibatalkan',     color: 'slate',   Icon: XCircle },
}

export default function PpobTransactionList({ limit = 30, emptyCta = true }) {
  const [downloading, setDownloading] = useState(null)
  const { data: response, isLoading } = useQuery({
    queryKey: ['ppob-my-trx', limit],
    queryFn : () => ppobApi.myTransactions({ limit }).then(r => r.data?.data ?? { data: [] }),
  })
  const trxList = response?.data ?? []

  const downloadStruk = async (e, trxCode) => {
    e.preventDefault(); e.stopPropagation()
    setDownloading(trxCode)
    try {
      const res = await ppobApi.downloadReceipt(trxCode)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      Object.assign(document.createElement('a'), { href: url, download: `E-Struk-${trxCode}.pdf` }).click()
      URL.revokeObjectURL(url)
    } catch { /* noop */ }
    finally { setDownloading(null) }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
      </div>
    )
  }

  if (trxList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">Belum ada transaksi PPOB.</p>
        <p className="text-xs text-slate-500 mt-1">Mulai dari Pulsa, Token PLN, atau Top Up E-Wallet.</p>
        {emptyCta && (
          <Link to="/topup-tagihan" className="inline-block mt-5 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-700 active:scale-95 transition-all">
            Mulai Transaksi →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trxList.map(trx => {
        const meta       = STATUS_META[trx.status] || STATUS_META.pending
        const StatusIcon = meta.Icon
        const trxCode    = trx.trxCode
        const productName = trx.product?.name || '-'
        const customer   = trx.customer?.number || '-'
        const total      = Number(trx.pricing?.totalAmount || 0)
        const createdAt  = trx.timestamps?.createdAt
        const rawSn      = trx.serialNumber
        const sn = (rawSn && String(rawSn).trim() && String(rawSn).trim() !== '-') ? rawSn : null
        const isPln = (productName).toUpperCase().includes('PLN')
        const isPlnSuccess = trx.status === 'success' && isPln && sn

        const target = trxCode ? `/topup-tagihan/pay/${trxCode}` : null

        const isSuccess = trx.status === 'success'
        const isDownloading = downloading === trxCode
        const CardBody = (
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
                isPlnSuccess ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                    <Zap className="w-3.5 h-3.5" /> Token PLN tersedia — Tap untuk lihat
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 font-mono break-all">
                    {isPln ? 'Token: ' : 'SN: '}{sn}
                  </p>
                )
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
        )

        const StrukBtn = isSuccess && trxCode ? (
          <button onClick={(e) => downloadStruk(e, trxCode)} disabled={isDownloading}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 active:scale-[0.98] transition-all disabled:opacity-60">
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Unduh Struk PDF
          </button>
        ) : null

        return target ? (
          <Link key={trx.id || trxCode} to={target}
            className="block bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 hover:border-brand active:scale-[0.99] transition-all">
            {CardBody}
            {StrukBtn}
          </Link>
        ) : (
          <div key={trx.id || trxCode} className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 hover:border-brand transition-colors">
            {CardBody}
            {StrukBtn}
          </div>
        )
      })}
    </div>
  )
}
