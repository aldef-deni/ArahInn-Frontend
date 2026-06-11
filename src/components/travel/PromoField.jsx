import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag, Check, AlertCircle } from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'

// Input kode promo untuk checkout tiket (pesawat/pelni/kereta) — dengan tombol
// "Gunakan" + preview potongan diskon (mirip checkout akomodasi).
// Props:
//   moda        : 'pesawat' | 'pelni' | 'kereta'
//   total       : harga sebelum diskon (tiket + biaya layanan)
//   departDate  : tanggal berangkat (Y-m-d) — untuk kondisi hari berlaku
//   onApplied   : ({ code, discount }) | null  → dipanggil saat promo diterapkan/dibatalkan
export default function PromoField({ moda, total, departDate, onApplied }) {
  const { t } = useTranslation()
  const [code, setCode]       = useState('')
  const [applied, setApplied] = useState(null)   // { code, discount }
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const change = (v) => {
    setCode(v)
    if (error) setError('')
    if (applied) { setApplied(null); onApplied?.(null) }   // edit kode → batalkan diskon
  }

  const apply = async () => {
    if (!code.trim() || loading) return
    setLoading(true); setError('')
    try {
      const r = await travelApi.validatePromo({ code: code.trim(), moda, total, departDate })
      const d = r.data?.data
      if (!d?.discount || d.discount <= 0) {
        setError(t('travel.promoNoDiscount')); setApplied(null); onApplied?.(null)
        return
      }
      setApplied({ code: code.trim(), discount: d.discount })
      onApplied?.({ code: code.trim(), discount: d.discount })
    } catch (e) {
      setError(e?.response?.data?.message || t('travel.promoInvalid'))
      setApplied(null); onApplied?.(null)
    } finally { setLoading(false) }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-orange-500" /> {t('travel.promoCodeLabel')} <span className="font-normal text-slate-400">{t('travel.optional')}</span>
      </label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => change(e.target.value.toUpperCase())}
          placeholder={t('travel.enterVoucher')}
          className={`flex-1 min-w-0 px-3.5 py-2.5 border rounded-xl text-sm uppercase tracking-wider focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-orange-300 focus:border-orange-400'}`}
        />
        <button
          type="button" onClick={apply} disabled={!code.trim() || loading}
          className="shrink-0 px-4 sm:px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? '...' : t('travel.use')}
        </button>
      </div>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}
      {applied && !error && (
        <div className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
          <Check className="w-3.5 h-3.5 shrink-0" /> {t('travel.promoApplied', { amount: formatRupiah(applied.discount) })}
        </div>
      )}
    </div>
  )
}
