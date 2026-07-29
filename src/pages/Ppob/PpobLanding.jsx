import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ppobApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import {
  Smartphone, Zap, Receipt, Wallet, Gamepad2,
  History, ChevronRight, ShieldCheck, ArrowRight, AlertTriangle,
  Wifi, Lightbulb, Droplets, HeartPulse, Router, Tv, CreditCard, Landmark, Car, Building2, GraduationCap,
  Bike, Milestone, AppWindow, Gift, Gem,
} from 'lucide-react'
import SEO from '@/components/SEO'
import bannerPpob from '@/assets/banners/ppob.webp'

// Ikon kategori tagihan (nama ikon dari API kategori → komponen lucide). Sinkron dgn PpobCategoryPage.
const CAT_ICONS = { Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet, Tv, CreditCard, Landmark, Car, Receipt, Building2, GraduationCap, Bike, Milestone, AppWindow, Gift, Gem }

// Deskripsi ringkas default per kode kategori (dipakai bila API tak menyertakan `description`).
const TAGIHAN_DESC = {
  pdam: 'Air PDAM daerah', telkom: 'Telepon & IndiHome', 'tv-kabel': 'TV berlangganan',
  multifinance: 'Cicilan & leasing', asuransi: 'Premi asuransi', 'kartu-kredit': 'Tagihan kartu kredit',
  'telepon-pasca': 'Telepon pascabayar', pajak: 'Pajak PBB (Objek Pajak)', samsat: 'Pajak kendaraan',
  bpjs: 'Iuran BPJS', gas: 'Gas PGN',
}

