import { Sparkles, Palette, Hammer, Shield, ArrowRight } from 'lucide-react'
import InteriorPenawaran from '@/components/InteriorPenawaran'

const FEATURES = [
  {
    icon: Palette,
    title: 'Desain Kustom',
    desc: 'Konsep ruang yang disesuaikan dengan karakter dan kebutuhan properti Anda.',
  },
  {
    icon: Hammer,
    title: 'Tim Profesional',
    desc: 'Dikerjakan oleh desainer interior dan tukang berpengalaman.',
  },
  {
    icon: Shield,
    title: 'Garansi Kualitas',
    desc: 'Material premium dengan jaminan kerapian dan ketahanan jangka panjang.',
  },
]

export default function InteriorPage() {
  const scrollToGallery = () => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Section ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl" />
          <div className="absolute bottom-0 -right-20 w-96 h-96 bg-amber-400 rounded-full mix-blend-screen filter blur-3xl" />
        </div>

        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur border border-white/20 text-orange-200 text-xs font-semibold rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Layanan Premium Arahinn
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Furnish &amp; Design <span className="text-orange-300">Interior</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-8 max-w-2xl">
              Wujudkan ruang impian Anda bersama tim desainer profesional kami.
              Dari konsep modern minimalis hingga klasik elegan, kami siap menghadirkan
              estetika yang memikat tamu Anda.
            </p>
            <button
              onClick={scrollToGallery}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 hover:-translate-y-0.5"
            >
              Lihat Galeri Desain
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="container py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Kenapa pilih Arahinn?
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Kami memadukan estetika, fungsi, dan ketahanan untuk setiap proyek interior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative bg-white border border-slate-100 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery ───────────────────────────────────── */}
      <section id="gallery" className="bg-slate-50 py-16 md:py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full mb-3">
              GALERI
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Inspirasi Desain Terbaru
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Pilih konsep yang sesuai dengan visi Anda, lalu konsultasikan langsung dengan tim kami.
            </p>
          </div>

          <InteriorPenawaran noCard />
        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────── */}
      <section className="container py-16 md:py-20">
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 md:p-14 text-center shadow-xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
              Siap memulai proyek Anda?
            </h2>
            <p className="text-orange-50 mb-7 max-w-2xl mx-auto leading-relaxed">
              Tim kami siap berdiskusi untuk mewujudkan ruang yang Anda impikan.
              Tidak ada biaya untuk konsultasi awal.
            </p>
            <button
              onClick={scrollToGallery}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-orange-50 text-orange-600 font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
            >
              Mulai Konsultasi
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
