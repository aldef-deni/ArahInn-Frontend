import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { formatRupiah } from '@/utils'
import {
  Zap, Receipt, FileWarning, AlertCircle, Loader2, CheckCircle, Check,
} from 'lucide-react'

/**
 * Layout khusus PLN:
 * - Card pilih sub-layanan: Prabayar | Pascabayar | Non Taglist
 * - Input No. Meter / ID Pelanggan
 * - Prabayar: chip nominal Rp 20rb - Rp 1jt → backend purchase
 * - Pascabayar / Non Taglist: tombol "Cek Tagihan" → inquiry → confirm
 *
 * Props:
 *   products             - array of products (PLN category)
 *   loadingProducts
 *   customerNumber       - meter ID
 *   onCustomerChange
 *   selectedProduct
 *   onSelectProduct
 *   onExtraChange        - parent state extra (untuk nominal)
 *   inquiry              - hasil inquiry kalau ada
 *   inquiryPending
 *   onInquiry            - trigger inquiry (product, customerNumber)
 */

const PLN_NOMINALS = [
  { value: 20000,   labelKey: 'ppob.nom20k',  pln: '17 kWh ±' },
  { value: 50000,   labelKey: 'ppob.nom50k',  pln: '45 kWh ±' },
  { value: 100000,  labelKey: 'ppob.nom100k', pln: '90 kWh ±' },
  { value: 200000,  labelKey: 'ppob.nom200k', pln: '180 kWh ±' },
  { value: 500000,  labelKey: 'ppob.nom500k', pln: '460 kWh ±' },
  { value: 1000000, labelKey: 'ppob.nom1jt',  pln: '930 kWh ±' },
]

const SUBTYPES = [
  {
    id: 'prabayar',
    labelKey: 'ppob.plnPrepaid',
    descKey: 'ppob.plnPrepaidDesc',
    Icon: Zap,
    color: 'bg-amber-500',
    border: 'border-amber-500',
    soft: 'bg-amber-50',
    accent: 'text-amber-700',
  },
  {
    id: 'pascabayar',
    labelKey: 'ppob.plnPostpaid',
    descKey: 'ppob.plnPostpaidDesc',
    Icon: Receipt,
    color: 'bg-blue-500',
    border: 'border-blue-500',
    soft: 'bg-blue-50',
    accent: 'text-blue-700',
  },
  {
    id: 'non_taglist',
    labelKey: 'ppob.plnNonTaglist',
    descKey: 'ppob.plnNonTaglistDesc',
    Icon: FileWarning,
    color: 'bg-rose-500',
    border: 'border-rose-500',
    soft: 'bg-rose-50',
    accent: 'text-rose-700',
  },
]

function classifySubtype(name) {
  const n = (name || '').toUpperCase()
  if (/NON\s*TAGLIST/.test(n)) return 'non_taglist'
  if (/PASCABAYAR|PASCA\s*BAYAR/.test(n)) return 'pascabayar'
  if (/PRABAYAR|PRA\s*BAYAR/.test(n)) return 'prabayar'
  return null
}

// Pilih produk channel default.
// Strategi: prefer code dengan suffix H (granted production), skip ADMIN variants.
// Tidak filter by H2H name karena PLN Pascabayar granted-nya justru PLNPASCH (name "PLN PASCABAYAR H2H").
function pickMainProduct(productsInSubtype) {
  if (productsInSubtype.length === 0) return null
  // Priority 1: code berakhir 'H' (PLNPRAH, PLNPASCH) — granted
  const hSuffix = productsInSubtype.find(p => {
    const c = (p.raja_biller_code || p.rajaBillerCode || '').toUpperCase()
    const n = (p.name || '').toUpperCase()
    return c.endsWith('H') && !c.includes('H2H') && !/ADMIN\s*\d+/.test(n)
  })
  if (hSuffix) return hSuffix
  // Fallback: produk non-admin, non-H2H code
  const main = productsInSubtype.find(p => {
    const c = (p.raja_biller_code || p.rajaBillerCode || '').toUpperCase()
    const n = (p.name || '').toUpperCase()
    return !c.includes('H2H') && !/ADMIN\s*\d+/.test(n)
  })
  return main || productsInSubtype[0]
}

