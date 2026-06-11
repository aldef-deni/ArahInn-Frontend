import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ppobApi, paymentApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import {
  Clock, Copy, CheckCircle, XCircle, ArrowLeft, Info, Loader2,
  Receipt, Building2, X, Zap, Smartphone, Wallet, ShoppingBag, Share2,
} from 'lucide-react'
import SEO from '@/components/SEO'

function useCountdown(expiresAt) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
    setSecs(calc())
    const t = setInterval(() => setSecs(calc()), 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return { secs, display: `${h}:${m}:${s}`, expired: secs === 0 && !!expiresAt }
}

const STATUS_PRESENTATION = {
  pending     : { labelKey: 'ppob.payStatusPending',    color: 'amber',   Icon: Clock },
  paid        : { labelKey: 'ppob.payStatusPaid',       color: 'blue',    Icon: CheckCircle },
  processing  : { labelKey: 'ppob.payStatusProcessing', color: 'blue',    Icon: Loader2 },
  inquired    : { labelKey: 'ppob.payStatusInquired',   color: 'amber',   Icon: Clock },
  success     : { labelKey: 'ppob.payStatusSuccess',    color: 'emerald', Icon: CheckCircle },
  failed      : { labelKey: 'ppob.payStatusFailed',     color: 'red',     Icon: XCircle },
  refundable  : { labelKey: 'ppob.payStatusRefundable', color: 'amber',   Icon: Clock },
  refunded    : { labelKey: 'ppob.payStatusRefunded',   color: 'slate',   Icon: Clock },
}