// #RRGGBB → rgba() untuk latar ikon pastel (mirip iconBg tailwind pada kartu utama).
const hexToRgba = (hex, a) => {
  const h = String(hex || '#1d4ed8').replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

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
    { id: 'game',       label: t('topupLanding.game'),        desc: t('topupLanding.gameDesc'),        path: '/topup-tagihan/game',       Icon: Gamepad2,   gradient: 'from-rose-500 to-pink-600', iconBg: 'bg-rose-100',     iconColor: 'text-rose-600' },
  ]

  // Recent trx untuk shortcut "Riwayat" (kalau ada)
  const { data: recentResp } = useQuery({
    queryKey: ['ppob-recent-trx'],
    queryFn : () => ppobApi.myTransactions({ limit: 1 }).then(r => r.data?.data ?? { data: [] }),
    enabled : !!token,
    staleTime: 60_000,
  })
  const hasRecent = (recentResp?.data?.length ?? 0) > 0

  // Grup layanan yang dinonaktifkan superadmin (mis. e-wallet saat provider gangguan)
  const { data: disabledGroups = [] } = useQuery({
    queryKey: ['ppob-groups-status'],
    queryFn : () => ppobApi.groupsStatus().then(r => r.data?.data?.disabled ?? []),
    staleTime: 60_000,
  })
  const isGroupDown = (id) => disabledGroups.map(String).includes(String(id))

  // Kategori "Bayar Tagihan" (PDAM, Telkom, TV Kabel, Multifinance, dst) — dulu tersembunyi di
  // submenu /topup-tagihan/tagihan, kini ditampilkan langsung sebagai kartu di landing.
  const { data: categories = [] } = useQuery({
    queryKey: ['ppob-categories'],
    queryFn : () => ppobApi.categories().then(r => r.data?.data ?? []),
    staleTime: 60_000,
  })
  const tagihanCats = categories.filter(c => (c.group || c.code) === 'tagihan')
  const tagihanDown = isGroupDown('tagihan')

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
          <span className="text-[10px] sm:text-xs text-slate-400">{GROUPS.length + tagihanCats.length} {t('topupLanding.categoryCount')}</span>
        </div>

        {/* Cards — 2 col mobile, 3 col tablet+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {GROUPS.map((group, idx) => {
            const Icon = group.Icon
            // First card spans 2 columns on mobile (hero treatment)
            const isHero = idx === 0
            const down = isGroupDown(group.id)

            // Konten kartu (dipakai baik saat aktif maupun nonaktif)
            const cardInner = (
              <>
                {/* Gradient accent corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${group.gradient} opacity-10 rounded-bl-full pointer-events-none`} />

                {/* Badge (kalau ada) — sembunyikan saat gangguan */}
                {group.badge && !down && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    {group.badge}
                  </span>
                )}
                {down && (
                  <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3" /> {t('topupLanding.disruptedBadge', 'Gangguan')}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${down ? 'bg-slate-100' : group.iconBg} flex items-center justify-center mb-2.5 sm:mb-3 relative shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${down ? 'text-slate-400' : group.iconColor}`} strokeWidth={2.25} />
                </div>

                {/* Label */}
                <p className={`font-bold text-sm sm:text-base leading-tight relative ${down ? 'text-slate-400' : 'text-slate-900'}`}>{group.label}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 leading-snug relative">
                  {down ? t('topupLanding.disruptedDesc', 'Sedang gangguan, coba lagi nanti') : group.desc}
                </p>

                {/* Chevron */}
                {!down && (
                  <ChevronRight className="w-4 h-4 text-slate-300 absolute bottom-3 right-3 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                )}
              </>
            )

            const baseCls = `group relative rounded-2xl p-3.5 sm:p-5 overflow-hidden flex flex-col ${
              isHero ? 'col-span-2 sm:col-span-1' : ''
            } min-h-[120px] sm:min-h-[150px]`

            if (down) {
              return (
                <div
                  key={group.id}
                  aria-disabled="true"
                  className={`${baseCls} bg-slate-50 border border-slate-200 opacity-70 cursor-not-allowed`}
                >
                  {cardInner}
                </div>
              )
            }

            return (
              <Link
                key={group.id}
                to={group.path}
                className={`${baseCls} bg-white border border-slate-200 hover:border-brand hover:shadow-lg active:scale-[0.97] transition-all`}
              >
                {cardInner}
              </Link>
            )
          })}

          {/* Kartu kategori "Bayar Tagihan" — dikeluarkan dari submenu, tampil MENYAMBUNG
              setelah Game Online dalam grid yang sama (gaya kartu besar, tanpa pemisah section). */}
          {tagihanCats.map((cat) => {
            const Icon = CAT_ICONS[cat.icon] || Receipt
            const color = cat.color || '#1d4ed8'
            // E-Toll dinonaktifkan sementara (tidak bisa diklik) — atas permintaan.
            const isEtoll = String(cat.code).toLowerCase() === 'e-toll'
            const catDown = tagihanDown || isEtoll
            const badgeTxt = isEtoll && !tagihanDown
              ? t('topupLanding.unavailableBadge', 'Nonaktif')
              : t('topupLanding.disruptedBadge', 'Gangguan')
            const downDesc = isEtoll && !tagihanDown
              ? t('topupLanding.unavailableDesc', 'Sementara tidak tersedia')
              : t('topupLanding.disruptedDesc', 'Sedang gangguan, coba lagi nanti')
            const baseCls = 'group relative rounded-2xl p-3.5 sm:p-5 overflow-hidden flex flex-col min-h-[120px] sm:min-h-[150px]'
            const inner = (
              <>
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 opacity-10 rounded-bl-full pointer-events-none"
                  style={{ background: catDown ? undefined : color }} />
                {catDown && (
                  <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3" /> {badgeTxt}
                  </span>
                )}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 relative shrink-0"
                  style={{ backgroundColor: catDown ? '#f1f5f9' : hexToRgba(color, 0.12) }}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${catDown ? 'text-slate-400' : ''}`} strokeWidth={2.25}
                    style={{ color: catDown ? undefined : color }} />
                </div>
                <p className={`font-bold text-sm sm:text-base leading-tight relative ${catDown ? 'text-slate-400' : 'text-slate-900'}`}>{cat.name}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 leading-snug relative">
                  {catDown ? downDesc : (cat.description || TAGIHAN_DESC[String(cat.code).toLowerCase()] || t('topupLanding.tagihanDesc'))}
                </p>
                {!catDown && (
                  <ChevronRight className="w-4 h-4 text-slate-300 absolute bottom-3 right-3 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                )}
              </>
            )
            if (catDown) {
              return (
                <div key={cat.id} aria-disabled="true"
                  className={`${baseCls} bg-slate-50 border border-slate-200 opacity-70 cursor-not-allowed`}>
                  {inner}
                </div>
              )
            }
            return (
              <Link
                key={cat.id}
                to={`/topup-tagihan/${encodeURIComponent(cat.code)}`}
                className={`${baseCls} bg-white border border-slate-200 hover:border-brand hover:shadow-lg active:scale-[0.97] transition-all`}
              >
                {inner}
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
