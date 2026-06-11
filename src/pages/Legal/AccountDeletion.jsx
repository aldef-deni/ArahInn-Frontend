import { useTranslation } from 'react-i18next'
import {
  UserX, Mail, MessageCircle, Phone, AlertTriangle, CheckCircle2,
  Database, Clock, ShieldCheck, ArrowRight, FileText,
} from 'lucide-react'
import SEO from '@/components/SEO'

const STEPS = [
  { num: 1, titleKey: 'accountDeletion.step1Title', descKey: 'accountDeletion.step1Desc' },
  { num: 2, titleKey: 'accountDeletion.step2Title', descKey: 'accountDeletion.step2Desc' },
  { num: 3, titleKey: 'accountDeletion.step3Title', descKey: 'accountDeletion.step3Desc' },
  { num: 4, titleKey: 'accountDeletion.step4Title', descKey: 'accountDeletion.step4Desc' },
]

const DATA_DELETED = [
  'accountDeletion.del1', 'accountDeletion.del2', 'accountDeletion.del3', 'accountDeletion.del4',
  'accountDeletion.del5', 'accountDeletion.del6', 'accountDeletion.del7', 'accountDeletion.del8',
]

const DATA_RETAINED = [
  { labelKey: 'accountDeletion.ret1Label', periodKey: 'accountDeletion.ret1Period', reasonKey: 'accountDeletion.ret1Reason' },
  { labelKey: 'accountDeletion.ret2Label', periodKey: 'accountDeletion.ret2Period', reasonKey: 'accountDeletion.ret2Reason' },
  { labelKey: 'accountDeletion.ret3Label', periodKey: 'accountDeletion.ret3Period', reasonKey: 'accountDeletion.ret3Reason' },
  { labelKey: 'accountDeletion.ret4Label', periodKey: 'accountDeletion.ret4Period', reasonKey: 'accountDeletion.ret4Reason' },
]

export default function AccountDeletion() {
  const { t } = useTranslation()
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO
        title={t('accountDeletion.seoTitle')}
        description={t('accountDeletion.seoDesc')}
        url="/account-deletion"
        type="article"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-orange-700 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-8 sm:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 md:h-12 w-auto" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            {t('accountDeletion.heroTitle')}
          </h1>
          <p className="text-white/90 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            {t('accountDeletion.heroSubtitle')}
          </p>
        </div>
      </section>

      <section className="container py-6 sm:py-10 lg:py-16 max-w-3xl">

        {/* Important notice */}
        <div className="mb-8 sm:mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-amber-900 mb-1.5">{t('accountDeletion.noticeTitle')}</h3>
              <ul className="text-xs sm:text-sm text-amber-800 space-y-1 leading-relaxed list-disc pl-4">
                <li>{t('accountDeletion.notice1')}</li>
                <li>{t('accountDeletion.notice2')}</li>
                <li>{t('accountDeletion.notice3')}</li>
                <li>{t('accountDeletion.notice4')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Steps */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
          </div>
          {t('accountDeletion.howToTitle')}
        </h2>

        <div className="space-y-3 sm:space-y-4 mb-10 sm:mb-12">
          {STEPS.map(step => (
            <div key={step.num} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand to-orange-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                {step.num}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1">{t(step.titleKey)}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t(step.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact methods */}
        <div className="mb-10 sm:mb-12 bg-gradient-to-br from-brand/5 via-blue-50 to-orange-50 border border-brand/20 rounded-2xl p-5 sm:p-6 md:p-8">
          <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">{t('accountDeletion.sendTo')}</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">{t('accountDeletion.sendToHint')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <a href="mailto:privacy@arahinn.com?subject=Permintaan%20Hapus%20Akun%20ArahInn"
              className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] transition-all group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 shrink-0 transition-colors">
                <Mail className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{t('accountDeletion.emailPrivacy')}</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">privacy@arahinn.com</p>
              </div>
            </a>
            <a href="https://wa.me/6285188136009?text=Halo%20saya%20ingin%20menghapus%20akun%20ArahInn%20saya"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.98] transition-all group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 shrink-0 transition-colors">
                <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{t('accountDeletion.whatsapp')}</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
              </div>
            </a>
            <a href="tel:+6285188136009"
              className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md active:scale-[0.98] transition-all group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 shrink-0 transition-colors">
                <Phone className="w-5 h-5 text-orange-600 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{t('accountDeletion.phone')}</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
              </div>
            </a>
          </div>
        </div>

        {/* Data Deleted */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
          </div>
          {t('accountDeletion.dataDeletedTitle')}
        </h2>

        <div className="mb-10 sm:mb-12 bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 leading-relaxed">
            {t('accountDeletion.dataDeletedIntro')}
          </p>
          <ul className="space-y-2 sm:space-y-2.5">
            {DATA_DELETED.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{t(item)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Data Retained */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
          </div>
          {t('accountDeletion.dataRetainedTitle')}
        </h2>

        <div className="mb-10 sm:mb-12 space-y-3 sm:space-y-4">
          {DATA_RETAINED.map(item => (
            <div key={item.labelKey} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">{t(item.labelKey)}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] sm:text-xs font-bold shrink-0">
                  <Clock className="w-3 h-3" />
                  {t(item.periodKey)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t(item.reasonKey)}</p>
            </div>
          ))}
        </div>

        {/* Trust info */}
        <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg mb-1.5 sm:mb-2">{t('accountDeletion.commitmentTitle')}</h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {t('accountDeletion.commitmentText')}
              </p>
              <a href="/kebijakan-privasi"
                className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                <FileText className="w-3.5 h-3.5" />
                {t('accountDeletion.readPrivacy')}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
          {t('accountDeletion.copyright')}<br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>{t('accountDeletion.rightsReserved')}
        </p>
      </section>
    </div>
  )
}
