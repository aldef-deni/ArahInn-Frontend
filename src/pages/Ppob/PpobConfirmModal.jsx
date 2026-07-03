import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { formatRupiah } from '@/utils'
import {
  X, AlertCircle, ShieldCheck, ShoppingBag, Loader2,
} from 'lucide-react'

/**
 * Modal konfirmasi pembelian PPOB — tampil sebelum trigger backend purchase.
 * Pattern sama dengan PpobPayment (backdrop + slide-up card + X close).
 *
 * Props:
 *   open                  - boolean
 *   onClose
 *   onConfirm             - panggil saat user klik "Ya, Lanjut Bayar"
 *   isLoading
 *   product               - { name, raja_biller_code }
 *   customerNumber        - nomor tujuan (HP / meter / ID pelanggan)
 *   customerLabel         - label ID pelanggan, mis "Nomor HP"
 *   totalAmount           - nominal total yg user bayar
 *   operatorLabel         - mis "Telkomsel" / "PLN" / "GoPay" (optional, accent)
 *   note                  - pesan tambahan (optional)
 */
export default function PpobConfirmModal({
  open, onClose, onConfirm, isLoading,
  product, customerNumber, customerLabel,
  totalAmount, operatorLabel, note, customerName,
}) {
  const { t } = useTranslation()
  customerLabel = customerLabel || t('topup.phoneNumber')
  // Buang istilah internal ("H2H", "Open Denom") dari nama produk yang tampil ke customer.
  const displayName = (product?.name || '-').replace(/\b(?:H2H|OPEN\s*DENOM)\b/gi, '').replace(/\s{2,}/g, ' ').trim() || '-'
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !isLoading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isLoading, onClose])

  if (!open) return null

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !isLoading) onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 animate-fade-in-checkout"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md max-h-[94vh] sm:max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up-checkout"
      >
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 bg-white border-b border-slate-100">
          <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">{t('confirmModal.reviewOrder')}</p>
              <h2 className="font-display text-lg sm:text-xl font-bold leading-tight text-slate-900">
                {t('confirmModal.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
              aria-label={t('confirmModal.close')}
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-6 py-5 sm:py-6">

            {/* Product card */}
            <div className="bg-gradient-to-br from-brand/5 to-orange-50 border border-brand/20 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  {operatorLabel && (
                    <p className="text-[10px] sm:text-xs font-bold text-brand uppercase tracking-wider">
                      {operatorLabel}
                    </p>
                  )}
                  <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug mt-0.5">
                    {displayName}
                  </p>
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="space-y-3 mb-5">
              {customerName && <DetailRow label={t('ppob.nameLabel')} value={customerName} />}
              <DetailRow label={customerLabel} value={customerNumber} mono />
              <div className="border-t border-dashed border-slate-200 my-3" />
              <div className="flex items-end justify-between gap-3">
                <span className="text-xs sm:text-sm text-slate-500 font-semibold">{t('confirmModal.totalPayment')}</span>
                <span className="font-display text-xl sm:text-2xl font-bold text-brand">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-3.5 flex items-start gap-2.5 mb-4">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                <strong>{t('confirmModal.ensureCorrect', { field: customerLabel.toLowerCase() })}</strong>{' '}
                {note || t('confirmModal.warningDefault')}
              </p>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{t('confirmModal.trustBadge')}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-4 sm:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-5 bg-white border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="py-3 sm:py-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {t('confirmModal.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="py-3 sm:py-3.5 rounded-xl bg-brand hover:bg-brand-700 text-white text-sm font-bold active:scale-[0.98] transition-all shadow-md shadow-brand/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('confirmModal.processing')}
                </>
              ) : (
                <>
                  {t('confirmModal.confirm')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs sm:text-sm text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs sm:text-sm font-semibold text-slate-900 text-right ${mono ? 'font-mono tracking-wide' : ''}`}>
        {value}
      </span>
    </div>
  )
}
