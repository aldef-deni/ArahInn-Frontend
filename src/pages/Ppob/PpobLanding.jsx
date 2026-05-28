import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ppobApi } from '@/services/index'
import {
  Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet,
  Receipt, History, ArrowRight,
} from 'lucide-react'
import SEO from '@/components/SEO'

const ICONS = { Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet, Receipt }

const GROUPS = [
  { id: 'pulsa',   label: 'Pulsa & Data',      path: '/ppob/pulsa-data' },
  { id: 'pln',     label: 'Listrik PLN',       path: '/ppob/pln' },
  { id: 'tagihan', label: 'Bayar Tagihan',     path: '/ppob/tagihan' },
  { id: 'ewallet', label: 'Top Up E-Wallet',   path: '/ppob/ewallet' },
]

export default function PpobLanding() {
  const { data: categories = [] } = useQuery({
    queryKey: ['ppob-categories'],
    queryFn : () => ppobApi.categories().then(r => r.data?.data ?? []),
  })

  return (
    <div className="container py-5 sm:py-8">
      <SEO
        title="Bayar Tagihan & Top Up"
        description="Beli pulsa, paket data, token PLN, top up e-wallet, dan bayar tagihan rumah dengan cepat dan aman di ArahInn."
        url="/ppob"
      />
      <div className="flex items-end justify-between gap-3 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight">Bayar Tagihan &amp; Top Up</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">Pulsa, listrik, tagihan rumah, e-wallet — semua di satu tempat.</p>
        </div>
        <Link to="/ppob/history" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:underline active:scale-95 transition-transform shrink-0">
          <History className="w-4 h-4" /> Riwayat
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
        {GROUPS.map(group => {
          const items = categories.filter(c => c.group === group.id)
          return (
            <Link
              key={group.id}
              to={group.path}
              className="group bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-brand hover:shadow-lg active:scale-[0.98] transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex -space-x-2 shrink-0">
                  {items.slice(0, 3).map(cat => {
                    const Icon = ICONS[cat.icon] || Receipt
                    return (
                      <div
                        key={cat.id}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-white shadow-sm"
                        style={{ backgroundColor: cat.color || '#1d4ed8' }}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    )
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-brand transition-colors text-sm sm:text-base">{group.label}</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {items.length > 0 ? items.map(c => c.name).join(' · ') : 'Memuat...'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-brand transition-colors shrink-0" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm sm:text-base">Aman &amp; terverifikasi</p>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Transaksi PPOB terhubung langsung ke biller resmi. Token PLN dan voucher dikirim otomatis ke akun Anda
            setelah pembayaran terkonfirmasi. Bantuan refund tersedia di admin support kalau ada kendala.
          </p>
        </div>
      </div>
    </div>
  )
}