export default function PpobPayment() {
  const { t } = useTranslation()
  const { trxCode } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [copiedField, setCopiedField] = useState('')

  // Mode pembayaran (manual/doku) + bank info
  const { data: modeData } = useQuery({
    queryKey: ['payment-mode'],
    queryFn : () => paymentApi.mode().then(r => r.data?.data),
    staleTime: 60_000,
  })
  const paymentMode = modeData?.mode ?? 'manual'
  const manualBank  = modeData?.bank

  // Lock body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Back ke previous page (kalau dibuka dari history/orders). Fallback ke /ppob.
  const handleClose = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/topup-tagihan")
  }
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) handleClose() }

  // Transaksi PPOB
  const { data: trx, isLoading } = useQuery({
    queryKey: ['ppob-trx', trxCode],
    queryFn : () => ppobApi.getTrx(trxCode).then(r => r.data?.data),
    refetchInterval: (q) => {
      const s = q.state.data?.status
      // polling lebih sering saat menunggu konfirmasi / sedang diproses
      return ['pending', 'paid', 'processing', 'inquired'].includes(s) ? 8000 : false
    },
  })

  const expiresAt = trx?.timestamps?.expiresAt
  const { display: countdown, expired } = useCountdown(expiresAt)

  const totalAmount = Number(trx?.pricing?.totalAmount || 0)
  // Kode unik 3 digit deterministik dari trx_code agar konsisten saat refetch
  const uniqueCode = (() => {
    if (!trxCode) return 0
    let h = 0
    for (let i = 0; i < trxCode.length; i++) h = (h * 31 + trxCode.charCodeAt(i)) >>> 0
    return h % 1000
  })()
  const finalAmount = totalAmount + uniqueCode

  const copyText = (text, field) => {
    if (text == null) return
    navigator.clipboard.writeText(String(text))
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  if (isLoading) {
    return (
      <ModalShell onClose={handleClose} onBackdrop={handleBackdrop}>
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </ModalShell>
    )
  }

  if (!trx) {
    return (
      <ModalShell onClose={handleClose} onBackdrop={handleBackdrop}>
        <div className="py-16 text-center px-6">
          <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">{t('ppob.trxNotFound')}</p>
          <button onClick={handleClose} className="inline-block mt-4 text-sm font-semibold text-brand hover:underline">
            {t('ppob.backToPpob')}
          </button>
        </div>
      </ModalShell>
    )
  }

  const status     = trx.status || 'pending'
  const presentation = STATUS_PRESENTATION[status] || STATUS_PRESENTATION.pending
  const StatusIcon = presentation.Icon

  // ── Terminal states ──
  if (status === 'success') {
    return (
      <ModalShell onClose={handleClose} onBackdrop={handleBackdrop}>
        <SuccessView trx={trx} navigate={navigate} />
      </ModalShell>
    )
  }
  if (['failed', 'refundable', 'refunded'].includes(status)) {
    return (
      <ModalShell onClose={handleClose} onBackdrop={handleBackdrop}>
        <FailedView trx={trx} status={status} navigate={navigate} />
      </ModalShell>
    )
  }

  // ── Active payment / waiting states (modal) ──
  return (
    <ModalShell onClose={handleClose} onBackdrop={handleBackdrop}>
      <SEO title={t('ppob.paySeoTitle')} description={t('ppob.paySeoDesc')} />

      <div className="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">

      {/* Status indicator */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-semibold bg-${presentation.color}-50 border border-${presentation.color}-200 text-${presentation.color}-700`}>
        <StatusIcon className={`w-4 h-4 shrink-0 ${status === 'processing' ? 'animate-spin' : ''}`} />
        <span className="truncate">{t(presentation.labelKey)}</span>
        {expiresAt && !expired && status === 'pending' && (
          <span className="ml-auto font-mono text-[10px] sm:text-xs shrink-0">{countdown}</span>
        )}
      </div>

      {/* Transaction summary */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 font-bold">{t('ppob.product')}</p>
            <p className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2">{trx.product?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{trx.customer?.number}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 font-bold">{t('ppob.code')}</p>
            <p className="font-mono text-xs sm:text-sm font-bold text-brand">{trx.trxCode}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs sm:text-sm">
          <Row label={t('ppob.billOrPrice')} value={formatRupiah(trx.pricing?.tagihan || totalAmount)} />
          {Number(trx.pricing?.adminFee || 0) > 0 && (
            <Row label={t('ppob.adminFee')} value={formatRupiah(trx.pricing?.adminFee)} />
          )}
          <Row label={t('ppob.subtotal')} value={formatRupiah(totalAmount)} />
          {paymentMode === 'manual' && (
            <Row label={t('ppob.uniqueCode')} value={`+ ${String(uniqueCode).padStart(3, '0')}`} accent="brand" />
          )}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold">
            <span className="text-sm sm:text-base">{t('ppob.totalTransfer')}</span>
            <span className="text-base sm:text-xl text-brand">{formatRupiah(finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Manual transfer instructions */}
      {paymentMode === 'manual' && manualBank && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          {/* Amount */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs sm:text-sm text-slate-500">{t('ppob.transferAmount')}</p>
            <span className="text-[10px] sm:text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">{t('ppob.uniqueNominal')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 rounded-xl px-3 sm:px-4 py-3 sm:py-4 mb-2">
            <span className="font-mono text-xl sm:text-3xl font-black tracking-tight flex-1 min-w-0 text-slate-900 truncate">
              {formatRupiah(finalAmount)}
            </span>
            <button onClick={() => copyText(finalAmount, 'amount')}
              className="p-2 rounded-xl hover:bg-white active:scale-90 transition-all shrink-0">
              {copiedField === 'amount'
                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                : <Copy className="w-5 h-5 text-slate-500" />}
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 sm:mb-5 flex items-start gap-2 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {t('ppob.transferExactInfo', { amount: formatRupiah(finalAmount), code: String(uniqueCode).padStart(3, '0') })}
            </span>
          </p>

          {/* Bank info */}
          <div className="space-y-2 mb-4 sm:mb-5">
            <FieldRow label={t('ppob.destBank')} value={manualBank.bankName} />
            <FieldRow label={t('ppob.accountNumberFull')} value={manualBank.accountNumber}
              onCopy={() => copyText(manualBank.accountNumber, 'rek')}
              copied={copiedField === 'rek'} mono />
            <FieldRow label={t('ppob.accountNameLabel')} value={manualBank.accountName} />
          </div>

          {/* How to pay */}
          <div className="space-y-2 text-xs sm:text-sm bg-slate-50 rounded-xl p-3.5 sm:p-4 mb-4 sm:mb-5">
            <p className="font-semibold text-slate-700 mb-2">{t('ppob.howToPay')}</p>
            <ol className="space-y-1.5 list-decimal list-inside text-slate-600 leading-relaxed">
              <li>{t('ppob.payInstr1', { amount: formatRupiah(finalAmount) })}</li>
              <li>{t('ppob.payInstr2')}</li>
              <li>{t('ppob.payInstr3')}</li>
              <li>{t('ppob.payInstr4', { number: trx.customer?.number })}</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
              {t('ppob.paidNoConfirm')}
            </p>
          </div>
        </div>
      )}

      {paymentMode !== 'manual' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          {t('ppob.modeUnsupported', { mode: paymentMode })}
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
        <Link to="/topup-tagihan/history"
          className="text-center py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
          {t('ppob.history')}
        </Link>
        <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer"
          className="text-center py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] transition-all">
          {t('ppob.chatAdmin')}
        </a>
      </div>
      </div>
    </ModalShell>
  )
}

/**
 * ModalShell — overlay backdrop + centered card dengan slide-up animation
 * (pattern sama dengan Checkout akomodasi).
 */
function ModalShell({ children, onClose, onBackdrop }) {
  const { t } = useTranslation()
  return (
    <div
      onClick={onBackdrop}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 animate-fade-in-checkout"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-2xl max-h-[94vh] sm:max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up-checkout"
      >
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 bg-white border-b border-slate-100">
          <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">{t('ppob.paymentLabel')}</p>
              <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold leading-tight text-slate-900 truncate">
                {t('ppob.completePayment')}
              </h1>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all shrink-0"
              aria-label={t('ppob.close')}
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={accent === 'brand' ? 'font-semibold text-brand' : 'text-slate-700'}>{value}</span>
    </div>
  )
}

function FieldRow({ label, value, onCopy, copied, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs sm:text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs sm:text-sm font-semibold text-slate-900 truncate ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="p-1.5 rounded-lg hover:bg-slate-100 active:scale-90 transition-all shrink-0">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Detect kategori trx dari product code/name + category.
 * Return: 'pln' | 'pulsa' | 'ewallet' | 'tagihan' | 'game' | 'other'
 */
function detectTrxKind(trx) {
  const code = (trx.product?.code || '').toUpperCase()
  const name = (trx.product?.name || '').toUpperCase()
  const catCode = (trx.category?.code || '').toLowerCase()
  if (catCode === 'pln' || code.startsWith('PLN') || name.startsWith('PLN ')) return 'pln'
  if (catCode === 'pulsa-data' || /TELKOMSEL|INDOSAT|XL\b|AXIS|TRI|SMART|FREN|BYU/.test(name)) return 'pulsa'
  if (catCode === 'ewallet' || /GOPAY|OVO|DANA|SHOPEE|LINKAJA|SPEEDCASH/.test(name)) return 'ewallet'
  if (catCode === 'tagihan' || /PDAM|BPJS|TELKOM|TV|PAJAK|SAMSAT|PBB/.test(name)) return 'tagihan'
  if (catCode === 'game' || /MOBILE\s*LEGEND|FREE\s*FIRE|PUBG|VOUCHER GAME/.test(name)) return 'game'
  return 'other'
}

/** Format token PLN ke grup 4 digit: 1234567890123456 → "1234 5678 9012 3456" */
function formatToken(raw) {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length < 8) return String(raw)
  return digits.match(/.{1,4}/g)?.join(' ') || String(raw)
}

function SuccessView({ trx, navigate }) {
  const { t } = useTranslation()
  const [copied, setCopied]   = useState(false)
  const kind = detectTrxKind(trx)
  const sn   = trx.serialNumber
  const hasSn = sn && String(sn).trim() && String(sn).trim() !== '-'

  const copyToken = () => {
    if (!sn) return
    navigator.clipboard.writeText(String(sn).replace(/\D/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareToken = async () => {
    if (!navigator.share || !sn) return
    try {
      await navigator.share({
        title: t('ppob.shareTokenTitle', { name: trx.product?.name }),
        text : t('ppob.shareTokenText', { sn, number: trx.customer?.number, name: trx.customer?.name || '-' }),
      })
    } catch {}
  }

  // Detect PLN specific data dari template_struk atau payment_response
  const struk = trx.templateStruk || {}
  const kwh   = struk.jumlah_kwh || struk.jumlahKwh
  const tarif = struk.tarif_daya || struk.tarifDaya

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      {/* Hero check icon */}
      <div className="text-center mb-5 sm:mb-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-30 animate-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <CheckCircle className="w-9 h-9 sm:w-11 sm:h-11 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-bold mt-4 text-slate-900">
          {t('ppob.trxSuccess')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {kind === 'pln'     ? t('ppob.subPln')
          : kind === 'pulsa'  ? t('ppob.subPulsa',   { number: trx.customer?.number })
          : kind === 'ewallet'? t('ppob.subEwallet', { number: trx.customer?.number })
          : kind === 'tagihan'? t('ppob.subTagihan', { name: trx.product?.name })
          : kind === 'game'   ? t('ppob.subGame',    { number: trx.customer?.number })
          : t('ppob.subOther')}
        </p>
      </div>

      {/* ── PLN TOKEN CARD (special) ────────────────────────── */}
      {kind === 'pln' && hasSn && (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-4 relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-300 rounded-full opacity-10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-400 rounded-full opacity-10 blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">{t('ppob.plnTokenCard')}</p>
                <p className="text-[11px] text-slate-600">
                  {t('ppob.forMeter', { number: '' })}<span className="font-mono font-semibold">{trx.customer?.number}</span>
                </p>
              </div>
            </div>

            {/* Token besar dengan grouping */}
            <div className="bg-white border-2 border-dashed border-amber-300 rounded-xl py-4 px-3 mb-3 text-center">
              <p className="font-mono text-lg sm:text-2xl font-black text-amber-900 tracking-wider break-all leading-tight">
                {formatToken(sn)}
              </p>
            </div>

            {/* Meta info kalau ada */}
            {(trx.customer?.name || kwh || tarif) && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {trx.customer?.name && (
                  <div className="bg-white/60 rounded-lg p-2.5">
                    <p className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-bold">{t('ppob.customerLabel')}</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{trx.customer.name}</p>
                  </div>
                )}
                {kwh && (
                  <div className="bg-white/60 rounded-lg p-2.5">
                    <p className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-bold">{t('ppob.electricityAmount')}</p>
                    <p className="text-xs sm:text-sm font-bold text-amber-700">{kwh} kWh</p>
                  </div>
                )}
                {tarif && (
                  <div className="bg-white/60 rounded-lg p-2.5">
                    <p className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-bold">{t('ppob.tariffPower')}</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">{tarif}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyToken}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97] ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> {t('ppob.copiedToken')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> {t('ppob.copyToken')}
                  </>
                )}
              </button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={shareToken}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 font-bold text-sm hover:bg-amber-100 active:scale-[0.97] transition-all"
                >
                  <Share2 className="w-4 h-4" /> {t('ppob.share')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PLN Instructions ────────────────────────────── */}
      {kind === 'pln' && hasSn && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 sm:p-4 mb-4">
          <p className="text-xs sm:text-sm font-bold text-blue-900 mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4" /> {t('ppob.plnInputTitle')}
          </p>
          <ol className="text-[11px] sm:text-xs text-blue-800 space-y-1 list-decimal list-inside leading-relaxed">
            <li>{t('ppob.plnInput1')}</li>
            <li>{t('ppob.plnInput2')}</li>
            <li>{t('ppob.plnInput3')}</li>
            <li>{t('ppob.plnInput4')}</li>
          </ol>
        </div>
      )}

      {/* ── Non-PLN: simpler SN display ─────────────────── */}
      {kind !== 'pln' && hasSn && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 mb-4">
          <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase mb-2">
            {kind === 'game' ? t('ppob.voucherCode') : t('ppob.refNumber')}
          </p>
          <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-2.5">
            <p className="font-mono text-sm sm:text-base font-bold text-emerald-900 break-all flex-1">{sn}</p>
            <button onClick={copyToken}
              className="p-2 rounded-lg hover:bg-emerald-100 active:scale-90 transition-all shrink-0">
              {copied
                ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : <Copy className="w-4 h-4 text-emerald-600" />}
            </button>
          </div>
          {kind === 'pulsa' && (
            <p className="text-[11px] text-emerald-700 mt-2.5 leading-relaxed">
              {t('ppob.tipPulsa')}
            </p>
          )}
          {kind === 'ewallet' && (
            <p className="text-[11px] text-emerald-700 mt-2.5 leading-relaxed">
              {t('ppob.tipEwallet')}
            </p>
          )}
          {kind === 'game' && (
            <p className="text-[11px] text-emerald-700 mt-2.5 leading-relaxed">
              {t('ppob.tipGame')}
            </p>
          )}
        </div>
      )}

      {/* ── Trx info summary ────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 mb-5">
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <InfoCell label={t('ppob.product')} value={trx.product?.name} />
          <InfoCell label={t('ppob.destNumber')} value={trx.customer?.number} mono />
          <InfoCell label={t('ppob.trxCodeLabel')} value={trx.trxCode} mono />
          <InfoCell label={t('ppob.totalPaid')} value={formatRupiah(trx.pricing?.totalAmount || 0)} accent="brand" />
        </div>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button onClick={() => navigate("/topup-tagihan")}
          className="py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all">
          {t('ppob.trxAgain')}
        </button>
        <button onClick={() => navigate("/topup-tagihan/history")}
          className="py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand/30">
          {t('ppob.viewHistory')}
        </button>
      </div>
    </div>
  )
}

function InfoCell({ label, value, mono, accent }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-bold tracking-wider">{label}</p>
      <p className={`mt-0.5 ${mono ? 'font-mono' : ''} ${accent === 'brand' ? 'text-brand font-bold' : 'text-slate-900 font-semibold'} truncate`}>
        {value || '-'}
      </p>
    </div>
  )
}

function FailedView({ trx, status, navigate }) {
  const { t } = useTranslation()
  const presentation = STATUS_PRESENTATION[status]
  const Icon = presentation?.Icon || XCircle
  return (
    <div className="py-8 sm:py-10 px-6 text-center">
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-${presentation?.color || 'red'}-100 flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
        <Icon className={`w-10 h-10 sm:w-12 sm:h-12 text-${presentation?.color || 'red'}-600`} />
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-bold mb-2 text-slate-900">{presentation ? t(presentation.labelKey) : t('ppob.payStatusFailed')}</h1>
      <p className="text-sm sm:text-base text-slate-600 mb-1">
        {t('ppob.trxCodeColon')} <strong className="font-mono">{trx.trxCode}</strong>
      </p>
      {trx.failureReason && (
        <p className="text-sm text-slate-500 mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
          {trx.failureReason}
        </p>
      )}
      {status === 'refundable' && (
        <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
          {t('ppob.refundNote')}
        </p>
      )}
      <div className="mt-6 sm:mt-8 flex gap-3">
        <button onClick={() => navigate("/topup-tagihan")}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          {t('travel.back')}
        </button>
        <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer"
          className="flex-1 py-3 text-center bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm">
          {t('ppob.chatAdmin')}
        </a>
      </div>
    </div>
  )
}
