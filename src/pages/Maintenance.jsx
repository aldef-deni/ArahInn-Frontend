import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Wrench, ShieldCheck, Mail, MessageCircle, Clock, ArrowRight,
  Sparkles, Settings,
} from 'lucide-react'
import SEO from '@/components/SEO'
import { maintenanceApi } from '@/services/index'

/**
 * Halaman maintenance/sementara — tampil saat sistem PPOB/transaksi
 * masih dalam proses migrasi production atau ada kendala teknis.
 *
 * Design: elegant centered card dengan logo ArahInn,
 * gentle gradient bg, animated subtle elements.
 */
export default function Maintenance() {
  const { t } = useTranslation()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => (v + 1) % 4), 700)
    return () => clearInterval(t)
  }, [])

  // Re-use cache yang sama dengan App.jsx
  const { data: mData } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn : () => maintenanceApi.status().then(r => r.data?.data ?? {}),
    staleTime: 20_000,
  })
  const customMessage = mData?.message?.trim()

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-blue-50/40 flex items-center justify-center px-4 py-10">
      <SEO
        title={t('maintenancePage.seoTitle')}
        description={t('maintenancePage.seoDescription')}
        url="/"
      />

      {/* ── Decorative background orbs ─────────────────── */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-orange-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-brand/5 to-transparent blur-3xl pointer-events-none" />

      {/* ── Main card ─────────────────────────────────── */}
      <div className="relative w-full max-w-xl">
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] rounded-3xl p-6 sm:p-10 text-center">

          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <img
              src="/logo-arahin.png"
              alt="ArahInn"
              className="h-12 sm:h-14 w-auto"
            />
          </div>

          {/* Animated icon */}
          <div className="relative inline-flex items-center justify-center mb-5 sm:mb-7">
            <div className="absolute inset-0 bg-gradient-to-br from-brand to-orange-600 rounded-2xl blur-2xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-brand to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Settings
                className={`w-10 h-10 sm:w-12 sm:h-12 text-white transition-transform duration-700`}
                style={{ transform: `rotate(${tick * 90}deg)` }}
                strokeWidth={2.25}
              />
            </div>
            <Sparkles className="absolute -top-2 -right-3 w-5 h-5 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-amber-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 sm:mb-4">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            {t('maintenancePage.badge')}
          </div>

          {/* Headline */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 leading-tight">
            {t('maintenancePage.title')}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 sm:mb-7 max-w-md mx-auto">
            {customMessage || t('maintenancePage.defaultMessage')}
          </p>

          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 mb-7 sm:mb-8">
            <Clock className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-semibold">{t('maintenancePage.estimate')}</span>
          </div>

          {/* Contact CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
            <a
              href="https://wa.me/6285188136009"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm shadow-sm shadow-emerald-500/30 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              {t('maintenancePage.ctaWa')}
              <ArrowRight className="w-4 h-4 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </a>
            <a
              href="mailto:help@arahinn.com"
              className="flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl bg-white border border-slate-200 hover:border-brand active:scale-[0.98] text-slate-700 hover:text-brand font-bold text-sm transition-all"
            >
              <Mail className="w-4 h-4" />
              {t('maintenancePage.ctaEmail')}
            </a>
          </div>

          {/* Trust footer */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200/70 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('maintenancePage.trust')}</span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center mt-5 sm:mt-6 text-[11px] sm:text-xs text-slate-400">
          {t('maintenancePage.tagline')}
        </p>

        {/* Admin access (subtle, kalau ada keperluan urgent) */}
        <p className="text-center mt-2 text-[10px] sm:text-[11px] text-slate-300">
          {t('maintenancePage.adminAccess')}{' '}
          <Link to="/login" className="text-slate-400 hover:text-brand font-semibold underline-offset-2 hover:underline transition-colors">
            {t('maintenancePage.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
