import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Palette, Hammer, Shield, ArrowRight } from 'lucide-react'
import InteriorPenawaran from '@/components/InteriorPenawaran'
import SEO from '@/components/SEO'
import api from '@/services/api'

const DEFAULT_WA = { number: '6282181111618', message: 'Halo ArahInn, saya ingin konsultasi Design Interior.' }

export default function InteriorPage() {
  const { t } = useTranslation()

  const { data: wa } = useQuery({
    queryKey: ['interior-wa'],
    queryFn : () => api.get('/interior-wa').then(r => r.data?.data || DEFAULT_WA),
    staleTime: 5 * 60 * 1000,
  })
  const waNumber  = wa?.number  || DEFAULT_WA.number
  const waMessage = wa?.message || DEFAULT_WA.message
  const waLink    = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`

  const features = [
    { icon: Palette, title: t('interior.feat1Title'), desc: t('interior.feat1Desc') },
    { icon: Hammer,  title: t('interior.feat2Title'), desc: t('interior.feat2Desc') },
    { icon: Shield,  title: t('interior.feat3Title'), desc: t('interior.feat3Desc') },
  ]

  const scrollToGallery = () => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Jasa Desain Interior"
        description="Layanan desain interior profesional ArahInn: konsep, perencanaan, dan eksekusi untuk rumah, apartemen, dan ruang komersial. Konsultasi gratis."
        url="/interior"
      />
      {/* ── Hero Section ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-20 w-72 sm:w-96 h-72 sm:h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl" />
          <div className="absolute bottom-0 -right-20 w-72 sm:w-96 h-72 sm:h-96 bg-amber-400 rounded-full mix-blend-screen filter blur-3xl" />
        </div>

        <div className="container relative py-12 sm:py-16 md:py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/10 backdrop-blur border border-white/20 text-orange-200 text-[11px] sm:text-xs font-semibold rounded-full mb-3 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {t('interior.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3 sm:mb-6">
              {t('interior.title1')} <span className="text-orange-300">{t('interior.title2')}</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-200 leading-relaxed mb-5 sm:mb-8 max-w-2xl">
              {t('interior.subtitle')}
            </p>
            <button
              onClick={scrollToGallery}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 hover:-translate-y-0.5 text-sm sm:text-base"
            >
              {t('interior.ctaHero')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="container py-10 sm:py-14 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight">
            {t('interior.whyTitle')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 leading-relaxed">
            {t('interior.whySubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all hover:-translate-y-1"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 sm:mb-2 leading-snug">{title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery ───────────────────────────────────── */}
      <section id="gallery" className="bg-slate-50 py-10 sm:py-14 md:py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-10">
            <span className="inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-700 text-[11px] sm:text-xs font-bold rounded-full mb-2 sm:mb-3">
              {t('interior.galleryTag')}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight">
              {t('interior.galleryTitle')}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-500 leading-relaxed">
              {t('interior.gallerySubtitle')}
            </p>
          </div>

          <InteriorPenawaran noCard />
        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────── */}
      <section className="container py-10 sm:py-14 md:py-20">
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-14 text-center shadow-xl">
          <div className="absolute -top-12 -right-12 w-36 sm:w-48 h-36 sm:h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-36 sm:w-48 h-36 sm:h-48 bg-white/10 rounded-full" />
          <div className="relative">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight">
              {t('interior.ctaTitle')}
            </h2>
            <p className="text-orange-50 mb-5 sm:mb-7 max-w-2xl mx-auto leading-relaxed text-xs sm:text-sm md:text-base">
              {t('interior.ctaSubtitle')}
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-white hover:bg-orange-50 active:scale-95 text-orange-600 font-bold rounded-xl sm:rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 text-sm sm:text-base"
            >
              {t('interior.ctaButton')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
