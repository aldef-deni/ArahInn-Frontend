import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ppobApi } from '@/services/index'
import {
  Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet,
  Receipt, History, ArrowRight,
} from 'lucide-react'

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
    <div className="container py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Bayar Tagihan & Top Up</h1>
          <p className="text-sm text-slate-500 mt-1">Pulsa, listrik, tagihan rumah, e-wallet — semua di satu tempat.</p>
        </div>
        <Link to="/ppob/history" className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          <History className="w-4 h-4" /> Riwayat
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {GROUPS.map(group => {
          const items = categories.filter(c => c.group === group.id)
          return (
            <Link
              key={group.id}
              to={group.path}
              className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex -space-x-2">
                  {items.slice(0, 3).map(cat => {
                    const Icon = ICONS[cat.icon] || Receipt
                    return (
                      <div
                        key={cat.id}
                        className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white shadow-sm"
                        style={{ backgroundColor: cat.color || '#1d4ed8' }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    )
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-brand transition-colors">{group.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {items.length > 0 ? items.map(c => c.name).join(' · ') : 'Memuat...'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-bold text-slate-900">Aman & terverifikasi</p>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Transaksi PPOB terhubung langsung ke biller resmi. Token PLN dan voucher dikirim otomatis ke akun Anda
            setelah pembayaran terkonfirmasi. Bantuan refund tersedia di admin support kalau ada kendala.
          </p>
        </div>
      </div>
    </div>
  )
}
