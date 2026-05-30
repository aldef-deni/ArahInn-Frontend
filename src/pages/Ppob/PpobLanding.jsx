import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ppobApi } from '@/services/index'
import {
  Smartphone, Zap, Receipt, Wallet, Gamepad2,
  History, ChevronRight, ShieldCheck,
} from 'lucide-react'
import SEO from '@/components/SEO'

/**
 * Group config — icon, gradient bg, dan path tujuan.
 * Mobile-first: full color cards yang terasa native.
 */
const GROUPS = [
  {
    id: 'pulsa-data', label: 'Pulsa & Data',  desc: 'Telkomsel, Indosat, XL, dll',
    path: '/ppob/pulsa-data', Icon: Smartphone,
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'pln',        label: 'Listrik PLN',   desc: 'Token prabayar & pascabayar',
    path: '/ppob/pln', Icon: Zap,
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 'ewallet',    label: 'Top Up E-Wallet', desc: 'GoPay, OVO, DANA, Shopee',
    path: '/ppob/ewallet', Icon: Wallet,
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: 'tagihan',    label: 'Bayar Tagihan', desc: 'PDAM, BPJS, TV, Pajak',
    path: '/ppob/tagihan', Icon: Receipt,
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'game',       label: 'Game Online',   desc: 'Mobile Legends, FF, PUBG, dll',
    path: '/ppob/game', Icon: Gamepad2,
    gradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
]

export default function PpobLanding() {
  const { data: categories = [] } = useQuery({
    queryKey: ['ppob-categories'],
    queryFn : () => ppobApi.categories().then(r => r.data?.data ?? []),
  })

  return (
    <div className="min-h-[60vh] bg-slate-50 sm:bg-transparent">
      <SEO
        title="Bayar Tagihan & Top Up"
        description="Beli pulsa, paket data, token PLN, top up e-wallet, dan bayar tagihan rumah dengan cepat dan aman di ArahInn."
        url="/ppob"
      />

      {/* ── Hero (mobile feel) ────────────────────────── */}
      <section className="bg-gradient-to-br from-brand to-orange-600 text-white sm:bg-none sm:bg-transparent sm:text-slate-900">
        <div className="container py-5 sm:py-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                Bayar Tagihan &amp; Top Up
              </h1>
              <p className="text-xs sm:text-sm text-white/85 sm:text-slate-500 mt-1 leading-snug">
                Pulsa, listrik, e-wallet, tagihan rumah — cepat &amp; aman.
              </p>
            </div>
            <Link
              to="/ppob/history"
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3 sm:py-2 rounded-full bg-white/15 sm:bg-brand/10 backdrop-blur-sm border border-white/20 sm:border-brand/20 text-xs sm:text-sm font-semibold text-white sm:text-brand active:scale-95 transition-transform shrink-0"
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Riwayat</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Grid Layanan ─────────────────────────────── */}
      <section className="container py-5 sm:py-6 -mt-2 sm:mt-0 relative">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Pilih Layanan
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {GROUPS.map(group => {
            const Icon = group.Icon
            return (
              <Link
                key={group.id}
                to={group.path}
                className="group relative bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 hover:border-brand hover:shadow-md active:scale-[0.97] transition-all overflow-hidden min-h-[112px] sm:min-h-[130px] flex flex-col"
              >
                {/* Subtle gradient accent corner */}
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${group.gradient} opacity-10 rounded-bl-full`} />

                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${group.iconBg} flex items-center justify-center mb-2.5 sm:mb-3 relative`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${group.iconColor}`} strokeWidth={2.25} />
                </div>
                <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight relative">{group.label}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 leading-snug relative">
                  {group.desc}
                </p>
                <ChevronRight className="w-4 h-4 text-slate-300 absolute bottom-3 right-3 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>

        {/* ── Trust block ─────────────────────────────── */}
        <div className="mt-5 sm:mt-7 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-5 flex items-start gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">Aman &amp; terverifikasi</p>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
              Transaksi langsung ke biller resmi. Token/voucher otomatis terkirim setelah pembayaran terkonfirmasi.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
