import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ppobApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import {
  Smartphone, Zap, Receipt, Wallet, Gamepad2,
  History, ChevronRight, ShieldCheck, ArrowRight,
  Plane, TrainFront, Ship,
} from 'lucide-react'
import SEO from '@/components/SEO'
import bannerPpob from '@/assets/banners/ppob.webp'

/**
 * Top Up & Tagihan — landing page yang elegan + mobile-responsive.
 *
 * 5 layanan utama, masing-masing card:
 *  - Pulsa & Data (Telkomsel/Indosat/XL/Tri/Smartfren)
 *  - Listrik PLN (Prabayar/Pascabayar)
 *  - E-Wallet (GoPay/OVO/DANA/ShopeePay)
 *  - Bayar Tagihan (PDAM/BPJS/dll)
 *  - Game Online (ML/FF/PUBG/dll)
 */
export default function PpobLanding() {
  const { t } = useTranslation()
  const { token } = useAuthStore()

  const GROUPS = [
    { id: 'pulsa-data', label: t('topupLanding.pulsaData'),    desc: t('topupLanding.pulsaDataDesc'),    path: '/topup-tagihan/pulsa-data', Icon: Smartphone, gradient: 'from-blue-500 to-indigo-600', iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   badge: t('topupLanding.savingsBadge') },
    { id: 'pln',        label: t('topupLanding.listrikPln'),  desc: t('topupLanding.listrikPlnDesc'),  path: '/topup-tagihan/pln',        Icon: Zap,        gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { id: 'ewallet',    label: t('topupLanding.ewallet'),     desc: t('topupLanding.ewalletDesc'),     path: '/topup-tagihan/ewallet',    Icon: Wallet,     gradient: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { id: 'tagihan',    label: t('topupLanding.tagihan'),     desc: t('topupLanding.tagihanDesc'),     path: '/topup-tagihan/tagihan',    Icon: Receipt,    gradient: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { id: 'game',       label: t('topupLanding.game'),        desc: t('topupLanding.gameDesc'),        path: '/topup-tagihan/game',       Icon: Gamepad2,   gradient: 'from-rose-500 to-pink-600', iconBg: 'bg-rose-100',     iconColor: 'text-rose-600' },
  ]

  // Ticketing — tiket perjalanan
  const TICKETS = [
    { id: 'pesawat', label: 'Tiket Pesawat',    desc: 'Semua maskapai domestik', path: '/tiket/pesawat', Icon: Plane,      gradient: 'from-sky-500 to-blue-600',  iconBg: 'bg-sky-100',  iconColor: 'text-sky-600' },
    { id: 'kereta',  label: 'Tiket Kereta',     desc: 'KAI antarkota',           path: '/coming-soon?feature=tiket-kereta',  Icon: TrainFront, gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { id: 'pelni',   label: 'Tiket Kapal Laut', desc: 'PELNI semua rute',        path: '/tiket/pelni',   Icon: Ship,       gradient: 'from-cyan-500 to-blue-600', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  ]

  // Recent trx untuk shortcut "Riwayat" (kalau ada)
  const { data: recentResp } = useQuery({
    queryKey: ['ppob-recent-trx'],
    queryFn : () => ppobApi.myTransactions({ limit: 1 }).then(r => r.data?.data ?? { data: [] }),
    enabled : !!token,
    staleTime: 60_000,
  })
  const hasRecent = (recentResp?.data?.length ?? 0) > 0

  return (
    <div className="bg-slate-50 sm:bg-transparent min-h-[60vh]">
      <SEO
        title={t('topupLanding.title')}
        description={t('topupLanding.subtitle')}
        url="/topup-tagihan"
      />

      {/* ── Header banner Top Up & Tagihan (gambar saja) ── */}
      <div className="relative">
        <img src={bannerPpob} alt="Top Up & Tagihan ArahInn" width="1774" height="887"
          className="block w-full h-auto" loading="eager" fetchpriority="high" />
        {token && (
          <Link
            to="/topup-tagihan/history"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-sm border border-white/60 text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-sm"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{t('topupLanding.history')}</span>
            {hasRecent && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-300 ring-2 ring-white" />
            )}
          </Link>
        )}
      </div>

      {/* ── Grid Layanan ───────────────────────────────────── */}
      <section className="container pt-7 pb-6 sm:pt-10 sm:pb-8 relative">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {t('topupLanding.sectionTitle')}
          </h2>
          <span className="text-[10px] sm:text-xs text-slate-400">{GROUPS.length} {t('topupLanding.categoryCount')}</span>
        </div>

        {/* Cards — 2 col mobile, 3 col tablet+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {GROUPS.map((group, idx) => {
            const Icon = group.Icon
            // First card spans 2 columns on mobile (hero treatment)
            const isHero = idx === 0
            return (
              <Link
                key={group.id}
                to={group.path}
                className={`group relative bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 hover:border-brand hover:shadow-lg active:scale-[0.97] transition-all overflow-hidden flex flex-col ${
                  isHero ? 'col-span-2 sm:col-span-1' : ''
                } min-h-[120px] sm:min-h-[150px]`}
              >
                {/* Gradient accent corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${group.gradient} opacity-10 rounded-bl-full pointer-events-none`} />

                {/* Badge (kalau ada) */}
                {group.badge && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    {group.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${group.iconBg} flex items-center justify-center mb-2.5 sm:mb-3 relative shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${group.iconColor}`} strokeWidth={2.25} />
                </div>

                {/* Label */}
                <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight relative">{group.label}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 leading-snug relative">
                  {group.desc}
                </p>

                {/* Chevron */}
                <ChevronRight className="w-4 h-4 text-slate-300 absolute bottom-3 right-3 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>

        {/* ── Ticketing (tiket perjalanan) ──────────────────── */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 mt-7 sm:mt-9">
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Ticketing</h2>
          <span className="text-[10px] sm:text-xs text-slate-400">{TICKETS.length} layanan</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {TICKETS.map((group) => {
            const Icon = group.Icon
            return (
              <Link
                key={group.id}
                to={group.path}
                className="group relative bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 hover:border-brand hover:shadow-lg active:scale-[0.97] transition-all overflow-hidden flex flex-col min-h-[120px] sm:min-h-[150px]"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${group.gradient} opacity-10 rounded-bl-full pointer-events-none`} />
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${group.iconBg} flex items-center justify-center mb-2.5 sm:mb-3 relative shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${group.iconColor}`} strokeWidth={2.25} />
                </div>
                <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight relative">{group.label}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 leading-snug relative">{group.desc}</p>
                <ChevronRight className="w-4 h-4 text-slate-300 absolute bottom-3 right-3 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>

        {/* ── Trust block ─────────────────────────────────── */}
        <div className="mt-5 sm:mt-7 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-5 flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">{t('topupLanding.trustTitle')}</p>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
              {t('topupLanding.trustDesc')}
            </p>
          </div>
        </div>

        {/* ── Pesanan baru CTA (kalau ada riwayat) ──────── */}
        {token && hasRecent && (
          <Link
            to="/topup-tagihan/history"
            className="mt-3 sm:mt-4 flex items-center justify-between p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand hover:shadow-sm active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                <History className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-brand" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{t('topupLanding.historyShortcut')}</p>
                <p className="text-[11px] sm:text-xs text-slate-500">{t('topupLanding.historyShortcutSub')}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>
        )}
      </section>
    </div>
  )
}
