import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Star, Gift, TrendingUp, Award, ArrowUpRight, ArrowDownRight, Calendar, Crown,
} from 'lucide-react'
import { promoApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { formatRupiah, formatDateShort } from '@/utils'
import SEO from '@/components/SEO'

const TIER_STYLES = {
  silver:   { grad: 'from-slate-500 to-slate-700',     ring: 'text-slate-200',   icon: Star },
  gold:     { grad: 'from-amber-500 to-yellow-600',    ring: 'text-amber-100',   icon: Award },
  platinum: { grad: 'from-indigo-500 to-violet-700',   ring: 'text-indigo-100',  icon: Crown },
}

export default function Loyalty() {
  const { t } = useTranslation()
  const { token } = useAuthStore()

  const { data: summary } = useQuery({
    queryKey: ['loyalty-summary'],
    queryFn: () => promoApi.loyalty.summary().then(r => r.data?.data),
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

  const tier      = summary?.tier ?? 'silver'
  const ts        = TIER_STYLES[tier] ?? TIER_STYLES.silver
  const TierIcon  = ts.icon
  const balance   = summary?.balance ?? 0
  const lifetime  = summary?.lifetime ?? 0
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
    { key: 'silver',   name: t('loyalty.silver'),   mult: 1, threshold: 0 },
    { key: 'gold',     name: t('loyalty.gold'),     mult: 2, threshold: cfg.tierGold ?? cfg.tier_gold ?? 10000 },
    { key: 'platinum', name: t('loyalty.platinum'), mult: 5, threshold: cfg.tierPlatinum ?? cfg.tier_platinum ?? 100000 },
  ]

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO title={t('loyalty.title')} url="/loyalty" />
      <div className="container py-8 max-w-3xl">

        <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('loyalty.title')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('loyalty.subtitle')}</p>

        {/* Hero tier card */}
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br ${ts.grad} text-white shadow-xl`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4">
                <TierIcon className="w-3.5 h-3.5" /> {t('loyalty.tierLabel', { tier: t(`loyalty.${tier}`) })}
              </div>
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tight">{balance.toLocaleString('id-ID')}</p>
              <p className="text-white/80 text-sm mt-1">{t('loyalty.available')}</p>
            </div>
            <TierIcon className={`w-16 h-16 ${ts.ring} opacity-30`} />
          </div>

          <div className="mt-5 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
              <span>{t('loyalty.lifetime')}: {lifetime.toLocaleString('id-ID')}</span>
              {nextThr ? <span>{nextThr.toLocaleString('id-ID')}</span> : null}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-white/85 mt-2">
              {nextTier
                ? t('loyalty.toNext', { points: remaining.toLocaleString('id-ID'), tier: t(`loyalty.${nextTier}`) })
                : t('loyalty.maxTier')}
            </p>
          </div>
        </div>

        {/* How it works */}
        <h2 className="text-base font-bold text-slate-900 mt-8 mb-3">{t('loyalty.howTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HOW.map(({ Icon, title, desc }, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-brand" />
              </div>
              <p className="font-bold text-slate-900 text-sm">{title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">{t('loyalty.activationNote', { points: actPts.toLocaleString('id-ID') })}</p>

        {/* Tiers */}
        <h2 className="text-base font-bold text-slate-900 mt-8 mb-3">{t('loyalty.tiersTitle')}</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {TIERS.map((tr, i) => {
            const active = tr.key === tier
            const st = TIER_STYLES[tr.key]
            const TI = st.icon
            return (
              <div key={tr.key} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-slate-100' : ''} ${active ? 'bg-brand/5' : ''}`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${st.grad} flex items-center justify-center`}>
                  <TI className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{tr.name}{active && <span className="ml-2 text-[10px] font-bold text-brand">●</span>}</p>
                  <p className="text-xs text-slate-500">{t('loyalty.perRule', { per: earnPer, mult: tr.mult })}</p>
                </div>
                {tr.threshold > 0 && (
                  <p className="text-xs text-slate-400">≥ {tr.threshold.toLocaleString('id-ID')}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* History */}
        <h2 className="text-base font-bold text-slate-900 mt-8 mb-3">{t('loyalty.historyTitle')}</h2>
        {history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-10 text-center">
            <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">{t('loyalty.empty')}</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {history.map((h, i) => {
              const pts = Number(h.points ?? 0)
              const isEarn = pts > 0
              return (
                <div key={h.id ?? i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEarn ? 'bg-emerald-50' : 'bg-red-50'}`}>
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
            })}
          </div>
        )}
      </div>
    </div>
  )
}
