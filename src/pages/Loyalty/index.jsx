import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Star, Gift, TrendingUp, Award, ArrowUpRight, ArrowDownRight, Calendar, Crown, UserCircle2,
} from 'lucide-react'
import { promoApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { formatRupiah, formatDateShort } from '@/utils'
import SEO from '@/components/SEO'

// Background image per tier (di folder public)
const TIER_BG = {
  member:   '/member-bg.webp',
  silver:   '/silver-bg.webp',
  gold:     '/gold-bg.webp',
  platinum: '/platinum-bg.webp',
}

const TIER_STYLES = {
  member:   { grad: 'from-blue-500 to-blue-700',           ring: 'text-blue-200',   icon: UserCircle2 },
  silver:   { grad: 'from-slate-400 to-slate-600',         ring: 'text-white/40',   icon: Star },
  gold:     { grad: 'from-yellow-300 via-amber-500 to-amber-600', ring: 'text-white/40', icon: Award },
  platinum: { grad: 'from-zinc-800 via-neutral-950 to-black', ring: 'text-amber-300/20', icon: Crown },
}

export default function Loyalty() {
  const { t } = useTranslation()
  const { token } = useAuthStore()

  const { data: summary } = useQuery({
    queryKey: ['loyalty-summary'],
    queryFn: () => promoApi.loyalty.summary().then(r => r.data?.data),
    enabled: !!token,
  })
  // Saldo dari endpoint stabil (selalu ada) → headline tetap akurat walau summary
  // (endpoint baru) belum ter-deploy. Summary hanya untuk tier/progress.
  const { data: balanceData } = useQuery({
    queryKey: ['loyalty-balance-num'],
    queryFn: () => promoApi.loyalty.balance().then(r => r.data?.data?.balance ?? 0),
    enabled: !!token,
  })
  const { data: history = [] } = useQuery({
    queryKey: ['loyalty-history'],
    queryFn: () => promoApi.loyalty.history({ limit: 50 }).then(r => r.data?.data ?? []),
    enabled: !!token,
  })

  if (!token) {
    return (
      <div className="container py-20 text-center">
        <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 mb-6">{t('loyalty.loginPrompt')}</p>
        <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-semibold">
          {t('nav.login')} <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const tier      = summary?.tier ?? 'member'
  const ts        = TIER_STYLES[tier] ?? TIER_STYLES.member
  const bgUrl     = TIER_BG[tier] || TIER_BG.member   // background image per tier
  const isPlat    = tier === 'platinum'   // hitam + aksen emas
  const isGold    = tier === 'gold'       // emas hangat + kilau putih
  const lux       = isPlat || isGold
  // Helper kelas untuk treatment mewah (Platinum vs Gold)
  const cardLux   = isPlat ? 'ring-1 ring-amber-300/25 shadow-2xl shadow-black/50'
                  : isGold ? 'ring-1 ring-white/30 shadow-2xl shadow-amber-900/20'
                  : 'shadow-xl'
  const hairline  = isPlat ? 'via-amber-300/60' : 'via-white/70'
  const orb2      = isPlat ? 'bg-amber-400/10' : 'bg-white/10'
  const badgeLux  = isPlat ? 'bg-amber-400/15 text-amber-200 border border-amber-300/30'
                  : isGold ? 'bg-white/25 text-white border border-white/40'
                  : 'bg-white/20'
  const numberLux = isPlat ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow'
                  : 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]'
  const availLux  = isPlat ? 'text-amber-100/70' : 'text-white/80'
  const dividerLux= isPlat ? 'border-amber-300/20' : 'border-white/20'
  const barLux    = isPlat ? 'bg-gradient-to-r from-amber-300 to-amber-500'
                  : isGold ? 'bg-gradient-to-r from-amber-100 to-white'
                  : 'bg-white'
  const TierIcon  = ts.icon
  const balance   = summary?.balance ?? balanceData ?? 0
  const lifetime  = summary?.lifetime ?? balanceData ?? 0
  const nextTier  = summary?.nextTier ?? summary?.next_tier
  const nextThr   = summary?.nextThreshold ?? summary?.next_threshold ?? 0
  const remaining = summary?.remaining ?? 0
  const cfg       = summary?.config ?? {}
  const earnPer   = cfg.earnPer ?? cfg.earn_per ?? 100
  const actPts    = cfg.activationPoints ?? cfg.activation_points ?? 1000
  const progress  = nextThr ? Math.min(100, (lifetime / nextThr) * 100) : 100

  const HOW = [
    { Icon: Star,       title: t('loyalty.earnTitle'),   desc: t('loyalty.earnDesc',   { per: earnPer }) },
    { Icon: Gift,       title: t('loyalty.redeemTitle'), desc: t('loyalty.redeemDesc') },
    { Icon: TrendingUp, title: t('loyalty.tierTitle'),   desc: t('loyalty.tierDesc') },
  ]
  const TIERS = [
    { key: 'member',   name: t('loyalty.member'),   mult: 1, threshold: 0 },
    { key: 'silver',   name: t('loyalty.silver'),   mult: 2, threshold: cfg.tierSilver ?? cfg.tier_silver ?? 5000 },
    { key: 'gold',     name: t('loyalty.gold'),     mult: 3, threshold: cfg.tierGold ?? cfg.tier_gold ?? 25000 },
    { key: 'platinum', name: t('loyalty.platinum'), mult: 5, threshold: cfg.tierPlatinum ?? cfg.tier_platinum ?? 100000 },
  ]

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO title={t('loyalty.title')} url="/poin" />
      <div className="container py-8 max-w-5xl">

        <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('loyalty.title')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('loyalty.subtitle')}</p>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── Kolom utama: kartu poin + riwayat ── */}
          <div className="space-y-6">

            {/* Hero tier card — background image per tier */}
            <div
              className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white bg-zinc-900 ${cardLux}`}
              style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {/* Scrim halus (kiri-atas) agar badge, angka & teks tetap terbaca di atas image */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/45 via-black/10 to-transparent" />
              {/* Hairline premium untuk Gold & Platinum */}
              {lux && (
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isPlat ? 'via-amber-300/50' : 'via-white/60'} to-transparent`} />
              )}
              <div className="relative flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${badgeLux}`}>
                    <TierIcon className="w-3.5 h-3.5" /> {t(`loyalty.${tier}`)}
                  </div>
                  <p className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${numberLux}`}>{balance.toLocaleString('id-ID')}</p>
                  <p className={`text-sm mt-1 ${availLux}`}>{t('loyalty.available')}</p>
                </div>
                {lux ? (
                  <div className="relative w-16 h-16 shrink-0">
                    {/* Halo berputar (shine loop) — emas utk Platinum, putih utk Gold */}
                    <div
                      className="absolute -inset-2 rounded-full blur-md opacity-80 animate-spin"
                      style={{
                        background: isPlat
                          ? 'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.55) 70deg, transparent 150deg, transparent 360deg)'
                          : 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.75) 70deg, transparent 150deg, transparent 360deg)',
                        animationDuration: '5s',
                      }}
                    />
                    {/* Glow lembut yang berdenyut */}
                    <div className={`absolute inset-1 rounded-full blur-lg animate-pulse ${isPlat ? 'bg-amber-400/15' : 'bg-white/25'}`} />
                    {/* Ikon tier */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TierIcon className={`w-10 h-10 ${isPlat ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.65)]' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]'}`} />
                    </div>
                  </div>
                ) : (
                  <TierIcon className={`w-16 h-16 ${ts.ring} opacity-30`} />
                )}
              </div>

              <div className={`relative mt-5 pt-4 border-t ${dividerLux}`}>
                <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
                  <span>{t('loyalty.lifetime')}: {lifetime.toLocaleString('id-ID')}</span>
                  {nextThr ? <span>{nextThr.toLocaleString('id-ID')}</span> : null}
                </div>
                <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barLux}`} style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-white/85 mt-2">
                  {nextTier
                    ? t('loyalty.toNext', { points: remaining.toLocaleString('id-ID'), tier: t(`loyalty.${nextTier}`) })
                    : t('loyalty.maxTier')}
                </p>
              </div>
            </div>

            {/* History */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <h2 className="text-base font-bold text-slate-900 px-5 pt-4 pb-3 border-b border-slate-100">{t('loyalty.historyTitle')}</h2>
              {history.length === 0 ? (
                <div className="py-12 text-center">
                  <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{t('loyalty.empty')}</p>
                </div>
              ) : (
                history.map((h, i) => {
                  const pts = Number(h.points ?? 0)
                  const isEarn = pts > 0
                  return (
                    <div key={h.id ?? i} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isEarn ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {isEarn ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{h.description || (isEarn ? t('loyalty.earnTitle') : t('loyalty.redeemTitle'))}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {formatDateShort(h.createdAt ?? h.created_at)}
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${isEarn ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isEarn ? '+' : ''}{pts.toLocaleString('id-ID')}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Sidebar: Cara Kerja + Tingkatan ── */}
          <aside className="space-y-5 lg:sticky lg:top-24">

            {/* Cara Kerja */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">{t('loyalty.howTitle')}</h2>
              <div className="space-y-3.5">
                {HOW.map(({ Icon, title, desc }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">{t('loyalty.activationNote', { points: actPts.toLocaleString('id-ID') })}</p>
            </div>

            {/* Tingkatan Keanggotaan */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <h2 className="text-sm font-bold text-slate-900 px-4 pt-4 pb-3">{t('loyalty.tiersTitle')}</h2>
              {TIERS.map((tr) => {
                const active = tr.key === tier
                const st = TIER_STYLES[tr.key]
                const TI = st.icon
                return (
                  <div key={tr.key} className={`flex items-center gap-3 px-4 py-3 border-t border-slate-100 ${active ? 'bg-brand/5' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${st.grad} flex items-center justify-center shrink-0`}>
                      <TI className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">{tr.name}{active && <span className="text-[9px] text-brand">●</span>}</p>
                      <p className="text-[11px] text-slate-500">{t('loyalty.perRule', { per: earnPer, mult: tr.mult })}</p>
                    </div>
                    {tr.threshold > 0 && (
                      <p className="text-[11px] text-slate-400 shrink-0">≥ {tr.threshold.toLocaleString('id-ID')}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
