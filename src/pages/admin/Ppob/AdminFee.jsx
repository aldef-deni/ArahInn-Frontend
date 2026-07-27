import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  Smartphone, Zap, Wallet, Gamepad2, Droplets, Tv, CreditCard,
  HeartPulse, Landmark, Car, Coins, Save, TrendingUp, Info, Loader2, Building2, GraduationCap,
  Bike, Milestone, AppWindow, Gift, Gem,
} from 'lucide-react'

/**
 * Admin PPOB — atur BIAYA ADMIN per kategori PPOB.
 * Nominal yang diisi ditambahkan ke tagihan customer saat pembayaran, dan
 * seluruhnya MASUK LABA (keuntungan) platform ArahInn (price_sell − price_buy).
 * 0 / kosong = tidak dikenakan.
 */
const CATEGORIES = [
  { code: 'pulsa-data',    label: 'Pulsa & Data',        Icon: Smartphone, color: '#2563eb' },
  { code: 'pln',           label: 'Listrik PLN',         Icon: Zap,        color: '#d97706' },
  { code: 'ewallet',       label: 'Top Up E-Wallet',     Icon: Wallet,     color: '#7c3aed' },
  { code: 'game',          label: 'Game Online',         Icon: Gamepad2,   color: '#e11d48' },
  { code: 'pdam',          label: 'PDAM',                Icon: Droplets,   color: '#0ea5e9' },
  { code: 'tv-kabel',      label: 'Internet & TV Cable', Icon: Tv,         color: '#7c3aed' },
  { code: 'multifinance',  label: 'Multifinance',        Icon: CreditCard, color: '#f59e0b' },
  { code: 'pegadaian',     label: 'Pegadaian',           Icon: Gem,        color: '#ca8a04' },
  { code: 'asuransi',      label: 'Asuransi / BPJS',     Icon: HeartPulse, color: '#16a34a' },
  { code: 'kartu-kredit',  label: 'Kartu Kredit',        Icon: CreditCard, color: '#0f766e' },
  { code: 'telepon-pasca', label: 'Pascabayar',          Icon: Smartphone, color: '#2563eb' },
  { code: 'pajak',         label: 'Pajak (PBB)',         Icon: Landmark,   color: '#b45309' },
  { code: 'samsat',        label: 'Samsat',              Icon: Car,        color: '#4f46e5' },
  { code: 'ipl',           label: 'IPL / Iuran Lingkungan', Icon: Building2, color: '#0891b2' },
  { code: 'edukasi',       label: 'Edukasi / Pendidikan', Icon: GraduationCap, color: '#c026d3' },
  { code: 'saldo-driver',  label: 'Saldo Driver',        Icon: Bike,       color: '#059669' },
  { code: 'e-toll',        label: 'E-Toll / Uang Elektronik', Icon: Milestone, color: '#0284c7' },
  { code: 'voucher-apps',  label: 'Voucher Apps',        Icon: AppWindow,  color: '#7c3aed' },
  { code: 'gift-sosmed',   label: 'Gift Sosmed',         Icon: Gift,       color: '#db2777' },
]

const hexA = (hex, a) => {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
const grouped = (n) => (Number(n) || 0).toLocaleString('id-ID')

export default function AdminPpobFee() {
  const { toast } = useToast()
  const [fees, setFees] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['ppob-admin-fee'],
    queryFn : () => adminApi.getPpobAdminFee().then(r => r.data?.data ?? {}),
  })

  useEffect(() => {
    if (data?.fees) setFees({ ...data.fees })
  }, [data])

  const save = useMutation({
    mutationFn: () => adminApi.setPpobAdminFee({ fees }).then(r => r.data),
    onSuccess : (res) => {
      if (res?.data?.fees) setFees({ ...res.data.fees })
      toast({ title: 'Tersimpan', description: res?.message || 'Biaya admin PPOB diperbarui.' })
    },
    onError   : (e) => toast({ title: 'Gagal menyimpan', description: e?.response?.data?.message || 'Terjadi kesalahan.', variant: 'destructive' }),
  })

  const setFee = (code, raw) => {
    const digits = String(raw).replace(/\D+/g, '')
    setFees(prev => ({ ...prev, [code]: digits === '' ? 0 : parseInt(digits, 10) }))
  }

  const activeCount = useMemo(() => CATEGORIES.filter(c => (Number(fees[c.code]) || 0) > 0).length, [fees])
  const updatedAt = data?.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : null

  return (
    <div className="max-w-5xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
          <Coins className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-brand" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight">Admin PPOB</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur biaya admin per kategori. Nominal yang diisi ditambahkan ke tagihan customer saat pembayaran.
          </p>
        </div>
      </div>

      {/* Info: masuk laba */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 mb-5 sm:mb-6">
        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
          <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
        </div>
        <div className="min-w-0 text-[13px] leading-relaxed text-emerald-900">
          <b>Seluruh biaya admin masuk laba (keuntungan) platform ArahInn.</b> Kosong / 0 = tidak dikenakan
          & tidak tampil ke customer. Setiap kategori punya nominal sendiri.
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CATEGORIES.map(({ code, label, Icon, color }) => {
            const val = Number(fees[code]) || 0
            const on = val > 0
            return (
              <div key={code}
                className={`rounded-2xl border p-4 transition-all ${on ? 'border-brand/40 bg-brand/[0.03] shadow-sm' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: hexA(color, 0.12) }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} strokeWidth={2.25} />
                  </div>
                  <p className="font-semibold text-sm text-slate-800 leading-tight">{label}</p>
                </div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Biaya admin (nominal)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">Rp</span>
                  <input
                    inputMode="numeric"
                    value={val === 0 ? '' : grouped(val)}
                    onChange={(e) => setFee(code, e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 tabular-nums focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-64 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 min-w-0">
            <span className="font-semibold text-slate-700">{activeCount}</span> kategori berbiaya admin
            {updatedAt && <span className="hidden sm:inline"> · diperbarui {updatedAt}</span>}
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 active:scale-95 disabled:opacity-60 transition-all shrink-0"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
