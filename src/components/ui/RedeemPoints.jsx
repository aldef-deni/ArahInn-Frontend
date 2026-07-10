import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { promoApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import { Sparkles } from 'lucide-react'

/**
 * Kartu redeem poin loyalitas — 1 poin = Rp1, tanpa batas s/d total.
 * Self-contained (ambil saldo sendiri). Melapor perubahan lewat:
 *   onChange({ usePoints, points, discount })
 * Host memakai `discount` untuk menyesuaikan total tampilan dan mengirim
 * `usePoints`/`pointsToRedeem` ke API. Tak tampil bila saldo 0.
 */
export default function RedeemPoints({ total = 0, onChange, className = '' }) {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(false)
  const [input, setInput] = useState('')

  const { data: balance = 0 } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: () => promoApi.loyalty.balance().then(r => r.data?.data?.balance ?? 0),
    staleTime: 30_000,
  })

  const cap    = Math.max(0, Math.min(Number(balance) || 0, Math.floor(Number(total) || 0)))
  const points = enabled ? Math.max(0, Math.min(Math.floor(Number(input) || 0), cap)) : 0

  useEffect(() => {
    onChange?.({ usePoints: enabled && points > 0, points, discount: points })
  }, [enabled, points]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!balance || balance <= 0) return null

  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50/40 p-3 ${className}`}>
      <label className="flex items-center justify-between gap-2 cursor-pointer select-none">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {t('loyalty.usePoints', 'Tukar poin loyalitas')}
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
          className="w-4 h-4 accent-amber-500"
        />
      </label>
      <p className="text-[11px] text-slate-500 mt-1">
        {t('loyalty.balanceLabel', 'Saldo poin')}: <b>{Number(balance).toLocaleString('id-ID')}</b> · 1 poin = Rp1
      </p>
      {enabled && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number" min={0} max={cap} inputMode="numeric" value={input}
            onChange={e => setInput(e.target.value)} placeholder="0"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 outline-none"
          />
          <button type="button" onClick={() => setInput(String(cap))}
            className="text-xs font-bold text-amber-600 whitespace-nowrap px-2 py-1 rounded-lg hover:bg-amber-100">
            {t('loyalty.max', 'Maks')} {cap.toLocaleString('id-ID')}
          </button>
        </div>
      )}
      {points > 0 && (
        <p className="text-[11px] font-semibold text-green-600 mt-1.5">
          − {formatRupiah(points)} {t('loyalty.appliedFromPoints', 'dari poin')}
        </p>
      )}
    </div>
  )
}
