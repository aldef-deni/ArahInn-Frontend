import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowRight, X } from 'lucide-react'
import { formatRupiah } from '@/services/api'

/**
 * Konfirmasi perubahan harga setelah prebook.
 *
 * Wajib ada: harga sebelumnya, harga baru, selisih, dan persetujuan customer.
 * Pemesanan TIDAK boleh lanjut tanpa customer menekan tombol setuju.
 */
export default function PriceChangeDialog({ change, onAccept, onReject }) {
  const { t } = useTranslation()
  const previous = Number(change?.previousAmount ?? 0)
  const next     = Number(change?.newAmount ?? 0)
  const diff     = Number(change?.difference ?? next - previous)
  const naik     = diff > 0

  return (
    <div
      role="dialog" aria-modal="true" aria-label={t(naik ? 'supplier.priceUpTitle' : 'supplier.priceDownTitle')}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <button
          type="button" onClick={onReject} aria-label={t('supplier.close')}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-7 pb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${naik ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            {t(naik ? 'supplier.priceUpTitle' : 'supplier.priceDownTitle')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            {t('supplier.priceChangeBody')}
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 divide-y divide-slate-100">
            <Row label={t('supplier.previousPrice')} value={formatRupiah(previous)} muted strike />
            <Row label={t('supplier.newPrice')} value={formatRupiah(next)} strong />
            <Row
              label={t(naik ? 'supplier.diffUp' : 'supplier.diffDown')}
              value={`${naik ? '+' : '-'} ${formatRupiah(Math.abs(diff))}`}
              tone={naik ? 'amber' : 'emerald'}
            />
          </div>

          <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2.5">
            <button
              type="button" onClick={onReject}
              className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t('supplier.rejectNewPrice')}
            </button>
            <button
              type="button" onClick={onAccept}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {t('supplier.acceptNewPrice')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted, strike, strong, tone }) {
  const tones = { amber: 'text-amber-600', emerald: 'text-emerald-600' }
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={[
        'text-sm',
        strong ? 'font-extrabold text-slate-900' : 'font-semibold',
        muted ? 'text-slate-400' : '',
        strike ? 'line-through' : '',
        tone ? tones[tone] : '',
      ].join(' ')}>
        {value}
      </span>
    </div>
  )
}
