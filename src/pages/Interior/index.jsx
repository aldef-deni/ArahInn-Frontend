import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Palette, Hammer, Shield, ArrowRight } from 'lucide-react'
import InteriorPenawaran from '@/components/InteriorPenawaran'
import SEO from '@/components/SEO'
import api from '@/services/api'
import bannerInterior from '@/assets/banners/design-interior2.webp'

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

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Jasa Desain Interior"
        description="Layanan desain interior profesional ArahInn: konsep, perencanaan, dan eksekusi untuk rumah, apartemen, dan ruang komersial. Konsultasi gratis."
        url="/interior"
      />
      {/* ── Header banner Design Interior (gambar saja) ── */}
      <img src={bannerInterior} alt="Jasa Design Interior ArahInn" width="1774" height="887"
        className="block w-full h-auto" loading="eager" fetchpriority="high" />

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

      {/* ── Brand Story Dekorasi.Me ───────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 text-white">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="container relative py-12 sm:py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              {t('interior.brandIntro')}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-6 sm:mt-8 leading-tight">
              {t('interior.brandQuestion')}
            </h2>
            <p className="text-base sm:text-lg text-white/90 mt-3 sm:mt-4 leading-relaxed max-w-2xl mx-auto">
              {t('interior.brandAnswer')}
            </p>
            <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3">
              <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-orange-300/60" />
              <p className="font-display text-lg sm:text-2xl font-bold italic bg-gradient-to-r from-amber-200 via-orange-200 to-yellow-200 bg-clip-text text-transparent">
                {t('interior.brandTagline')}
              </p>
              <span className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-orange-300/60" />
            </div>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/85 max-w-2xl mx-auto leading-relaxed">
              {t('interior.brandClosing')}
            </p>
          </div>
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