export default function PpobPlnView({
  products,
  loadingProducts,
  customerNumber,
  onCustomerChange,
  selectedProduct,
  onSelectProduct,
  onExtraChange,
  inquiry,
  inquiryPending,
  onInquiry,
}) {
  const { t } = useTranslation()
  const [subtype, setSubtype] = useState(null)
  const [nominal, setNominal] = useState(null)

  // Kelompokkan produk PLN by subtype
  const grouped = useMemo(() => {
    const out = { prabayar: [], pascabayar: [], non_taglist: [] }
    for (const p of products) {
      const kind = classifySubtype(p.name)
      if (kind) out[kind].push(p)
    }
    return out
  }, [products])

  // Saat user pilih subtype, auto-select main product
  useEffect(() => {
    if (!subtype) return
    const main = pickMainProduct(grouped[subtype])
    onSelectProduct(main)
    setNominal(null)
    onExtraChange({})
  }, [subtype]) // eslint-disable-line

  // Saat user pick nominal (prabayar only) → simpan ke extra
  useEffect(() => {
    if (subtype === 'prabayar' && nominal) {
      onExtraChange({ nominal: String(nominal) })
    }
  }, [nominal, subtype]) // eslint-disable-line

  const handleInquiry = () => {
    if (!selectedProduct || customerNumber.length < 4) return
    onInquiry(selectedProduct, customerNumber)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Card: Pilih Layanan PLN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
          {t('ppob.plnStep1')}
        </p>
        <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
          {SUBTYPES.map(st => {
            const Icon = st.Icon
            const active = subtype === st.id
            const count  = grouped[st.id].length
            const disabled = count === 0
            return (
              <button
                key={st.id}
                onClick={() => !disabled && setSubtype(st.id)}
                disabled={disabled}
                className={`relative w-full p-3 sm:p-4 rounded-xl border-2 flex items-center sm:items-start gap-3 sm:gap-0 sm:flex-col text-left transition-all active:scale-[0.98] overflow-hidden ${
                  active
                    ? `${st.border} ${st.soft} shadow-sm`
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-lg flex items-center justify-center shrink-0 ${st.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 sm:mt-2.5">
                  <p className={`text-sm font-bold leading-tight ${active ? st.accent : 'text-slate-800'}`}>
                    {t(st.labelKey)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    {t(st.descKey)}
                  </p>
                </div>
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Check className={`w-3 h-3 ${st.accent}`} strokeWidth={3} />
                  </div>
                )}
                {disabled && (
                  <p className="absolute bottom-1.5 right-2 text-[9px] text-slate-400 italic">
                    {t('ppob.notAvailable')}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Meter Input */}
      {subtype && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
            {t('ppob.plnStep2')}
          </p>
          <input
            type="tel"
            inputMode="numeric"
            value={customerNumber}
            onChange={e => onCustomerChange(e.target.value.replace(/\D/g, ''))}
            placeholder={t('ppob.plnMeterPlaceholder')}
            maxLength={14}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            {t('ppob.plnMeterHint')}
          </p>
        </div>
      )}

      {/* Step 3: Prabayar = pilih nominal, Pascabayar/Non Taglist = cek tagihan */}
      {subtype && customerNumber.length >= 4 && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
            3. {subtype === 'prabayar' ? t('ppob.plnPickNominal') : t('ppob.plnCheckBill')}
          </p>

          {loadingProducts && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('ppob.plnLoadingProducts')}
            </div>
          )}

          {!loadingProducts && !selectedProduct && (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">{t('ppob.plnNoProducts')}</p>
              <p className="text-[11px] text-slate-400 mt-1">{t('ppob.plnNoProductsDesc')}</p>
            </div>
          )}

          {/* PRABAYAR: Nominal chips */}
          {subtype === 'prabayar' && selectedProduct && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {PLN_NOMINALS.map(nom => {
                const active = nominal === nom.value
                return (
                  <button
                    key={nom.value}
                    onClick={() => setNominal(nom.value)}
                    className={`relative p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] ${
                      active
                        ? 'border-amber-500 bg-amber-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">{t(nom.labelKey)}</p>
                    <p className={`mt-1 text-sm sm:text-base font-bold ${active ? 'text-amber-700' : 'text-slate-900'}`}>
                      {formatRupiah(nom.value)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{nom.pln}</p>
                    {active && (
                      <div className="absolute -top-px -right-px w-5 h-5 bg-amber-500 rounded-bl-lg rounded-tr-xl flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* PASCABAYAR / NON TAGLIST: Cek Tagihan */}
          {(subtype === 'pascabayar' || subtype === 'non_taglist') && selectedProduct && !inquiry && (
            <button
              onClick={handleInquiry}
              disabled={inquiryPending}
              className={`w-full py-3 text-white rounded-xl font-semibold active:scale-[0.98] disabled:opacity-50 transition-all ${
                subtype === 'pascabayar' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {inquiryPending ? t('ppob.plnChecking') : t('ppob.plnCheckNow')}
            </button>
          )}

          {/* Inquiry result */}
          {inquiry && (
            <div className="mt-4 p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-xs sm:text-sm font-bold text-emerald-700">{t('ppob.plnBillFound')}</p>
              </div>
              <p className="text-xs sm:text-sm text-slate-700">{t('ppob.nameLabel')}: <b>{inquiry.customer?.name || '-'}</b></p>
              <p className="text-xs sm:text-sm text-slate-700">{t('ppob.billLabel')}: <b>{formatRupiah(inquiry.pricing?.tagihan || 0)}</b></p>
              {Number(inquiry.pricing?.adminFee || 0) > 0 && (
                <p className="text-xs sm:text-sm text-slate-700">{t('ppob.adminFee')}: <b>{formatRupiah(inquiry.pricing?.adminFee)}</b></p>
              )}
              <p className="text-sm sm:text-base font-bold text-slate-900 mt-2">{t('ppob.totalLabel')}: {formatRupiah(inquiry.pricing?.totalAmount || 0)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
